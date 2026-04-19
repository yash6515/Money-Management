import type { User, Transaction, Goal, FDPortfolio, Referral, AdminLog, FeatureFlag, AIUsageLog, AnalyticsEvent, ChatSession } from "./types";

const today = new Date();
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d;
};
const daysAhead = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d;
};

export const DEMO_USER_ID = "u_raj";
export const DEMO_ADMIN_ID = "u_admin";

export const demoUsers: User[] = [
  {
    id: DEMO_USER_ID,
    email: "raj@demo.paise.app",
    name: "Raj Sharma",
    phone: "+91 98765 43210",
    income_range: "50K-1L",
    risk_appetite: "medium",
    language: "en",
    role: "user",
    referral_code: "RAJ-F8K2",
    credits: 0,
    created_at: iso(daysAgo(90)),
    goals_tags: ["emergency_fund", "travel", "retirement"],
  },
  {
    id: DEMO_ADMIN_ID,
    email: "admin@paise.app",
    name: "Paise Admin",
    income_range: "1L-2L",
    risk_appetite: "medium",
    language: "en",
    role: "admin",
    referral_code: "ADM-0001",
    credits: 999,
    created_at: iso(daysAgo(180)),
  },
  {
    id: "u_priya",
    email: "priya@demo.paise.app",
    name: "Priya Patel",
    income_range: "30K-50K",
    risk_appetite: "low",
    language: "hi",
    role: "user",
    referral_code: "PRI-M3N4",
    referred_by: DEMO_USER_ID,
    credits: 14,
    created_at: iso(daysAgo(45)),
    goals_tags: ["emergency_fund", "marriage"],
  },
  {
    id: "u_arjun",
    email: "arjun@demo.paise.app",
    name: "Arjun Mehta",
    income_range: "1L-2L",
    risk_appetite: "high",
    language: "en",
    role: "user",
    referral_code: "ARJ-P9Q1",
    referred_by: DEMO_USER_ID,
    credits: 14,
    created_at: iso(daysAgo(30)),
    goals_tags: ["house", "retirement", "car"],
  },
  {
    id: "u_sneha",
    email: "sneha@demo.paise.app",
    name: "Sneha Reddy",
    income_range: "50K-1L",
    risk_appetite: "medium",
    language: "en",
    role: "user",
    referral_code: "SNE-X7Y2",
    credits: 0,
    created_at: iso(daysAgo(20)),
    goals_tags: ["travel"],
  },
  {
    id: "u_vikram",
    email: "vikram@demo.paise.app",
    name: "Vikram Iyer",
    income_range: ">2L",
    risk_appetite: "high",
    language: "en",
    role: "user",
    referral_code: "VIK-L4M8",
    referred_by: "u_arjun",
    credits: 14,
    created_at: iso(daysAgo(10)),
    goals_tags: ["retirement", "house"],
  },
  {
    id: "u_kavya",
    email: "kavya@demo.paise.app",
    name: "Kavya Nair",
    income_range: "30K-50K",
    risk_appetite: "low",
    language: "hi",
    role: "user",
    referral_code: "KAV-R5T9",
    credits: 0,
    created_at: iso(daysAgo(5)),
    goals_tags: ["emergency_fund"],
  },
];

