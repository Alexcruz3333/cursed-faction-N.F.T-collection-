import Fastify from "fastify";
import { randomUUID } from "crypto";
import { env, logger, setupTracing, createNats } from "@cursed/common";

setupTracing();

const sessions = new Map<string, { id: string; region: string; mode: string; teamA: string[]; teamB: string[] }>();

async function main() {
  const app = Fastify({ logger });
  const nats = await createNats(process.env.NATS_URL);

  const sub = nats.subscribe("matchmaking.match_found");
  (async () => {
    for await (const m of sub) {
      const match = JSON.parse(new TextDecoder().decode(m.data)) as { mode: string; region: string; teamA: string[]; teamB: string[]; createdAt: number };
      const id = randomUUID();
      sessions.set(id, { id, region: match.region, mode: match.mode, teamA: match.teamA, teamB: match.teamB });
      logger.info({ id, match }, "session_created");
      await nats.publish("session.created", new TextEncoder().encode(JSON.stringify({ id, match })));
    }
  })().catch((err) => logger.error({ err }, "session subscriber error"));

  app.get("/healthz", async () => ({ status: "ok" }));
  app.get("/v1/sessions/:id", async (req, reply) => {
    const id = (req.params as any).id as string;
    const s = sessions.get(id);
    if (!s) return reply.code(404).send({ error: "not_found" });
    return s;
  });

  const port = Number(env.PORT ?? 4002);
  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  logger.error({ err }, "session failed");
  process.exit(1);
});