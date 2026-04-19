"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { store } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import type { AIUsageLog } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface UsageData {
  logs: AIUsageLog[];
  totalIn: number;
  totalOut: number;
  totalCost: number;
  byDay: { day: string; calls: number; cost: number }[];
  topUsers: [string, { name: string; calls: number; cost: number; tokens: number }][];
}

export default function AdminAIUsage() {
  const [data, setData] = useState<UsageData>({ logs: [], totalIn: 0, totalOut: 0, totalCost: 0, byDay: [], topUsers: [] });
  useEffect(() => {
    (async () => {
    const logs = await store.listAIUsage();
    const totalIn = logs.reduce((s, l) => s + l.tokens_in, 0);
    const totalOut = logs.reduce((s, l) => s + l.tokens_out, 0);
    const totalCost = logs.reduce((s, l) => s + l.cost_usd, 0);

    // by day last 14
    const byDay: { day: string; calls: number; cost: number }[] = [];
    for (let d = 13; d >= 0; d--) {
      const start = Date.now() - (d + 1) * 86400000;
      const end = Date.now() - d * 86400000;
      const day = logs.filter((l) => {
        const t = new Date(l.created_at).getTime();
        return t >= start && t < end;
      });
      byDay.push({
        day: `D-${d}`,
        calls: day.length,
        cost: +day.reduce((s, l) => s + l.cost_usd, 0).toFixed(4),
      });
    }

    // top users
    const byUser: Record<string, { name: string; calls: number; cost: number; tokens: number }> = {};
    logs.forEach((l) => {
      if (!byUser[l.user_id]) byUser[l.user_id] = { name: l.user_name, calls: 0, cost: 0, tokens: 0 };
      byUser[l.user_id].calls += 1;
      byUser[l.user_id].cost += l.cost_usd;
      byUser[l.user_id].tokens += l.tokens_in + l.tokens_out;
    });
    const topUsers = Object.entries(byUser).sort((a, b) => b[1].calls - a[1].calls).slice(0, 10);

    setData({ logs, totalIn, totalOut, totalCost, byDay, topUsers });
    })();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl md:text-2xl font-bold">AI Usage & Cost</h1>
        <p className="text-xs text-muted-foreground">Claude API call tracking</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Total calls" val={String(data.logs.length)} />
        <KPI label="Tokens in" val={data.totalIn.toLocaleString()} />
        <KPI label="Tokens out" val={data.totalOut.toLocaleString()} />
        <KPI label="Total cost" val={`$${data.totalCost.toFixed(4)}`} accent />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Calls per day (last 14)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={10} />
                <Tooltip contentStyle={{ background: "#0a1020", border: "1px solid #1e293b", borderRadius: 8 }} />
                <Bar dataKey="calls" fill="#00d4aa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Top 10 users by calls</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {data.topUsers.map(([id, u], i) => (
              <div key={id} className="flex items-center justify-between p-2 rounded-md bg-white/5 text-xs">
                <span className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded bg-purple/20 text-purple text-[9px] font-bold">{i + 1}</span>
                  {u.name}
                </span>
                <span className="flex items-center gap-3 text-muted-foreground">
                  <span>{u.calls} calls</span>
                  <span className="text-teal">${u.cost.toFixed(4)}</span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Recent calls</CardTitle></CardHeader>
          <CardContent className="max-h-80 overflow-y-auto scrollbar-thin space-y-1">
            {data.logs.slice(0, 30).map((l) => (
              <div key={l.id} className="flex items-center justify-between p-2 rounded-md bg-white/5 text-[11px]">
                <div className="min-w-0">
                  <div className="truncate">{l.user_name} <Badge variant="outline" className="text-[9px]">{l.endpoint}</Badge></div>
                  <div className="text-muted-foreground text-[10px]">{formatDate(l.created_at)}</div>
                </div>
                <div className="text-right text-muted-foreground">
                  <div>{l.tokens_in}↑ {l.tokens_out}↓</div>
                  <div className="text-teal">${l.cost_usd.toFixed(5)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPI({ label, val, accent }: { label: string; val: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`font-display text-xl md:text-2xl font-bold mt-1 ${accent ? "gradient-text" : ""}`}>{val}</div>
      </CardContent>
    </Card>
  );
}
