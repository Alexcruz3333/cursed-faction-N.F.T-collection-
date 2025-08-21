import Redis from "ioredis";
import { logger } from "./logger.js";

export function createRedis(url?: string): Redis {
  if (!url) {
    throw new Error("Redis URL is required");
  }

  const client = new Redis(url, {
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
  
  client.on("error", (err) => {
    logger.error({ err }, "Redis connection error");
  });
  
  client.on("connect", () => {
    logger.debug("Redis client connected");
  });
  
  client.on("reconnecting", () => {
    logger.info("Redis client reconnecting");
  });

  return client;
}