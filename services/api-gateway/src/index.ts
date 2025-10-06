import Fastify from "fastify";
import cors from "@fastify/cors";
import { env, logger, setupTracing, createPgPool, createNats } from "@cursed/common";

setupTracing();

async function validateConnections(pg: any, nats: any) {
  try {
    // Test PostgreSQL connection
    await pg.query("SELECT 1");
    logger.info("PostgreSQL connection validated");
    
    // Test NATS connection
    const info = nats.info;
    if (!info) throw new Error("NATS connection info unavailable");
    logger.info("NATS connection validated");
  } catch (err) {
    logger.error({ err }, "Connection validation failed");
    throw err;
  }
}

async function main() {
  const app = Fastify({ logger });
  await app.register(cors, { origin: true });

  // Validate required environment variables
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL environment variable is required");
  }
  if (!process.env.NATS_URL) {
    throw new Error("NATS_URL environment variable is required");
  }

  const pg = createPgPool(process.env.POSTGRES_URL);
  const nats = await createNats(process.env.NATS_URL);

  // Validate connections before starting server
  await validateConnections(pg, nats);

  app.get("/healthz", async () => {
    try {
      await pg.query("SELECT 1");
      return { status: "ok", timestamp: new Date().toISOString() };
    } catch (err) {
      logger.error({ err }, "Health check failed");
      throw new Error("Service unhealthy");
    }
  });

  app.get<{ Params: { id: string } }>("/v1/players/:id", async (req, reply) => {
    try {
      const { id } = req.params;
      
      // Basic UUID validation
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        return reply.code(400).send({ error: "invalid_player_id_format" });
      }

      const { rows } = await pg.query("SELECT id, account_level, mmr, wallet_addr, created_at FROM players WHERE id = $1", [id]);
      if (rows.length === 0) return reply.code(404).send({ error: "not_found" });
      return rows[0];
    } catch (err) {
      logger.error({ err, playerId: req.params.id }, "Failed to get player");
      return reply.code(500).send({ error: "internal_server_error" });
    }
  });

  app.post<{ Body: { playerId: string; mmr?: number } }>("/v1/matchmaking/enqueue", async (req, reply) => {
    try {
      const { playerId, mmr } = req.body;

      // Input validation
      if (!playerId || typeof playerId !== 'string') {
        return reply.code(400).send({ error: "missing_or_invalid_playerId" });
      }

      if (mmr !== undefined && (typeof mmr !== 'number' || mmr < 0 || mmr > 10000)) {
        return reply.code(400).send({ error: "invalid_mmr_range" });
      }

      // Basic UUID validation for playerId
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(playerId)) {
        return reply.code(400).send({ error: "invalid_playerId_format" });
      }

      const payload = { playerId, mmr: mmr ?? 1000, ts: Date.now() };
      await nats.publish("matchmaking.enqueue", new TextEncoder().encode(JSON.stringify(payload)));
      
      logger.info({ playerId, mmr: payload.mmr }, "Player enqueued for matchmaking");
      return { status: "enqueued" };
    } catch (err) {
      logger.error({ err, body: req.body }, "Failed to enqueue player");
      return reply.code(500).send({ error: "internal_server_error" });
    }
  });

  // Graceful shutdown handling
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    try {
      await nats.close();
      await pg.end();
      await app.close();
    } catch (err) {
      logger.error({ err }, 'Error during graceful shutdown');
    }
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    try {
      await nats.close();
      await pg.end();
      await app.close();
    } catch (err) {
      logger.error({ err }, 'Error during graceful shutdown');
    }
    process.exit(0);
  });

  const port = Number(env.PORT ?? 8080);
  await app.listen({ port, host: "0.0.0.0" });
  logger.info({ port }, "API Gateway started successfully");
}

main().catch((err) => {
  logger.error({ err }, "api-gateway failed to start");
  process.exit(1);
});