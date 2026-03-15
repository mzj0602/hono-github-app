import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const lambdaEnv = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    CORS_ORIGIN: z.string().min(1),
    NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
