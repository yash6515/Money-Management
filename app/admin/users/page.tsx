"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { store } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Search, Download, Ban, UserCog, Trash2, Gift } from "lucide-react";
import { formatDate, formatINR } from "@/lib/utils";
import type { User } from "@/lib/types";

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [q, setQ] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState<User | null>(null);
  const [grantDays, setGrantDays] = useState(30);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [counts, setCounts] = useState<{ txns: number; goals: number; fds: number; refs: number }>({ txns: 0, goals: 0, fds: 0, refs: 0 });

  useEffect(() => {
    (async () => setAllUsers(await store.listUsers()))();
  }, [refresh]);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const [t, g, f, r] = await Promise.all([
        store.listTransactions(selected.id),
        store.listGoals(selected.id),
        store.listFDs(selected.id),
        store.listReferralsBy(selected.id),
      ]);
      setCounts({ txns: t.length, goals: g.length, fds: f.length, refs: r.length });
    })();
  }, [selected]);

  const users = useMemo(() => {
    return allUsers.filter(
      (u) =>
        !q ||
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase()) ||
        u.referral_code.toLowerCase().includes(q.toLowerCase())
    );
  }, [q, allUsers]);

  async function logAction(action: string, target_id: string, metadata?: any) {
    if (!me) return;
    await store.addAdminLog({ admin_id: me.id, admin_name: me.name, action, target_id, metadata });
  }

  async function grantCredits() {
    if (!selected) return;
    await store.updateUser(selected.id, { credits: selected.credits + grantDays });
    await logAction("grant_credits", selected.id, { amount: grantDays });
    setRefresh((x) => x + 1);
    setSelected({ ...selected, credits: selected.credits + grantDays });
  }

  async function toggleSuspend() {
    if (!selected) return;
    const val = !selected.suspended;
    await store.updateUser(selected.id, { suspended: val });
    await logAction(val ? "suspend_user" : "unsuspend_user", selected.id);
    setSelected({ ...selected, suspended: val });
    setRefresh((x) => x + 1);
  }

  async function promoteAdmin() {
    if (!selected) return;
    const role = selected.role === "admin" ? "user" : "admin";
    await store.updateUser(selected.id, { role });
    await logAction("change_role", selected.id, { role });
    setSelected({ ...selected, role });
    setRefresh((x) => x + 1);
  }

  async function deleteUser() {
    if (!selected) return;
    if (!confirm(`Delete ${selected.name}? This cannot be undone.`)) return;
    await store.deleteUser(selected.id);
    await logAction("delete_user", selected.id, { email: selected.email });
    setSelected(null);
    setRefresh((x) => x + 1);
  }

  function exportCSV() {
    const header = "id,name,email,income,risk,role,credits,referral_code,created_at";
    const rows = users.map((u) =>
      [u.id, u.name, u.email, u.income_range, u.risk_appetite, u.role, u.credits, u.referral_code, u.created_at].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paise-users-${Date.now()}.csv`;
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold">Users</h1>
          <p className="text-xs text-muted-foreground">{users.length} total</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportCSV}><Download className="h-3.5 w-3.5" /> Export CSV</Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search name, email, referral code…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-9" />
          </div>
          <div className="rounded-lg border border-white/5 overflow-hidden text-xs">
            <div className="grid grid-cols-[1.5fr_2fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-3 px-3 py-2 bg-white/5 font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Name</span>
              <span>Email</span>
              <span>Code</span>
              <span>Income</span>
              <span>Credits</span>
              <span>Role</span>
              <span>Joined</span>
            </div>
            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
              {users.map((u, i) => (
                <button
                  key={u.id}
                  onClick={() => { setSelected(u); setGrantDays(30); }}
                  className={`w-full grid grid-cols-[1.5fr_2fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-3 px-3 py-2 items-center text-left hover:bg-white/5 ${i % 2 ? "bg-white/[0.02]" : ""}`}
                >
                  <span className="truncate flex items-center gap-1">
                    {u.name}
                    {u.suspended && <Badge variant="destructive" className="text-[9px]">susp</Badge>}
                  </span>
                  <span className="truncate text-muted-foreground">{u.email}</span>
                  <span className="font-mono text-[10px]">{u.referral_code}</span>
                  <span>{u.income_range}</span>
                  <span className={u.credits > 0 ? "text-teal" : ""}>{u.credits}d</span>
                  <span>{u.role === "admin" ? <Badge variant="secondary" className="text-[9px]">admin</Badge> : "user"}</span>
                  <span className="text-muted-foreground">{formatDate(u.created_at)}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>{selected.email} · {selected.referral_code}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <Stat label="Role" val={selected.role} />
                <Stat label="Income" val={selected.income_range} />
                <Stat label="Risk" val={selected.risk_appetite} />
                <Stat label="Credits" val={`${selected.credits}d`} />
                <Stat label="Transactions" val={String(counts.txns)} />
                <Stat label="Goals" val={String(counts.goals)} />
                <Stat label="FDs" val={String(counts.fds)} />
                <Stat label="Referred" val={String(counts.refs)} />
              </div>

              <div className="grid gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={grantDays}
                    onChange={(e) => setGrantDays(Number(e.target.value))}
                    className="w-24 h-9"
                  />
                  <Button size="sm" onClick={grantCredits}><Gift className="h-3.5 w-3.5" /> Grant credits (days)</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={promoteAdmin}>
                    <UserCog className="h-3.5 w-3.5" /> {selected.role === "admin" ? "Demote" : "Make admin"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={toggleSuspend}>
                    <Ban className="h-3.5 w-3.5" /> {selected.suspended ? "Unsuspend" : "Suspend"}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={deleteUser}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete account
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, val }: { label: string; val: string }) {
  return (
    <div className="rounded-md bg-white/5 p-2">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5 capitalize">{val}</div>
    </div>
  );
}
