import Fastify from "fastify";
import { randomUUID } from "crypto";
import { env, logger, setupTracing, createNats } from "@cursed/common";

setupTracing();

type Session = { 
  id: string; 
  region: string; 
  mode: string; 
  teamA: string[]; 
  teamB: string[] 
};

type MatchFoundPayload = { 
  mode: string; 
  region: string; 
  teamA: string[]; 
  teamB: string[]; 
  createdAt: number 
};

const sessions = new Map<string, Session>();

async function main() {
  const app = Fastify({ logger });
  const nats = await createNats(process.env.NATS_URL);

  // Graceful shutdown handling
  const gracefulShutdown = async () => {
    logger.info("Shutting down session service gracefully...");
    await app.close();
    await nats.close();
    sessions.clear();
    process.exit(0);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  const sub = nats.subscribe("matchmaking.match_found");
  
  // Handle match creation asynchronously with proper error handling
  (async () => {
    try {
      for await (const m of sub) {
        try {
          const match = JSON.parse(new TextDecoder().decode(m.data)) as MatchFoundPayload;
          
          // Validate match data
          if (!match.mode || !match.region || !Array.isArray(match.teamA) || !Array.isArray(match.teamB)) {
            logger.warn({ match }, "Invalid match data received");
            continue;
          }

          const id = randomUUID();
          const session: Session = { 
            id, 
            region: match.region, 
            mode: match.mode, 
            teamA: match.teamA, 
            teamB: match.teamB 
          };
          
          sessions.set(id, session);
          logger.info({ id, match }, "session_created");
          
          await nats.publish("session.created", new TextEncoder().encode(JSON.stringify({ id, match })));
        } catch (messageError) {
          logger.error({ messageError, data: m.data }, "Error processing match_found message");
        }
      }
    } catch (subscriptionError) {
      logger.error({ subscriptionError }, "Session subscriber error");
      // Attempt to reconnect or gracefully shutdown
      setTimeout(() => process.exit(1), 1000);
    }
  })();

  app.get("/healthz", async () => ({ status: "ok" }));
  
  app.get<{ Params: { id: string } }>("/v1/sessions/:id", async (req, reply) => {
    try {
      const { id } = req.params;
      
      // Basic UUID validation
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return reply.code(400).send({ error: "invalid_id", message: "Invalid session ID format" });
      }
      
      const session = sessions.get(id);
      if (!session) {
        return reply.code(404).send({ error: "not_found", message: "Session not found" });
      }
      
      return session;
    } catch (error) {
      logger.error({ error, sessionId: req.params.id }, "Error retrieving session");
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  const port = Number(env.PORT ?? 4002);
  await app.listen({ port, host: "0.0.0.0" });
  logger.info({ port }, "Session service started");
}

main().catch((err) => {
  logger.error({ err }, "session failed");
  process.exit(1);
});