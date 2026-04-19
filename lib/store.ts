"use client";
// =====================================================================
// Paise — Data store
// =====================================================================
// Supabase-backed when NEXT_PUBLIC_SUPABASE_URL + ANON_KEY are set.
// Falls back to localStorage (with demo seed) when not configured — so
// the app still runs locally without any env vars.
//
// ALL METHODS ARE ASYNC. Every call site must use `await`.
// =====================================================================

import type {
  User,
  Transaction,
  Goal,
  FDPortfolio,
  Referral,
  AdminLog,
  FeatureFlag,
  AIUsageLog,
  AnalyticsEvent,
  ChatSession,
  Bank,
} from "./types";
import {
  demoUsers,
  demoTransactions,
  demoGoals,
  demoFDs,
  demoReferrals,
  demoAdminLogs,
  demoFeatureFlags,
  demoAIUsage,
  demoAnalytics,
  demoChatSessions,
} from "./demo-data";
import { BANKS as DEFAULT_BANKS } from "./banks";
import { uid } from "./utils";
import { supabase, isSupabaseConfigured } from "./supabase";

// ---- Local fallback ---------------------------------------------------
const KEY = "paise_state_v1";

interface LocalState {
  users: User[];
  transactions: Transaction[];
  goals: Goal[];
  fds: FDPortfolio[];
  referrals: Referral[];
  adminLogs: AdminLog[];
  featureFlags: FeatureFlag[];
  aiUsage: AIUsageLog[];
  analytics: AnalyticsEvent[];
  chatSessions: ChatSession[];
  banks: Bank[];
  chatbotPrompt: string;
  preSeededPrompts: string[];
  featuredInsight: string;
}

const DEFAULT_CHATBOT_PROMPT = `You are "Paise Coach", an expert Indian personal finance advisor. You help users make smart money decisions across FDs, SIPs, PPF, ELSS, NPS, 80C tax planning, loans, and emergency funds. Always:
- Use ₹ and Indian context (UPI, PAN, Aadhaar, lakhs/crores)
- Be concrete with numbers. Show calculations.
- Respect the user's income range and risk appetite.
- Avoid giving advice that requires SEBI registration (don't recommend specific stocks).
- Reply in the user's preferred language (English or Hindi).
- Be warm but concise. Use markdown for structure.`;

const DEFAULT_SEEDED_PROMPTS = [
  "How should I split ₹50K/month between FD, SIP, and PPF?",
  "What's the tax-smartest way to invest ₹1.5L for 80C?",
  "Help me build a 6-month emergency fund on ₹40K income",
  "Is ELSS better than PPF for a 30-year-old?",
  "Should I prepay home loan or invest the extra EMI?",
  "Explain FD laddering in simple terms",
];

function defaultLocalState(): LocalState {
  return {
    users: demoUsers,
    transactions: demoTransactions,
    goals: demoGoals,
    fds: demoFDs,
    referrals: demoReferrals,
    adminLogs: demoAdminLogs,
    featureFlags: demoFeatureFlags,
    aiUsage: demoAIUsage,
    analytics: demoAnalytics,
    chatSessions: demoChatSessions,
    banks: DEFAULT_BANKS,
    chatbotPrompt: DEFAULT_CHATBOT_PROMPT,
    preSeededPrompts: DEFAULT_SEEDED_PROMPTS,
    featuredInsight:
      "Small Finance Banks currently offer up to 8.75% on 24-month FDs — nearly 2% higher than big banks. Consider laddering.",
  };
}

function loadLocal(): LocalState {
  if (typeof window === "undefined") return defaultLocalState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = defaultLocalState();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw);
  } catch {
    return defaultLocalState();
  }
}

