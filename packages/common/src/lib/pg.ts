import { Pool } from "pg";
import { logger } from "./logger.js";

export function createPgPool(connectionString?: string): Pool {
  if (!connectionString) {
    throw new Error("PostgreSQL connection string is required");
  }

  const pool = new Pool({ 
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  pool.on("error", (err) => {
    logger.error({ err }, "PostgreSQL pool error");
  });
  
  pool.on("connect", () => {
    logger.debug("PostgreSQL client connected");
  });

  return pool;
}