import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, HeartPulse, Lightbulb, Ruler, LogOut } from "lucide-react";

const NAV = [
  { to: "/today", label: "Check-in", icon: HeartPulse },
  { to: "/vitals", label: "Vitals", icon: Activity },
  { to: "/insights", label: "Insights", icon: Lightbulb },
  { to: "/baseline", label: "Baseline", icon: Ruler },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <Link to="/today" className="font-display text-xl tracking-tight">
            NeuroVitals
          </Link>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-28 pt-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-stretch">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-1 px-2 py-3 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <Icon className="size-[18px]" strokeWidth={1.6} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
