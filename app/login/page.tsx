"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { CircleDollarSign, Mail, Phone, Zap, Shield } from "lucide-react";

export default function LoginPage() {
  const { loginWithEmail, loginAsGuest, loginAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"email" | "otp">("email");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  function sendOtp() {
    if (method === "email" && !email) return;
    if (method === "phone" && !phone) return;
    setStage("otp");
  }

  async function verify() {
    if (otp.length < 4) return;
    const result = await loginWithEmail(method === "email" ? email : `${phone}@phone.paise.app`);
    if (result === null) setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 opacity-40">
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-teal/20 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 h-72 w-72 rounded-full bg-purple/20 blur-3xl" />
      </div>
      <div className="w-full max-w-md animate-fade-in">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal to-purple">
            <CircleDollarSign className="h-6 w-6 text-black" />
          </div>
          <span className="font-display text-2xl font-bold">Paise</span>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to your money coach</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sent ? (
              <div className="rounded-lg border border-teal/30 bg-teal/10 p-4 text-sm">
                Check your email for the magic link to sign in.
              </div>
            ) : stage === "email" ? (
              <>
                <div className="flex gap-2 rounded-lg bg-muted p-1">
                  <button
                    onClick={() => setMethod("email")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm transition ${method === "email" ? "bg-teal text-black" : "text-muted-foreground"}`}
                  >
                    <Mail className="h-4 w-4" /> Email
                  </button>
                  <button
                    onClick={() => setMethod("phone")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm transition ${method === "phone" ? "bg-teal text-black" : "text-muted-foreground"}`}
                  >
                    <Phone className="h-4 w-4" /> Phone
                  </button>
                </div>
                {method === "email" ? (
                  <div>
                    <Label>Email</Label>
                    <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" />
                  </div>
                ) : (
                  <div>
                    <Label>Phone</Label>
                    <Input type="tel" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
                  </div>
                )}
                <Button className="w-full" onClick={sendOtp}>Send OTP</Button>
                <Button variant="outline" className="w-full" onClick={async () => {
                  const r = await loginWithEmail("google@demo.paise.app", "Google User");
                  if (r === null) setSent(true);
                }}>
                  Continue with Google
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label>Enter OTP (any 4 digits in demo mode)</Label>
                  <Input type="text" placeholder="1234" value={otp} onChange={(e) => setOtp(e.target.value)} className="mt-1.5 text-center tracking-widest text-lg" maxLength={6} />
                </div>
                <Button className="w-full" onClick={verify}>Verify & continue</Button>
                <Button variant="ghost" className="w-full" onClick={() => setStage("email")}>Back</Button>
              </>
            )}

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>

            <Button variant="secondary" className="w-full" onClick={loginAsGuest}>
              <Zap className="h-4 w-4" /> Try as Guest (demo data)
            </Button>
            <Button variant="ghost" className="w-full text-xs" onClick={loginAdmin}>
              <Shield className="h-4 w-4" /> Demo admin login
            </Button>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No account? <Link href="/signup" className="text-teal hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
