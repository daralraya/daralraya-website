import { createServerFn } from "@tanstack/react-start";

export type CatalogOverrides = {
  edited: Record<string, unknown>;
  added: unknown[];
};

const loadCatalogOverridesServer = () => import("./catalog-overrides-server");

export const getCatalogOverrides = createServerFn({ method: "GET" }).handler(async () => {
  const server = await loadCatalogOverridesServer();
  return server.getCatalogOverrides();
});

export const saveCatalogOverrides = createServerFn({ method: "POST" })
  .validator((data: CatalogOverrides) => data)
  .handler(async ({ data }) => {
    const server = await loadCatalogOverridesServer();
    return server.saveCatalogOverrides({ data });
  });
