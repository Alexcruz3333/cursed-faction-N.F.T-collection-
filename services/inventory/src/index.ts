import Fastify from "fastify";
import { env, logger, setupTracing, createPgPool } from "@cursed/common";

setupTracing();

async function validateConnections(pg: any) {
  try {
    await pg.query("SELECT 1");
    logger.info("PostgreSQL connection validated");
  } catch (err) {
    logger.error({ err }, "Connection validation failed");
    throw err;
  }
}

async function main() {
  const app = Fastify({ logger });

  // Validate required environment variables
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL environment variable is required");
  }

  const pg = createPgPool(process.env.POSTGRES_URL);

  // Validate connections before starting
  await validateConnections(pg);

  app.get("/healthz", async () => {
    try {
      await pg.query("SELECT 1");
      return { status: "ok", timestamp: new Date().toISOString() };
    } catch (err) {
      logger.error({ err }, "Health check failed");
      throw new Error("Service unhealthy");
    }
  });

  app.get<{ Params: { playerId: string } }>("/v1/inventory/:playerId", async (req, reply) => {
    try {
      const { playerId } = req.params;
      
      // Basic UUID validation
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(playerId)) {
        return reply.code(400).send({ error: "invalid_playerId_format" });
      }

      const { rows } = await pg.query("SELECT item_id, qty FROM inventory WHERE player_id = $1", [playerId]);
      
      logger.debug({ playerId, itemCount: rows.length }, "Retrieved inventory");
      return rows;
    } catch (err) {
      logger.error({ err, playerId: req.params.playerId }, "Failed to get inventory");
      return reply.code(500).send({ error: "internal_server_error" });
    }
  });

  app.post<{ Params: { playerId: string }, Body: { itemId: string; qty: number } }>("/v1/inventory/:playerId", async (req, reply) => {
    try {
      const { playerId } = req.params;
      const { itemId, qty } = req.body;

      // Input validation
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(playerId)) {
        return reply.code(400).send({ error: "invalid_playerId_format" });
      }

      if (!itemId || typeof itemId !== 'string' || itemId.trim().length === 0) {
        return reply.code(400).send({ error: "missing_or_invalid_itemId" });
      }

      if (typeof qty !== 'number' || qty < 0 || qty > 1000000) {
        return reply.code(400).send({ error: "invalid_qty_range" });
      }

      await pg.query(
        `INSERT INTO inventory (player_id, item_id, qty) VALUES ($1, $2, $3)
         ON CONFLICT (player_id, item_id) DO UPDATE SET qty = $3, updated_at = now()`,
        [playerId, itemId.trim(), qty]
      );

      logger.info({ playerId, itemId: itemId.trim(), qty }, "Inventory updated");
      return { status: "ok" };
    } catch (err) {
      logger.error({ err, playerId: req.params.playerId, body: req.body }, "Failed to update inventory");
      return reply.code(500).send({ error: "internal_server_error" });
    }
  });

  // Graceful shutdown handling
  const gracefulShutdown = async () => {
    logger.info('Shutting down inventory service gracefully');
    try {
      await pg.end();
      await app.close();
    } catch (err) {
      logger.error({ err }, 'Error during graceful shutdown');
    }
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  const port = Number(env.PORT ?? 4003);
  await app.listen({ port, host: "0.0.0.0" });
  logger.info({ port }, "Inventory service started successfully");
}

main().catch((err) => {
  logger.error({ err }, "inventory failed");
  process.exit(1);
});