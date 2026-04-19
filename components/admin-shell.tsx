"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileEdit,
  Gift,
  Zap,
  Flag,
  ClipboardList,
  CircleDollarSign,
  LogOut,
  ArrowLeft,
} from "lucide-react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/content", label: "Content", icon: FileEdit },
  { href: "/admin/referrals", label: "Referrals", icon: Gift },
  { href: "/admin/ai-usage", label: "AI Usage", icon: Zap },
  { href: "/admin/features", label: "Feature Flags", icon: Flag },
  { href: "/admin/logs", label: "Audit Log", icon: ClipboardList },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRequireAuth({ admin: true });
  const { logout } = useAuth();
  const pathname = usePathname();

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center"><div className="animate-pulse text-muted-foreground">Loading…</div></div>;
  }

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex sticky top-0 z-30 h-screen w-56 shrink-0 bg-card/40 border-r border-white/5 flex-col">
        <div className="h-14 flex items-center gap-2 px-4 border-b border-white/5">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-purple">
            <CircleDollarSign className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-sm">Paise Admin</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">v1.0</div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-thin">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs transition",
                  active ? "bg-purple/20 text-purple font-medium" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-white/5 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to app
          </Link>
          <button onClick={logout} className="w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5">
            <LogOut className="h-3.5 w-3.5" /> Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* Mobile nav */}
        <div className="md:hidden border-b border-white/5 p-3 flex gap-2 overflow-x-auto scrollbar-thin">
          {nav.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "shrink-0 px-3 py-1.5 text-xs rounded-md",
                  active ? "bg-purple/20 text-purple" : "bg-white/5 text-muted-foreground"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
