import Fastify from "fastify";
import { z } from "zod";
import { env, logger, setupTracing, createPgPool } from "@cursed/common";

setupTracing();

// Validation schemas
const PlayerIdSchema = z.object({
  playerId: z.string().uuid("Invalid player ID format"),
});

const InventoryUpdateSchema = z.object({
  itemId: z.string().min(1, "Item ID cannot be empty").max(100, "Item ID too long"),
  qty: z.number().int().min(0, "Quantity must be non-negative").max(999999, "Quantity too large"),
});

async function main() {
  const app = Fastify({ logger });
  const pg = createPgPool(process.env.POSTGRES_URL);

  // Graceful shutdown handling
  const gracefulShutdown = async () => {
    logger.info("Shutting down inventory service gracefully...");
    await app.close();
    await pg.end();
    process.exit(0);
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  app.get("/healthz", async () => ({ status: "ok" }));

  app.get<{ Params: { playerId: string } }>("/v1/inventory/:playerId", async (req, reply) => {
    try {
      const { playerId } = PlayerIdSchema.parse(req.params);
      
      const { rows } = await pg.query(
        "SELECT item_id, qty FROM inventory WHERE player_id = $1 ORDER BY item_id", 
        [playerId]
      );
      
      return rows;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: "validation_error", 
          details: error.errors 
        });
      }
      
      logger.error({ error, playerId: req.params.playerId }, "Failed to fetch inventory");
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  app.post<{ 
    Params: { playerId: string }, 
    Body: { itemId: string; qty: number } 
  }>("/v1/inventory/:playerId", async (req, reply) => {
    try {
      const { playerId } = PlayerIdSchema.parse(req.params);
      const { itemId, qty } = InventoryUpdateSchema.parse(req.body);

      // Check if player exists
      const playerCheck = await pg.query("SELECT id FROM players WHERE id = $1", [playerId]);
      if (playerCheck.rows.length === 0) {
        return reply.code(404).send({ 
          error: "player_not_found", 
          message: "Player does not exist" 
        });
      }

      await pg.query(
        `INSERT INTO inventory (player_id, item_id, qty) VALUES ($1, $2, $3)
         ON CONFLICT (player_id, item_id) DO UPDATE SET qty = $3, updated_at = now()`,
        [playerId, itemId, qty]
      );
      
      logger.info({ playerId, itemId, qty }, "Inventory updated");
      return { status: "ok" };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: "validation_error", 
          details: error.errors 
        });
      }
      
      logger.error({ 
        error, 
        playerId: req.params.playerId, 
        body: req.body 
      }, "Failed to update inventory");
      
      return reply.code(500).send({ error: "internal_error" });
    }
  });

  const port = Number(env.PORT ?? 4003);
  await app.listen({ port, host: "0.0.0.0" });
  logger.info({ port }, "Inventory service started");
}

main().catch((err) => {
  logger.error({ err }, "inventory failed");
  process.exit(1);
});