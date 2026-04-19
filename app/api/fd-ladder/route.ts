import { NextRequest, NextResponse } from "next/server";
import { buildLadder, ladderExplanation, blendedYield } from "@/lib/fd-engine";
import { claudeChat } from "@/lib/claude";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, tenure_months, liquidity, senior, language, user_profile } = body;

    const rungs = buildLadder({
      amount: Number(amount) || 100000,
      total_tenure_months: Number(tenure_months) || 36,
      liquidity_need: liquidity || "medium",
      senior_citizen: !!senior,
    });

    const yld = blendedYield(rungs);

    // Try to enrich with AI explanation
    let explanation = ladderExplanation(rungs, language || "en");

    try {
      const system = `You are Paise Coach, an Indian personal finance expert. Given an FD ladder, explain in ${language === "hi" ? "Hindi (Devanagari)" : "clear English"}, using markdown, why this split is smart for the user. Keep it under 180 words. Include specific numbers. Address the user personally. End with one actionable next step.`;
      const prompt = `User profile: ${JSON.stringify(user_profile || {})}
Ladder: ${JSON.stringify(rungs.map((r) => ({
        bank: r.bank.name,
        amount: r.amount,
        tenure_months: r.tenure_months,
        rate: r.rate,
        maturity_value: r.maturity_value,
      })))}
Blended yield: ${yld}%
Total: ₹${rungs.reduce((s, r) => s + r.amount, 0)}`;
      const { text } = await claudeChat({
        system,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
      });
      if (text) explanation = text;
    } catch (e) {
      // keep template fallback
    }

    return NextResponse.json({ rungs, yld, explanation });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
