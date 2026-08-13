import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const loadCoverServer = () => import("./catalog-cover-upload-server");

export const uploadCatalogCover = createServerFn({ method: "POST" })
  .validator(z.object({ slug: z.string().min(1).max(240), dataUrl: z.string().min(1) }))
  .handler(async ({ data }) => {
    const server = await loadCoverServer();
    return server.uploadCatalogCoverAction(data);
  });
