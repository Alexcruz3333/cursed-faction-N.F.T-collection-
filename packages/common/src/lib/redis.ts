import Redis from "ioredis";
import { logger } from "./logger.js";

export function createRedis(url?: string): Redis {
  const client = url ? new Redis(url) : new Redis();
  client.on("error", (err) => logger.error({ err }, "redis error"));
  return client;
}