// Realistic Indian merchants with amounts based on Raj's 50K-1L income
const merchantSeeds = [
  { merchant: "Swiggy", category: "Food & Dining", min: 180, max: 650 },
  { merchant: "Zomato", category: "Food & Dining", min: 220, max: 800 },
  { merchant: "Zepto", category: "Groceries", min: 300, max: 1500 },
  { merchant: "BigBasket", category: "Groceries", min: 800, max: 3200 },
  { merchant: "Blinkit", category: "Groceries", min: 250, max: 1100 },
  { merchant: "Uber", category: "Transport", min: 120, max: 450 },
  { merchant: "Ola", category: "Transport", min: 100, max: 380 },
  { merchant: "Rapido", category: "Transport", min: 40, max: 150 },
  { merchant: "IRCTC", category: "Transport", min: 400, max: 2200 },
  { merchant: "Amazon", category: "Shopping", min: 299, max: 4999 },
  { merchant: "Flipkart", category: "Shopping", min: 399, max: 3999 },
  { merchant: "Myntra", category: "Shopping", min: 599, max: 2499 },
  { merchant: "Netflix", category: "Entertainment", min: 199, max: 649 },
  { merchant: "Spotify", category: "Entertainment", min: 119, max: 179 },
  { merchant: "BookMyShow", category: "Entertainment", min: 250, max: 700 },
  { merchant: "Apollo Pharmacy", category: "Healthcare", min: 150, max: 1200 },
  { merchant: "Cult.fit", category: "Healthcare", min: 999, max: 2499 },
  { merchant: "Airtel", category: "Bills", min: 399, max: 999 },
  { merchant: "Jio", category: "Bills", min: 299, max: 666 },
  { merchant: "Tata Power", category: "Bills", min: 800, max: 2500 },
  { merchant: "Indane Gas", category: "Bills", min: 850, max: 1050 },
  { merchant: "HP Petrol", category: "Transport", min: 500, max: 2000 },
  { merchant: "Starbucks", category: "Food & Dining", min: 320, max: 580 },
  { merchant: "Third Wave Coffee", category: "Food & Dining", min: 180, max: 350 },
  { merchant: "Chai Point", category: "Food & Dining", min: 60, max: 220 },
  { merchant: "Lenskart", category: "Shopping", min: 1500, max: 4500 },
  { merchant: "Nykaa", category: "Shopping", min: 399, max: 2499 },
  { merchant: "PharmEasy", category: "Healthcare", min: 200, max: 1800 },
  { merchant: "MakeMyTrip", category: "Travel", min: 2500, max: 18000 },
  { merchant: "Yulu", category: "Transport", min: 15, max: 80 },
];

function seedTransactions(userId: string, days: number = 60): Transaction[] {
  const txns: Transaction[] = [];
  let id = 0;
  // Seeded pseudo-random
  let seed = userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let d = 0; d < days; d++) {
    const date = daysAgo(d);
    const numTxns = Math.floor(rand() * 4) + 1; // 1-4 txns/day
    for (let i = 0; i < numTxns; i++) {
      const seed = merchantSeeds[Math.floor(rand() * merchantSeeds.length)];
      const amount = Math.round(seed.min + rand() * (seed.max - seed.min));
      txns.push({
        id: `txn_${userId}_${id++}`,
        user_id: userId,
        amount,
        category: seed.category,
        merchant: seed.merchant,
        date: iso(date),
        type: "debit",
        source: "demo",
      });
    }
    // Monthly salary credit on 1st of month
    if (date.getDate() === 1) {
      txns.push({
        id: `txn_${userId}_${id++}`,
        user_id: userId,
        amount: 78000,
        category: "Salary",
        merchant: "Employer Payroll",
        date: iso(date),
        type: "credit",
        source: "demo",
      });
    }
  }
  // Monthly rent
  for (let m = 0; m < 3; m++) {
    const d = daysAgo(30 * m + 2);
    txns.push({
      id: `txn_${userId}_rent_${m}`,
      user_id: userId,
      amount: 22000,
      category: "Rent",
      merchant: "NoBroker Pay",
      date: iso(d),
      type: "debit",
      source: "demo",
    });
  }
  // SIP
  for (let m = 0; m < 3; m++) {
    const d = daysAgo(30 * m + 5);
    txns.push({
      id: `txn_${userId}_sip_${m}`,
      user_id: userId,
      amount: 10000,
      category: "Investments",
      merchant: "Groww SIP - Parag Parikh Flexi",
      date: iso(d),
      type: "debit",
      source: "demo",
    });
  }
  return txns.sort((a, b) => b.date.localeCompare(a.date));
}

export const demoTransactions: Transaction[] = [
  ...seedTransactions(DEMO_USER_ID, 60),
  ...seedTransactions("u_priya", 45),
  ...seedTransactions("u_arjun", 30),
];

// =====================================================================
// Runtime seeder — pre-populate a newly created user (e.g. guest or
// demo login) with realistic data so the dashboard isn't empty.
// =====================================================================
import { uid } from "./utils";

