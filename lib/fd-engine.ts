import { BANKS, getBankRate, bestRate } from "./banks";
import type { Bank, FDPortfolio } from "./types";

export interface LadderRung {
  bank: Bank;
  amount: number;
  tenure_months: number;
  rate: number;
  maturity_date: string;
  maturity_value: number;
  weight_pct: number;
}

export interface LadderInput {
  amount: number;
  total_tenure_months: number; // e.g., 36 = 3 year horizon
  liquidity_need: "low" | "medium" | "high";
  senior_citizen?: boolean;
  user_banks_only?: string[];
}

export function buildLadder(input: LadderInput): LadderRung[] {
  const { amount, total_tenure_months, liquidity_need, senior_citizen } = input;

  // Weights depending on liquidity need
  let splits: { tenure: number; weight: number }[];
  if (liquidity_need === "high") {
    splits = [
      { tenure: 6, weight: 0.4 },
      { tenure: 12, weight: 0.35 },
      { tenure: Math.min(24, total_tenure_months), weight: 0.25 },
    ];
  } else if (liquidity_need === "low") {
    splits = [
      { tenure: 12, weight: 0.2 },
      { tenure: Math.min(24, total_tenure_months), weight: 0.3 },
      { tenure: Math.min(36, total_tenure_months), weight: 0.3 },
      { tenure: Math.min(60, total_tenure_months), weight: 0.2 },
    ];
  } else {
    splits = [
      { tenure: 12, weight: 0.25 },
      { tenure: Math.min(24, total_tenure_months), weight: 0.35 },
      { tenure: Math.min(36, total_tenure_months), weight: 0.4 },
    ];
  }

  const rungs: LadderRung[] = splits.map((s) => {
    // pick best bank for this tenure
    const ranked = bestRate(s.tenure, senior_citizen || false);
    const top = input.user_banks_only?.length
      ? ranked.find((r) => input.user_banks_only!.includes(r.bank.id))
      : ranked[0];
    const pick = top || ranked[0];
    const rungAmount = Math.round(amount * s.weight);
    const rate = pick.rate;
    const maturity =
      rungAmount * Math.pow(1 + rate / 100 / 4, (s.tenure / 12) * 4); // quarterly compounding approx
    const mdate = new Date();
    mdate.setMonth(mdate.getMonth() + s.tenure);
    return {
      bank: pick.bank,
      amount: rungAmount,
      tenure_months: s.tenure,
      rate,
      maturity_date: mdate.toISOString(),
      maturity_value: Math.round(maturity),
      weight_pct: s.weight * 100,
    };
  });

  return rungs;
}

export function blendedYield(rungs: LadderRung[]): number {
  const total = rungs.reduce((s, r) => s + r.amount, 0);
  if (!total) return 0;
  const weightedRate = rungs.reduce((s, r) => s + r.rate * r.amount, 0) / total;
  return +weightedRate.toFixed(2);
}

export function ladderExplanation(
  rungs: LadderRung[],
  lang: "en" | "hi" = "en"
): string {
  const total = rungs.reduce((s, r) => s + r.amount, 0);
  const totalMaturity = rungs.reduce((s, r) => s + r.maturity_value, 0);
  const blended = blendedYield(rungs);
  const gain = totalMaturity - total;
  const gainPct = ((gain / total) * 100).toFixed(1);

  if (lang === "hi") {
    return `**आपका FD Ladder** (कुल ₹${total.toLocaleString("en-IN")})

Blended Yield: **${blended}%** — बड़े बैंकों से ~1% ज़्यादा।
अनुमानित रिटर्न: **₹${gain.toLocaleString("en-IN")}** (+${gainPct}%)

**क्यों यह काम करता है:**
${rungs.map((r, i) => `- Rung ${i + 1}: ₹${r.amount.toLocaleString("en-IN")} → ${r.bank.name} ${r.tenure_months}mo @ ${r.rate}%`).join("\n")}

हर rung के maturity पर आप उसे सबसे लम्बे tenure पर फिर से invest करें। इससे आपको regular liquidity मिलती है और rate बढ़ने का फायदा भी।`;
  }

  return `**Your FD Ladder** (₹${total.toLocaleString("en-IN")} total)

Blended Yield: **${blended}%** — ~1% higher than big-bank FDs alone.
Estimated Return: **₹${gain.toLocaleString("en-IN")}** (+${gainPct}%)

**Why this works:**
${rungs.map((r, i) => `- Rung ${i + 1}: ₹${r.amount.toLocaleString("en-IN")} → ${r.bank.name}, ${r.tenure_months}mo @ ${r.rate}%`).join("\n")}

As each rung matures, reinvest at the longest tenure. You'll have **liquidity every ${Math.min(...rungs.map((r) => r.tenure_months))} months** without sacrificing long-term yield.`;
}
