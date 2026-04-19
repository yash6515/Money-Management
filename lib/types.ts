export type Language = "en" | "hi";
export type IncomeRange = "<30K" | "30K-50K" | "50K-1L" | "1L-2L" | ">2L";
export type RiskAppetite = "low" | "medium" | "high";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  income_range: IncomeRange;
  risk_appetite: RiskAppetite;
  language: Language;
  role: "user" | "admin";
  referral_code: string;
  referred_by?: string;
  credits: number; // days of Pro
  created_at: string;
  is_guest?: boolean;
  suspended?: boolean;
  goals_tags?: string[];
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  category: string;
  created_at: string;
}

export type TxnType = "debit" | "credit";
export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  merchant: string;
  date: string;
  type: TxnType;
  source: string;
}

export interface FDPortfolio {
  id: string;
  user_id: string;
  bank: string;
  amount: number;
  rate: number;
  start_date: string;
  maturity_date: string;
  tenure_months: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referred_email?: string;
  status: "pending" | "approved" | "voided";
  reward_given: boolean;
  flagged?: boolean;
  created_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rollout_percentage: number;
  description?: string;
}

export interface AIUsageLog {
  id: string;
  user_id: string;
  user_name: string;
  endpoint: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id?: string;
  event: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Bank {
  id: string;
  name: string;
  type: "psu" | "private" | "sfb";
  logo?: string;
  rates: { tenure_months: number; rate: number; senior_rate: number }[];
  min_amount: number;
  featured?: boolean;
}
