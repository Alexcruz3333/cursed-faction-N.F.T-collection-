import { env, logger, setupTracing, createNats, createRedis } from "@cursed/common";

setupTracing();

const QUEUE_KEY = "mm_queue";
const BUCKET = 100;

type EnqueuePayload = { playerId: string; mmr: number; ts: number };

async function validateConnections(nats: any, redis: any) {
  try {
    // Test NATS connection
    const info = nats.info;
    if (!info) throw new Error("NATS connection info unavailable");
    logger.info("NATS connection validated");
    
    // Test Redis connection
    await redis.ping();
    logger.info("Redis connection validated");
  } catch (err) {
    logger.error({ err }, "Connection validation failed");
    throw err;
  }
}

function validateEnqueuePayload(payload: any): payload is EnqueuePayload {
  return (
    payload &&
    typeof payload.playerId === 'string' &&
    payload.playerId.length > 0 &&
    typeof payload.mmr === 'number' &&
    payload.mmr >= 0 &&
    payload.mmr <= 10000 &&
    typeof payload.ts === 'number' &&
    payload.ts > 0
  );
}

async function main() {
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

  const sub = nats.subscribe("matchmaking.enqueue");
  logger.info({ subject: sub.getSubject() }, "matchmaking listening");

  // Graceful shutdown handling
  const gracefulShutdown = async () => {
    logger.info('Shutting down matchmaking service gracefully');
    try {
      await sub.unsubscribe();
      await nats.close();
      redis.disconnect();
    } catch (err) {
      logger.error({ err }, 'Error during graceful shutdown');
    }
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  for await (const msg of sub) {
    try {
      const rawData = new TextDecoder().decode(msg.data);
      let payload: EnqueuePayload;

      try {
        payload = JSON.parse(rawData);
      } catch (parseErr) {
        logger.error({ err: parseErr, rawData }, "Failed to parse enqueue message");
        continue;
      }

      if (!validateEnqueuePayload(payload)) {
        logger.error({ payload }, "Invalid enqueue payload received");
        continue;
      }

      const bucket = Math.floor(payload.mmr / BUCKET) * BUCKET;
      const key = `${QUEUE_KEY}:${bucket}`;

      try {
        await redis.lpush(key, JSON.stringify(payload));
        const len = await redis.llen(key);

        logger.debug({ playerId: payload.playerId, bucket, queueLength: len }, "Player added to queue");

        if (len >= 8) {
          const players: string[] = await redis.lrange(key, -8, -1);
          await redis.ltrim(key, 0, -(8 + 1));
          
          const parsedPlayers: EnqueuePayload[] = [];
          
          // Validate all players before creating match
          for (const playerStr of players) {
            try {
              const player = JSON.parse(playerStr);
              if (validateEnqueuePayload(player)) {
                parsedPlayers.push(player);
              }
            } catch (parseErr) {
              logger.error({ err: parseErr, playerStr }, "Failed to parse player in queue");
            }
          }

          if (parsedPlayers.length >= 8) {
            const teamA = parsedPlayers.slice(0, 4).map(p => p.playerId);
            const teamB = parsedPlayers.slice(4, 8).map(p => p.playerId);
            const match = { 
              mode: "CONTROL", 
              region: "auto", 
              teamA, 
              teamB, 
              createdAt: Date.now() 
            };
            
            try {
              await nats.publish("matchmaking.match_found", new TextEncoder().encode(JSON.stringify(match)));
              logger.info({ bucket, match, avgMMR: parsedPlayers.reduce((sum, p) => sum + p.mmr, 0) / parsedPlayers.length }, "match_found");
            } catch (publishErr) {
              logger.error({ err: publishErr, match }, "Failed to publish match_found");
              
              // Put players back in queue on publish failure
              for (const player of parsedPlayers) {
                try {
                  await redis.lpush(key, JSON.stringify(player));
                } catch (readdErr) {
                  logger.error({ err: readdErr, player }, "Failed to re-add player to queue");
                }
              }
            }
          } else {
            logger.warn({ bucket, validPlayers: parsedPlayers.length }, "Not enough valid players for match");
          }
        }
      } catch (redisErr) {
        logger.error({ err: redisErr, payload }, "Redis operation failed for enqueue");
      }
    } catch (err) {
      logger.error({ err }, "Error processing enqueue message");
    }
  }
}

main().catch((err) => {
  logger.error({ err }, "matchmaking failed");
  process.exit(1);
});