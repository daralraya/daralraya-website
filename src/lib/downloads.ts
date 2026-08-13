import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

const loadDownloadsServer = () => import("./downloads-server");

export const getDownloadManifest = createServerFn({ method: "GET" }).handler(async () => {
  const server = await loadDownloadsServer();
  return server.getDownloadManifest();
});

export const uploadDownloadFile = createServerFn({ method: "POST" })
  .validator(z.object({
    filename: z.string().min(1).max(255),
    labelAr: z.string().min(1).max(200),
    labelEn: z.string().min(1).max(200),
    dataUrl: z.string().min(1),
  }))
  .handler(async ({ data }) => {
    const server = await loadDownloadsServer();
    return server.uploadDownloadFile({ data });
  });

export const deleteDownloadFile = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(8).max(100) }))
  .handler(async ({ data }) => {
    const server = await loadDownloadsServer();
    return server.deleteDownloadFile({ data });
  });
