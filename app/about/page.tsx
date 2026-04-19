import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CircleDollarSign } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen">
      <nav className="glass border-b border-white/5">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <CircleDollarSign className="h-6 w-6 text-teal" />
            <span className="font-display text-xl font-bold">Paise</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
        </div>
      </nav>
      <main className="container max-w-3xl py-16">
        <h1 className="font-display text-4xl font-bold">About Paise</h1>
        <p className="mt-4 text-muted-foreground">
          Paise is a personal finance platform built for young India — people who earn between ₹30K and ₹2L a month, UPI daily, and feel that their bank's app was designed in 2008.
        </p>
        <div className="mt-10 grid gap-4">
          {[
            { t: "The problem", d: "Most Indian finance apps are brokerage-first. They push you stocks or MFs. They never help you build a disciplined money foundation — emergency fund, goal FD ladder, tax-smart SIPs — in one place. And none speak Hindi well." },
            { t: "The wedge", d: "FD ladders. Boring. Low-risk. But math that compounds. If Paise can save a user 1.5% of blended yield on a ₹5L portfolio, that's ₹7,500/year — more than the app costs to run for a decade." },
            { t: "The moat", d: "AI-native onboarding plus Hindi-first UX. Every chat, insight, and ladder explanation runs through Claude, personalised with the user's profile. Competitors treat AI as a sidebar; for us it's the operating system." },
            { t: "The business", d: "Freemium. Free: basic ladders, 3 AI chats/day, expense tracking. Pro (₹199/mo or unlock via referrals): unlimited AI, portfolio tracking, priority support. Distribution partnership with Blostem for FD booking." },
          ].map((s) => (
            <Card key={s.t}>
              <CardContent className="py-6">
                <h3 className="font-display text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
