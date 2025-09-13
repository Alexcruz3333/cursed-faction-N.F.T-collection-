import Fastify from "fastify";
import { randomUUID } from "crypto";
import { env, logger, setupTracing, createNats, createRedis } from "@cursed/common";

setupTracing();

type MatchData = { mode: string; region: string; teamA: string[]; teamB: string[]; createdAt: number };
type SessionData = { id: string; region: string; mode: string; teamA: string[]; teamB: string[]; createdAt: number };

async function validateConnections(nats: any, redis: any) {
  try {
    const info = nats.info;
    if (!info) throw new Error("NATS connection info unavailable");
    logger.info("NATS connection validated");
    
    await redis.ping();
    logger.info("Redis connection validated");
  } catch (err) {
    logger.error({ err }, "Connection validation failed");
    throw err;
  }
}

function validateMatchData(data: any): data is MatchData {
  return (
    data &&
    typeof data.mode === 'string' &&
    typeof data.region === 'string' &&
    Array.isArray(data.teamA) &&
    Array.isArray(data.teamB) &&
    data.teamA.length === 4 &&
    data.teamB.length === 4 &&
    typeof data.createdAt === 'number'
  );
}

async function main() {
  const app = Fastify({ logger });

  // Validate required environment variables
  if (!process.env.NATS_URL) {
    throw new Error("NATS_URL environment variable is required");
  }
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL environment variable is required");
  }

  const nats = await createNats(process.env.NATS_URL);
  const redis = createRedis(process.env.REDIS_URL);

  // Validate connections before starting
  await validateConnections(nats, redis);

  const sub = nats.subscribe("matchmaking.match_found");
  
  // Process match_found messages
  (async () => {
    for await (const m of sub) {
      try {
        const rawData = new TextDecoder().decode(m.data);
        let match: MatchData;

        try {
          match = JSON.parse(rawData);
        } catch (parseErr) {
          logger.error({ err: parseErr, rawData }, "Failed to parse match_found message");
          continue;
        }

        if (!validateMatchData(match)) {
          logger.error({ match }, "Invalid match data received");
          continue;
        }

        const sessionId = randomUUID();
        const session: SessionData = { 
          id: sessionId, 
          region: match.region, 
          mode: match.mode, 
          teamA: match.teamA, 
          teamB: match.teamB,
          createdAt: match.createdAt
        };

        // Store session in Redis with TTL (24 hours)
        const sessionKey = `session:${sessionId}`;
        try {
          await redis.setex(sessionKey, 24 * 60 * 60, JSON.stringify(session));
          logger.info({ sessionId, match }, "session_created");
          
          await nats.publish("session.created", new TextEncoder().encode(JSON.stringify({ id: sessionId, match })));
        } catch (err) {
          logger.error({ err, sessionId }, "Failed to store session or publish event");
        }
      } catch (err) {
        logger.error({ err }, "Error processing match_found message");
      }
    }
  })().catch((err) => logger.error({ err }, "session subscriber error"));

  app.get("/healthz", async () => {
    try {
      await redis.ping();
      return { status: "ok", timestamp: new Date().toISOString() };
    } catch (err) {
      logger.error({ err }, "Health check failed");
      throw new Error("Service unhealthy");
    }
  });

  app.get<{ Params: { id: string } }>("/v1/sessions/:id", async (req, reply) => {
    try {
      const { id } = req.params;
      
      // Basic UUID validation
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        return reply.code(400).send({ error: "invalid_session_id_format" });
      }

      const sessionKey = `session:${id}`;
      const sessionData = await redis.get(sessionKey);

      if (!sessionData) {
        return reply.code(404).send({ error: "session_not_found" });
      }

      try {
        const session = JSON.parse(sessionData);
        return session;
      } catch (parseErr) {
        logger.error({ err: parseErr, sessionId: id }, "Failed to parse stored session data");
        return reply.code(500).send({ error: "internal_server_error" });
      }
    } catch (err) {
      logger.error({ err, sessionId: req.params.id }, "Failed to get session");
      return reply.code(500).send({ error: "internal_server_error" });
    }
  });

  // Graceful shutdown handling
  const gracefulShutdown = async () => {
    logger.info('Shutting down session service gracefully');
    try {
      await sub.unsubscribe();
      await nats.close();
      redis.disconnect();
      await app.close();
    } catch (err) {
      logger.error({ err }, 'Error during graceful shutdown');
    }
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  const port = Number(env.PORT ?? 4002);
  await app.listen({ port, host: "0.0.0.0" });
  logger.info({ port }, "Session service started successfully");
}

main().catch((err) => {
  logger.error({ err }, "session failed");
  process.exit(1);
});