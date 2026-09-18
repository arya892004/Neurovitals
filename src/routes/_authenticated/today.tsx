import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CALIBRATION_DAYS, formatDate, todayIso } from "@/lib/vitals";
import { useCheckIns, useSaveCheckIn } from "@/lib/health-data";

export const Route = createFileRoute("/_authenticated/today")({
  head: () => ({
    meta: [
      { title: "Daily check-in · NeuroVitals" },
      {
        name: "description",
        content: "A ten-second check-in: energy, stress and sleep quality, plus an optional note.",
      },
      { property: "og:title", content: "Daily check-in · NeuroVitals" },
      { property: "og:description", content: "Log today's mental state in ten seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TodayPage,
});

const SCALES = [
  { key: "energy", label: "Energy", low: "Depleted", high: "Charged" },
  { key: "stress", label: "Stress", low: "Settled", high: "Wired" },
  { key: "sleep_quality", label: "Sleep quality", low: "Restless", high: "Deep" },
] as const;

function TodayPage() {
  const { data: checkIns } = useCheckIns();
  const save = useSaveCheckIn();

  const existing = checkIns?.find((c) => c.entry_date === todayIso());

  const [values, setValues] = useState<Record<string, number>>({
    energy: 0,
    stress: 0,
    sleep_quality: 0,
  });
  const [note, setNote] = useState("");

  useEffect(() => {
    if (existing) {
      setValues({
        energy: existing.energy,
        stress: existing.stress,
        sleep_quality: existing.sleep_quality,
      });
      setNote(existing.note ?? "");
    }
  }, [existing]);

  const complete = SCALES.every((s) => values[s.key]! > 0);
  const logged = checkIns?.length ?? 0;
  const calibrating = logged < CALIBRATION_DAYS;

  function submit() {
    save.mutate(
      {
        energy: values['energy']!,
        stress: values['stress']!,
        sleep_quality: values['sleep_quality']!,
        note,
      },
      {
        onSuccess: () => toast.success("Logged. See you tomorrow."),
        onError: () => toast.error("Couldn't save that — try once more."),
      },
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {formatDate(todayIso())}
        </p>
        <h1 className="mt-2 text-3xl">How is today sitting with you?</h1>
      </div>

      <div className="space-y-5">
        {SCALES.map((scale) => (
          <div key={scale.key} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">{scale.label}</span>
              <span className="text-[11px] text-muted-foreground">
                {scale.low} → {scale.high}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = values[scale.key] === n;
                return (
                  <button
                    key={n}
                    onClick={() => setValues((v) => ({ ...v, [scale.key]: n }))}
                    className={`numeric h-12 flex-1 rounded-xl border text-sm transition-all ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface text-muted-foreground hover:border-ring"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Anything worth remembering? (optional)"
          className="w-full resize-none rounded-2xl border border-input bg-card p-5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
        />

        <button
          onClick={submit}
          disabled={!complete || save.isPending}
          className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {existing ? "Update today's check-in" : "Log check-in"}
        </button>
      </div>

      {calibrating && (
        <div className="rounded-2xl border border-border bg-accent/40 p-5">
          <p className="text-sm font-medium text-accent-foreground">Building your baseline</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {logged} of {CALIBRATION_DAYS} check-ins recorded. Mood insights stay quiet until
            NeuroVitals knows what an ordinary day looks like for you — there is no generic normal
            to fall back on.
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (logged / CALIBRATION_DAYS) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {!!checkIns?.length && (
        <div>
          <h2 className="text-sm font-medium tracking-tight">Recent check-ins</h2>
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {checkIns.slice(0, 7).map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
                <div>
                  <p className="text-sm">{formatDate(c.entry_date)}</p>
                  {c.note && <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>}
                </div>
                <p className="numeric shrink-0 text-xs text-muted-foreground">
                  E{c.energy} · S{c.stress} · Q{c.sleep_quality}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
