"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import { BANKS, bestRate } from "@/lib/banks";
import { formatINR, formatDate, uid } from "@/lib/utils";
import type { LadderRung } from "@/lib/fd-engine";
import { Sparkles, TrendingUp, Zap, Search, CheckCircle2, ExternalLink } from "lucide-react";

export default function FDLadderPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("builder");

  // Builder state
  const [amount, setAmount] = useState(500000);
  const [tenure, setTenure] = useState(36);
  const [liquidity, setLiquidity] = useState<"low" | "medium" | "high">("medium");
  const [senior, setSenior] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rungs, setRungs] = useState<LadderRung[]>([]);
  const [yld, setYld] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [language, setLanguage] = useState<"en" | "hi">(user?.language || "en");
  const [showBlostem, setShowBlostem] = useState(false);

  // Compare state
  const [filterType, setFilterType] = useState<"all" | "psu" | "private" | "sfb">("all");
  const [filterTenure, setFilterTenure] = useState(12);
  const [search, setSearch] = useState("");

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/fd-ladder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          tenure_months: tenure,
          liquidity,
          senior,
          language,
          user_profile: user
            ? { income_range: user.income_range, risk_appetite: user.risk_appetite, name: user.name }
            : {},
        }),
      });
      const data = await res.json();
      setRungs(data.rungs || []);
      setYld(data.yld || 0);
      setExplanation(data.explanation || "");
      store.track("fd_ladder_created", user?.id, { amount, tenure, liquidity });
    } finally {
      setLoading(false);
    }
  }

  async function saveLadder() {
    if (!user || !rungs.length) return;
    const fds = rungs.map((r) => ({
      id: uid(),
      user_id: user.id,
      bank: r.bank.id,
      amount: r.amount,
      rate: r.rate,
      start_date: new Date().toISOString(),
      maturity_date: r.maturity_date,
      tenure_months: r.tenure_months,
    }));
    await store.addFDs(fds);
    alert("Ladder saved to your portfolio ✓");
  }

  const compareRows = useMemo(() => {
    const ranked = bestRate(filterTenure, senior, filterType === "all" ? undefined : filterType);
    return ranked
      .filter((r) => (search ? r.bank.name.toLowerCase().includes(search.toLowerCase()) : true))
      .slice(0, 20);
  }, [filterTenure, filterType, search, senior]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">FD Ladder</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build a smart multi-FD split. AI optimises for yield and liquidity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="builder"><Sparkles className="h-3 w-3 mr-1" /> AI Ladder</TabsTrigger>
          <TabsTrigger value="compare"><TrendingUp className="h-3 w-3 mr-1" /> Compare Banks</TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Tell us what you need</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Amount to invest</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value) || 0)}
                      className="w-32"
                    />
                    <div className="text-sm text-muted-foreground">{formatINR(amount, { compact: true })}</div>
                  </div>
                  <Slider
                    value={amount}
                    min={10000}
                    max={5000000}
                    step={10000}
                    onChange={setAmount}
                    className="mt-3"
                  />
                </div>
                <div>
                  <Label>Maximum horizon</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Input
                      type="number"
                      value={tenure}
                      onChange={(e) => setTenure(Number(e.target.value) || 0)}
                      className="w-24"
                    />
                    <div className="text-sm text-muted-foreground">months</div>
                  </div>
                  <Slider value={tenure} min={6} max={120} step={6} onChange={setTenure} className="mt-3" />
                </div>
                <div>
                  <Label>Liquidity need</Label>
                  <Select value={liquidity} onValueChange={(v) => setLiquidity(v as any)}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low — OK to lock long</SelectItem>
                      <SelectItem value="medium">Medium — balanced</SelectItem>
                      <SelectItem value="high">High — want easy access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={senior} onChange={(e) => setSenior(e.target.checked)} className="accent-teal" />
                  Senior citizen (+0.5% usually)
                </label>
                <Button className="w-full" onClick={generate} disabled={loading}>
                  {loading ? (
                    <>Generating…</>
                  ) : (
                    <><Zap className="h-4 w-4" /> Generate my ladder</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="md:col-span-2 space-y-4">
              {rungs.length === 0 ? (
                <Card>
                  <CardContent className="py-20 text-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Set your amount and hit <strong className="text-foreground">Generate my ladder</strong>.</p>
                    <p className="text-xs mt-1">AI will split across banks for max blended yield.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="overflow-hidden border-teal/30">
                    <div className="bg-gradient-to-r from-teal/10 to-purple/10 p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Blended Yield</div>
                        <div className="font-display text-3xl font-bold gradient-text">{yld}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Total at maturity</div>
                        <div className="font-display text-xl font-bold">
                          {formatINR(rungs.reduce((s, r) => s + r.maturity_value, 0), { compact: true })}
                        </div>
                      </div>
                    </div>
                    <CardContent className="space-y-3 pt-5">
                      {rungs.map((r, i) => (
                        <div key={i} className="rounded-lg border border-white/5 p-4 hover:bg-white/5 transition">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">Rung {i + 1}</Badge>
                                <span className="text-sm font-medium">{r.bank.name}</span>
                                <Badge className="text-[10px]">{r.rate}% p.a.</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                ₹{r.amount.toLocaleString("en-IN")} · {r.tenure_months}mo · matures {formatDate(r.maturity_date)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{formatINR(r.maturity_value, { compact: true })}</div>
                              <div className="text-[10px] text-emerald-400">
                                +{formatINR(r.maturity_value - r.amount, { compact: true })}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal to-purple"
                              style={{ width: `${r.weight_pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {explanation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-teal" /> Why this split
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                          {explanation}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={saveLadder} variant="outline"><CheckCircle2 className="h-4 w-4" /> Save to portfolio</Button>
                    <Button onClick={() => setShowBlostem(true)}><ExternalLink className="h-4 w-4" /> Book via Blostem</Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compare">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compare FD rates across India</CardTitle>
              <CardDescription>15+ banks · updated daily by Paise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search bank…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All banks</SelectItem>
                    <SelectItem value="psu">PSU</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="sfb">Small Finance</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={String(filterTenure)} onValueChange={(v) => setFilterTenure(Number(v))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">1 year</SelectItem>
                    <SelectItem value="24">2 years</SelectItem>
                    <SelectItem value="36">3 years</SelectItem>
                    <SelectItem value="60">5 years</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={senior} onChange={(e) => setSenior(e.target.checked)} className="accent-teal" />
                  Senior rates
                </label>
              </div>

              <div className="rounded-lg border border-white/5 overflow-hidden">
                <div className="grid grid-cols-4 gap-4 px-4 py-2.5 bg-white/5 text-xs font-semibold text-muted-foreground">
                  <span>Bank</span>
                  <span>Type</span>
                  <span>Min amount</span>
                  <span className="text-right">{filterTenure}mo rate</span>
                </div>
                {compareRows.map((r, i) => (
                  <div key={r.bank.id} className={`grid grid-cols-4 gap-4 px-4 py-3 text-sm items-center ${i % 2 ? "bg-white/[0.02]" : ""}`}>
                    <span className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-teal/20 to-purple/20 text-[10px] font-bold">
                        {r.bank.name.split(" ").slice(0, 2).map(w => w[0]).join("")}
                      </span>
                      <span className="truncate">{r.bank.name}</span>
                      {i === 0 && <Badge className="text-[9px]">Best</Badge>}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase">{r.bank.type}</span>
                    <span className="text-xs text-muted-foreground">{formatINR(r.bank.min_amount)}</span>
                    <span className="text-right">
                      <span className={`font-display font-bold ${i === 0 ? "gradient-text" : ""}`}>{r.rate}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showBlostem} onOpenChange={setShowBlostem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redirecting to Blostem API</DialogTitle>
            <DialogDescription>
              In production, Paise hands off the full ladder to Blostem's FD booking API. Partnered banks open a pre-filled flow — user completes KYC once, books all rungs in one session.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted p-4 text-xs space-y-2">
            <div className="flex justify-between"><span>Rungs</span><span>{rungs.length}</span></div>
            <div className="flex justify-between"><span>Total amount</span><span>{formatINR(rungs.reduce((s, r) => s + r.amount, 0))}</span></div>
            <div className="flex justify-between"><span>Blended yield</span><span className="text-teal">{yld}%</span></div>
          </div>
          <Button onClick={() => setShowBlostem(false)}>Got it</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
