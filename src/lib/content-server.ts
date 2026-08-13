/**
 * SERVER-SIDE CONTENT PERSISTENCE
 * ------------------------------------------------------------------
 * Runs only on the server (Node.js), never shipped to the browser.
 * Uses durable Netlify storage in production and the local JSON file in
 * development, so Admin changes remain shared by all visitors.
 */
import { requireAdminSession } from "./admin-auth";
import * as path from "node:path";
import contentSeed from "@/data/content-store.json";
import { readPersistentJson, writePersistentJson } from "./durable-store.server";

const STORE_PATH = path.join(process.cwd(), "src/data/content-store.json");

async function readStoreFile(): Promise<unknown> {
  try {
    return await readPersistentJson("content/site-content.json", STORE_PATH, contentSeed);
  } catch {
    return null;
  }
}

export async function getContentStoreAction() {
  return await readStoreFile();
}

export async function saveContentStoreAction(data: unknown) {
  await requireAdminSession();
  await writePersistentJson("content/site-content.json", STORE_PATH, data);
  return { success: true, savedAt: new Date().toISOString() };
}
