import { createServerFn } from "@tanstack/react-start";

const loadContentServer = () => import("./content-server");

export const getContentStore = createServerFn({ method: "GET" }).handler(async () => {
  const server = await loadContentServer();
  return server.getContentStoreAction();
});

export const saveContentStore = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const server = await loadContentServer();
    return server.saveContentStoreAction(data);
  });
