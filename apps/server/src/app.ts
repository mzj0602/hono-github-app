import { createContext } from "@hono-github-app/api/context";
import { appRouter } from "@hono-github-app/api/routers/index";
import { env } from "@hono-github-app/env/server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

export function createApp() {
  const app = new Hono();

  app.use(logger());
  app.use(
    "/*",
    cors({
      origin: env.CORS_ORIGIN,
      allowMethods: ["GET", "POST", "OPTIONS"],
    }),
  );

  app.use(
    "/trpc/*",
    trpcServer({
      router: appRouter,
      createContext: (_opts, context) => {
        return createContext({ context });
      },
    }),
  );

  app.get("/", (c) => {
    return c.json({
      status: "ok",
      service: "hono-github-app",
    });
  });

  return app;
}