export function makeSeedForUser(userId: string): {
  transactions: Transaction[];
  goals: Goal[];
  fds: FDPortfolio[];
} {
  // seedTransactions uses string ids like "txn_u_..."; rewrite to proper
  // UUIDs so they satisfy the Supabase schema.
  const transactions = seedTransactions(userId, 60).map((t) => ({
    ...t,
    id: uid(),
  }));

  const goals: Goal[] = [
    {
      id: uid(),
      user_id: userId,
      title: "Emergency Fund (6 months)",
      target_amount: 300000,
      current_amount: 185000,
      deadline: iso(daysAhead(180)),
      category: "safety",
      created_at: iso(daysAgo(90)),
    },
    {
      id: uid(),
      user_id: userId,
      title: "Trip to Japan",
      target_amount: 200000,
      current_amount: 67000,
      deadline: iso(daysAhead(365)),
      category: "travel",
      created_at: iso(daysAgo(60)),
    },
    {
      id: uid(),
      user_id: userId,
      title: "Down Payment — Flat",
      target_amount: 1500000,
      current_amount: 410000,
      deadline: iso(daysAhead(1095)),
      category: "house",
      created_at: iso(daysAgo(80)),
    },
  ];

  const fds: FDPortfolio[] = [
    {
      id: uid(),
      user_id: userId,
      bank: "hdfc",
      amount: 50000,
      rate: 6.6,
      start_date: iso(daysAgo(60)),
      maturity_date: iso(daysAhead(305)),
      tenure_months: 12,
    },
    {
      id: uid(),
      user_id: userId,
      bank: "suryoday",
      amount: 75000,
      rate: 8.25,
      start_date: iso(daysAgo(30)),
      maturity_date: iso(daysAhead(335)),
      tenure_months: 12,
    },
    {
      id: uid(),
      user_id: userId,
      bank: "sbi",
      amount: 100000,
      rate: 7.0,
      start_date: iso(daysAgo(120)),
      maturity_date: iso(daysAhead(610)),
      tenure_months: 24,
    },
  ];

  return { transactions, goals, fds };
}

export const demoGoals: Goal[] = [
  {
    id: "g1",
    user_id: DEMO_USER_ID,
    title: "Emergency Fund (6 months)",
    target_amount: 300000,
    current_amount: 185000,
    deadline: iso(daysAhead(180)),
    category: "safety",
    created_at: iso(daysAgo(90)),
  },
  {
    id: "g2",
    user_id: DEMO_USER_ID,
    title: "Trip to Japan",
    target_amount: 200000,
    current_amount: 67000,
    deadline: iso(daysAhead(365)),
    category: "travel",
    created_at: iso(daysAgo(60)),
  },
  {
    id: "g3",
    user_id: DEMO_USER_ID,
    title: "Down Payment — Flat",
    target_amount: 1500000,
    current_amount: 410000,
    deadline: iso(daysAhead(1095)),
    category: "house",
    created_at: iso(daysAgo(80)),
  },
];

export const demoFDs: FDPortfolio[] = [
  {
    id: "fd1",
    user_id: DEMO_USER_ID,
    bank: "hdfc",
    amount: 50000,
    rate: 6.6,
    start_date: iso(daysAgo(60)),
    maturity_date: iso(daysAhead(305)),
    tenure_months: 12,
  },
  {
    id: "fd2",
    user_id: DEMO_USER_ID,
    bank: "suryoday",
    amount: 75000,
    rate: 8.25,
    start_date: iso(daysAgo(30)),
    maturity_date: iso(daysAhead(335)),
    tenure_months: 12,
  },
  {
    id: "fd3",
    user_id: DEMO_USER_ID,
    bank: "sbi",
    amount: 100000,
    rate: 7.0,
    start_date: iso(daysAgo(120)),
    maturity_date: iso(daysAhead(610)),
    tenure_months: 24,
  },
];

export const demoReferrals: Referral[] = [
  {
    id: "r1",
    referrer_id: DEMO_USER_ID,
    referred_id: "u_priya",
    referred_email: "priya@demo.paise.app",
    status: "approved",
    reward_given: true,
    created_at: iso(daysAgo(45)),
  },
  {
    id: "r2",
    referrer_id: DEMO_USER_ID,
    referred_id: "u_arjun",
    referred_email: "arjun@demo.paise.app",
    status: "approved",
    reward_given: true,
    created_at: iso(daysAgo(30)),
  },
  {
    id: "r3",
    referrer_id: DEMO_USER_ID,
    referred_email: "aditya@gmail.com",
    referred_id: "pending_1",
    status: "pending",
    reward_given: false,
    created_at: iso(daysAgo(2)),
  },
  {
    id: "r4",
    referrer_id: "u_arjun",
    referred_id: "u_vikram",
    status: "approved",
    reward_given: true,
    created_at: iso(daysAgo(10)),
  },
  {
    id: "r5",
    referrer_id: "u_priya",
    referred_email: "suspicious@temp-mail.com",
    referred_id: "flagged_1",
    status: "pending",
    reward_given: false,
    flagged: true,
    created_at: iso(daysAgo(1)),
  },
];

