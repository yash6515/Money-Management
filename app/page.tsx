"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Wallet,
  MessageSquare,
  Target,
  Shield,
  Zap,
  Globe,
  CircleDollarSign,
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "AI FD Ladder Builder",
    desc: "Compare 15+ Indian banks. Claude AI builds you an optimised multi-FD split with 1-2% higher blended yield than sticking with one bank.",
    tag: "Hero feature",
  },
  {
    icon: Wallet,
    title: "Smart Expense Tracker",
    desc: "Upload HDFC, ICICI, Paytm or PhonePe statements. AI categorises every transaction and gives you insights tuned to your income.",
    tag: "CSV + PDF",
  },
  {
    icon: MessageSquare,
    title: "Paise Coach Chatbot",
    desc: "Chat with an AI finance expert trained on Indian instruments — FDs, SIPs, PPF, ELSS, 80C, NPS. English or Hindi.",
    tag: "Claude Sonnet 4.5",
  },
  {
    icon: Target,
    title: "Goals + What-If Simulator",
    desc: "Set goals. Slide through scenarios — cut Swiggy by 30%, bump SIP by ₹5K, prepay your loan — and see the compound effect.",
    tag: "Interactive",
  },
];

export default function Landing() {
  const { loginAsGuest, user } = useAuth();
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-teal to-purple">
              <CircleDollarSign className="h-5 w-5 text-black" />
            </div>
            <span className="font-display text-xl font-bold">Paise</span>
            <Badge variant="outline" className="hidden sm:inline-flex text-xs">beta</Badge>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/about" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground px-3">About</Link>
            {user ? (
              <Button asChild size="sm"><Link href={user.role === "admin" ? "/admin" : "/dashboard"}>Open app <ArrowRight className="h-4 w-4" /></Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link href="/login">Sign in</Link></Button>
                <Button asChild size="sm"><Link href="/signup">Get started</Link></Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container pt-16 pb-20 md:pt-28 md:pb-28">
        <div className="mx-auto max-w-4xl text-center animate-fade-in">
          <Badge className="mb-6"><Sparkles className="h-3 w-3 mr-1" /> AI-powered personal finance · Built for India</Badge>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight tracking-tight">
            Your <span className="gradient-text">AI money coach.</span><br />Apna paisa, apni taraf.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Build smarter FD ladders, track every rupee, chat with a finance coach, and plan real goals — all in one app.
            Powered by Claude AI. Hindi + English. Mobile-first.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={loginAsGuest} className="group">
              <Zap className="h-4 w-4" /> Try instantly as Guest
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/signup">Create free account</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Guest mode loads a pre-seeded demo account. No signup needed.
          </p>
        </div>

        {/* Stats strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { k: "15+", v: "Indian banks" },
            { k: "up to 8.75%", v: "FD rates tracked" },
            { k: "EN + HI", v: "Languages" },
            { k: "< 2 min", v: "From signup to insight" },
          ].map((s) => (
            <Card key={s.v} className="text-center">
              <CardContent className="py-4">
                <div className="font-display text-2xl font-bold gradient-text">{s.k}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.v}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Four tools. One money brain.</h2>
          <p className="mt-4 text-muted-foreground">Every feature uses your profile — income, goals, risk appetite — to give advice that actually fits your life.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="group hover:border-teal/30 transition">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal/10 text-teal group-hover:bg-teal/20 transition">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                        <Badge variant="outline" className="text-[10px]">{f.tag}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Trust */}
      <section className="container py-16">
        <Card className="overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div>
                <Badge variant="secondary" className="mb-3">For Blostem hackathon</Badge>
                <h3 className="font-display text-2xl font-bold">Infra-grade personal finance, opinionated for India</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  Paise is designed to sit on top of Blostem's FD booking infrastructure. Once a user finalises a ladder, they're handed off to partnered banks via Blostem's API. Users win; distribution partners win.
                </p>
              </div>
              <div className="grid gap-3">
                {[
                  { icon: Shield, t: "Row-level security", d: "Users only see their own data" },
                  { icon: Globe, t: "Hindi + English", d: "Language toggle everywhere AI speaks" },
                  { icon: Zap, t: "Real AI", d: "Claude Sonnet 4.5 under the hood" },
                ].map((i) => {
                  const Icon = i.icon;
                  return (
                    <div key={i.t} className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-teal shrink-0" />
                      <div>
                        <div className="text-sm font-medium">{i.t}</div>
                        <div className="text-xs text-muted-foreground">{i.d}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-center md:text-right">
                <Button size="lg" onClick={loginAsGuest} className="w-full md:w-auto">
                  Explore as Guest <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Preloaded with Raj Sharma's demo data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-white/5 py-8">
        <div className="container text-center text-xs text-muted-foreground">
          © 2026 Paise · Built in 3 days · Not a SEBI registered advisor
        </div>
      </footer>
    </div>
  );
}
