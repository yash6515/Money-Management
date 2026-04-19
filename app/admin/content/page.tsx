"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { store } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { Bank } from "@/lib/types";

export default function AdminContent() {
  const { user: me } = useAuth();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [insight, setInsight] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setBanks(await store.listBanks());
      setPrompt(await store.getChatbotPrompt());
      setSuggestions((await store.getPreSeededPrompts()).join("\n"));
      setInsight(await store.getFeaturedInsight());
    })();
  }, []);

  async function log(action: string, target_id?: string, metadata?: any) {
    if (me) await store.addAdminLog({ admin_id: me.id, admin_name: me.name, action, target_id, metadata });
  }

  async function saveRate(bankId: string, tenure: number, val: number, senior = false) {
    const bank = banks.find((b) => b.id === bankId)!;
    const rate = bank.rates.find((r) => r.tenure_months === tenure);
    if (!rate) return;
    const old = senior ? rate.senior_rate : rate.rate;
    if (senior) rate.senior_rate = val;
    else rate.rate = val;
    await store.updateBank(bankId, { rates: bank.rates });
    setBanks([...banks]);
    await log("update_fd_rate", bankId, { tenure, old, new: val, senior });
    setSavedAt(new Date().toLocaleTimeString());
  }

  async function savePrompt() {
    await store.setChatbotPrompt(prompt);
    await log("update_chatbot_prompt");
    setSavedAt(new Date().toLocaleTimeString());
  }

  async function saveSuggestions() {
    const arr = suggestions.split("\n").map((s) => s.trim()).filter(Boolean);
    await store.setPreSeededPrompts(arr);
    await log("update_chat_suggestions");
    setSavedAt(new Date().toLocaleTimeString());
  }

  async function saveInsight() {
    await store.setFeaturedInsight(insight);
    await log("update_featured_insight");
    setSavedAt(new Date().toLocaleTimeString());
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold">Content</h1>
          <p className="text-xs text-muted-foreground">Edit bank rates, chatbot prompt, chat suggestions, featured insights</p>
        </div>
        {savedAt && <Badge className="text-[10px]">Saved {savedAt}</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Featured insight (shown on user dashboards)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea value={insight} onChange={(e) => setInsight(e.target.value)} rows={2} />
          <Button size="sm" onClick={saveInsight}>Save</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Chatbot system prompt</CardTitle>
          <CardDescription>Controls Paise Coach behaviour</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={10} className="font-mono text-xs" />
          <Button size="sm" onClick={savePrompt}>Save prompt</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pre-seeded chat suggestions (one per line)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea value={suggestions} onChange={(e) => setSuggestions(e.target.value)} rows={6} />
          <Button size="sm" onClick={saveSuggestions}>Save suggestions</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">FD rates ({banks.length} banks)</CardTitle>
          <CardDescription>Inline edit. Changes log to audit trail.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 max-h-[60vh] overflow-y-auto scrollbar-thin pr-2">
            {banks.map((b) => (
              <div key={b.id} className="rounded-lg border border-white/5 p-3 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{b.name}</span>
                    <Badge variant="outline" className="text-[9px] uppercase">{b.type}</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">min ₹{b.min_amount.toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {b.rates.map((r) => (
                    <div key={r.tenure_months} className="rounded-md bg-black/20 p-2">
                      <div className="text-[10px] text-muted-foreground">{r.tenure_months}mo</div>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          step="0.05"
                          defaultValue={r.rate}
                          onBlur={(e) => saveRate(b.id, r.tenure_months, Number(e.target.value))}
                          className="w-16 h-7 text-xs bg-transparent border border-white/10 rounded px-1"
                        />
                        <span className="text-[10px] text-muted-foreground">%</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          step="0.05"
                          defaultValue={r.senior_rate}
                          onBlur={(e) => saveRate(b.id, r.tenure_months, Number(e.target.value), true)}
                          className="w-16 h-7 text-xs bg-transparent border border-white/10 rounded px-1 text-teal"
                        />
                        <span className="text-[10px] text-muted-foreground">senior</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
