"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { store } from "@/lib/store";
import { formatINR } from "@/lib/utils";
import type { User } from "@/lib/types";
import { Users, Zap, DollarSign, TrendingUp, Gift } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface AdminStats {
  users: number;
  newToday: number;
  newWeek: number;
  newMonth: number;
  dau: number;
  wau: number;
  mau: number;
  totalAICalls: number;
  totalCost: number;
  featureUsage: Record<string, number>;
  signupsByDay: { day: string; signups: number }[];
  convRate: number;
  topReferrers: { user: User | undefined; count: number }[];
}

const EMPTY_STATS: AdminStats = {
  users: 0, newToday: 0, newWeek: 0, newMonth: 0,
  dau: 0, wau: 0, mau: 0,
  totalAICalls: 0, totalCost: 0,
  featureUsage: {}, signupsByDay: [], convRate: 0, topReferrers: [],
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  useEffect(() => {
    (async () => {
    const users = await store.listUsers();
    const refs = await store.listReferrals();
    const ai = await store.listAIUsage();
    const events = await store.listAnalytics();

    const today = Date.now();
    const isWithin = (iso: string, days: number) => today - new Date(iso).getTime() < days * 86400000;

    const newToday = users.filter((u) => isWithin(u.created_at, 1)).length;
    const newWeek = users.filter((u) => isWithin(u.created_at, 7)).length;
    const newMonth = users.filter((u) => isWithin(u.created_at, 30)).length;

    const dau = events.filter((e) => isWithin(e.created_at, 1)).map((e) => e.user_id).filter(Boolean);
    const wau = events.filter((e) => isWithin(e.created_at, 7)).map((e) => e.user_id).filter(Boolean);
    const mau = events.filter((e) => isWithin(e.created_at, 30)).map((e) => e.user_id).filter(Boolean);

    const totalAICalls = ai.length;
    const totalCost = ai.reduce((s, a) => s + a.cost_usd, 0);

    const featureUsage: Record<string, number> = {};
    events.forEach((e) => {
      if (e.event === "fd_ladder_created") featureUsage["FD Ladder"] = (featureUsage["FD Ladder"] || 0) + 1;
      if (e.event === "ai_call") featureUsage["Chatbot"] = (featureUsage["Chatbot"] || 0) + 1;
      if (e.event === "goal_created") featureUsage["Goals"] = (featureUsage["Goals"] || 0) + 1;
    });

    // Signups by day (last 14 days)
    const signupsByDay: { day: string; signups: number }[] = [];
    for (let d = 13; d >= 0; d--) {
      const start = today - (d + 1) * 86400000;
      const end = today - d * 86400000;
      const count = users.filter((u) => {
        const t = new Date(u.created_at).getTime();
        return t >= start && t < end;
      }).length;
      signupsByDay.push({ day: `D-${d}`, signups: count });
    }

    const approved = refs.filter((r) => r.status === "approved").length;
    const convRate = refs.length ? (approved / refs.length) * 100 : 0;

    // Top referrers
    const byUser: Record<string, number> = {};
    refs.filter((r) => r.status === "approved").forEach((r) => {
      byUser[r.referrer_id] = (byUser[r.referrer_id] || 0) + 1;
    });
    const topReferrers = Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ user: users.find((u) => u.id === id), count }));

    setStats({
      users: users.length,
      newToday,
      newWeek,
      newMonth,
      dau: new Set(dau).size,
      wau: new Set(wau).size,
      mau: new Set(mau).size,
      totalAICalls,
      totalCost,
      featureUsage,
      signupsByDay,
      convRate,
      topReferrers,
    });
    })();
  }, []);

  const featureData = Object.entries(stats.featureUsage).map(([name, value]) => ({ name, value }));
  const COLORS = ["#00d4aa", "#8b5cf6", "#f59e0b", "#ec4899"];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl md:text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Operational overview of Paise</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={<Users className="h-4 w-4" />} label="Total users" val={String(stats.users)} sub={`+${stats.newWeek} this week`} />
        <KPI icon={<TrendingUp className="h-4 w-4" />} label="DAU / MAU" val={`${stats.dau} / ${stats.mau}`} sub="active users" />
        <KPI icon={<Zap className="h-4 w-4" />} label="AI calls" val={String(stats.totalAICalls)} sub={`$${stats.totalCost.toFixed(4)} spent`} />
        <KPI icon={<Gift className="h-4 w-4" />} label="Referral conv" val={`${stats.convRate.toFixed(0)}%`} sub={`${stats.topReferrers.reduce((s, r) => s + r.count, 0)} total`} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Signups (last 14 days)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.signupsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="#888" fontSize={10} />
                  <YAxis stroke="#888" fontSize={10} />
                  <Tooltip contentStyle={{ background: "#0a1020", border: "1px solid #1e293b", borderRadius: 8 }} />
                  <Bar dataKey="signups" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Feature usage</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={featureData} dataKey="value" nameKey="name" outerRadius={70}>
                    {featureData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0a1020", border: "1px solid #1e293b", borderRadius: 8 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Top referrers this month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.topReferrers.map((t, i) => (
            <div key={t.user?.id || i} className="flex items-center justify-between p-2 rounded-md bg-white/5 text-sm">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-purple/20 text-purple text-xs font-bold">
                  {i + 1}
                </span>
                <span>{t.user?.name || "Unknown"}</span>
                <Badge variant="outline" className="text-[9px]">{t.user?.referral_code}</Badge>
              </div>
              <span className="text-purple font-medium">{t.count} refs</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ icon, label, val, sub }: { icon: React.ReactNode; label: string; val: string; sub: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          {icon} {label}
        </div>
        <div className="font-display text-xl md:text-2xl font-bold mt-1">{val}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
      </CardContent>
    </Card>
  );
}
