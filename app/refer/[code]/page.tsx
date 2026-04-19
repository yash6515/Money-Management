"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { store } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign, Gift, Sparkles, ArrowRight } from "lucide-react";
import type { User } from "@/lib/types";

export default function ReferLanding() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const [referrer, setReferrer] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      const u = await store.getUserByCode(code);
      if (u) setReferrer(u);
    })();
  }, [code]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 opacity-40">
        <div className="absolute top-20 left-1/4 h-96 w-96 rounded-full bg-teal/20 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 h-80 w-80 rounded-full bg-purple/20 blur-3xl" />
      </div>
      <div className="w-full max-w-xl animate-fade-in">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal to-purple">
            <CircleDollarSign className="h-6 w-6 text-black" />
          </div>
          <span className="font-display text-2xl font-bold">Paise</span>
        </Link>
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-teal/20 via-purple/20 to-teal/20 p-8 text-center border-b border-white/10">
            <Badge className="mb-4"><Sparkles className="h-3 w-3 mr-1" /> Friend invite</Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              {referrer ? (
                <><span className="gradient-text">{referrer.name.split(" ")[0]}</span> invited you to smarter money management</>
              ) : (
                <>You've been invited to <span className="gradient-text">Paise</span></>
              )}
            </h1>
            <p className="mt-3 text-muted-foreground">
              Sign up via this link and both of you unlock Paise Pro — for free.
            </p>
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-teal/30 bg-teal/10 p-4 text-center">
                <Gift className="h-6 w-6 text-teal mx-auto mb-2" />
                <div className="text-xs text-muted-foreground">You get</div>
                <div className="font-display text-xl font-bold">14 days Pro</div>
                <div className="text-[10px] text-muted-foreground">Unlimited AI chats</div>
              </div>
              <div className="rounded-xl border border-purple/30 bg-purple/10 p-4 text-center">
                <Gift className="h-6 w-6 text-purple mx-auto mb-2" />
                <div className="text-xs text-muted-foreground">{referrer?.name.split(" ")[0] || "They"} get{referrer ? "s" : ""}</div>
                <div className="font-display text-xl font-bold">30 days Pro</div>
                <div className="text-[10px] text-muted-foreground">On your signup</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">With Paise Pro you unlock:</p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Unlimited AI chats with Paise Coach</li>
                <li>AI-optimised FD ladders across 15+ banks</li>
                <li>Smart expense categorisation</li>
                <li>Goal-based What-If simulator</li>
              </ul>
            </div>
            <Button asChild size="lg" className="w-full">
              <Link href={`/signup?ref=${code}`}>
                Claim your 14 days Pro <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              By signing up you agree to verify your email & phone before the reward activates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
