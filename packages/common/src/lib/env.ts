import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SERVICE_NAME: z.string().default("service"),
  PORT: z.string().default("3000"),
  POSTGRES_URL: z.string().url().optional(),
  REDIS_URL: z.string().optional(),
  NATS_URL: z.string().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional()
});

export const env = EnvSchema.parse(process.env);