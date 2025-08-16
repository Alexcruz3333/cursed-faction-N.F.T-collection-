import { env, logger, setupTracing, createNats, createRedis } from "@cursed/common";

setupTracing();

const QUEUE_KEY = "mm_queue";
const BUCKET = 100;

type EnqueuePayload = { playerId: string; mmr: number; ts: number };

async function main() {
  const nats = await createNats(process.env.NATS_URL);
  const redis = createRedis(process.env.REDIS_URL);

  const sub = nats.subscribe("matchmaking.enqueue");
  logger.info({ subject: sub.getSubject() }, "matchmaking listening");

  for await (const msg of sub) {
    const payload = JSON.parse(new TextDecoder().decode(msg.data)) as EnqueuePayload;
    const bucket = Math.floor(payload.mmr / BUCKET) * BUCKET;
    const key = `${QUEUE_KEY}:${bucket}`;

    await redis.lpush(key, JSON.stringify(payload));
    const len = await redis.llen(key);

    if (len >= 8) {
      const players: string[] = await redis.lrange(key, -8, -1);
      await redis.ltrim(key, 0, -(8 + 1));
      const teamA = players.slice(0, 4).map((p: string) => (JSON.parse(p) as EnqueuePayload).playerId);
      const teamB = players.slice(4, 8).map((p: string) => (JSON.parse(p) as EnqueuePayload).playerId);
      const match = { mode: "CONTROL", region: "auto", teamA, teamB, createdAt: Date.now() };
      await nats.publish("matchmaking.match_found", new TextEncoder().encode(JSON.stringify(match)));
      logger.info({ bucket, match }, "match_found");
    }
  }
}

main().catch((err) => {
  logger.error({ err }, "matchmaking failed");
  process.exit(1);
});