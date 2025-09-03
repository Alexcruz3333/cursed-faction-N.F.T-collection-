import Fastify from "fastify";
import { env, logger, setupTracing, createPgPool } from "@cursed/common";

setupTracing();

async function main() {
  const app = Fastify({ logger });
  const pg = createPgPool(process.env.POSTGRES_URL);

  app.get("/healthz", async () => ({ status: "ok" }));

  app.get<{ Params: { playerId: string } }>("/v1/inventory/:playerId", async (req) => {
    const { playerId } = req.params;
    const { rows } = await pg.query("SELECT item_id, qty FROM inventory WHERE player_id = $1", [playerId]);
    return rows;
  });

  app.post<{ Params: { playerId: string }; Body: { itemId: string; qty: number } }>(
    "/v1/inventory/:playerId",
    async (req) => {
      const { playerId } = req.params;
      const { itemId, qty } = req.body;
      await pg.query(
        `INSERT INTO inventory (player_id, item_id, qty) VALUES ($1, $2, $3)
       ON CONFLICT (player_id, item_id) DO UPDATE SET qty = $3, updated_at = now()`,
        [playerId, itemId, qty]
      );
      return { status: "ok" };
    }
  );

  const port = Number(env.PORT ?? 4003);
  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  logger.error({ err }, "inventory failed");
  process.exit(1);
});
