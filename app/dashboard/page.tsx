"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import type { Transaction, Goal, FDPortfolio } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/utils";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Wallet,
  Target,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import { BANKS } from "@/lib/banks";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DashData {
  txns: Transaction[];
  goals: Goal[];
  fds: FDPortfolio[];
  last30: Transaction[];
  spent30: number;
  earned30: number;
  fdValue: number;
  fdMatureValue: number;
  weekly: { week: string; spend: number }[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashData | null>(null);
  const [featured, setFeatured] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
    const txns = await store.listTransactions(user.id);
    const goals = await store.listGoals(user.id);
    const fds = await store.listFDs(user.id);

    const last30 = txns.filter((t) => {
      const d = new Date(t.date);
      return d.getTime() > Date.now() - 30 * 86400000;
    });
    const spent30 = last30.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const earned30 = last30.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const fdValue = fds.reduce((s, f) => s + f.amount, 0);
    const fdMatureValue = fds.reduce((s, f) => {
      const yrs = f.tenure_months / 12;
      return s + f.amount * Math.pow(1 + f.rate / 100 / 4, yrs * 4);
    }, 0);

    // Weekly spending chart (last 8 weeks)
    const weekly: { week: string; spend: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const start = Date.now() - (w + 1) * 7 * 86400000;
      const end = Date.now() - w * 7 * 86400000;
      const weekSpend = txns
        .filter((t) => t.type === "debit")
        .filter((t) => {
          const d = new Date(t.date).getTime();
          return d >= start && d < end;
        })
        .reduce((s, t) => s + t.amount, 0);
      weekly.push({ week: `W${8 - w}`, spend: Math.round(weekSpend) });
    }

    setData({ txns, goals, fds, last30, spent30, earned30, fdValue, fdMatureValue, weekly });
    setFeatured(await store.getFeaturedInsight());
    })();
  }, [user]);

  if (!user || !data) return null;

  const topGoal = data.goals[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">
          Namaste, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's your money pulse for the last 30 days.
        </p>
      </div>

      {/* AI Insight */}
      <Card className="overflow-hidden border-teal/20">
        <div className="absolute inset-0 bg-gradient-to-r from-teal/5 to-purple/5 pointer-events-none" />
        <CardContent className="relative pt-6">
          <div className="flex gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal/20 text-teal">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="font-display font-semibold text-sm">Paise Insight</div>
                <Badge className="text-[10px]"><Sparkles className="h-2.5 w-2.5 mr-0.5" /> AI</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{featured}</p>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0 hidden sm:flex">
              <Link href="/fd-ladder">Build ladder <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Spent (30d)" value={formatINR(data.spent30, { compact: true })} sub={`${data.last30.filter(t=>t.type==='debit').length} txns`} color="text-rose-400" />
        <KPI label="Earned (30d)" value={formatINR(data.earned30, { compact: true })} sub="Salary + credits" color="text-emerald-400" />
        <KPI label="FD Portfolio" value={formatINR(data.fdValue, { compact: true })} sub={`Maturing to ${formatINR(data.fdMatureValue, { compact: true })}`} color="text-teal" />
        <KPI label="Goals" value={`${data.goals.length}`} sub={data.goals.length ? `Top: ${topGoal?.title.slice(0,18)}` : "None yet"} color="text-purple" />
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-4 gap-3">
        {[
          { href: "/fd-ladder", icon: TrendingUp, label: "Build FD Ladder", sub: "AI-optimised" },
          { href: "/expenses", icon: Wallet, label: "Upload Statement", sub: "CSV · PDF" },
          { href: "/chat", icon: MessageSquare, label: "Ask Paise Coach", sub: "EN · HI" },
          { href: "/goals", icon: Target, label: "What-If Simulator", sub: "See your future" },
        ].map((q) => {
          const Icon = q.icon;
          return (
            <Link key={q.href} href={q.href}>
              <Card className="h-full hover:border-teal/30 hover:bg-white/5 transition">
                <CardContent className="pt-5 pb-5">
                  <Icon className="h-5 w-5 text-teal mb-3" />
                  <div className="font-medium text-sm">{q.label}</div>
                  <div className="text-xs text-muted-foreground">{q.sub}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Charts grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Weekly spending</CardTitle>
            <CardDescription>Last 8 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" stroke="#888" fontSize={11} />
                  <YAxis stroke="#888" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ background: "#0a1020", border: "1px solid #1e293b", borderRadius: 8 }}
                    formatter={(v: any) => formatINR(v)}
                  />
                  <Bar dataKey="spend" fill="#00d4aa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top goal</CardTitle>
            <CardDescription>{topGoal ? topGoal.title : "Set a goal to see progress"}</CardDescription>
          </CardHeader>
          <CardContent>
            {topGoal ? (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-xl font-bold">{formatINR(topGoal.current_amount, { compact: true })}</span>
                  <span className="text-xs text-muted-foreground">of {formatINR(topGoal.target_amount, { compact: true })}</span>
                </div>
                <Progress value={(topGoal.current_amount / topGoal.target_amount) * 100} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Deadline: {formatDate(topGoal.deadline)}</span>
                  <span>{Math.round((topGoal.current_amount / topGoal.target_amount) * 100)}%</span>
                </div>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href="/goals">Simulate paths</Link>
                </Button>
              </div>
            ) : (
              <Button asChild size="sm"><Link href="/goals">Create a goal</Link></Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FDs + recent transactions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your FDs</CardTitle>
            <CardDescription>{data.fds.length} active · blended yield {(data.fds.reduce((s,f)=>s+f.rate*f.amount,0)/(data.fdValue||1)).toFixed(2)}%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.fds.length ? data.fds.slice(0, 4).map((f) => {
              const bank = BANKS.find((b) => b.id === f.bank);
              return (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <div className="text-sm font-medium">{bank?.name || f.bank}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {f.tenure_months}mo · matures {formatDate(f.maturity_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatINR(f.amount, { compact: true })}</div>
                    <div className="text-[10px] text-teal">{f.rate}% p.a.</div>
                  </div>
                </div>
              );
            }) : <div className="text-sm text-muted-foreground text-center py-8">No FDs yet. <Link className="text-teal" href="/fd-ladder">Build a ladder →</Link></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent transactions</CardTitle>
            <CardDescription>Last 5 · <Link href="/expenses" className="text-teal hover:underline">See all</Link></CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.txns.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                <div className="min-w-0">
                  <div className="text-sm truncate">{t.merchant}</div>
                  <div className="text-[10px] text-muted-foreground">{t.category} · {formatDate(t.date)}</div>
                </div>
                <div className={t.type === "credit" ? "text-emerald-400 text-sm" : "text-sm"}>
                  {t.type === "credit" ? "+" : "-"}{formatINR(t.amount, { compact: true })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPI({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`font-display text-xl md:text-2xl font-bold mt-1 ${color || ""}`}>{value}</div>
        <div className="text-[10px] text-muted-foreground mt-1 truncate">{sub}</div>
      </CardContent>
    </Card>
  );
}
