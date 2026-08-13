import { requireAdminSession } from "./admin-auth";
import * as path from "node:path";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import downloadsSeed from "@/data/downloads-store.json";
import {
  deletePersistentFile,
  readPersistentFile,
  readPersistentJson,
  writePersistentFile,
  writePersistentJson,
} from "./durable-store.server";

const DOWNLOADS_DIR = path.join(process.cwd(), "public", "downloads");
const MANIFEST_PATH = path.join(process.cwd(), "src", "data", "downloads-store.json");
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["xlsx", "xls", "csv", "doc", "docx", "pdf", "ppt", "pptx", "odt", "ods", "zip"]);

export type DownloadEntry = {
  id: string;
  filename: string;
  url: string;
  labelAr: string;
  labelEn: string;
  size: number;
  updatedAt: string;
  storageKey?: string;
};

type DownloadStore = { files: DownloadEntry[] };

const emptyStore: DownloadStore = { files: [] };

const uploadInput = z.object({
  filename: z.string().min(1).max(255),
  labelAr: z.string().min(1).max(200),
  labelEn: z.string().min(1).max(200),
  dataUrl: z.string().min(1),
});
const deleteInput = z.object({ id: z.string().min(8).max(100) });

function safeFilename(value: string): string {
  const base = path.basename(value).trim().replace(/[^\p{L}\p{N}._-]/gu, "-").replace(/-+/g, "-");
  if (!base || base.startsWith(".") || base.length > 140) throw new Error("اسم الملف غير صالح");
  const extension = path.extname(base).slice(1).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) throw new Error("نوع الملف غير مسموح");
  return base;
}

function mediaPath(id: string): string {
  return `/media/download/${encodeURIComponent(id)}`;
}

async function readStore(): Promise<DownloadStore> {
  try {
    const parsed = await readPersistentJson<DownloadStore>(
      "downloads/manifest.json",
      MANIFEST_PATH,
      downloadsSeed as DownloadStore,
    );
    return { files: Array.isArray(parsed.files) ? parsed.files : [] };
  } catch {
    return emptyStore;
  }
}

async function writeStore(store: DownloadStore): Promise<void> {
  await writePersistentJson("downloads/manifest.json", MANIFEST_PATH, store);
}

function decodeFileData(dataUrl: string): Buffer {
  const match = /^data:[^;]+;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("تعذر قراءة الملف");
  const buffer = Buffer.from(match[1], "base64");
  if (!buffer.length || buffer.length > MAX_FILE_SIZE) throw new Error("يجب ألا يتجاوز الملف 25 ميغابايت");
  return buffer;
}

export async function getStoredDownloadFile(id: string): Promise<{ data: ArrayBuffer; filename: string } | null> {
  const store = await readStore();
  const entry = store.files.find((file) => file.id === id);
  if (!entry?.storageKey) return null;
  const data = await readPersistentFile(entry.storageKey, path.join(DOWNLOADS_DIR, entry.filename));
  return data ? { data, filename: entry.filename } : null;
}

export async function getDownloadManifestAction() {
  const store = await readStore();
  return store.files;
}

export async function uploadDownloadFileAction(input: unknown) {
  const data = uploadInput.parse(input);
  await requireAdminSession();
  const original = safeFilename(data.filename);
  const buffer = decodeFileData(data.dataUrl);
  const id = randomBytes(16).toString("hex");
  const storedFilename = `${Date.now()}-${randomBytes(4).toString("hex")}-${original}`;
  const storageKey = `downloads/${id}/${storedFilename}`;
  await writePersistentFile(storageKey, path.join(DOWNLOADS_DIR, storedFilename), buffer);

  const entry: DownloadEntry = {
    id,
    filename: original,
    url: mediaPath(id),
    labelAr: data.labelAr.trim(),
    labelEn: data.labelEn.trim(),
    size: buffer.length,
    updatedAt: new Date().toISOString(),
    storageKey,
  };
  const store = await readStore();
  await writeStore({ files: [...store.files, entry] });
  return entry;
}

export async function deleteDownloadFileAction(input: unknown) {
  const data = deleteInput.parse(input);
  await requireAdminSession();
  const store = await readStore();
  const entry = store.files.find((file) => file.id === data.id);
  if (!entry) throw new Error("الملف غير موجود");
  if (entry.storageKey) {
    await deletePersistentFile(entry.storageKey, path.join(DOWNLOADS_DIR, entry.filename));
  }
  await writeStore({ files: store.files.filter((file) => file.id !== data.id) });
  return { success: true };
}
