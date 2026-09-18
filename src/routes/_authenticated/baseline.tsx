import { createFileRoute } from "@tanstack/react-router";
import { useVitals } from "@/lib/health-data";
import { BASELINE_WINDOW, METRICS, baselineAt, formatValue } from "@/lib/vitals";

export const Route = createFileRoute("/_authenticated/baseline")({
  head: () => ({
    meta: [
      { title: "How NeuroVitals sees you · Baseline" },
      {
        name: "description",
        content:
          "Your personal ranges for heart rate, HRV, sleep and activity, side by side with the generic ranges a typical health app would show.",
      },
      { property: "og:title", content: "How NeuroVitals sees you" },
      {
        property: "og:description",
        content: "Your own ranges, next to the population averages they replace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BaselinePage,
});

function BaselinePage() {
  const { data: rows, isLoading } = useVitals();

  if (isLoading) return <p className="py-16 text-sm text-muted-foreground">Loading…</p>;
  if (!rows?.length) return <p className="py-16 text-sm text-muted-foreground">Nothing yet.</p>;

  const i = rows.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">How NeuroVitals sees you</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Your baseline is the mean and standard deviation of your last {BASELINE_WINDOW} days. A
          generic health app would compare you with everyone else instead.
        </p>
      </div>

      <div className="space-y-4">
        {METRICS.map((meta) => {
          const b = baselineAt(rows, meta.key, i);
          return (
            <div key={meta.key} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <p className="text-sm font-medium">{meta.label}</p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-accent/40 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-accent-foreground">
                    Your typical range
                  </p>
                  <p className="numeric mt-2 text-lg">
                    {formatValue(meta, b.low)} – {formatValue(meta, b.high)}{" "}
                    <span className="text-sm text-muted-foreground">{meta.unit}</span>
                  </p>
                  <p className="numeric mt-1 text-xs text-muted-foreground">
                    mean {formatValue(meta, b.mean)} · sd {formatValue(meta, b.sd)} · n{" "}
                    {b.sampleSize}
                  </p>
                </div>

                <div className="rounded-xl bg-generic/40 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    A generic health app
                  </p>
                  <p className="numeric mt-2 text-lg text-muted-foreground">
                    {formatValue(meta, meta.genericRange[0])} –{" "}
                    {formatValue(meta, meta.genericRange[1])} {meta.unit}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{meta.genericLabel}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="pt-2 text-xs leading-relaxed text-muted-foreground">
        Baselines shift as you do — they are recomputed from your most recent {BASELINE_WINDOW} days
        every time you open the app. NeuroVitals is not a diagnosis.
      </p>
    </div>
  );
}
