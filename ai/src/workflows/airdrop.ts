import { Address, createWalletClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import vaultAbi from "../abi/CursedPiggyBankVault.min.json" assert { type: "json" };
import { AirdropRequest } from "../agent";

export async function executeAirdrop(
  req: AirdropRequest,
  rpcUrl: string,
  chainId: number,
  aiExecutorPk: `0x${string}`,
  vault: Address
) {
  const chain = chainId === base.id ? base : baseSepolia;
  const walletClient = createWalletClient({ transport: http(rpcUrl), chain, account: aiExecutorPk });

  // Simple loop; consider batching off-chain
  const txs: `0x${string}`[] = [];
  for (const r of req.recipients) {
    const hash = await walletClient.writeContract({
      address: vault,
      abi: vaultAbi as any,
      functionName: req.token ? "spendERC20" : "spendETH",
      args: req.token
        ? [req.tokenId, req.token, r.to, r.amountWei]
        : [req.tokenId, r.to, r.amountWei]
    });
    txs.push(hash);
  }

  return { ok: true, txs };
}