"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import { Download, LogOut, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [income, setIncome] = useState(user?.income_range || "50K-1L");
  const [risk, setRisk] = useState(user?.risk_appetite || "medium");
  const [lang, setLang] = useState(user?.language || "en");
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  async function save() {
    await updateProfile({ name, income_range: income as any, risk_appetite: risk as any, language: lang as any });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function exportData() {
    if (!user) return;
    const [transactions, goals, fds, chat_sessions] = await Promise.all([
      store.listTransactions(user.id),
      store.listGoals(user.id),
      store.listFDs(user.id),
      store.listChatSessions(user.id),
    ]);
    const data = { user, transactions, goals, fds, chat_sessions };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paise-export-${Date.now()}.json`;
    a.click();
  }

  async function deleteAccount() {
    if (!user) return;
    if (!confirm("Delete your account and all data? This cannot be undone.")) return;
    await store.deleteUser(user.id);
    await logout();
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile and data.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
          <div><Label>Email</Label><Input value={user.email} readOnly className="mt-1.5 opacity-60" /></div>
          <div>
            <Label>Monthly income</Label>
            <Select value={income} onValueChange={(v) => setIncome(v as any)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="<30K">Less than ₹30K</SelectItem>
                <SelectItem value="30K-50K">₹30K - ₹50K</SelectItem>
                <SelectItem value="50K-1L">₹50K - ₹1L</SelectItem>
                <SelectItem value="1L-2L">₹1L - ₹2L</SelectItem>
                <SelectItem value=">2L">Above ₹2L</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Risk appetite</Label>
            <Select value={risk} onValueChange={(v) => setRisk(v as any)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Language</Label>
            <Select value={lang} onValueChange={(v) => setLang(v as any)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={save}>{saved ? "Saved ✓" : "Save changes"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Plan</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">
              {user.credits > 0 ? <>Paise Pro <Badge className="ml-1">{user.credits}d left</Badge></> : "Free plan"}
            </div>
            <div className="text-xs text-muted-foreground">
              {user.credits > 0 ? "Unlimited AI chats" : "3 AI chats/day. Refer friends for Pro."}
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/referrals">Get Pro via referrals</a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Data & account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={exportData} variant="outline" className="w-full justify-start"><Download className="h-4 w-4" /> Export all my data (JSON)</Button>
          <Button onClick={() => { logout(); }} variant="outline" className="w-full justify-start"><LogOut className="h-4 w-4" /> Log out</Button>
          <Button onClick={deleteAccount} variant="destructive" className="w-full justify-start"><Trash2 className="h-4 w-4" /> Delete account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
