"use client";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { CircleDollarSign, Gift, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function SignupInner() {
  const { loginWithEmail, loginAsGuest, updateProfile } = useAuth();
  const search = useSearchParams();
  const referredBy = search.get("ref") || undefined;
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [income, setIncome] = useState("50K-1L");
  const [risk, setRisk] = useState("medium");
  const [lang, setLang] = useState("en");
  const [sent, setSent] = useState(false);

  async function begin() {
    if (!email || !name) return;
    const u = await loginWithEmail(email, name, referredBy);
    if (u === null) {
      setSent(true);
      return;
    }
    setStep(2);
  }

  async function finish() {
    await updateProfile({
      income_range: income as any,
      risk_appetite: risk as any,
      language: lang as any,
    });
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 opacity-40">
        <div className="absolute top-20 right-1/4 h-72 w-72 rounded-full bg-purple/20 blur-3xl" />
        <div className="absolute bottom-20 left-1/4 h-72 w-72 rounded-full bg-teal/20 blur-3xl" />
      </div>
      <div className="w-full max-w-md animate-fade-in">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal to-purple">
            <CircleDollarSign className="h-6 w-6 text-black" />
          </div>
          <span className="font-display text-2xl font-bold">Paise</span>
        </Link>

        {referredBy && (
          <div className="mb-4 rounded-lg border border-teal/30 bg-teal/10 p-3 flex items-center gap-3">
            <Gift className="h-4 w-4 text-teal" />
            <div className="text-sm">
              <div className="font-medium">Invited by <span className="text-teal">{referredBy}</span></div>
              <div className="text-xs text-muted-foreground">You get 14 days of Paise Pro free on signup</div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{step === 1 ? "Create account" : "One last thing"}</CardTitle>
            <CardDescription>
              {step === 1
                ? "Start managing your money smarter in 60 seconds"
                : "Help us personalise your experience"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sent ? (
              <div className="rounded-lg border border-teal/30 bg-teal/10 p-4 text-sm">
                Check your email for the magic link to finish signing up.
              </div>
            ) : step === 1 ? (
              <>
                <div>
                  <Label>Full name</Label>
                  <Input placeholder="Raj Sharma" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
                </div>
                <Button className="w-full" onClick={begin} disabled={!email || !name}>Continue</Button>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
                </div>
                <Button variant="secondary" className="w-full" onClick={loginAsGuest}>
                  <Zap className="h-4 w-4" /> Skip & try as Guest
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label>Monthly take-home</Label>
                  <Select value={income} onValueChange={setIncome}>
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
                  <Select value={risk} onValueChange={setRisk}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low — FD, PPF, safety first</SelectItem>
                      <SelectItem value="medium">Medium — Mix of FD, SIP, PPF</SelectItem>
                      <SelectItem value="high">High — Equity-heavy, long horizon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Preferred language</Label>
                  <Select value={lang} onValueChange={setLang}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={finish}>Finish & enter Paise</Button>
              </>
            )}
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="text-teal hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupInner />
    </Suspense>
  );
}
