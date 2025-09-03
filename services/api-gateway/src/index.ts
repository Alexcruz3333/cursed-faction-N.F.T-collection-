import Fastify from "fastify";
import cors from "@fastify/cors";
import { env, logger, setupTracing, createPgPool, createNats } from "@cursed/common";

setupTracing();

async function main() {
  const app = Fastify({ logger });
  await app.register(cors, { origin: true });

  const pg = createPgPool(process.env.POSTGRES_URL);
  const nats = await createNats(process.env.NATS_URL);

  app.get("/healthz", async () => ({ status: "ok" }));

  app.get<{ Params: { id: string } }>("/v1/players/:id", async (req, reply) => {
    const { id } = req.params;
    const { rows } = await pg.query(
      "SELECT id, account_level, mmr, wallet_addr, created_at FROM players WHERE id = $1",
      [id]
    );
    if (rows.length === 0) return reply.code(404).send({ error: "not_found" });
    return rows[0];
  });

  app.post<{ Body: { playerId: string; mmr?: number } }>("/v1/matchmaking/enqueue", async (req) => {
    const payload = { playerId: req.body.playerId, mmr: req.body.mmr ?? 1000, ts: Date.now() };
    await nats.publish("matchmaking.enqueue", new TextEncoder().encode(JSON.stringify(payload)));
    return { status: "enqueued" };
  });

  const port = Number(env.PORT ?? 8080);
  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  logger.error({ err }, "api-gateway failed to start");
  process.exit(1);
});
