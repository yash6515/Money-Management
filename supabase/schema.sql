-- =====================================================================
-- Paise — Supabase schema
-- Paste this entire file into Supabase SQL Editor and hit Run.
-- Safe to re-run (uses `if not exists` / `drop policy if exists`).
-- =====================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============== USERS ===============
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  phone text,
  income_range text check (income_range in ('<30K','30K-50K','50K-1L','1L-2L','>2L')) default '50K-1L',
  risk_appetite text check (risk_appetite in ('low','medium','high')) default 'medium',
  language text check (language in ('en','hi')) default 'en',
  role text check (role in ('user','admin')) default 'user',
  referral_code text unique not null,
  referred_by text,
  credits integer default 0,
  suspended boolean default false,
  goals_tags text[],
  created_at timestamptz default now()
);

-- =============== TRANSACTIONS ===============
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  amount numeric not null,
  category text not null,
  merchant text not null,
  date timestamptz not null,
  type text check (type in ('debit','credit')) not null,
  source text default 'manual',
  created_at timestamptz default now()
);
create index if not exists idx_txn_user on public.transactions(user_id, date desc);

-- =============== GOALS ===============
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  deadline timestamptz,
  category text,
  created_at timestamptz default now()
);

-- =============== FD PORTFOLIOS ===============
create table if not exists public.fd_portfolios (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  bank text not null,
  amount numeric not null,
  rate numeric not null,
  start_date timestamptz not null,
  maturity_date timestamptz not null,
  tenure_months integer not null,
  created_at timestamptz default now()
);

-- =============== CHAT SESSIONS ===============
create table if not exists public.chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  messages jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============== REFERRALS ===============
create table if not exists public.referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid references public.users(id) on delete cascade,
  referred_id uuid,
  referred_email text,
  status text check (status in ('pending','approved','voided')) default 'pending',
  reward_given boolean default false,
  flagged boolean default false,
  created_at timestamptz default now()
);

-- =============== ADMIN LOGS ===============
create table if not exists public.admin_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references public.users(id),
  admin_name text,
  action text not null,
  target_id text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- =============== FEATURE FLAGS ===============
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean default true,
  rollout_percentage integer default 100,
  description text,
  updated_at timestamptz default now()
);

-- =============== AI USAGE LOGS ===============
create table if not exists public.ai_usage_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  user_name text,
  endpoint text not null,
  tokens_in integer default 0,
  tokens_out integer default 0,
  cost_usd numeric default 0,
  created_at timestamptz default now()
);
create index if not exists idx_aiusage_created on public.ai_usage_logs(created_at desc);

-- =============== ANALYTICS EVENTS ===============
create table if not exists public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  event text not null,
  metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_events_created on public.analytics_events(created_at desc);

-- =============== CONTENT (kv store for admin content) ===============
create table if not exists public.content_kv (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

-- =============== BANKS ===============
create table if not exists public.banks (
  id text primary key,
  name text not null,
  type text check (type in ('psu','private','sfb')) not null,
  min_amount numeric default 1000,
  featured boolean default false,
  rates jsonb not null default '[]'::jsonb
);

-- =====================================================================
-- ROW LEVEL SECURITY
-- Users can only see/write their own data.
-- Admins can see/write everything.
-- =====================================================================

alter table public.users enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.fd_portfolios enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.referrals enable row level security;
alter table public.admin_logs enable row level security;
alter table public.feature_flags enable row level security;
alter table public.ai_usage_logs enable row level security;
alter table public.analytics_events enable row level security;
alter table public.banks enable row level security;
alter table public.content_kv enable row level security;

-- Helper: is the caller an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- USERS policies
drop policy if exists "users read self" on public.users;
create policy "users read self" on public.users for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "users update self" on public.users;
create policy "users update self" on public.users for update
  using (auth.uid() = id or public.is_admin());

drop policy if exists "users insert self" on public.users;
create policy "users insert self" on public.users for insert
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "admin delete users" on public.users;
create policy "admin delete users" on public.users for delete using (public.is_admin());

-- Per-user tables (transactions, goals, fds, chat_sessions)
do $$
declare
  tbl text;
begin
  foreach tbl in array array['transactions','goals','fd_portfolios','chat_sessions','ai_usage_logs','analytics_events']
  loop
    execute format('drop policy if exists "%s owner all" on public.%I', tbl, tbl);
    execute format(
      'create policy "%s owner all" on public.%I for all using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin())',
      tbl, tbl
    );
  end loop;
end$$;

-- REFERRALS — referrer or referred can see, admin can see all
drop policy if exists "referrals participant read" on public.referrals;
create policy "referrals participant read" on public.referrals for select
  using (auth.uid() = referrer_id or auth.uid() = referred_id or public.is_admin());

drop policy if exists "referrals insert" on public.referrals;
create policy "referrals insert" on public.referrals for insert with check (true);

drop policy if exists "referrals admin update" on public.referrals;
create policy "referrals admin update" on public.referrals for update using (public.is_admin());

-- ADMIN-ONLY tables
drop policy if exists "admin only logs" on public.admin_logs;
create policy "admin only logs" on public.admin_logs for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write flags" on public.feature_flags;
create policy "admin write flags" on public.feature_flags for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public read flags" on public.feature_flags;
create policy "public read flags" on public.feature_flags for select using (true);

-- PUBLIC READ tables
drop policy if exists "public read banks" on public.banks;
create policy "public read banks" on public.banks for select using (true);
drop policy if exists "admin write banks" on public.banks;
create policy "admin write banks" on public.banks for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read content" on public.content_kv;
create policy "public read content" on public.content_kv for select using (true);
drop policy if exists "admin write content" on public.content_kv;
create policy "admin write content" on public.content_kv for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- DONE. Now seed banks + feature flags + default content from SQL:
-- (Run the second file seed.sql, or let the app seed on first admin login.)
-- =====================================================================
