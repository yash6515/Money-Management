"use client";
import { AppShell } from "@/components/app-shell";
import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { store } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Trophy, ArrowLeft, Crown, Medal, Award } from "lucide-react";

export default function Leaderboard() {
  return (
    <AppShell>
      <Inner />
    </AppShell>
  );
}

interface TopEntry { rank: number; user: User | undefined; count: number }

function Inner() {
  const { user } = useAuth();
  const [top, setTop] = useState<TopEntry[]>([]);
  useEffect(() => {
    (async () => {
      const allRefs = await store.listReferrals();
      const refs = allRefs.filter((r) => r.status === "approved");
      const byUser: Record<string, number> = {};
      refs.forEach((r) => {
        byUser[r.referrer_id] = (byUser[r.referrer_id] || 0) + 1;
      });
      const users = await store.listUsers();
      setTop(
        Object.entries(byUser)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([id, count], i) => ({ rank: i + 1, user: users.find((u) => u.id === id), count }))
      );
    })();
  }, []);

  if (!user) return null;

  const userRank = top.find((t) => t.user?.id === user.id)?.rank;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/referrals"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
      </div>

      <div className="text-center max-w-2xl mx-auto">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br from-teal to-purple grid place-items-center mb-4">
          <Trophy className="h-7 w-7 text-black" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold">Referral Leaderboard</h1>
        <p className="text-muted-foreground mt-2">Top 10 Paise advocates this month</p>
        {userRank && (
          <Badge className="mt-4">You're ranked #{userRank}</Badge>
        )}
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-base">Top referrers</CardTitle>
          <CardDescription>Based on approved referrals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {top.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">No referrals yet. Be the first.</div>
          ) : top.map((t) => {
            const isUser = t.user?.id === user.id;
            const Icon = t.rank === 1 ? Crown : t.rank === 2 ? Medal : t.rank === 3 ? Award : null;
            return (
              <div
                key={t.user?.id}
                className={`flex items-center justify-between p-3 rounded-lg ${isUser ? "bg-teal/10 border border-teal/30" : "bg-white/5"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`grid h-9 w-9 place-items-center rounded-lg ${t.rank <= 3 ? "bg-gradient-to-br from-teal to-purple text-black" : "bg-white/10"} font-display font-bold`}>
                    {Icon ? <Icon className="h-4 w-4" /> : t.rank}
                  </div>
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {t.user?.name || "Unknown"}
                      {isUser && <Badge className="text-[10px]">You</Badge>}
                    </div>
                    <div className="text-[10px] text-muted-foreground">@{t.user?.referral_code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold">{t.count}</div>
                  <div className="text-[10px] text-muted-foreground">referrals</div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
