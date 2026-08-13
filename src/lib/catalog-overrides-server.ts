import { requireAdminSession } from "./admin-auth";
import * as path from "node:path";
import overridesSeed from "@/data/catalog-overrides.json";
import { readPersistentJson, writePersistentJson } from "./durable-store.server";

const STORE_PATH = path.join(process.cwd(), "src/data/catalog-overrides.json");
export type CatalogOverrides = {
  edited: Record<string, unknown>;
  added: unknown[];
};

const emptyOverrides: CatalogOverrides = { edited: {}, added: [] };

async function readOverridesFile(): Promise<CatalogOverrides> {
  try {
    const parsed = await readPersistentJson<CatalogOverrides>(
      "catalog/overrides.json",
      STORE_PATH,
      overridesSeed as CatalogOverrides,
    ) as Partial<CatalogOverrides>;
    return {
      edited: parsed.edited && typeof parsed.edited === "object" ? parsed.edited : {},
      added: Array.isArray(parsed.added) ? parsed.added : [],
    };
  } catch {
    return emptyOverrides;
  }
}

export async function getCatalogOverridesAction() {
  return await readOverridesFile();
}

export async function saveCatalogOverridesAction(data: CatalogOverrides) {
  await requireAdminSession();
  const next: CatalogOverrides = {
    edited: data.edited && typeof data.edited === "object" ? data.edited : {},
    added: Array.isArray(data.added) ? data.added : [],
  };
  await writePersistentJson("catalog/overrides.json", STORE_PATH, next);
  return { success: true, savedAt: new Date().toISOString() };
}
