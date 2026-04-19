import { NextRequest, NextResponse } from "next/server";
import { claudeChat } from "@/lib/claude";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { messages, system, user_profile, language } = await req.json();

    const base =
      system ||
      `You are "Paise Coach", an expert Indian personal finance advisor. You help users make smart money decisions across FDs, SIPs, PPF, ELSS, NPS, 80C tax planning, loans, and emergency funds. Always:
- Use ₹ and Indian context (UPI, PAN, Aadhaar, lakhs/crores)
- Be concrete with numbers. Show calculations.
- Respect the user's income range and risk appetite.
- Avoid giving advice that requires SEBI registration (no stock picks).
- Be warm but concise. Use markdown for structure.`;

    const profileCtx = user_profile
      ? `\n\nUser profile: name=${user_profile.name}, income=${user_profile.income_range}, risk=${user_profile.risk_appetite}, preferred language=${language || user_profile.language || "en"}. Reply in ${language === "hi" ? "Hindi (Devanagari)" : "English"}.`
      : "";

    const { text, usage } = await claudeChat({
      system: base + profileCtx,
      messages: messages || [],
      max_tokens: 800,
    });

    return NextResponse.json({ text, usage });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
