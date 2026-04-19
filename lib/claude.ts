import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-5";

let client: Anthropic | null = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export async function claudeChat(opts: {
  system: string;
  messages: ClaudeMessage[];
  max_tokens?: number;
}): Promise<{ text: string; usage: { in: number; out: number } }> {
  const c = getClient();
  if (!c) {
    // Fallback: return canned response so the UI still demos without an API key
    const last = opts.messages[opts.messages.length - 1]?.content || "";
    return {
      text: fallbackReply(last),
      usage: { in: 0, out: 0 },
    };
  }
  const resp = await c.messages.create({
    model: MODEL,
    max_tokens: opts.max_tokens ?? 1024,
    system: opts.system,
    messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
  });
  const text = resp.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");
  return {
    text,
    usage: { in: resp.usage.input_tokens, out: resp.usage.output_tokens },
  };
}

function fallbackReply(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("fd") || p.includes("ladder") || p.includes("fixed deposit")) {
    return `**FD Laddering Strategy** (demo response — ANTHROPIC_API_KEY not set)

For a balanced ladder, split your amount across 3 tenures:
- **25%** in a 6-month FD (liquidity buffer)
- **35%** in a 12-month FD at highest available rate (usually SFBs: Suryoday 8.25%, Unity 8.45%)
- **40%** in a 24-month FD to lock in rates (Yes Bank 8%, Unity SFB 8.75%)

As each rung matures, reinvest at the longest end. This gives you liquidity every 6 months while maximising blended yield.

*Switch on the Anthropic API key to get personalised advice in English/Hindi.*`;
  }
  if (p.includes("sip") || p.includes("mutual")) {
    return `**SIP Strategy** (demo response)

For a 25-30 year old earning ₹50K-1L with medium risk:
- **60% Equity**: Nifty 50 Index Fund, Parag Parikh Flexi Cap
- **20% Hybrid**: Balanced Advantage Fund
- **20% Debt/PPF**: For stability + tax benefits

Start with ₹10K/month if new. Increase 10% YoY. Stay invested minimum 7 years.

*Set ANTHROPIC_API_KEY for live, personalised advice.*`;
  }
  if (p.includes("emergency") || p.includes("fund")) {
    return `**Emergency Fund** (demo response)

Rule of thumb: **6 months of essential expenses**. For you, that's likely ₹2-3L.

Park this in:
- **50%** — Liquid Fund (redeemable in 24h, ~6.5% returns)
- **50%** — 6-month FD ladder (keeps rolling liquidity)

Never dip into long-term investments for emergencies — that's what this is for.`;
  }
  return `Thanks for the question! **(demo fallback response)**

I can help with FDs, SIPs, PPF, ELSS, 80C tax planning, emergency funds, and building a goal-based portfolio. Set \`ANTHROPIC_API_KEY\` in \`.env\` for live AI responses powered by Claude.

Try asking: "Build me an FD ladder for ₹5 lakh" or "How should I invest my first ₹20K?"`;
}

export function estimateCostUSD(tokens_in: number, tokens_out: number) {
  // Rough Sonnet pricing placeholder ($3/MTok in, $15/MTok out)
  return (tokens_in * 3 + tokens_out * 15) / 1_000_000;
}
