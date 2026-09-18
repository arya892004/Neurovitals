import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useVitals } from "@/lib/health-data";
import {
  BASELINE_WINDOW,
  Z_THRESHOLD,
  buildInsights,
  formatDate,
  formatValue,
  relativeDay,
} from "@/lib/vitals";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({
    meta: [
      { title: "Insights · NeuroVitals" },
      {
        name: "description",
        content:
          "Explainable, historical insights: days where two or more of your metrics drifted from your personal baseline at once.",
      },
      { property: "og:title", content: "Insights · NeuroVitals" },
      {
        property: "og:description",
        content: "Deterministic z-score scoring, shown with its own working.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const { data: rows, isLoading } = useVitals();
  const [threshold, setThreshold] = useState(Z_THRESHOLD);

  if (isLoading) return <p className="py-16 text-sm text-muted-foreground">Reading your history…</p>;
  if (!rows?.length) return <p className="py-16 text-sm text-muted-foreground">Nothing yet.</p>;

  const insights = buildInsights(rows, threshold);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Insights</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Historical and informational. An insight appears only when two or more metrics drift past
          |z| &gt; {threshold.toFixed(1)} from your own {BASELINE_WINDOW}-day baseline on the same
          day.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="threshold">Sensitivity threshold</label>
          <span className="numeric text-muted-foreground">|z| &gt; {threshold.toFixed(1)}</span>
        </div>
        <input
          id="threshold"
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="mt-4 w-full accent-[var(--color-primary)]"
        />
      </div>

      {insights.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
          Nothing stands out across your recent history at this threshold. That is a normal result,
          not a clean bill of health.
        </div>
      ) : (
        <ul className="space-y-4">
          {insights.map((insight) => (
            <li
              key={insight.date}
              className="rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {relativeDay(insight.date)}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(insight.date)}</p>
              </div>

              <h2 className="mt-3 text-xl leading-snug">{insight.headline}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{insight.body}</p>

              <div className="mt-4 space-y-1.5 rounded-xl bg-surface p-4">
                {insight.deviations.map((d) => (
                  <div key={d.key} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{d.meta.label}</span>
                    <span className="numeric">
                      {formatValue(d.meta, d.value)} {d.meta.unit} · baseline{" "}
                      {formatValue(d.meta, d.baseline.mean)} · z {d.z.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
