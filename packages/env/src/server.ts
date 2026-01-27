import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    CORS_ORIGIN: z.string().url().optional(),

    // Opinion.Trade API
    OPINION_TRADE_API_KEY: z.string().min(1).optional(),
    OPINION_TRADE_BASE_URL: z.string().url().default("https://proxy.opinion.trade:8443/openapi"),

    // Polar
    POLAR_ACCESS_TOKEN: z.string().min(1).optional(),
    POLAR_WEBHOOK_SECRET: z.string().min(1).optional(),
    POLAR_ORGANIZATION_ID: z.string().min(1).optional(),

    // Clerk (for server-side)
    CLERK_SECRET_KEY: z.string().min(1).optional(),
    CLERK_WEBHOOK_SECRET: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
