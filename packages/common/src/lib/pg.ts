import { Pool } from "pg";
import { logger } from "./logger.js";

export function createPgPool(connectionString?: string): Pool {
  const pool = new Pool({ connectionString });
  pool.on("error", (err) => logger.error({ err }, "pg pool error"));
  return pool;
}