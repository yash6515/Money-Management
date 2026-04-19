import { NextRequest, NextResponse } from "next/server";
import { claudeChat } from "@/lib/claude";
import { categorizeLocal } from "@/lib/categorize";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { rows, insights_profile } = await req.json();
    const items: Array<{ merchant: string; amount: number }> = rows || [];

    // First pass: heuristic
    const categories = items.map((r) => categorizeLocal(r.merchant));

    // Insights via Claude
    let insights =
      "Based on your spending: consider reducing discretionary categories (Shopping, Entertainment) by 10-15% and redirecting to a SIP. Top merchants by volume are your biggest levers.";
    try {
      const totalByCat: Record<string, number> = {};
      items.forEach((r, i) => {
        totalByCat[categories[i]] = (totalByCat[categories[i]] || 0) + r.amount;
      });
      const { text } = await claudeChat({
        system: `You are Paise Coach. Given category spending totals for an Indian user, give 3 concise, numbered insights — warm, specific, actionable. Use ₹. Under 140 words. Markdown OK.`,
        messages: [
          {
            role: "user",
            content: `Profile: ${JSON.stringify(insights_profile || {})}\nSpending by category: ${JSON.stringify(totalByCat)}`,
          },
        ],
        max_tokens: 400,
      });
      if (text) insights = text;
    } catch {}

    return NextResponse.json({ categories, insights });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
