import { getStore } from "@netlify/blobs";
import * as fs from "node:fs";
import * as path from "node:path";

const DATA_STORE_NAME = "alraya-admin-data";
const FILE_STORE_NAME = "alraya-admin-files";

/** Netlify provides these runtime variables to Functions; local development keeps file-backed stores. */
export function isNetlifyRuntime(): boolean {
  return Boolean(
    process.env.NETLIFY === "true"
      || process.env.NETLIFY_SITE_ID
      || process.env.SITE_ID
      || process.env.CONTEXT,
  );
}

function dataStore() {
  return getStore({ name: DATA_STORE_NAME, consistency: "strong" });
}

function fileStore() {
  return getStore({ name: FILE_STORE_NAME, consistency: "strong" });
}

export async function readPersistentJson<T>(
  key: string,
  localFile: string,
  seed: T | (() => T),
): Promise<T> {
  if (isNetlifyRuntime()) {
    const stored = await dataStore().get(key, { type: "json", consistency: "strong" });
    if (stored !== null) return stored as T;
    const initial = typeof seed === "function" ? (seed as () => T)() : seed;
    return structuredClone(initial);
  }

  const raw = await fs.promises.readFile(localFile, "utf-8");
  return JSON.parse(raw) as T;
}

export async function writePersistentJson<T>(
  key: string,
  localFile: string,
  data: T,
): Promise<void> {
  if (isNetlifyRuntime()) {
    await dataStore().setJSON(key, data);
    return;
  }

  await fs.promises.mkdir(path.dirname(localFile), { recursive: true });
  const temporaryFile = `${localFile}.tmp`;
  await fs.promises.writeFile(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  await fs.promises.rename(temporaryFile, localFile);
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

export async function writePersistentFile(
  key: string,
  localFile: string,
  data: Uint8Array,
): Promise<void> {
  if (isNetlifyRuntime()) {
    await fileStore().set(key, toArrayBuffer(data));
    return;
  }

  await fs.promises.mkdir(path.dirname(localFile), { recursive: true });
  await fs.promises.writeFile(localFile, data, { flag: "wx" });
}

export async function readPersistentFile(
  key: string,
  localFile: string,
): Promise<ArrayBuffer | null> {
  if (isNetlifyRuntime()) {
    return await fileStore().get(key, { type: "arrayBuffer", consistency: "strong" });
  }

  try {
    const data = await fs.promises.readFile(localFile);
    return toArrayBuffer(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function deletePersistentFile(key: string, localFile: string): Promise<void> {
  if (isNetlifyRuntime()) {
    await fileStore().delete(key);
    return;
  }

  try {
    await fs.promises.unlink(localFile);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
