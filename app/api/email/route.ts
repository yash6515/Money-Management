import { NextRequest, NextResponse } from "next/server";
import { sendEmail, templates } from "@/lib/email";

export const runtime = "nodejs";

// POST /api/email
// Body: { type: "welcome" | "referral_signup" | "referral_reward", ... }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let tmpl: { subject: string; html: string; text?: string } | null = null;
    let to: string | undefined;

    switch (body.type) {
      case "welcome": {
        to = body.to;
        tmpl = templates.welcome(body.name || "there", appUrl);
        break;
      }
      case "referral_signup": {
        to = body.to;
        tmpl = templates.referralSignup({
          referred_name: body.referred_name || "friend",
          referrer_name: body.referrer_name || "a friend",
          appUrl,
        });
        break;
      }
      case "referral_reward": {
        to = body.to;
        tmpl = templates.referralReward({
          referrer_name: body.referrer_name || "there",
          referred_name: body.referred_name || "a new user",
          bonus_days: body.bonus_days ?? 30,
          total_credits: body.total_credits ?? 30,
          appUrl,
        });
        break;
      }
      default:
        return NextResponse.json({ error: "unknown email type" }, { status: 400 });
    }

    if (!to) return NextResponse.json({ error: "missing `to`" }, { status: 400 });

    const result = await sendEmail({ to, ...tmpl });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: result.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
