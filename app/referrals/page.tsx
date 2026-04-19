"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { store } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import type { Referral, User } from "@/lib/types";
import {
  Gift,
  Users,
  Copy,
  Check,
  Trophy,
  Share2,
  MessageCircle,
  Twitter,
  Linkedin,
  Zap,
} from "lucide-react";

export default function ReferralsPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const [refs, setRefs] = useState<Referral[]>([]);
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());
  useEffect(() => {
    if (!user) return;
    (async () => {
      const r = await store.listReferralsBy(user.id);
      setRefs(r);
      const ids = Array.from(new Set(r.map((x) => x.referred_id)));
      const users = await Promise.all(ids.map((id) => store.getUser(id)));
      const m = new Map<string, User>();
      users.forEach((u) => { if (u) m.set(u.id, u); });
      setUserMap(m);
    })();
  }, [user]);

  const data = useMemo(() => {
    if (!user) return null;
    const approved = refs.filter((r) => r.status === "approved").length;
    const pending = refs.filter((r) => r.status === "pending").length;
    const voided = refs.filter((r) => r.status === "voided").length;
    const credits = approved * 30;
    return { refs, approved, pending, voided, credits };
  }, [user, refs]);

  if (!user || !data) return null;

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/refer/${user.referral_code}`
      : `https://paise.app/refer/${user.referral_code}`;

  const msgEN = `I've been using Paise — an AI money coach for India. Built smart FD ladders and tracks every rupee in English + Hindi. Try it free + get 14 days of Pro: ${link}`;
  const msgHI = `Paise app try करो — AI से बना smart FD ladder, expense tracking हिन्दी में भी। मेरे link से 14 दिन Pro free: ${link}`;

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function share(platform: "whatsapp" | "twitter" | "linkedin" | "native") {
    if (!user) return;
    const msg = encodeURIComponent(msgEN);
    if (platform === "whatsapp") window.open(`https://wa.me/?text=${msg}`);
    else if (platform === "twitter") window.open(`https://twitter.com/intent/tweet?text=${msg}`);
    else if (platform === "linkedin") window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`);
    else if (platform === "native" && navigator.share) navigator.share({ title: "Paise", text: msgEN, url: link });
    store.track("referral_sent", user.id, { platform });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Refer & earn Pro</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Each friend who joins gives you 30 days of Paise Pro. They get 14 days.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/referrals/leaderboard"><Trophy className="h-4 w-4" /> Leaderboard</Link>
        </Button>
      </div>

      {/* Hero card */}
      <Card className="overflow-hidden border-teal/30">
        <div className="bg-gradient-to-r from-teal/15 via-purple/10 to-teal/15 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-5 w-5 text-teal" />
            <span className="text-sm font-medium">Your referral link</span>
          </div>
          <div className="flex items-center gap-2 mt-3 max-w-xl">
            <Input readOnly value={link} className="font-mono text-sm bg-black/30" />
            <Button onClick={copy} size="sm">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => share("whatsapp")} variant="outline" size="sm">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
            <Button onClick={() => share("twitter")} variant="outline" size="sm">
              <Twitter className="h-4 w-4" /> Twitter/X
            </Button>
            <Button onClick={() => share("linkedin")} variant="outline" size="sm">
              <Linkedin className="h-4 w-4" /> LinkedIn
            </Button>
            <Button onClick={() => share("native")} variant="outline" size="sm">
              <Share2 className="h-4 w-4" /> More
            </Button>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Your code: <span className="font-mono text-teal">{user.referral_code}</span>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total sent" val={String(data.refs.length)} icon={<Share2 className="h-4 w-4" />} />
        <StatCard label="Successful" val={String(data.approved)} color="text-emerald-400" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Pending" val={String(data.pending)} color="text-yellow-400" icon={<Zap className="h-4 w-4" />} />
        <StatCard label="Pro days earned" val={`${data.credits}d`} color="text-teal" icon={<Gift className="h-4 w-4" />} />
      </div>

      {/* Pre-filled messages */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">English share message</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg bg-white/5 p-3 text-sm whitespace-pre-wrap">{msgEN}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Hindi (हिन्दी) share message</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg bg-white/5 p-3 text-sm whitespace-pre-wrap">{msgHI}</div>
          </CardContent>
        </Card>
      </div>

      {/* Referral tree */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your referrals</CardTitle>
          <CardDescription>Who you've invited and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {data.refs.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No referrals yet. Share your link above to start earning.
            </div>
          ) : (
            <div className="space-y-2">
              {data.refs.map((r) => {
                const referred = userMap.get(r.referred_id);
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <div className="text-sm font-medium">{referred?.name || r.referred_email || "Unknown"}</div>
                      <div className="text-[10px] text-muted-foreground">{formatDate(r.created_at)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.reward_given && <Badge className="text-[10px]"><Gift className="h-2.5 w-2.5 mr-0.5" /> +30d</Badge>}
                      <Badge variant={r.status === "approved" ? "success" : r.status === "pending" ? "warning" : "destructive"} className="text-[10px] capitalize">
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Anti-abuse: max 50 successful referrals/user. Referred users must verify email + phone. Suspicious signups (same IP/device, disposable email) are flagged for admin review.
      </p>
    </div>
  );
}

function StatCard({ label, val, color, icon }: { label: string; val: string; color?: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          {icon} {label}
        </div>
        <div className={`font-display text-2xl font-bold mt-1 ${color || ""}`}>{val}</div>
      </CardContent>
    </Card>
  );
}
