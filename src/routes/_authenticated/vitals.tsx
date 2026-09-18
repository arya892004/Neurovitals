import { createFileRoute } from "@tanstack/react-router";
import { Sparkline } from "@/components/Sparkline";
import { useVitals } from "@/lib/health-data";
import {
  BASELINE_WINDOW,
  CALIBRATION_DAYS,
  METRICS,
  evaluateDay,
  formatDate,
  formatValue,
} from "@/lib/vitals";

export const Route = createFileRoute("/_authenticated/vitals")({
  head: () => ({
    meta: [
      { title: "Vitals · NeuroVitals" },
      {
        name: "description",
        content:
          "Resting heart rate, heart rate variability, sleep and activity, each compared with your own rolling 14-day baseline.",
      },
      { property: "og:title", content: "Vitals · NeuroVitals" },
      {
        property: "og:description",
        content: "Every number is read against your own history, not a population average.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VitalsPage,
});

function VitalsPage() {
  const { data: rows, isLoading, error } = useVitals();

  if (isLoading) return <p className="py-16 text-sm text-muted-foreground">Loading your history…</p>;
  if (error || !rows?.length)
    return <p className="py-16 text-sm text-muted-foreground">No vitals history yet.</p>;

  const last = rows.length - 1;
  const evaluated = evaluateDay(rows, last);
  const calibrating = rows.length < CALIBRATION_DAYS;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {formatDate(rows[last]!.entry_date)}
        </p>
        <h1 className="mt-2 text-3xl">Your vitals</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Compared against your own rolling {BASELINE_WINDOW}-day average — synthetic history for
          this prototype.
        </p>
      </div>

      {calibrating && (
        <div className="rounded-2xl border border-border bg-accent/40 p-5 text-sm text-accent-foreground">
          Still calibrating: {rows.length} of {CALIBRATION_DAYS} days collected.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {METRICS.map((meta) => {
          const d = evaluated.find((e) => e.key === meta.key)!;
          const series = rows.slice(-BASELINE_WINDOW).map((r) => Number(r[meta.key]));
          const sign = d.delta >= 0 ? "+" : "−";
          return (
            <div
              key={meta.key}
              className="rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-muted-foreground">{meta.label}</span>
                {d.flagged && (
                  <span className="rounded-full bg-notice px-2.5 py-1 text-[10px] uppercase tracking-wider text-notice-foreground">
                    Unusual for you
                  </span>
                )}
              </div>

              <p className="numeric mt-3 text-3xl">
                {formatValue(meta, d.value)}
                <span className="ml-1.5 text-sm text-muted-foreground">{meta.unit}</span>
              </p>

              <Sparkline values={series} className="mt-3" width={200} height={38} />

              <p className="numeric mt-3 text-xs text-muted-foreground">
                {sign}
                {formatValue(meta, Math.abs(d.delta))} {meta.unit} vs your {BASELINE_WINDOW}-day
                average · z {d.z.toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>

      <p className="pt-2 text-xs leading-relaxed text-muted-foreground">
        Flags are statistical, not clinical. NeuroVitals is not a diagnosis.
      </p>
    </div>
  );
}
