import { connect, NatsConnection } from "nats";
import { logger } from "./logger.js";

export async function createNats(url?: string): Promise<NatsConnection> {
  if (!url) {
    throw new Error("NATS URL is required");
  }

  try {
    const nc = await connect({ 
      servers: url,
      reconnect: true,
      maxReconnectAttempts: 10,
      reconnectTimeWait: 1000,
    });
    
    nc.closed().then((err) => {
      if (err) {
        logger.error({ err }, "NATS connection closed with error");
      } else {
        logger.info("NATS connection closed");
      }
    });

    logger.debug({ url }, "NATS connection established");
    return nc;
  } catch (err) {
    logger.error({ err, url }, "Failed to connect to NATS");
    throw err;
  }
}