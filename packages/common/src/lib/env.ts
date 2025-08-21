import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SERVICE_NAME: z.string().default("service"),
  PORT: z.string().default("3000"),
  POSTGRES_URL: z.string().url("Invalid PostgreSQL URL").optional(),
  REDIS_URL: z.string().optional(),
  NATS_URL: z.string().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url("Invalid OTLP endpoint URL").optional(),
});

export const env = EnvSchema.parse(process.env);

// Validation helpers for services
export function requireDatabaseUrl(): string {
  if (!env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is required but not provided");
  }
  return env.POSTGRES_URL;
}

export function requireRedisUrl(): string {
  if (!env.REDIS_URL) {
    throw new Error("REDIS_URL is required but not provided");
  }
  return env.REDIS_URL;
}

export function requireNatsUrl(): string {
  if (!env.NATS_URL) {
    throw new Error("NATS_URL is required but not provided");
  }
  return env.NATS_URL;
}