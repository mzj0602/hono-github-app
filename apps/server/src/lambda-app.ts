import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { lambdaEnv } from "./lambda-env";
import { lambdaAppRouter } from "./lambda-router";

export function createLambdaApp() {
  const app = new Hono();

  app.use(logger());
  app.use(
    "/*",
    cors({
      origin: lambdaEnv.CORS_ORIGIN,
      allowMethods: ["GET", "POST", "OPTIONS"],
    }),
  );

  app.use(
    "/trpc/*",
    trpcServer({
      router: lambdaAppRouter,
      createContext: () => ({}),
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
