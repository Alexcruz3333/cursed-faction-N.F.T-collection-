import { Address, createWalletClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import vaultAbi from "../abi/CursedPiggyBankVault.min.json" assert { type: "json" };
import { AIAgent, PaymentRequest } from "../agent";

export async function tryProcessPayment(
  agent: AIAgent,
  daySpentWei: bigint,
  req: PaymentRequest,
  rpcUrl: string,
  chainId: number,
  aiExecutorPk: `0x${string}`,
  vault: Address
) {
  const chain = chainId === base.id ? base : baseSepolia;
  const walletClient = createWalletClient({ transport: http(rpcUrl), chain, account: aiExecutorPk });
  const decision = await agent.decidePayment(req, daySpentWei);
  if (!decision.approve) return { ok: false, reason: decision.reason };

  const hash = await walletClient.writeContract({
    address: vault,
    abi: vaultAbi as any,
    functionName: "spendETH",
    args: [req.tokenId, req.to, req.amountWei]
  });
  return { ok: true, tx: hash };
}
