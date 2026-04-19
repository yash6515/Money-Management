"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  MessageSquare,
  Target,
  Users,
  Settings,
  LogOut,
  CircleDollarSign,
  Menu,
  X,
  Shield,
  Zap,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/fd-ladder", label: "FD Ladder", icon: TrendingUp },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/chat", label: "Coach Chat", icon: MessageSquare },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/referrals", label: "Referrals", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRequireAuth();
  const { logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="animate-pulse text-muted-foreground">Loading Paise…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile topbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-white/5 h-14 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <CircleDollarSign className="h-6 w-6 text-teal" />
          <span className="font-display font-bold">Paise</span>
        </Link>
        <button onClick={() => setOpen(!open)} className="p-2">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-30 h-screen w-64 shrink-0 glass border-r border-white/5 flex flex-col transition-transform",
          !open && "max-md:-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center gap-2 px-5 border-b border-white/5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-teal to-purple">
            <CircleDollarSign className="h-5 w-5 text-black" />
          </div>
          <div>
            <div className="font-display font-bold">Paise</div>
            <div className="text-[10px] text-muted-foreground">AI money coach</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "bg-teal/15 text-teal"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
          {user.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition mt-4",
                pathname.startsWith("/admin")
                  ? "bg-purple/15 text-purple"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          )}
        </nav>
        <div className="p-3 border-t border-white/5 space-y-2">
          {user.credits > 0 && (
            <div className="rounded-lg bg-teal/10 border border-teal/20 px-3 py-2">
              <div className="flex items-center gap-2 text-xs">
                <Zap className="h-3 w-3 text-teal" />
                <span className="font-medium">Paise Pro</span>
                <Badge className="ml-auto text-[10px]">{user.credits}d left</Badge>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal to-purple grid place-items-center text-xs font-bold text-black">
              {user.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
            </div>
            <button onClick={logout} className="p-1 text-muted-foreground hover:text-foreground" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setOpen(false)} />
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
