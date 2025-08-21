import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { z } from "zod";
import { env, logger, setupTracing, createPgPool, createNats } from "@cursed/common";

setupTracing();

// Validation schemas
const PlayerIdSchema = z.object({
  id: z.string().uuid("Invalid player ID format"),
});

const MatchmakingEnqueueSchema = z.object({
  playerId: z.string().uuid("Invalid player ID format"),
  mmr: z.number().int().min(0).max(10000).optional(),
});

async function main() {
  const app = Fastify({ logger });
  
  // Security middleware
  await app.register(cors, { 
    origin: process.env.NODE_ENV === "production" ? false : true,
    credentials: true 
  });
  
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  const pg = createPgPool(process.env.POSTGRES_URL);
  const nats = await createNats(process.env.NATS_URL);

  // Graceful shutdown handling
  const gracefulShutdown = async () => {
    logger.info("Shutting down gracefully...");
    await app.close();
    await pg.end();
    await nats.close();
    process.exit(0);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  app.get("/healthz", async () => ({ status: "ok" }));

  app.get<{ Params: { id: string } }>("/v1/players/:id", async (req, reply) => {
    try {
      // Validate input
      const { id } = PlayerIdSchema.parse(req.params);
      
      const { rows } = await pg.query(
        "SELECT id, account_level, mmr, wallet_addr, created_at FROM players WHERE id = $1", 
        [id]
      );
      
      if (rows.length === 0) {
        return reply.code(404).send({ error: "not_found", message: "Player not found" });
      }
      
      return rows[0];
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: "validation_error", 
          details: error.errors 
        });
      }
      
      logger.error({ error, playerId: req.params.id }, "Failed to fetch player");
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  app.post<{ Body: { playerId: string; mmr?: number } }>("/v1/matchmaking/enqueue", async (req, reply) => {
    try {
      // Validate input
      const payload = MatchmakingEnqueueSchema.parse({
        ...req.body,
        mmr: req.body.mmr ?? 1000,
      });

      const enqueuePaylodWithTimestamp = { 
        ...payload, 
        ts: Date.now() 
      };

      await nats.publish("matchmaking.enqueue", new TextEncoder().encode(JSON.stringify(enqueuePaylodWithTimestamp)));
      
      logger.info({ playerId: payload.playerId, mmr: payload.mmr }, "Player enqueued for matchmaking");
      return { status: "enqueued" };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: "validation_error", 
          details: error.errors 
        });
      }
      
      logger.error({ error, body: req.body }, "Failed to enqueue player");
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  const port = Number(env.PORT ?? 8080);
  await app.listen({ port, host: "0.0.0.0" });
  logger.info({ port }, "API Gateway started");
}

main().catch((err) => {
  logger.error({ err }, "api-gateway failed to start");
  process.exit(1);
});