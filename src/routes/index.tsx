import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeuroVitals — your own baseline, not a generic normal" },
      {
        name: "description",
        content:
          "NeuroVitals compares today's energy, stress, sleep and vitals against your own rolling personal baseline, so you notice what is unusual for you.",
      },
      { property: "og:title", content: "NeuroVitals — your own baseline, not a generic normal" },
      {
        property: "og:description",
        content:
          "A calm personal health dashboard that learns your normal and quietly flags what drifts from it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const POINTS = [
  {
    title: "Your normal, measured",
    body: "Every metric is scored against your own rolling mean and spread over the last 30 days.",
  },
  {
    title: "A quiet calibration period",
    body: "The first 14 days simply collect data. No insights, no nudges, no false alarms.",
  },
  {
    title: "Deviations, not diagnoses",
    body: "Insights describe how far today sits from your usual — never what it means medically.",
  },
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setSignedIn(Boolean(session)),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <span className="font-display text-xl tracking-tight">NeuroVitals</span>
        <Link
          to={signedIn ? "/today" : "/auth"}
          className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {signedIn ? "Open dashboard" : "Sign in"}
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24">
        <section className="pt-12 sm:pt-20">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Personal baseline tracking
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight sm:text-6xl">
            What's unusual for you — not for everyone else.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            NeuroVitals learns your own rhythm of energy, stress, sleep and resting vitals, then
            gently points out the days that drift away from it.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to={signedIn ? "/today" : "/auth"}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {signedIn ? "Go to today's check-in" : "Start your baseline"}
            </Link>
            <Link
              to={signedIn ? "/baseline" : "/auth"}
              className="rounded-xl border border-input bg-card px-5 py-3 text-sm transition-colors hover:bg-muted"
            >
              See how it works
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {POINTS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-display text-lg">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </section>

        <p className="mt-14 text-xs leading-relaxed text-muted-foreground">
          NeuroVitals is a personal reflection tool, not a medical device. Vitals in this prototype
          are synthetic — no wearable is connected.
        </p>
      </main>
    </div>
  );
}
