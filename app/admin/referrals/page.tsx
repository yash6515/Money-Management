"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { store } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { Check, X, Flag } from "lucide-react";
import type { Referral, User } from "@/lib/types";

export default function AdminReferrals() {
  const { user: me } = useAuth();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "voided" | "flagged">("all");
  const [refresh, setRefresh] = useState(0);
  const [allRefs, setAllRefs] = useState<Referral[]>([]);
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    (async () => {
      const [refs, users] = await Promise.all([store.listReferrals(), store.listUsers()]);
      setAllRefs(refs);
      setUserMap(new Map(users.map((u) => [u.id, u])));
    })();
  }, [refresh]);

  const refs = useMemo(() => {
    return allRefs
      .filter((r) => {
        if (filter === "flagged") return r.flagged;
        if (filter === "all") return true;
        return r.status === filter;
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [filter, allRefs]);

  async function log(action: string, id: string, meta?: any) {
    if (me) await store.addAdminLog({ admin_id: me.id, admin_name: me.name, action, target_id: id, metadata: meta });
  }

  async function approve(id: string) {
    await store.updateReferral(id, { status: "approved", reward_given: true });
    await log("approve_referral", id);
    setRefresh((x) => x + 1);
  }

  async function voidRef(id: string) {
    await store.updateReferral(id, { status: "voided", reward_given: false });
    await log("void_referral", id, { reason: "manual void by admin" });
    setRefresh((x) => x + 1);
  }

  const counts = useMemo(() => {
    return {
      total: allRefs.length,
      pending: allRefs.filter((r) => r.status === "pending").length,
      approved: allRefs.filter((r) => r.status === "approved").length,
      flagged: allRefs.filter((r) => r.flagged).length,
    };
  }, [allRefs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold">Referrals</h1>
          <p className="text-xs text-muted-foreground">Moderate referrals and flag suspicious signups</p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({counts.total})</SelectItem>
            <SelectItem value="pending">Pending ({counts.pending})</SelectItem>
            <SelectItem value="approved">Approved ({counts.approved})</SelectItem>
            <SelectItem value="flagged">Flagged ({counts.flagged})</SelectItem>
            <SelectItem value="voided">Voided</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="rounded-lg border border-white/5 overflow-hidden text-xs">
            <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr] gap-3 px-3 py-2 bg-white/5 font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Referrer</span>
              <span>Referred</span>
              <span>Date</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            <div className="max-h-[65vh] overflow-y-auto scrollbar-thin">
              {refs.map((r, i) => {
                const referrer = userMap.get(r.referrer_id);
                const referred = userMap.get(r.referred_id);
                return (
                  <div
                    key={r.id}
                    className={`grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr] gap-3 px-3 py-2.5 items-center ${i % 2 ? "bg-white/[0.02]" : ""} ${r.flagged ? "bg-yellow-500/5" : ""}`}
                  >
                    <span className="truncate">
                      {referrer?.name || "Unknown"}
                      <span className="text-muted-foreground ml-1">({referrer?.referral_code})</span>
                    </span>
                    <span className="truncate flex items-center gap-1">
                      {referred?.name || r.referred_email || "—"}
                      {r.flagged && <Flag className="h-3 w-3 text-yellow-400" />}
                    </span>
                    <span className="text-muted-foreground">{formatDate(r.created_at)}</span>
                    <span>
                      <Badge
                        variant={r.status === "approved" ? "success" : r.status === "pending" ? "warning" : "destructive"}
                        className="text-[9px] capitalize"
                      >
                        {r.status}
                      </Badge>
                    </span>
                    <span className="flex gap-1">
                      {r.status !== "approved" && (
                        <Button size="sm" variant="outline" onClick={() => approve(r.id)} className="h-7 text-[10px]">
                          <Check className="h-3 w-3" /> Approve
                        </Button>
                      )}
                      {r.status !== "voided" && (
                        <Button size="sm" variant="destructive" onClick={() => voidRef(r.id)} className="h-7 text-[10px]">
                          <X className="h-3 w-3" /> Void
                        </Button>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
