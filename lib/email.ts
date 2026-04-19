// =====================================================================
// Paise — Transactional email (Resend)
// =====================================================================
// Server-only. Call from API routes. Falls back to a no-op log if
// RESEND_API_KEY is not configured.
// =====================================================================

import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL || "Paise <onboarding@resend.dev>";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const c = client();
  if (!c) {
    console.log("[email:dev] (RESEND_API_KEY not set) would send:", opts.subject, "→", opts.to);
    return { ok: true, id: "dev-noop" };
  }
  try {
    const { data, error } = await c.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (e: any) {
    return { ok: false, error: e?.message || "resend failed" };
  }
}

// ---------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------

function layout(inner: string, cta?: { label: string; href: string }) {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; padding: 32px 24px; border-radius: 12px;">
    <div style="display:flex; align-items:center; gap: 10px; margin-bottom: 24px;">
      <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#00d4aa,#8b5cf6);display:inline-block;"></div>
      <span style="font-size:20px;font-weight:700;color:#fff;">Paise</span>
    </div>
    <div style="color:#d4d4d4;line-height:1.6;font-size:15px;">${inner}</div>
    ${
      cta
        ? `<div style="margin-top:28px;"><a href="${cta.href}" style="display:inline-block;background:#00d4aa;color:#000;font-weight:600;padding:12px 20px;border-radius:8px;text-decoration:none;">${cta.label}</a></div>`
        : ""
    }
    <hr style="border:none;border-top:1px solid #262626;margin:32px 0 16px;" />
    <p style="color:#737373;font-size:12px;">
      Paise — AI money coach for modern India. You received this because you signed up or were referred.
    </p>
  </div>`;
}

export const templates = {
  welcome(name: string, appUrl: string) {
    return {
      subject: "Welcome to Paise 🎉",
      html: layout(
        `<h2 style="color:#fff;margin:0 0 12px;">Hey ${name}, welcome to Paise!</h2>
         <p>Your AI money coach is ready. Try these in the first 2 minutes:</p>
         <ul>
           <li>📊 Upload a bank statement CSV → get auto-categorized spending + insights</li>
           <li>💰 Build a personalized FD ladder across 16 Indian banks (rates up to 8.75%)</li>
           <li>🎯 Set a goal → run what-if simulations</li>
           <li>💬 Ask the coach anything in English or Hindi</li>
         </ul>`,
        { label: "Open your dashboard →", href: `${appUrl}/dashboard` }
      ),
      text: `Hey ${name}, welcome to Paise! Try the dashboard: ${appUrl}/dashboard`,
    };
  },

  referralSignup(opts: {
    referred_name: string;
    referrer_name: string;
    appUrl: string;
  }) {
    return {
      subject: `You're in! Welcome to Paise (via ${opts.referrer_name}) 🎁`,
      html: layout(
        `<h2 style="color:#fff;margin:0 0 12px;">Welcome, ${opts.referred_name}!</h2>
         <p><strong>${opts.referrer_name}</strong> referred you, so you've started with <strong>14 days of Paise Pro</strong> free — unlimited AI coach, no daily limits.</p>
         <p>Dive into the dashboard to get your first AI insight, build an FD ladder, or chat in Hindi / English.</p>`,
        { label: "Claim my Pro trial →", href: `${opts.appUrl}/dashboard` }
      ),
      text: `Welcome ${opts.referred_name}! You got 14 days of Paise Pro via ${opts.referrer_name}.`,
    };
  },

  referralReward(opts: {
    referrer_name: string;
    referred_name: string;
    bonus_days: number;
    total_credits: number;
    appUrl: string;
  }) {
    return {
      subject: `🎉 ${opts.referred_name} joined! +${opts.bonus_days} days of Paise Pro`,
      html: layout(
        `<h2 style="color:#fff;margin:0 0 12px;">Nice work, ${opts.referrer_name}!</h2>
         <p><strong>${opts.referred_name}</strong> just joined Paise using your referral code.</p>
         <p>You've earned <strong>${opts.bonus_days} extra days of Paise Pro</strong>. Your balance is now <strong>${opts.total_credits} days</strong>.</p>
         <p>Keep sharing your code to stack credits → one successful referral = 30 days.</p>`,
        { label: "Share more →", href: `${opts.appUrl}/referrals` }
      ),
      text: `${opts.referred_name} joined via your code. +${opts.bonus_days} days Pro (total: ${opts.total_credits}d).`,
    };
  },
};
