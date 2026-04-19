"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { store } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { ShieldCheck, Search } from "lucide-react";
import type { AdminLog } from "@/lib/types";

export default function AdminLogs() {
  const [q, setQ] = useState("");
  const [allLogs, setAllLogs] = useState<AdminLog[]>([]);
  useEffect(() => {
    (async () => setAllLogs(await store.listAdminLogs()))();
  }, []);
  const logs = useMemo(() => {
    return allLogs.filter((l) => !q || l.action.toLowerCase().includes(q.toLowerCase()) || l.admin_name.toLowerCase().includes(q.toLowerCase()));
  }, [q, allLogs]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl md:text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-purple" /> Audit Log
        </h1>
        <p className="text-xs text-muted-foreground">Immutable record of admin actions</p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Filter by action or admin…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-9" />
          </div>
          <div className="rounded-lg border border-white/5 overflow-hidden text-xs">
            <div className="grid grid-cols-[1fr_1fr_1.5fr_1fr_1.5fr] gap-3 px-3 py-2 bg-white/5 font-semibold uppercase tracking-wider text-muted-foreground">
              <span>When</span>
              <span>Admin</span>
              <span>Action</span>
              <span>Target</span>
              <span>Metadata</span>
            </div>
            <div className="max-h-[65vh] overflow-y-auto scrollbar-thin">
              {logs.length === 0 && (
                <div className="px-3 py-8 text-center text-muted-foreground text-xs">No logs match</div>
              )}
              {logs.map((l, i) => (
                <div key={l.id} className={`grid grid-cols-[1fr_1fr_1.5fr_1fr_1.5fr] gap-3 px-3 py-2 items-center ${i % 2 ? "bg-white/[0.02]" : ""}`}>
                  <span className="text-muted-foreground">{formatDate(l.created_at)}</span>
                  <span>{l.admin_name}</span>
                  <span><Badge variant="outline" className="text-[9px] font-mono">{l.action}</Badge></span>
                  <span className="font-mono text-[10px] truncate">{l.target_id || "—"}</span>
                  <span className="font-mono text-[10px] truncate text-muted-foreground">
                    {l.metadata ? JSON.stringify(l.metadata) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">Logs are append-only. No delete option by design.</p>
        </CardContent>
      </Card>
    </div>
  );
}
