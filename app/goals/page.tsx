"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import { formatINR, formatDate, daysBetween } from "@/lib/utils";
import { Target, Plus, Sparkles, TrendingUp, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from "recharts";
import type { Goal } from "@/lib/types";

export default function GoalsPage() {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", target_amount: "", deadline: "", category: "safety" });
  const [goals, setGoals] = useState<Goal[]>([]);
  useEffect(() => {
    if (!user) return;
    (async () => setGoals(await store.listGoals(user.id)))();
  }, [user, refresh]);

  // Simulator state
  const [sipDelta, setSipDelta] = useState(0);
  const [cutPct, setCutPct] = useState(0);
  const [prepay, setPrepay] = useState(0);
  const [years, setYears] = useState(10);

  async function addGoal() {
    if (!user || !form.title || !form.target_amount) return;
    await store.addGoal({
      user_id: user.id,
      title: form.title,
      target_amount: Number(form.target_amount),
      current_amount: 0,
      deadline: form.deadline || new Date(Date.now() + 365 * 86400000).toISOString(),
      category: form.category,
    });
    store.track("goal_created", user.id);
    setForm({ title: "", target_amount: "", deadline: "", category: "safety" });
    setShowAdd(false);
    setRefresh((x) => x + 1);
  }

  async function deleteGoal(id: string) {
    if (!confirm("Delete this goal?")) return;
    await store.deleteGoal(id);
    setRefresh((x) => x + 1);
  }

  // Simulate compound growth
  const sim = useMemo(() => {
    const monthlySIP = 10000 + sipDelta * 1000; // base ₹10K + delta
    const monthlyCut = (40000 * cutPct) / 100; // assume ₹40K discretionary
    const effective = monthlySIP + monthlyCut;
    const annualReturn = 0.12;
    const data: any[] = [];
    let balance = 0;
    let balanceBase = 0;
    for (let y = 0; y <= years; y++) {
      data.push({
        year: `Y${y}`,
        "Current path": Math.round(balanceBase),
        "With changes": Math.round(balance),
      });
      balance = (balance + effective * 12) * (1 + annualReturn);
      balanceBase = (balanceBase + 10000 * 12) * (1 + annualReturn);
    }
    const prepaySavings = prepay * 1000 * 0.085 * years * 0.5; // rough — 8.5% saved half period
    return { data, finalBalance: balance, baseBalance: balanceBase, gain: balance - balanceBase, prepaySavings };
  }, [sipDelta, cutPct, prepay, years]);

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Goals & Simulator</h1>
          <p className="text-muted-foreground text-sm mt-1">Set goals. Play with scenarios. See the compound effect.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> New goal</Button>
      </div>

      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals"><Target className="h-3 w-3 mr-1" /> My goals</TabsTrigger>
          <TabsTrigger value="simulator"><Sparkles className="h-3 w-3 mr-1" /> What-If Simulator</TabsTrigger>
        </TabsList>

        <TabsContent value="goals">
          {goals.length === 0 ? (
            <Card>
              <CardContent className="py-20 text-center text-muted-foreground">
                <Target className="h-12 w-12 mx-auto opacity-40 mb-3" />
                <p className="text-sm">No goals yet. Set one and we'll show you the path.</p>
                <Button className="mt-4" onClick={() => setShowAdd(true)}>Create your first goal</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {goals.map((g) => {
                const pct = (g.current_amount / g.target_amount) * 100;
                const daysLeft = daysBetween(new Date(), g.deadline);
                const monthsLeft = Math.max(1, Math.round(daysLeft / 30));
                const needMonthly = (g.target_amount - g.current_amount) / monthsLeft;
                return (
                  <Card key={g.id} className="hover:border-teal/30 transition">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-semibold">{g.title}</h3>
                            <Badge variant="outline" className="text-[10px]">{g.category}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">Due {formatDate(g.deadline)} · {daysLeft > 0 ? `${daysLeft}d left` : "overdue"}</div>
                        </div>
                        <button onClick={() => deleteGoal(g.id)} className="text-muted-foreground hover:text-destructive p-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <span className="font-display text-2xl font-bold">{formatINR(g.current_amount, { compact: true })}</span>
                        <span className="text-xs text-muted-foreground">of {formatINR(g.target_amount, { compact: true })}</span>
                      </div>
                      <Progress value={pct} />

                      <div className="rounded-lg bg-white/5 p-3 text-xs">
                        <div className="text-muted-foreground mb-1">To stay on track:</div>
                        <div className="font-medium">Save <span className="text-teal">{formatINR(needMonthly, { compact: true })}/mo</span></div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="simulator">
          <div className="grid lg:grid-cols-[320px_1fr] gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pull the levers</CardTitle>
                <CardDescription>See how small changes compound</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <SliderRow
                  label="Increase SIP by"
                  value={sipDelta}
                  suffix={`₹${sipDelta}K/mo`}
                  min={0}
                  max={20}
                  onChange={setSipDelta}
                />
                <SliderRow
                  label="Cut discretionary spend by"
                  value={cutPct}
                  suffix={`${cutPct}%`}
                  min={0}
                  max={50}
                  onChange={setCutPct}
                />
                <SliderRow
                  label="Prepay loan (one-time)"
                  value={prepay}
                  suffix={`₹${prepay}K`}
                  min={0}
                  max={500}
                  step={10}
                  onChange={setPrepay}
                />
                <SliderRow
                  label="Time horizon"
                  value={years}
                  suffix={`${years} yrs`}
                  min={1}
                  max={30}
                  onChange={setYears}
                />
                <div className="rounded-lg border border-teal/30 bg-teal/10 p-4 space-y-2">
                  <div className="text-xs text-muted-foreground">Projected extra wealth</div>
                  <div className="font-display text-2xl font-bold gradient-text">
                    +{formatINR(sim.gain + sim.prepaySavings, { compact: true })}
                  </div>
                  <div className="text-[10px] text-muted-foreground">in {years} yrs at 12% equity return</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-teal" /> Two futures</CardTitle>
                <CardDescription>Compound magic visualised</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sim.data}>
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="year" stroke="#888" fontSize={11} />
                      <YAxis stroke="#888" fontSize={11} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                      <Tooltip
                        contentStyle={{ background: "#0a1020", border: "1px solid #1e293b", borderRadius: 8 }}
                        formatter={(v: any) => formatINR(v, { compact: true })}
                      />
                      <Legend iconType="circle" />
                      <Area type="monotone" dataKey="Current path" stroke="#8b5cf6" fill="url(#g1)" strokeWidth={2} />
                      <Area type="monotone" dataKey="With changes" stroke="#00d4aa" fill="url(#g2)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <StatTile label="Base path" value={formatINR(sim.baseBalance, { compact: true })} />
                  <StatTile label="With changes" value={formatINR(sim.finalBalance, { compact: true })} accent />
                  <StatTile label="Extra gained" value={`+${formatINR(sim.gain, { compact: true })}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New goal</DialogTitle>
            <DialogDescription>What are you saving for?</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input placeholder="Trip to Japan" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Target ₹</Label>
                <Input type="number" placeholder="200000" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} />
              </div>
              <div>
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Category</Label>
              <Input placeholder="travel / safety / house" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <Button className="w-full" onClick={addGoal}>Create goal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SliderRow({ label, value, suffix, min, max, step = 1, onChange }: { label: string; value: number; suffix: string; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="mb-0">{label}</Label>
        <span className="text-sm font-mono text-teal">{suffix}</span>
      </div>
      <Slider value={value} min={min} max={max} step={step} onChange={onChange} />
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-white/5 p-3 text-center">
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className={`font-display text-sm md:text-base font-bold mt-1 ${accent ? "gradient-text" : ""}`}>{value}</div>
    </div>
  );
}