export const demoAdminLogs: AdminLog[] = [
  {
    id: "al1",
    admin_id: DEMO_ADMIN_ID,
    admin_name: "Paise Admin",
    action: "update_fd_rate",
    target_id: "suryoday",
    metadata: { old: 8.0, new: 8.25, tenure: 12 },
    created_at: iso(daysAgo(3)),
  },
  {
    id: "al2",
    admin_id: DEMO_ADMIN_ID,
    admin_name: "Paise Admin",
    action: "grant_credits",
    target_id: "u_priya",
    metadata: { amount: 14, reason: "Referral reward" },
    created_at: iso(daysAgo(5)),
  },
  {
    id: "al3",
    admin_id: DEMO_ADMIN_ID,
    admin_name: "Paise Admin",
    action: "void_referral",
    target_id: "r5",
    metadata: { reason: "Suspicious email pattern" },
    created_at: iso(daysAgo(1)),
  },
];

export const demoFeatureFlags: FeatureFlag[] = [
  { key: "new_chatbot", enabled: true, rollout_percentage: 100, description: "Claude-powered chatbot v2" },
  { key: "pdf_statements", enabled: false, rollout_percentage: 0, description: "PDF bank statement parsing" },
  { key: "whatsapp_share", enabled: true, rollout_percentage: 100, description: "WhatsApp share for referrals" },
  { key: "leaderboard", enabled: true, rollout_percentage: 100, description: "Referral leaderboard" },
  { key: "hindi_ui", enabled: true, rollout_percentage: 50, description: "Hindi language interface" },
  { key: "blostem_redirect", enabled: true, rollout_percentage: 100, description: "FD booking via Blostem" },
];

export const demoAIUsage: AIUsageLog[] = Array.from({ length: 40 }, (_, i) => {
  const users = [
    { id: DEMO_USER_ID, name: "Raj Sharma" },
    { id: "u_priya", name: "Priya Patel" },
    { id: "u_arjun", name: "Arjun Mehta" },
    { id: "u_sneha", name: "Sneha Reddy" },
    { id: "u_vikram", name: "Vikram Iyer" },
  ];
  const u = users[i % users.length];
  const endpoints = ["chat", "categorize", "fd-ladder", "insights"];
  const tokens_in = 400 + Math.floor(Math.random() * 2000);
  const tokens_out = 200 + Math.floor(Math.random() * 800);
  return {
    id: `ai_${i}`,
    user_id: u.id,
    user_name: u.name,
    endpoint: endpoints[i % endpoints.length],
    tokens_in,
    tokens_out,
    cost_usd: (tokens_in * 3 + tokens_out * 15) / 1_000_000,
    created_at: iso(daysAgo(Math.floor(i / 3))),
  };
});

export const demoAnalytics: AnalyticsEvent[] = Array.from({ length: 80 }, (_, i) => {
  const events = [
    "user_signup",
    "feature_used",
    "ai_call",
    "fd_ladder_created",
    "goal_created",
    "referral_sent",
    "referral_converted",
  ];
  return {
    id: `ev_${i}`,
    user_id: demoUsers[i % demoUsers.length].id,
    event: events[i % events.length],
    metadata: {},
    created_at: iso(daysAgo(Math.floor(i / 4))),
  };
});

export const demoChatSessions: ChatSession[] = [
  {
    id: "cs_raj",
    user_id: DEMO_USER_ID,
    messages: [
      {
        role: "user",
        content: "I earn 75K/month. How should I split between FD, SIP, and PPF?",
        ts: iso(daysAgo(5)),
      },
      {
        role: "assistant",
        content:
          "Great question, Raj! Based on your income and medium risk appetite, here's a balanced split:\n\n**50/30/20 adapted for investing:**\n- **SIP in Equity Funds: ₹15,000/mo** — Long-term wealth (Parag Parikh Flexi / Nifty 50 Index). 10+ yr horizon, 12% avg returns expected.\n- **PPF: ₹12,500/mo (₹1.5L/yr max)** — Tax-free, 7.1%, 80C deduction. Lock for 15 yrs.\n- **FD Ladder: ₹10,000/mo** — Split across 1/2/3yr. Use SFBs like Suryoday (8.25%) for highest rates.\n\nThat's ~50% of take-home going to wealth building. Keep 6 months' expenses (₹3L) as emergency fund before aggressive investing.\n\nWant me to build you an FD ladder?",
        ts: iso(daysAgo(5)),
      },
    ],
    created_at: iso(daysAgo(5)),
    updated_at: iso(daysAgo(5)),
  },
];
