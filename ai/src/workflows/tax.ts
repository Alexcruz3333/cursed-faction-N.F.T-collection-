import { differenceInCalendarDays, startOfMonth, endOfMonth } from "date-fns";
import { PublicClient, Address } from "viem";

export type TaxReport = {
  periodStart: Date;
  periodEnd: Date;
  totalIncomeWei: bigint;
  totalGiftsWei: bigint;
  totalPayoutsWei: bigint;
  csv: string; // export for accountant/filing
};

// NOTE: Not legal advice. This produces exports for review by a qualified professional.
export async function buildCaliforniaMonthlyReport(
  client: PublicClient,
  vault: Address,
  from: Date,
  to: Date
): Promise<TaxReport> {
  // Placeholder: query logs and aggregate amounts
  const periodStart = startOfMonth(from);
  const periodEnd = endOfMonth(to);

  // Simplified: replace with real log scans and categorization policy
  const totalIncomeWei = 0n;
  const totalGiftsWei = 0n;
  const totalPayoutsWei = 0n;

  const csv = [
    "date,type,tokenId,amountWei,txHash,category",
    // ... fill with scanned rows
  ].join("\n");

  return { periodStart, periodEnd, totalIncomeWei, totalGiftsWei, totalPayoutsWei, csv };
}