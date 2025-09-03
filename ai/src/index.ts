import "dotenv/config";
import pino from "pino";
import { createPublicClient, http, Address, parseAbiItem } from "viem";
import { base, baseSepolia } from "viem/chains";
import { AIAgent } from "./agent";
import { tryProcessPayment } from "./workflows/payments";
import { buildCaliforniaMonthlyReport } from "./workflows/tax";

const log = pino({ transport: { target: "pino-pretty" } });

const RPC_URL = process.env.RPC_URL!;
const CHAIN_ID = Number(process.env.CHAIN_ID || baseSepolia.id);
const VAULT_ADDRESS = process.env.VAULT_ADDRESS as Address;
const AI_EXECUTOR_PRIVATE_KEY = process.env.AI_EXECUTOR_PRIVATE_KEY as `0x${string}`;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DAILY_ETH_SPEND_LIMIT_WEI = BigInt(process.env.DAILY_ETH_SPEND_LIMIT_WEI || "1000000000000000000");
const MAX_SINGLE_PAYMENT_WEI = BigInt(process.env.MAX_SINGLE_PAYMENT_WEI || "200000000000000000");

async function main() {
  if (!RPC_URL || !VAULT_ADDRESS || !AI_EXECUTOR_PRIVATE_KEY) {
    throw new Error("Missing env: RPC_URL, VAULT_ADDRESS, AI_EXECUTOR_PRIVATE_KEY");
  }

  const chain = CHAIN_ID === base.id ? base : baseSepolia;
  const publicClient = createPublicClient({ transport: http(RPC_URL), chain });
  const agent = new AIAgent({
    openaiApiKey: OPENAI_API_KEY,
    dailyLimitWei: DAILY_ETH_SPEND_LIMIT_WEI,
    maxSingleWei: MAX_SINGLE_PAYMENT_WEI,
  });

  log.info({ chainId: CHAIN_ID, vault: VAULT_ADDRESS }, "AI operator starting...");

  // Example: subscribe to NodeAppended for monitoring
  const nodeAppendedEvent = parseAbiItem(
    "event NodeAppended(uint256 indexed tokenId,uint256 indexed nodeId,uint256 indexed parentId,uint8 edgeType,address token,address actor,uint256 amount,bytes32 meta)"
  );

  publicClient.watchEvent({
    address: VAULT_ADDRESS,
    event: nodeAppendedEvent,
    onLogs: (logs) => {
      for (const l of logs) {
        log.info({ log: l, event: nodeAppendedEvent.name }, "NodeAppended");
      }
    },
  });

  // Placeholder: sample payment queue item (would come from webhook/db/helpdesk)
  // Remove in production
  setTimeout(async () => {
    try {
      const res = await tryProcessPayment(
        agent,
        0n,
        { tokenId: 1n, to: "0x000000000000000000000000000000000000dEaD", amountWei: 1000000000000000n, memo: "test" },
        RPC_URL,
        CHAIN_ID,
        AI_EXECUTOR_PRIVATE_KEY,
        VAULT_ADDRESS
      );
      log.info({ res }, "Payment processed");
    } catch (e) {
      log.error(e, "Payment failed");
    }
  }, 5000);

  // Monthly CA tax export (first day of month at 02:00 PT)
  // In production use a proper scheduler (e.g., cron)
  const ONE_DAY = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    const now = new Date();
    if (now.getUTCDate() === 1 && now.getUTCHours() === 10 && now.getUTCMinutes() < 5) {
      try {
        const report = await buildCaliforniaMonthlyReport(VAULT_ADDRESS, now, now);
        log.info({ report }, "Built CA monthly tax report (review required)");
      } catch (e) {
        log.error(e, "Failed to build tax report");
      }
    }
  }, ONE_DAY);
}

main().catch((e) => {
  log.error(e, "Fatal error");
  process.exit(1);
});
