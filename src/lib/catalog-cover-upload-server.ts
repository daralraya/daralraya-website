import { createServerFn } from "@tanstack/react-start";
import { requireAdminSession } from "./admin-auth";
import * as path from "node:path";
import {
  readPersistentFile,
  writePersistentFile,
} from "./durable-store.server";

const COVERS_DIR = path.join(process.cwd(), "public", "Processed_Covers");

function safeFileStem(value: unknown): string {
  if (typeof value !== "string") throw new Error("Invalid book identifier");
  const stem = value.trim().replace(/[^\p{L}\p{N}-]/gu, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!stem) throw new Error("Invalid book identifier");
  return stem;
}

function safeFilename(value: string): string | null {
  const filename = path.basename(value);
  return /^[\p{L}\p{N}-]+\.(?:jpg|png|webp)$/iu.test(filename) ? filename : null;
}

function decodeImageData(value: unknown): { buffer: Buffer; extension: "jpg" | "png" | "webp" } {
  if (typeof value !== "string") throw new Error("Invalid image data");
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(value);
  if (!match) throw new Error("Only JPG, PNG, and WebP image files are supported");

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0 || buffer.length > 8 * 1024 * 1024) {
    throw new Error("The image must be between 1 byte and 8 MB");
  }

  return { buffer, extension: match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase() as "png" | "webp" };
}

export async function getStoredCoverFile(filename: string): Promise<ArrayBuffer | null> {
  const safe = safeFilename(filename);
  if (!safe) return null;
  return await readPersistentFile(`covers/${safe}`, path.join(COVERS_DIR, safe));
}

export const uploadCatalogCover = createServerFn({ method: "POST" })
  .validator((data: { slug: unknown; dataUrl: unknown }) => data)
  .handler(async ({ data }) => {
    await requireAdminSession();
    const stem = safeFileStem(data.slug);
    const image = decodeImageData(data.dataUrl);
    const filename = `${stem}.${image.extension}`;
    await writePersistentFile(`covers/${filename}`, path.join(COVERS_DIR, filename), image.buffer);

    return { success: true, cover: `/media/cover/${encodeURIComponent(filename)}` };
  });
