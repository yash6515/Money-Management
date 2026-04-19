"use client";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import { formatINR, formatDate, uid } from "@/lib/utils";
import { Upload, Plus, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { categorizeLocal } from "@/lib/categorize";
import type { Transaction } from "@/lib/types";

const COLORS = ["#00d4aa", "#8b5cf6", "#f59e0b", "#ec4899", "#3b82f6", "#10b981", "#f43f5e", "#a855f7", "#eab308", "#06b6d4"];

export default function ExpensesPage() {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [insights, setInsights] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ merchant: "", amount: "", category: "", type: "debit" });

  const [txns, setTxns] = useState<Transaction[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => setTxns(await store.listTransactions(user.id)))();
  }, [user, refresh]);

  const stats = useMemo(() => {
    const last30 = txns.filter((t) => Date.now() - new Date(t.date).getTime() < 30 * 86400000);
    const last60 = txns.filter((t) => {
      const age = Date.now() - new Date(t.date).getTime();
      return age >= 30 * 86400000 && age < 60 * 86400000;
    });
    const spent30 = last30.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const spent60 = last60.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    const earned30 = last30.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const wowChange = spent60 ? ((spent30 - spent60) / spent60) * 100 : 0;

    const byCat: Record<string, number> = {};
    last30.filter((t) => t.type === "debit").forEach((t) => {
      byCat[t.category] = (byCat[t.category] || 0) + t.amount;
    });
    const pieData = Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value: Math.round(value) }));

    const byMerchant: Record<string, { amount: number; count: number }> = {};
    last30.filter((t) => t.type === "debit").forEach((t) => {
      if (!byMerchant[t.merchant]) byMerchant[t.merchant] = { amount: 0, count: 0 };
      byMerchant[t.merchant].amount += t.amount;
      byMerchant[t.merchant].count += 1;
    });
    const topMerchants = Object.entries(byMerchant)
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 8)
      .map(([name, d]) => ({ name, amount: Math.round(d.amount), count: d.count }));

    // Category trend last 8 weeks (top 5 categories)
    const topCats = pieData.slice(0, 5).map((c) => c.name);
    const weekly: any[] = [];
    for (let w = 7; w >= 0; w--) {
      const start = Date.now() - (w + 1) * 7 * 86400000;
      const end = Date.now() - w * 7 * 86400000;
      const row: any = { week: `W${8 - w}` };
      topCats.forEach((cat) => {
        row[cat] = txns
          .filter((t) => t.type === "debit" && t.category === cat)
          .filter((t) => {
            const d = new Date(t.date).getTime();
            return d >= start && d < end;
          })
          .reduce((s, t) => s + t.amount, 0);
      });
      weekly.push(row);
    }

    return { spent30, spent60, earned30, wowChange, pieData, topMerchants, weekly, topCats };
  }, [txns]);

  async function handleFile(file: File) {
    if (!user) return;
    setUploading(true);
    setInsights("");

    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    let rows: Transaction[] = [];

    if (isPdf) {
      // PDF: send to /api/parse-pdf for Claude-powered extraction.
      // If it's password-protected, server returns 401 + needsPassword;
      // we prompt and retry (up to 3 attempts).
      try {
        let password = "";
        let data: any = null;
        for (let attempt = 0; attempt < 4; attempt++) {
          const fd = new FormData();
          fd.append("file", file);
          if (password) fd.append("password", password);
          const res = await fetch("/api/parse-pdf", { method: "POST", body: fd });
          const rawText = await res.text();
          try {
            data = JSON.parse(rawText);
          } catch {
            // Server returned an HTML error page — surface it and stop.
            console.error("parse-pdf non-JSON response:", rawText.slice(0, 500));
            alert(
              "Server error while parsing the PDF. Check the dev server terminal for the full stack trace.\n\n" +
                rawText.replace(/<[^>]+>/g, " ").trim().slice(0, 300)
            );
            setUploading(false);
            return;
          }
          if (res.ok) break;
          if (data?.needsPassword) {
            const pw = window.prompt(
              data.error ||
                "This PDF is password-protected. Enter the password (banks often use PAN+DOB like ABCDE1234F01011990):"
            );
            if (!pw) {
              setUploading(false);
              return;
            }
            password = pw;
            continue;
          }
          alert(data?.error || "Failed to parse PDF.");
          setUploading(false);
          return;
        }
        if (!data || !data.transactions) {
          alert("Couldn't unlock the PDF after several tries.");
          setUploading(false);
          return;
        }
        rows = (data.transactions || []).map((t: any) => ({
          id: uid(),
          user_id: user.id,
          amount: Number(t.amount) || 0,
          merchant: (t.merchant || "Unknown").slice(0, 80),
          category: t.category || categorizeLocal(t.merchant || ""),
          date: new Date(t.date).toISOString(),
          type: (t.type === "credit" ? "credit" : "debit") as "credit" | "debit",
          source: "pdf",
        }));
      } catch (e: any) {
        alert("PDF upload failed: " + (e?.message || "unknown error"));
        setUploading(false);
        return;
      }
    } else {
      // CSV: parse client-side with PapaParse
      const text = await file.text();
      const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
      for (const r of result.data) {
        const keys = Object.keys(r).reduce((acc, k) => ({ ...acc, [k.toLowerCase().trim()]: r[k] }), {} as Record<string, string>);
        const merchant = keys["merchant"] || keys["description"] || keys["narration"] || keys["particulars"] || keys["details"] || "Unknown";
        const amountStr = keys["amount"] || keys["debit"] || keys["withdrawal"] || keys["withdrawals"] || "0";
        const credit = keys["credit"] || keys["deposit"] || keys["deposits"];
        const date = keys["date"] || keys["txn date"] || keys["transaction date"] || new Date().toISOString();
        const isCredit = credit && Number(credit.replace(/[^0-9.-]/g, "")) > 0;
        const amount = Math.abs(Number((isCredit ? credit : amountStr).replace(/[^0-9.-]/g, ""))) || 0;
        if (!amount || !merchant) continue;
        rows.push({
          id: uid(),
          user_id: user.id,
          amount,
          merchant: merchant.slice(0, 80),
          category: categorizeLocal(merchant),
          date: new Date(date).toISOString(),
          type: isCredit ? "credit" : "debit",
          source: "upload",
        });
      }
    }

    if (rows.length === 0) {
      alert(
        isPdf
          ? "No transactions detected in the PDF. Try a text-based (not scanned) bank statement."
          : "Couldn't detect columns. Try a CSV with merchant + amount + date headers."
      );
      setUploading(false);
      return;
    }
    await store.addTransactions(rows);
    setRefresh((x) => x + 1);

    // Call AI for insights
    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: rows.map((r) => ({ merchant: r.merchant, amount: r.amount })),
          insights_profile: { income_range: user.income_range, risk: user.risk_appetite },
        }),
      });
      const data = await res.json();
      setInsights(data.insights || "");
    } catch {}
    setUploading(false);
  }

  async function addManual() {
    if (!user || !form.merchant || !form.amount) return;
    const amt = Number(form.amount);
    const t: Transaction = {
      id: uid(),
      user_id: user.id,
      merchant: form.merchant,
      amount: amt,
      category: form.category || categorizeLocal(form.merchant),
      date: new Date().toISOString(),
      type: form.type as any,
      source: "manual",
    };
    await store.addTransactions([t]);
    setForm({ merchant: "", amount: "", category: "", type: "debit" });
    setShowAdd(false);
    setRefresh((x) => x + 1);
  }

  async function aiInsight() {
    setUploading(true);
    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: txns.slice(0, 100).map((r) => ({ merchant: r.merchant, amount: r.amount })),
          insights_profile: { income_range: user?.income_range, risk: user?.risk_appetite },
        }),
      });
      const data = await res.json();
      setInsights(data.insights || "");
    } finally {
      setUploading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">Track, categorise, and learn from your spending.</p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv,.pdf,application/pdf,text/csv"
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <Button asChild variant="outline" size="sm">
              <span><Upload className="h-4 w-4" /> {uploading ? "Parsing…" : "Upload statement"}</span>
            </Button>
          </label>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Spent (30d)" val={formatINR(stats.spent30, { compact: true })} />
        <KPI label="Earned (30d)" val={formatINR(stats.earned30, { compact: true })} />
        <KPI
          label="WoW change"
          val={`${stats.wowChange >= 0 ? "+" : ""}${stats.wowChange.toFixed(1)}%`}
          icon={stats.wowChange >= 0 ? <TrendingUp className="h-3 w-3 text-rose-400" /> : <TrendingDown className="h-3 w-3 text-emerald-400" />}
          color={stats.wowChange >= 0 ? "text-rose-400" : "text-emerald-400"}
        />
        <KPI label="Transactions" val={`${txns.length}`} sub={`${txns.filter(t=>t.source==='upload').length} uploaded`} />
      </div>

      {/* AI Insights */}
      <Card className="border-teal/20">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-teal" /> AI insights</CardTitle>
            <CardDescription>Personalised to your income range</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={aiInsight} disabled={uploading}>
            {uploading ? "Analysing…" : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {insights || "Click Refresh for personalised AI insights on your spending. We analyse category patterns against your income range and risk profile."}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Category breakdown (30d)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {stats.pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0a1020", border: "1px solid #1e293b", borderRadius: 8 }}
                    formatter={(v: any) => formatINR(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {stats.pieData.slice(0, 8).map((c, i) => (
                <div key={c.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="truncate flex-1">{c.name}</span>
                  <span className="text-muted-foreground">{formatINR(c.value, { compact: true })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Category trends (8 weeks)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" stroke="#888" fontSize={11} />
                  <YAxis stroke="#888" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ background: "#0a1020", border: "1px solid #1e293b", borderRadius: 8 }}
                    formatter={(v: any) => formatINR(v)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                  {stats.topCats.map((c, i) => (
                    <Bar key={c} dataKey={c} stackId="a" fill={COLORS[i % COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top merchants + recent */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Top merchants (30d)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stats.topMerchants.map((m) => (
              <div key={m.name} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5">
                <div>
                  <div className="text-sm font-medium">{m.name}</div>
                  <div className="text-[10px] text-muted-foreground">{m.count} transactions</div>
                </div>
                <div className="text-sm font-semibold">{formatINR(m.amount, { compact: true })}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">All transactions</CardTitle></CardHeader>
          <CardContent className="max-h-96 overflow-y-auto scrollbar-thin space-y-1">
            {txns.slice(0, 50).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                <div className="min-w-0">
                  <div className="text-sm truncate">{t.merchant}</div>
                  <div className="text-[10px] text-muted-foreground">
                    <Badge variant="outline" className="text-[9px] mr-1">{t.category}</Badge>
                    {formatDate(t.date)}
                  </div>
                </div>
                <div className={t.type === "credit" ? "text-emerald-400 text-sm shrink-0" : "text-sm shrink-0"}>
                  {t.type === "credit" ? "+" : "-"}{formatINR(t.amount, { compact: true })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Add manual */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add transaction</DialogTitle>
            <DialogDescription>Quick log a payment not in your statements.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Merchant</Label>
              <Input value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} placeholder="Swiggy" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount ₹</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Category (optional)</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Auto if blank" />
            </div>
            <Button className="w-full" onClick={addManual}>Add transaction</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPI({ label, val, sub, color, icon }: { label: string; val: string; sub?: string; color?: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">{label} {icon}</div>
        <div className={`font-display text-xl md:text-2xl font-bold mt-1 ${color || ""}`}>{val}</div>
        {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
