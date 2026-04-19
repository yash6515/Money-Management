"use client";
// =====================================================================
// Paise — Auth
// =====================================================================
// When Supabase env vars are set:
//   - Email login uses supabase.auth.signInWithOtp (magic link)
//   - Guest / demo / admin login uses supabase.auth.signInAnonymously
//     and upserts a corresponding `public.users` row.
//   - Session is managed by supabase-js (persisted in localStorage
//     under sb-* keys); we mirror a lightweight pointer in `paise_session`.
//
// When Supabase env vars are missing:
//   - Falls back to the original localStorage-stub auth so dev still works.
// =====================================================================

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { store } from "./store";
import { DEMO_USER_ID, DEMO_ADMIN_ID, makeSeedForUser } from "./demo-data";
import { randomCode, uid } from "./utils";
import type { User } from "./types";
import { supabase, isSupabaseConfigured } from "./supabase";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  loginAsGuest: () => Promise<void>;
  loginDemo: () => Promise<void>;
  loginAdmin: () => Promise<void>;
  loginWithEmail: (email: string, name?: string, referred_by?: string) => Promise<User | null>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);
const SESSION_KEY = "paise_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ---- bootstrap session on mount ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const u = await store.getUser(session.user.id);
            if (mounted && u) setUser(u);
          } else {
            // Fallback: maybe a local-only session (dev mode)
            const raw = typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY) : null;
            if (raw) {
              const { id } = JSON.parse(raw);
              const u = await store.getUser(id);
              if (mounted && u) setUser(u);
            }
          }

          // Subscribe to auth changes
          const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
            if (sess?.user) {
              const u = await store.getUser(sess.user.id);
              if (mounted) setUser(u || null);
            } else if (mounted) {
              setUser(null);
            }
          });
          return () => sub.subscription.unsubscribe();
        } else {
          // Local-only stub auth
          const raw = typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY) : null;
          if (raw) {
            const { id } = JSON.parse(raw);
            const u = await store.getUser(id);
            if (mounted && u) setUser(u);
          }
        }
      } catch (e) {
        console.error("auth bootstrap failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  function setLocalSession(u: User) {
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id: u.id }));
    }
    setUser(u);
  }

  // Create or fetch a user row tied to a Supabase auth uid.
  async function ensureUserRow(
    authId: string,
    seed: { email: string; name: string; role?: "user" | "admin"; referred_by?: string }
  ): Promise<User> {
    const existing = await store.getUser(authId);
    if (existing) return existing;
    const isAdminEmail =
      process.env.NEXT_PUBLIC_ADMIN_EMAIL &&
      seed.email.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL.toLowerCase();
    const newUser: User = {
      id: authId,
      email: seed.email,
      name: seed.name,
      income_range: "50K-1L",
      risk_appetite: "medium",
      language: "en",
      role: seed.role || (isAdminEmail ? "admin" : "user"),
      referral_code: randomCode(seed.name),
      referred_by: seed.referred_by,
      credits: seed.referred_by ? 14 : 0,
      created_at: new Date().toISOString(),
    };
    await store.upsertUser(newUser);
    await store.track("user_signup", newUser.id, { referred_by: seed.referred_by });

    // Seed guest/demo users with realistic data so the dashboard isn't
    // empty on first load. Real signups start clean.
    const isDemoAccount = /@(guest|demo)\.paise\.app$/i.test(newUser.email);
    if (isDemoAccount) {
      try {
        const seeded = makeSeedForUser(newUser.id);
        await store.addTransactions(seeded.transactions);
        for (const g of seeded.goals) {
          await store.addGoal({
            user_id: g.user_id,
            title: g.title,
            target_amount: g.target_amount,
            current_amount: g.current_amount,
            deadline: g.deadline,
            category: g.category,
          });
        }
        await store.addFDs(seeded.fds);
      } catch (e) {
        console.error("guest/demo data seed failed", e);
      }
    }

    // Fire welcome / referral emails (fire-and-forget — don't block auth)
    const isRealEmail = !isDemoAccount;
    if (seed.referred_by) {
      const referrer = await store.getUserByCode(seed.referred_by);
      if (referrer) {
        await store.addReferral({
          referrer_id: referrer.id,
          referred_id: newUser.id,
          referred_email: newUser.email,
          status: "approved",
          reward_given: true,
        });
        const updatedReferrer = await store.updateUser(referrer.id, {
          credits: referrer.credits + 30,
        });
        await store.track("referral_converted", newUser.id, { referrer: referrer.id });

        // Email the new user (referred) + the referrer
        if (isRealEmail) {
          fetch("/api/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "referral_signup",
              to: newUser.email,
              referred_name: newUser.name,
              referrer_name: referrer.name,
            }),
          }).catch(() => {});
        }
        fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "referral_reward",
            to: referrer.email,
            referrer_name: referrer.name,
            referred_name: newUser.name,
            bonus_days: 30,
            total_credits: updatedReferrer?.credits ?? referrer.credits + 30,
          }),
        }).catch(() => {});
      }
    } else if (isRealEmail) {
      // Non-referred real signup → plain welcome
      fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "welcome",
          to: newUser.email,
          name: newUser.name,
        }),
      }).catch(() => {});
    }

    return newUser;
  }

  // ---- Guest: anonymous Supabase session, or demo user locally ----
  const loginAsGuest = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) {
        console.error("guest sign-in failed", error);
        return;
      }
      const u = await ensureUserRow(data.user.id, {
        email: `guest_${data.user.id.slice(0, 8)}@guest.paise.app`,
        name: "Guest User",
      });
      setUser(u);
      await store.track("guest_login", u.id);
      router.push("/dashboard");
      return;
    }
    // Local fallback
    const guest = await store.getUser(DEMO_USER_ID);
    if (guest) {
      setLocalSession(guest);
      await store.track("guest_login", guest.id);
      router.push("/dashboard");
    }
  };

  // ---- Demo: same as guest but seeded as Raj Sharma for the demo video ----
  const loginDemo = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) return;
      const u = await ensureUserRow(data.user.id, {
        email: `demo_${data.user.id.slice(0, 8)}@demo.paise.app`,
        name: "Raj Sharma",
      });
      setUser(u);
      router.push("/dashboard");
      return;
    }
    const u = await store.getUser(DEMO_USER_ID);
    if (u) {
      setLocalSession(u);
      router.push("/dashboard");
    }
  };

  // ---- Admin demo login ----
  const loginAdmin = async () => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) return;
      const u = await ensureUserRow(data.user.id, {
        email: `admin_${data.user.id.slice(0, 8)}@demo.paise.app`,
        name: "Demo Admin",
        role: "admin",
      });
      setUser(u);
      router.push("/admin");
      return;
    }
    const u = await store.getUser(DEMO_ADMIN_ID);
    if (u) {
      setLocalSession(u);
      router.push("/admin");
    }
  };

  // ---- Email login ----
  // In Supabase mode: sends a magic link. User clicks link → lands back
  // in the app with an active session → the onAuthStateChange listener
  // picks it up and loads/creates their profile.
  // In local mode: instantly creates/returns a user row.
  const loginWithEmail = async (
    email: string,
    name?: string,
    referred_by?: string
  ): Promise<User | null> => {
    if (isSupabaseConfigured && supabase) {
      const emailRedirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/dashboard`
          : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo,
          data: { name: name || email.split("@")[0], referred_by },
        },
      });
      if (error) {
        console.error("magic link send failed", error);
        throw error;
      }
      // The caller should show a "check your email" message. We return
      // null here because the session only materializes after they click
      // the link.
      return null;
    }

    // Local fallback: instant (no magic link), reuse ensureUserRow for
    // consistent user creation + email side effects.
    const existing = await store.getUserByEmail(email);
    if (existing) {
      setLocalSession(existing);
      return existing;
    }
    const newUser = await ensureUserRow(uid(), {
      email,
      name: name || email.split("@")[0],
      referred_by,
    });
    setLocalSession(newUser);
    return newUser;
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
    setUser(null);
    router.push("/");
  };

  const updateProfile = async (patch: Partial<User>) => {
    if (!user) return;
    const updated = await store.updateUser(user.id, patch);
    if (updated) setUser(updated);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        loginAsGuest,
        loginDemo,
        loginAdmin,
        loginWithEmail,
        logout,
        updateProfile,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}

export function useRequireAuth(opts: { admin?: boolean } = {}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (opts.admin && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, loading, opts.admin, router]);
  return { user, loading };
}
