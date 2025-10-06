import { connect, NatsConnection, ConnectionOptions } from "nats";
import { logger } from "./logger.js";

export async function createNats(url?: string): Promise<NatsConnection> {
  const servers = url ? [url] : ["nats://localhost:4222"];
  
  const options: ConnectionOptions = {
    servers,
    reconnect: true,
    maxReconnectAttempts: 10,
    reconnectTimeWait: 2000,
    name: process.env.SERVICE_NAME || "cursed-service"
  };

  try {
    const nc = await connect(options);
    
    nc.addEventListener("connect", () => {
      logger.info({ servers }, "NATS connected");
    });
    
    nc.addEventListener("disconnect", () => {
      logger.warn("NATS disconnected");
    });
    
    nc.addEventListener("reconnect", () => {
      logger.info("NATS reconnected");
    });
    
    nc.addEventListener("error", (err) => {
      logger.error({ err }, "NATS connection error");
    });

    return nc;
  } catch (err) {
    logger.error({ err, servers }, "Failed to connect to NATS");
    throw new Error(`NATS connection failed: ${err}`);
  }
}