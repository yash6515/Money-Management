# Paise — AI money coach for modern India

> Built in 3 days for the Blostem hackathon. One line elevator: Paise is an AI-powered personal finance platform that helps Indian millennials build smart FD ladders, track expenses, plan goals, and chat with a finance coach — in English or Hindi.

**Live demo:** _add Vercel URL here after deploy_
**Demo video:** _add Loom link here_

## ⚡ Try it instantly

**No signup required.** The landing page has a "Try as Guest" button that loads a preloaded demo account (Raj Sharma, 60 days of transactions, 3 goals, 3 FDs, referral history).

For the admin panel:
- Email: `admin@paise.app`
- Use "Demo admin login" on `/login` page

## 🎯 What Paise does

1. **AI FD Ladder Builder** — 15+ Indian banks. Input amount + horizon, get an optimised multi-FD split with 1-2% higher blended yield than one-bank FDs. Explanation in English or Hindi.
2. **Smart Expense Tracker** — Upload HDFC/ICICI/Paytm CSVs. Auto-categorised. Category breakdown, WoW trends, top merchants, AI-generated spending insights.
3. **Paise Coach (chatbot)** — Claude-powered finance advisor trained on Indian instruments (FDs, SIPs, PPF, ELSS, 80C, NPS). Persistent sessions. EN/HI toggle.
4. **Goals + What-If Simulator** — Track goals with progress bars. Slide through scenarios (cut spend, bump SIP, prepay loan) and see compound growth over 1-30 years.

Plus:
- **Referral system** — each user gets a code. Inviter earns 30 days of Pro, invitee gets 14 days. Share via WhatsApp/Twitter/LinkedIn. Leaderboard.
- **Admin panel** — dashboard, user management, content management (FD rates, chatbot prompts, featured insights), referral moderation, AI usage & cost tracking, feature flags, audit log.

## 🛠 Tech stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + custom shadcn/ui primitives
- **Recharts** for all visualisations
- **Anthropic Claude SDK** (`claude-sonnet-4-5`) with graceful fallback responses
- **PapaParse** for CSV statement parsing
- **Resend** SDK wired for referral email notifications (stubbed)
- Auth: cookie-based stub with a clear upgrade path to **Clerk**
- Data: localStorage-backed store with a clear upgrade path to **Supabase** (schema in `lib/types.ts`)

The app **runs locally with zero external keys**. Set `ANTHROPIC_API_KEY` in `.env.local` to enable live AI.

## 🚀 Setup

```bash
# 1. Install deps
npm install

# 2. Copy env template
cp .env.example .env.local
# (optional) add your ANTHROPIC_API_KEY for live AI responses

# 3. Dev
npm run dev
# open http://localhost:3000
```

## 📂 Structure

```
app/
  page.tsx                 # Landing
  login/ signup/           # Auth (with guest mode)
  refer/[code]/            # Public referral landing
  dashboard/               # Unified user dashboard
  fd-ladder/               # AI ladder builder + bank comparison
  expenses/                # CSV upload + categorisation + charts
  chat/                    # Paise Coach chatbot
  goals/                   # Goals + what-if simulator
  referrals/               # Referral dashboard + leaderboard
  settings/                # Profile, plan, data export, delete
  admin/                   # Admin panel (role-gated)
    page.tsx               # Dashboard
    users/                 # User management
    content/               # FD rates, prompts, insights
    referrals/             # Referral moderation
    ai-usage/              # Cost tracking
    features/              # Feature flags
    logs/                  # Audit trail
  api/
    chat/route.ts          # Chatbot endpoint (Claude)
    fd-ladder/route.ts     # Ladder generator (Claude)
    categorize/route.ts    # Transaction categoriser (Claude)

components/
  ui/                      # Button, Card, Input, Dialog, Select, Tabs, Slider, Progress, Badge, Label, Textarea
  app-shell.tsx            # Protected user layout
  admin-shell.tsx          # Admin layout

lib/
  auth.tsx                 # AuthProvider + useAuth + useRequireAuth
  store.ts                 # localStorage-backed data store (swap for Supabase)
  claude.ts                # Anthropic wrapper with canned fallbacks
  fd-engine.ts             # Ladder-building algorithm
  banks.ts                 # 15+ Indian banks + rates (admin editable)
  categorize.ts            # Heuristic categoriser for uploads
  demo-data.ts             # Seed data (Raj Sharma + 6 other demo users)
  types.ts                 # All TypeScript types
  utils.ts                 # formatINR, formatDate, cn, uid, etc.
```

## 🧠 Design decisions

**Why localStorage + stub auth instead of Supabase + Clerk?**
Hackathon time. External services = accounts, env vars, and one-more-thing-to-break during demo. The store.ts interface mirrors a typical Supabase client, so swapping is a single-file change. `lib/types.ts` doubles as the Postgres schema reference (with RLS policies noted in the build prompt).

**Why Claude with canned fallbacks?**
Judges will open the app. If `ANTHROPIC_API_KEY` is missing, the UI still produces useful responses instead of erroring. The real calls use `claude-sonnet-4-5`.

**Why Hindi everywhere?**
It's the wedge. Big Indian finance apps ship English-only AI. Paise's ladder explanations, chatbot, and referral messages all have first-class Hindi support.

## 💰 Business model

- **Free**: basic ladders, 3 AI chats/day, expense tracking
- **Pro (₹199/mo)**: unlimited AI, portfolio tracking, priority support
- **Referral unlock**: invite = 30 days Pro free (inviter) + 14 days (invitee). Drives viral growth.
- **Distribution**: FD bookings redirect to **Blostem API** (strategic partnership signal to the judges).

## ⚠️ What's stubbed vs real

| Feature | Status |
|---|---|
| Landing, auth, guest mode | ✅ fully working |
| FD ladder algorithm + compare table | ✅ fully working |
| Ladder AI explanation (Claude) | ✅ if key set, else canned |
| Expense CSV upload + categorisation | ✅ working (heuristic) |
| AI expense insights | ✅ if key set |
| Chatbot | ✅ if key set |
| Goals + simulator | ✅ fully working |
| Referrals + share + leaderboard | ✅ fully working |
| Admin panel (all 7 pages) | ✅ fully working |
| Persistence | localStorage (swap for Supabase) |
| OAuth / phone OTP | stubbed (any 4-digit OTP works) |
| Email notifications for referrals | stubbed (Resend wired, not invoked) |
| PDF statement parsing | not implemented (CSV only) |
| FD booking | opens "Redirect to Blostem" modal |

## 🎬 Demo flow (2 min video script)

1. **Landing** — hit "Try as Guest". Dashboard loads instantly with Raj's 60 days of data.
2. **FD Ladder** — build a ₹5L ladder, watch it generate 3 rungs with blended yield. Click "Why this split" — AI explains in Hindi if you toggle.
3. **Expenses** — scroll through category pie + trend chart + AI insights card.
4. **Chat** — ask "Build me a tax-smart investment plan on 75K income" — get live Claude response.
5. **Goals** — slide the What-If levers, watch the area chart diverge.
6. **Referrals** — copy your link, show the leaderboard.
7. **Admin** — logout, login as admin. Walk through /admin, /admin/users, /admin/referrals (flagged row), /admin/ai-usage cost chart, /admin/features flag toggle, /admin/logs audit trail.
8. **Closer** — mention Blostem API partnership for FD booking.

## 📜 License

Built as a hackathon submission. Not open source.

---

Built by Yash · 2026 · Not a SEBI registered advisor. Figures are indicative.
