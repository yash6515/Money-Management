-- =====================================================================
-- Paise — Supabase seed data
-- Run AFTER schema.sql. Safe to re-run (uses upsert / on conflict).
-- Seeds: 16 Indian banks, feature flags, default content (chatbot prompt,
-- pre-seeded prompts, featured insight).
-- =====================================================================

-- =============== BANKS (16 Indian banks with FD rates) ===============
insert into public.banks (id, name, type, min_amount, featured, rates) values
  ('sbi', 'State Bank of India', 'psu', 1000, true,
    '[{"tenure_months":6,"rate":5.75,"senior_rate":6.25},{"tenure_months":12,"rate":6.8,"senior_rate":7.3},{"tenure_months":24,"rate":7.0,"senior_rate":7.5},{"tenure_months":36,"rate":6.75,"senior_rate":7.25},{"tenure_months":60,"rate":6.5,"senior_rate":7.5}]'::jsonb),
  ('hdfc', 'HDFC Bank', 'private', 5000, true,
    '[{"tenure_months":6,"rate":6.0,"senior_rate":6.5},{"tenure_months":12,"rate":6.6,"senior_rate":7.1},{"tenure_months":24,"rate":7.0,"senior_rate":7.5},{"tenure_months":36,"rate":7.0,"senior_rate":7.5},{"tenure_months":60,"rate":7.0,"senior_rate":7.75}]'::jsonb),
  ('icici', 'ICICI Bank', 'private', 10000, true,
    '[{"tenure_months":6,"rate":5.75,"senior_rate":6.25},{"tenure_months":12,"rate":6.7,"senior_rate":7.2},{"tenure_months":24,"rate":7.0,"senior_rate":7.5},{"tenure_months":36,"rate":7.0,"senior_rate":7.5},{"tenure_months":60,"rate":6.9,"senior_rate":7.65}]'::jsonb),
  ('axis', 'Axis Bank', 'private', 5000, false,
    '[{"tenure_months":6,"rate":5.75,"senior_rate":6.25},{"tenure_months":12,"rate":6.7,"senior_rate":7.2},{"tenure_months":24,"rate":7.1,"senior_rate":7.6},{"tenure_months":36,"rate":7.1,"senior_rate":7.6},{"tenure_months":60,"rate":7.0,"senior_rate":7.75}]'::jsonb),
  ('kotak', 'Kotak Mahindra Bank', 'private', 5000, false,
    '[{"tenure_months":6,"rate":6.0,"senior_rate":6.5},{"tenure_months":12,"rate":7.1,"senior_rate":7.6},{"tenure_months":24,"rate":7.15,"senior_rate":7.65},{"tenure_months":36,"rate":6.5,"senior_rate":7.0},{"tenure_months":60,"rate":6.2,"senior_rate":6.7}]'::jsonb),
  ('pnb', 'Punjab National Bank', 'psu', 1000, false,
    '[{"tenure_months":6,"rate":6.0,"senior_rate":6.5},{"tenure_months":12,"rate":6.8,"senior_rate":7.3},{"tenure_months":24,"rate":6.8,"senior_rate":7.3},{"tenure_months":36,"rate":7.0,"senior_rate":7.5},{"tenure_months":60,"rate":6.5,"senior_rate":7.3}]'::jsonb),
  ('bob', 'Bank of Baroda', 'psu', 1000, false,
    '[{"tenure_months":6,"rate":5.75,"senior_rate":6.25},{"tenure_months":12,"rate":6.85,"senior_rate":7.35},{"tenure_months":24,"rate":7.15,"senior_rate":7.65},{"tenure_months":36,"rate":7.15,"senior_rate":7.65},{"tenure_months":60,"rate":6.5,"senior_rate":7.5}]'::jsonb),
  ('canara', 'Canara Bank', 'psu', 1000, false,
    '[{"tenure_months":6,"rate":6.15,"senior_rate":6.65},{"tenure_months":12,"rate":6.85,"senior_rate":7.35},{"tenure_months":24,"rate":6.85,"senior_rate":7.35},{"tenure_months":36,"rate":6.8,"senior_rate":7.3},{"tenure_months":60,"rate":6.7,"senior_rate":7.2}]'::jsonb),
  ('union', 'Union Bank of India', 'psu', 1000, false,
    '[{"tenure_months":6,"rate":5.75,"senior_rate":6.25},{"tenure_months":12,"rate":6.8,"senior_rate":7.3},{"tenure_months":24,"rate":6.6,"senior_rate":7.1},{"tenure_months":36,"rate":6.7,"senior_rate":7.2},{"tenure_months":60,"rate":6.5,"senior_rate":7.5}]'::jsonb),
  ('idfc', 'IDFC First Bank', 'private', 10000, true,
    '[{"tenure_months":6,"rate":6.5,"senior_rate":7.0},{"tenure_months":12,"rate":7.5,"senior_rate":8.0},{"tenure_months":24,"rate":7.75,"senior_rate":8.25},{"tenure_months":36,"rate":7.25,"senior_rate":7.75},{"tenure_months":60,"rate":7.0,"senior_rate":7.5}]'::jsonb),
  ('yes', 'Yes Bank', 'private', 10000, false,
    '[{"tenure_months":6,"rate":6.1,"senior_rate":6.6},{"tenure_months":12,"rate":7.25,"senior_rate":7.75},{"tenure_months":24,"rate":7.25,"senior_rate":7.75},{"tenure_months":36,"rate":7.25,"senior_rate":8.0},{"tenure_months":60,"rate":7.25,"senior_rate":8.0}]'::jsonb),
  ('indusind', 'IndusInd Bank', 'private', 10000, false,
    '[{"tenure_months":6,"rate":6.35,"senior_rate":6.85},{"tenure_months":12,"rate":7.5,"senior_rate":8.0},{"tenure_months":24,"rate":7.75,"senior_rate":8.25},{"tenure_months":36,"rate":7.25,"senior_rate":7.75},{"tenure_months":60,"rate":7.0,"senior_rate":7.75}]'::jsonb),
  ('unity', 'Unity Small Finance Bank', 'sfb', 1000, true,
    '[{"tenure_months":6,"rate":6.75,"senior_rate":7.25},{"tenure_months":12,"rate":7.85,"senior_rate":8.35},{"tenure_months":24,"rate":8.75,"senior_rate":9.25},{"tenure_months":36,"rate":8.15,"senior_rate":8.65},{"tenure_months":60,"rate":8.15,"senior_rate":8.65}]'::jsonb),
  ('suryoday', 'Suryoday Small Finance Bank', 'sfb', 1000, true,
    '[{"tenure_months":6,"rate":6.85,"senior_rate":7.35},{"tenure_months":12,"rate":8.25,"senior_rate":8.75},{"tenure_months":24,"rate":8.6,"senior_rate":9.1},{"tenure_months":36,"rate":8.25,"senior_rate":8.75},{"tenure_months":60,"rate":8.25,"senior_rate":8.75}]'::jsonb),
  ('equitas', 'Equitas Small Finance Bank', 'sfb', 1000, false,
    '[{"tenure_months":6,"rate":6.5,"senior_rate":7.0},{"tenure_months":12,"rate":8.2,"senior_rate":8.7},{"tenure_months":24,"rate":8.5,"senior_rate":9.0},{"tenure_months":36,"rate":8.0,"senior_rate":8.5},{"tenure_months":60,"rate":7.25,"senior_rate":7.75}]'::jsonb),
  ('au', 'AU Small Finance Bank', 'sfb', 1000, true,
    '[{"tenure_months":6,"rate":6.5,"senior_rate":7.0},{"tenure_months":12,"rate":7.25,"senior_rate":7.75},{"tenure_months":24,"rate":8.0,"senior_rate":8.5},{"tenure_months":36,"rate":7.75,"senior_rate":8.25},{"tenure_months":60,"rate":7.25,"senior_rate":7.75}]'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  min_amount = excluded.min_amount,
  featured = excluded.featured,
  rates = excluded.rates;

-- =============== FEATURE FLAGS ===============
insert into public.feature_flags (key, enabled, rollout_percentage, description) values
  ('fd_ladder', true, 100, 'AI-powered FD ladder builder'),
  ('expense_tracker', true, 100, 'CSV upload + auto-categorization'),
  ('chatbot', true, 100, 'Claude-powered finance coach'),
  ('goals_simulator', true, 100, 'What-If goal simulator'),
  ('referrals', true, 100, 'Referral rewards program'),
  ('hindi_language', true, 100, 'Hindi UI + chatbot responses'),
  ('blostem_redirect', true, 50, 'Redirect FD bookings to Blostem partner'),
  ('pro_tier', true, 100, 'Paise Pro (unlimited AI via referrals)')
on conflict (key) do nothing;

-- =============== CONTENT KV (chatbot prompt, pre-seeded prompts, insight) ===============
insert into public.content_kv (key, value) values
  ('chatbot_system_prompt', '"You are Paise, a friendly AI money coach for Indians aged 22-35. Keep answers concrete, use ₹ amounts, mention Indian products (FD, SIP, PPF, NPS, ELSS, EPF). Under 150 words. Warm, plain-English tone. Never give tax/legal advice — suggest a CA. Respond in the user''s language (English or Hindi)."'::jsonb),
  ('preseeded_prompts', '[
    "How should I split ₹50,000 between FD, SIP and emergency fund?",
    "Explain FD laddering in simple terms",
    "I earn ₹60K/month. What should my emergency fund be?",
    "SIP vs FD — which is better for 3 year horizon?",
    "How to save tax under 80C with ₹1.5L?",
    "मैं हर महीने ₹10,000 बचा सकता हूं। कहां निवेश करूं?"
  ]'::jsonb),
  ('featured_insight', '{"title":"You spent 23% more on food delivery this month","body":"Cutting Swiggy/Zomato by half saves ~₹3,200/mo → ₹38K/year in an FD at 7.5%.","cta":"Set a food budget"}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- =====================================================================
-- DONE.
-- Verify with: select count(*) from public.banks;  -- should return 16
-- =====================================================================
