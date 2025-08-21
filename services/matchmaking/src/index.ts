import { env, logger, setupTracing, createNats, createRedis } from "@cursed/common";

setupTracing();

const QUEUE_KEY = "mm_queue";
const BUCKET = 100;
const MATCH_SIZE = 8;
const TEAM_SIZE = 4;

type EnqueuePayload = { playerId: string; mmr: number; ts: number };

async function main() {
  const nats = await createNats(process.env.NATS_URL);
  const redis = createRedis(process.env.REDIS_URL);

  // Graceful shutdown handling
  const gracefulShutdown = async () => {
    logger.info("Shutting down matchmaking service gracefully...");
    await nats.close();
    await redis.quit();
    process.exit(0);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  const sub = nats.subscribe("matchmaking.enqueue");
  logger.info({ subject: sub.getSubject() }, "matchmaking listening");

  for await (const msg of sub) {
    try {
      const payload = JSON.parse(new TextDecoder().decode(msg.data)) as EnqueuePayload;
      
      // Validate payload
      if (!payload.playerId || typeof payload.mmr !== "number" || typeof payload.ts !== "number") {
        logger.warn({ payload }, "Invalid enqueue payload received");
        continue;
      }

      const bucket = Math.floor(payload.mmr / BUCKET) * BUCKET;
      const key = `${QUEUE_KEY}:${bucket}`;

      // Use Redis pipeline for atomic operations to prevent race conditions
      const pipeline = redis.pipeline();
      pipeline.lpush(key, JSON.stringify(payload));
      pipeline.llen(key);
      const results = await pipeline.exec();

      if (!results || results.length !== 2) {
        logger.error("Failed to execute Redis pipeline");
        continue;
      }

      const len = results[1][1] as number;
      logger.debug({ bucket, queueLength: len, playerId: payload.playerId }, "Player added to queue");

      if (len >= MATCH_SIZE) {
        // Atomically get players and trim queue to prevent race conditions
        const multi = redis.multi();
        multi.lrange(key, -MATCH_SIZE, -1);
        multi.ltrim(key, 0, -(MATCH_SIZE + 1));
        const matchResults = await multi.exec();

        if (!matchResults || matchResults.length !== 2) {
          logger.error("Failed to execute match creation Redis operations");
          continue;
        }

        const players: string[] = matchResults[0][1] as string[];
        
        if (players.length !== MATCH_SIZE) {
          logger.warn({ 
            expected: MATCH_SIZE, 
            actual: players.length, 
            bucket 
          }, "Unexpected number of players for match");
          continue;
        }

        try {
          const teamA = players.slice(0, TEAM_SIZE).map((p: string) => {
            const parsed = JSON.parse(p) as EnqueuePayload;
            return parsed.playerId;
          });
          
          const teamB = players.slice(TEAM_SIZE, MATCH_SIZE).map((p: string) => {
            const parsed = JSON.parse(p) as EnqueuePayload;
            return parsed.playerId;
          });

          const match = { 
            mode: "CONTROL", 
            region: "auto", 
            teamA, 
            teamB, 
            createdAt: Date.now() 
          };

          await nats.publish("matchmaking.match_found", new TextEncoder().encode(JSON.stringify(match)));
          logger.info({ bucket, match, mmrBucket: bucket }, "match_found");
        } catch (parseError) {
          logger.error({ parseError, players }, "Failed to parse players for match creation");
          // Re-add players back to queue if match creation failed
          const readdPipeline = redis.pipeline();
          players.forEach(player => readdPipeline.lpush(key, player));
          await readdPipeline.exec();
        }
      }
    } catch (error) {
      logger.error({ error, msgData: msg.data }, "Error processing matchmaking message");
    }
  }
}

main().catch((err) => {
  logger.error({ err }, "matchmaking failed");
  process.exit(1);
});