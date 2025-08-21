import OpenAI from "openai";
import { z } from "zod";

export type PaymentRequest = { tokenId: bigint; to: `0x${string}`; amountWei: bigint; memo?: string };
export type AirdropRequest = { tokenId: bigint; token?: `0x${string}`; recipients: { to: `0x${string}`; amountWei: bigint }[]; memo?: string };
export type Decision = { approve: boolean; reason: string; cappedAmountWei?: bigint };

const schema = z.object({ approve: z.boolean(), reason: z.string(), cappedAmountWei: z.string().optional() });

export class AIAgent {
  private llm?: OpenAI;
  private dailyLimitWei: bigint;
  private maxSingleWei: bigint;

  constructor(opts: { openaiApiKey?: string; dailyLimitWei: bigint; maxSingleWei: bigint }) {
    this.dailyLimitWei = opts.dailyLimitWei;
    this.maxSingleWei = opts.maxSingleWei;
    if (opts.openaiApiKey) this.llm = new OpenAI({ apiKey: opts.openaiApiKey });
  }

  async decidePayment(req: PaymentRequest, daySpentWei: bigint): Promise<Decision> {
    // Hard guardrails
    if (req.amountWei > this.maxSingleWei) return { approve: false, reason: "Exceeds single payment cap" };
    if (req.amountWei + daySpentWei > this.dailyLimitWei) return { approve: false, reason: "Exceeds daily cap" };

    // If LLM is available, ask for additional risk scoring (non-binding)
    if (!this.llm) return { approve: true, reason: "Within policy caps" };

    const prompt = `Evaluate this payment under policy caps for fraud/tax risk. Reply JSON keys: approve, reason. amountWei=${req.amountWei}, to=${req.to}, memo=${req.memo ?? ""}`;

    try {
      const out = await this.llm.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const msg = out.choices[0]?.message?.content ?? "{}";
      const parsed = schema.safeParse(JSON.parse(msg));
      if (!parsed.success) return { approve: true, reason: "Within policy caps (fallback)" };

      return { approve: parsed.data.approve, reason: parsed.data.reason };
    } catch {
      return { approve: true, reason: "Within policy caps (LLM unavailable)" };
    }
  }
}