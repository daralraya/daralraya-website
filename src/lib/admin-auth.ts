import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { z } from "zod";

export const ADMIN_PASSWORD_MIN_LENGTH = 12;

const loadAuthServer = () => import("./admin-auth.server");

export const requireAdminSession = createServerOnlyFn(async () => {
  const server = await loadAuthServer();
  return server.requireAdminSession();
});

export const getAdminAuthStatus = createServerFn({ method: "GET" }).handler(async () => {
  const server = await loadAuthServer();
  return server.getAdminAuthStatus();
});

export const loginAdmin = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1).max(200) }))
  .handler(async ({ data }) => {
    const server = await loadAuthServer();
    return server.loginAdmin({ data });
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const server = await loadAuthServer();
  return server.logoutAdmin();
});

export const changeAdminPassword = createServerFn({ method: "POST" })
  .validator(z.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(ADMIN_PASSWORD_MIN_LENGTH).max(200) }))
  .handler(async ({ data }) => {
    const server = await loadAuthServer();
    return server.changeAdminPassword({ data });
  });

export const requestAdminPasswordReset = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email().max(320) }))
  .handler(async ({ data }) => {
    const server = await loadAuthServer();
    return server.requestAdminPasswordReset({ data });
  });

export const resetAdminPassword = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(32).max(200), newPassword: z.string().min(ADMIN_PASSWORD_MIN_LENGTH).max(200) }))
  .handler(async ({ data }) => {
    const server = await loadAuthServer();
    return server.resetAdminPassword({ data });
  });
