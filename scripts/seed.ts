/**
 * Seed script. Currently a placeholder — the localStorage store self-seeds
 * from lib/demo-data.ts on first client-side load. This script exists for
 * future Supabase wiring.
 *
 * When Supabase is swapped in, this script should:
 *   1. Connect using SUPABASE_SERVICE_ROLE_KEY
 *   2. Upsert demoUsers, demoTransactions, demoGoals, demoFDs, etc.
 *   3. Seed default feature flags + featured insight
 *
 * Run with: npm run seed
 */

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
} from "../lib/demo-data";

async function main() {
  console.log("🌱 Paise seed summary:");
  console.log(`   Users:           ${demoUsers.length}`);
  console.log(`   Transactions:    ${demoTransactions.length}`);
  console.log(`   Goals:           ${demoGoals.length}`);
  console.log(`   FDs:             ${demoFDs.length}`);
  console.log(`   Referrals:       ${demoReferrals.length}`);
  console.log(`   Admin logs:      ${demoAdminLogs.length}`);
  console.log(`   Feature flags:   ${demoFeatureFlags.length}`);
  console.log(`   AI usage logs:   ${demoAIUsage.length}`);
  console.log(`   Analytics evts:  ${demoAnalytics.length}`);
  console.log(`   Chat sessions:   ${demoChatSessions.length}`);
  console.log("");
  console.log("ℹ  localStorage store self-seeds on first load. No action needed.");
  console.log("   When Supabase is wired up, extend this script to upsert into Postgres.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