function saveLocal(s: LocalState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

const USE_SB = isSupabaseConfigured;
const sb = () => {
  if (!supabase) throw new Error("Supabase client not initialized");
  return supabase;
};

// =====================================================================
// Store API — all methods async
// =====================================================================
export const store = {
  reset() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(KEY);
      localStorage.removeItem("paise_session");
    }
  },

  // ===== USERS =====
  async getUser(id: string): Promise<User | undefined> {
    if (USE_SB) {
      const { data } = await sb().from("users").select("*").eq("id", id).maybeSingle();
      return (data as User) || undefined;
    }
    return loadLocal().users.find((u) => u.id === id);
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (USE_SB) {
      const { data } = await sb().from("users").select("*").ilike("email", email).maybeSingle();
      return (data as User) || undefined;
    }
    return loadLocal().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  async getUserByCode(code: string): Promise<User | undefined> {
    if (USE_SB) {
      const { data } = await sb().from("users").select("*").ilike("referral_code", code).maybeSingle();
      return (data as User) || undefined;
    }
    return loadLocal().users.find(
      (u) => u.referral_code.toLowerCase() === code.toLowerCase()
    );
  },

  async listUsers(): Promise<User[]> {
    if (USE_SB) {
      const { data } = await sb().from("users").select("*").order("created_at", { ascending: false });
      return (data as User[]) || [];
    }
    return loadLocal().users;
  },

  async upsertUser(u: User): Promise<void> {
    if (USE_SB) {
      await sb().from("users").upsert(u);
      return;
    }
    const s = loadLocal();
    const i = s.users.findIndex((x) => x.id === u.id);
    if (i >= 0) s.users[i] = u;
    else s.users.push(u);
    saveLocal(s);
  },

  async updateUser(id: string, patch: Partial<User>): Promise<User | null> {
    if (USE_SB) {
      const { data } = await sb().from("users").update(patch).eq("id", id).select().maybeSingle();
      return (data as User) || null;
    }
    const s = loadLocal();
    const i = s.users.findIndex((u) => u.id === id);
    if (i >= 0) {
      s.users[i] = { ...s.users[i], ...patch };
      saveLocal(s);
      return s.users[i];
    }
    return null;
  },

  async deleteUser(id: string): Promise<void> {
    if (USE_SB) {
      await sb().from("users").delete().eq("id", id);
      return;
    }
    const s = loadLocal();
    s.users = s.users.filter((u) => u.id !== id);
    saveLocal(s);
  },

  // ===== TRANSACTIONS =====
  async listTransactions(user_id: string): Promise<Transaction[]> {
    if (USE_SB) {
      const { data } = await sb()
        .from("transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("date", { ascending: false });
      return (data as Transaction[]) || [];
    }
    return loadLocal().transactions.filter((t) => t.user_id === user_id);
  },

  async addTransactions(txns: Transaction[]): Promise<void> {
    if (USE_SB) {
      await sb().from("transactions").insert(txns);
      return;
    }
    const s = loadLocal();
    s.transactions.push(...txns);
    saveLocal(s);
  },

  // ===== GOALS =====
  async listGoals(user_id: string): Promise<Goal[]> {
    if (USE_SB) {
      const { data } = await sb().from("goals").select("*").eq("user_id", user_id);
      return (data as Goal[]) || [];
    }
    return loadLocal().goals.filter((g) => g.user_id === user_id);
  },

  async addGoal(g: Omit<Goal, "id" | "created_at">): Promise<Goal> {
    const goal: Goal = { ...g, id: uid(), created_at: new Date().toISOString() } as Goal;
    if (USE_SB) {
      const { data } = await sb().from("goals").insert(goal).select().single();
      return (data as Goal) || goal;
    }
    const s = loadLocal();
    s.goals.push(goal);
    saveLocal(s);
    return goal;
  },

  async updateGoal(id: string, patch: Partial<Goal>): Promise<void> {
    if (USE_SB) {
      await sb().from("goals").update(patch).eq("id", id);
      return;
    }
    const s = loadLocal();
    const i = s.goals.findIndex((g) => g.id === id);
    if (i >= 0) {
      s.goals[i] = { ...s.goals[i], ...patch };
      saveLocal(s);
    }
  },

  async deleteGoal(id: string): Promise<void> {
    if (USE_SB) {
      await sb().from("goals").delete().eq("id", id);
      return;
    }
    const s = loadLocal();
    s.goals = s.goals.filter((g) => g.id !== id);
    saveLocal(s);
  },

  // ===== FDs =====
  async listFDs(user_id: string): Promise<FDPortfolio[]> {
    if (USE_SB) {
      const { data } = await sb().from("fd_portfolios").select("*").eq("user_id", user_id);
      return (data as FDPortfolio[]) || [];
    }
    return loadLocal().fds.filter((f) => f.user_id === user_id);
  },

  async addFDs(fds: FDPortfolio[]): Promise<void> {
    if (USE_SB) {
      await sb().from("fd_portfolios").insert(fds);
      return;
    }
    const s = loadLocal();
    s.fds.push(...fds);
    saveLocal(s);
  },

  async deleteFD(id: string): Promise<void> {
    if (USE_SB) {
      await sb().from("fd_portfolios").delete().eq("id", id);
      return;
    }
    const s = loadLocal();
    s.fds = s.fds.filter((f) => f.id !== id);
    saveLocal(s);
  },

  // ===== REFERRALS =====
  async listReferrals(): Promise<Referral[]> {
    if (USE_SB) {
      const { data } = await sb().from("referrals").select("*").order("created_at", { ascending: false });
      return (data as Referral[]) || [];
    }
    return loadLocal().referrals;
  },

  async listReferralsBy(referrer_id: string): Promise<Referral[]> {
    if (USE_SB) {
      const { data } = await sb().from("referrals").select("*").eq("referrer_id", referrer_id);
      return (data as Referral[]) || [];
    }
    return loadLocal().referrals.filter((r) => r.referrer_id === referrer_id);
  },

  async addReferral(r: Omit<Referral, "id" | "created_at">): Promise<Referral> {
    const ref: Referral = { ...r, id: uid(), created_at: new Date().toISOString() } as Referral;
    if (USE_SB) {
      const { data } = await sb().from("referrals").insert(ref).select().single();
      return (data as Referral) || ref;
    }
    const s = loadLocal();
    s.referrals.push(ref);
    saveLocal(s);
    return ref;
  },

  async updateReferral(id: string, patch: Partial<Referral>): Promise<void> {
    if (USE_SB) {
      await sb().from("referrals").update(patch).eq("id", id);
      return;
    }
    const s = loadLocal();
    const i = s.referrals.findIndex((r) => r.id === id);
    if (i >= 0) {
      s.referrals[i] = { ...s.referrals[i], ...patch };
      saveLocal(s);
    }
  },

  // ===== CHAT =====
  async listChatSessions(user_id: string): Promise<ChatSession[]> {
    if (USE_SB) {
      const { data } = await sb()
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", { ascending: false });
      return (data as ChatSession[]) || [];
    }
    return loadLocal().chatSessions.filter((c) => c.user_id === user_id);
  },

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    if (USE_SB) {
      const { data } = await sb().from("chat_sessions").select("*").eq("id", id).maybeSingle();
      return (data as ChatSession) || undefined;
    }
    return loadLocal().chatSessions.find((c) => c.id === id);
  },

  async upsertChatSession(cs: ChatSession): Promise<void> {
    if (USE_SB) {
      await sb().from("chat_sessions").upsert(cs);
      return;
    }
    const s = loadLocal();
    const i = s.chatSessions.findIndex((c) => c.id === cs.id);
    if (i >= 0) s.chatSessions[i] = cs;
    else s.chatSessions.push(cs);
    saveLocal(s);
  },

  // ===== ADMIN LOGS =====
  async listAdminLogs(): Promise<AdminLog[]> {
    if (USE_SB) {
      const { data } = await sb().from("admin_logs").select("*").order("created_at", { ascending: false });
      return (data as AdminLog[]) || [];
    }
    return loadLocal().adminLogs;
  },

  async addAdminLog(log: Omit<AdminLog, "id" | "created_at">): Promise<void> {
    const entry = { ...log, id: uid(), created_at: new Date().toISOString() } as AdminLog;
    if (USE_SB) {
      await sb().from("admin_logs").insert(entry);
      return;
    }
    const s = loadLocal();
    s.adminLogs.unshift(entry);
    saveLocal(s);
  },

  // ===== FEATURE FLAGS =====
  async listFeatureFlags(): Promise<FeatureFlag[]> {
    if (USE_SB) {
      const { data } = await sb().from("feature_flags").select("*");
      return (data as FeatureFlag[]) || [];
    }
    return loadLocal().featureFlags;
  },

  async updateFeatureFlag(key: string, patch: Partial<FeatureFlag>): Promise<void> {
    if (USE_SB) {
      await sb().from("feature_flags").update(patch).eq("key", key);
      return;
    }
    const s = loadLocal();
    const i = s.featureFlags.findIndex((f) => f.key === key);
    if (i >= 0) {
      s.featureFlags[i] = { ...s.featureFlags[i], ...patch };
      saveLocal(s);
    }
  },

  // ===== AI USAGE =====
  async listAIUsage(): Promise<AIUsageLog[]> {
    if (USE_SB) {
      const { data } = await sb().from("ai_usage_logs").select("*").order("created_at", { ascending: false }).limit(500);
      return (data as AIUsageLog[]) || [];
    }
    return loadLocal().aiUsage;
  },

  async addAIUsage(u: Omit<AIUsageLog, "id" | "created_at">): Promise<void> {
    const entry = { ...u, id: uid(), created_at: new Date().toISOString() } as AIUsageLog;
    if (USE_SB) {
      await sb().from("ai_usage_logs").insert(entry);
      return;
    }
    const s = loadLocal();
    s.aiUsage.unshift(entry);
    saveLocal(s);
  },

  // ===== ANALYTICS =====
  async listAnalytics(): Promise<AnalyticsEvent[]> {
    if (USE_SB) {
      const { data } = await sb().from("analytics_events").select("*").order("created_at", { ascending: false }).limit(1000);
      return (data as AnalyticsEvent[]) || [];
    }
    return loadLocal().analytics;
  },

  async track(event: string, user_id?: string, metadata?: Record<string, any>): Promise<void> {
    const entry = {
      id: uid(),
      user_id,
      event,
      metadata,
      created_at: new Date().toISOString(),
    } as AnalyticsEvent;
    if (USE_SB) {
      // fire-and-forget
      try {
        await sb().from("analytics_events").insert(entry);
      } catch {}
      return;
    }
    const s = loadLocal();
    s.analytics.unshift(entry);
    saveLocal(s);
  },

  // ===== BANKS =====
  async listBanks(): Promise<Bank[]> {
    if (USE_SB) {
      const { data } = await sb().from("banks").select("*");
      return (data as Bank[]) || [];
    }
    return loadLocal().banks;
  },

  async updateBank(id: string, patch: Partial<Bank>): Promise<void> {
    if (USE_SB) {
      await sb().from("banks").update(patch).eq("id", id);
      return;
    }
    const s = loadLocal();
    const i = s.banks.findIndex((b) => b.id === id);
    if (i >= 0) {
      s.banks[i] = { ...s.banks[i], ...patch };
      saveLocal(s);
    }
  },

  // ===== CONTENT KV =====
  async getChatbotPrompt(): Promise<string> {
    if (USE_SB) {
      const { data } = await sb().from("content_kv").select("value").eq("key", "chatbot_system_prompt").maybeSingle();
      return (data?.value as string) || DEFAULT_CHATBOT_PROMPT;
    }
    return loadLocal().chatbotPrompt;
  },

  async setChatbotPrompt(p: string): Promise<void> {
    if (USE_SB) {
      await sb().from("content_kv").upsert({ key: "chatbot_system_prompt", value: p, updated_at: new Date().toISOString() });
      return;
    }
    const s = loadLocal();
    s.chatbotPrompt = p;
    saveLocal(s);
  },

  async getPreSeededPrompts(): Promise<string[]> {
    if (USE_SB) {
      const { data } = await sb().from("content_kv").select("value").eq("key", "preseeded_prompts").maybeSingle();
      return (data?.value as string[]) || DEFAULT_SEEDED_PROMPTS;
    }
    return loadLocal().preSeededPrompts;
  },

  async setPreSeededPrompts(p: string[]): Promise<void> {
    if (USE_SB) {
      await sb().from("content_kv").upsert({ key: "preseeded_prompts", value: p, updated_at: new Date().toISOString() });
      return;
    }
    const s = loadLocal();
    s.preSeededPrompts = p;
    saveLocal(s);
  },

  async getFeaturedInsight(): Promise<string> {
    if (USE_SB) {
      const { data } = await sb().from("content_kv").select("value").eq("key", "featured_insight").maybeSingle();
      const v = data?.value as any;
      if (typeof v === "string") return v;
      if (v?.body) return `${v.title ? v.title + " — " : ""}${v.body}`;
      return loadLocal().featuredInsight;
    }
    return loadLocal().featuredInsight;
  },

  async setFeaturedInsight(t: string): Promise<void> {
    if (USE_SB) {
      await sb().from("content_kv").upsert({ key: "featured_insight", value: t, updated_at: new Date().toISOString() });
      return;
    }
    const s = loadLocal();
    s.featuredInsight = t;
    saveLocal(s);
  },
};
