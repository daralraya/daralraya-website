import {
  getRequestIP,
  getRequestUrl,
  useSession,
} from "@tanstack/react-start/server";
import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import * as fs from "node:fs";
import * as path from "node:path";
import nodemailer from "nodemailer";
import { readPersistentJson, writePersistentJson } from "./durable-store.server";

const scrypt = promisify(nodeScrypt);
const AUTH_STORE_PATH = path.join(process.cwd(), "src/data/admin-auth.json");
const SESSION_MAX_AGE = 60 * 60 * 12;
const RESET_TTL_MS = 60 * 60 * 1000;
const PASSWORD_MIN_LENGTH = 12;

type PasswordHash = {
  algorithm: "scrypt";
  salt: string;
  hash: string;
};

type AuthStore = {
  password: PasswordHash;
  resetTokenHash?: string;
  resetTokenExpiresAt?: number;
  updatedAt: string;
};

const attempts = new Map<string, { count: number; resetAt: number }>();

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured on the server`);
  return value;
}

function productionAuthSeed(): AuthStore {
  const salt = process.env.ADMIN_INITIAL_PASSWORD_SALT?.trim();
  const hash = process.env.ADMIN_INITIAL_PASSWORD_HASH?.trim();
  if (salt && hash) {
    return {
      password: { algorithm: "scrypt", salt, hash },
      updatedAt: process.env.ADMIN_INITIALIZED_AT?.trim() || "2026-08-13T00:00:00.000Z",
    };
  }

  // Netlify Dev can emulate Blobs locally; preserve the existing private local
  // credential file there without ever importing it into the browser bundle.
  try {
    return JSON.parse(fs.readFileSync(AUTH_STORE_PATH, "utf-8")) as AuthStore;
  } catch {
    throw new Error("ADMIN_INITIAL_PASSWORD_SALT and ADMIN_INITIAL_PASSWORD_HASH must be configured in Netlify before the first production login");
  }
}

function sessionConfig() {
  return {
    name: process.env.NODE_ENV === "production" ? "__Host-alraya-admin" : "alraya-admin",
    password: requiredEnv("ADMIN_SESSION_SECRET"),
    maxAge: SESSION_MAX_AGE,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      maxAge: SESSION_MAX_AGE,
    },
  };
}

async function readAuthStore(): Promise<AuthStore> {
  try {
    const parsed = await readPersistentJson<AuthStore>(
      "auth/store.json",
      AUTH_STORE_PATH,
      productionAuthSeed,
    );
    if (!parsed.password || parsed.password.algorithm !== "scrypt") {
      throw new Error("Invalid Admin authentication store");
    }
    return parsed as AuthStore;
  } catch (error) {
    if (error instanceof SyntaxError || (error as NodeJS.ErrnoException)?.code === "ENOENT") {
      throw new Error("Admin authentication is not initialized on the server");
    }
    throw error;
  }
}

async function writeAuthStore(store: AuthStore): Promise<void> {
  await writePersistentJson("auth/store.json", AUTH_STORE_PATH, store);
}

async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return {
    algorithm: "scrypt",
    salt: salt.toString("base64url"),
    hash: derived.toString("base64url"),
  };
}

async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  const salt = Buffer.from(stored.salt, "base64url");
  const expected = Buffer.from(stored.hash, "base64url");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

function consumeRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now >= current.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
}

function requestKey(prefix: string): string {
  return `${prefix}:${getRequestIP({ xForwardedFor: true }) ?? "unknown"}`;
}

async function getAdminSession() {
  return useSession<{ admin: boolean }> (sessionConfig());
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (session.data.admin !== true) throw new Error("Unauthorized");
  return session;
}

export async function getAdminAuthStatusAction() {
  const session = await getAdminSession();
  return { authenticated: session.data.admin === true };
}

export async function loginAdminAction(data: { password: string }) {
  if (!consumeRateLimit(requestKey("admin-login"), 5, 15 * 60 * 1000)) {
    throw new Error("محاولات كثيرة. حاول مرة أخرى بعد قليل.");
  }
  const store = await readAuthStore();
  const valid = await verifyPassword(data.password, store.password);
  if (!valid) throw new Error("كلمة السر غير صحيحة");
  const session = await getAdminSession();
  await session.clear();
  await session.update({ admin: true });
  return { authenticated: true };
}

export async function logoutAdminAction() {
  const session = await getAdminSession();
  await session.clear();
  return { authenticated: false };
}

export async function changeAdminPasswordAction(data: { currentPassword: string; newPassword: string }) {
  const session = await requireAdminSession();
  const store = await readAuthStore();
  if (!(await verifyPassword(data.currentPassword, store.password))) {
    throw new Error("كلمة السر الحالية غير صحيحة");
  }
  const nextPassword = await hashPassword(data.newPassword);
  await writeAuthStore({ password: nextPassword, updatedAt: new Date().toISOString() });
  await session.clear();
  await session.update({ admin: true });
  return { success: true };
}

async function sendResetEmail(resetToken: string): Promise<void> {
  const sender = requiredEnv("ADMIN_AUTH_EMAIL");
  const recipient = requiredEnv("ADMIN_RECOVERY_EMAIL");
  const appPassword = requiredEnv("ADMIN_SMTP_APP_PASSWORD").replace(/\s+/g, "");
  const origin = process.env.APP_ORIGIN?.trim() || getRequestUrl({ xForwardedHost: true }).origin;
  const resetUrl = `${origin}/admin?token=${encodeURIComponent(resetToken)}`;
  const transporter = nodemailer.createTransport({
    host: process.env.ADMIN_SMTP_HOST?.trim() || "smtp.gmail.com",
    port: Number(process.env.ADMIN_SMTP_PORT || 465),
    secure: process.env.ADMIN_SMTP_SECURE !== "false",
    auth: { user: sender, pass: appPassword },
  });
  await transporter.sendMail({
    from: sender,
    to: recipient,
    subject: "Dar Al-Raya Admin password reset",
    text: `A password reset was requested for the Dar Al-Raya Admin panel. Open this one-time link within one hour:\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
  });
}

export async function requestAdminPasswordResetAction(data: { email: string }) {
  if (!consumeRateLimit(requestKey("admin-reset"), 3, 15 * 60 * 1000)) {
    throw new Error("محاولات كثيرة. حاول مرة أخرى بعد قليل.");
  }
  const expectedEmail = process.env.ADMIN_RECOVERY_EMAIL?.trim().toLowerCase();
  if (expectedEmail && data.email.trim().toLowerCase() === expectedEmail) {
    const token = randomBytes(32).toString("base64url");
    const store = await readAuthStore();
    await writeAuthStore({
      ...store,
      resetTokenHash: hashResetToken(token),
      resetTokenExpiresAt: Date.now() + RESET_TTL_MS,
    });
    await sendResetEmail(token);
  }
  return { accepted: true };
}

export async function resetAdminPasswordAction(data: { token: string; newPassword: string }) {
  const store = await readAuthStore();
  const validToken = store.resetTokenHash === hashResetToken(data.token)
    && typeof store.resetTokenExpiresAt === "number"
    && Date.now() < store.resetTokenExpiresAt;
  if (!validToken) throw new Error("الرابط غير صالح أو انتهت صلاحيته");
  const nextPassword = await hashPassword(data.newPassword);
  await writeAuthStore({
    password: nextPassword,
    updatedAt: new Date().toISOString(),
  });
  const session = await getAdminSession();
  await session.clear();
  await session.update({ admin: true });
  return { success: true };
}

export const ADMIN_PASSWORD_MIN_LENGTH = PASSWORD_MIN_LENGTH;
