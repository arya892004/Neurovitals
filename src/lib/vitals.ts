export type MetricKey = "resting_hr" | "hrv" | "sleep_hours" | "steps";

export type VitalRow = {
  entry_date: string;
  resting_hr: number;
  hrv: number;
  sleep_hours: number;
  steps: number;
};

export type MetricMeta = {
  key: MetricKey;
  label: string;
  unit: string;
  decimals: number;
  /** A generic consumer-health "normal range" for the comparison view. */
  genericRange: [number, number];
  genericLabel: string;
};

export const METRICS: MetricMeta[] = [
  {
    key: "resting_hr",
    label: "Resting heart rate",
    unit: "bpm",
    decimals: 0,
    genericRange: [60, 100],
    genericLabel: "60–100 bpm for adults",
  },
  {
    key: "hrv",
    label: "Heart rate variability",
    unit: "ms",
    decimals: 0,
    genericRange: [20, 120],
    genericLabel: "20–120 ms for adults",
  },
  {
    key: "sleep_hours",
    label: "Sleep duration",
    unit: "h",
    decimals: 1,
    genericRange: [7, 9],
    genericLabel: "7–9 hours per night",
  },
  {
    key: "steps",
    label: "Activity",
    unit: "steps",
    decimals: 0,
    genericRange: [8000, 10000],
    genericLabel: "10,000 steps per day",
  },
];

export const BASELINE_WINDOW = 14;
export const CALIBRATION_DAYS = 14;
export const Z_THRESHOLD = 1.5;

/* ------------------------------------------------------------------ */
/* Deterministic synthetic history                                     */
/* ------------------------------------------------------------------ */

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function todayIso() {
  return isoDate(new Date());
}

/**
 * 30 days of believable personal history, with a handful of deliberate
 * multi-metric deviation days so the insight engine has something to explain.
 */
export function generateHistory(userId: string, days = 30): VitalRow[] {
  const rand = mulberry32(hashSeed(userId));

  // Each person gets their own centre of gravity — that is the whole point.
  const center = {
    resting_hr: 52 + Math.round(rand() * 18),
    hrv: 38 + Math.round(rand() * 45),
    sleep_hours: 6.3 + rand() * 1.6,
    steps: 5200 + Math.round(rand() * 5200),
  };

  // Days-ago offsets that carry a coordinated deviation.
  const deviationDays = new Set([1, 6, 14]);

  const rows: VitalRow[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);

    let hr = center.resting_hr + gaussian(rand) * 2.1;
    let hrv = center.hrv + gaussian(rand) * 4.5;
    let sleep = center.sleep_hours + gaussian(rand) * 0.42;
    let steps = center.steps + gaussian(rand) * 900;

    if (deviationDays.has(i)) {
      hr += 7.5 + rand() * 3;
      hrv -= 12 + rand() * 6;
      sleep -= 1.3 + rand() * 0.6;
      steps -= 1800 + rand() * 900;
    }

    rows.push({
      entry_date: isoDate(d),
      resting_hr: Math.round(Math.max(38, hr)),
      hrv: Math.round(Math.max(12, hrv)),
      sleep_hours: Math.round(Math.max(3, sleep) * 10) / 10,
      steps: Math.max(600, Math.round(steps)),
    });
  }

  return rows;
}

/* ------------------------------------------------------------------ */
/* Personal baseline statistics                                        */
/* ------------------------------------------------------------------ */

export function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stddev(values: number[]) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((a, b) => a + (b - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export type Baseline = {
  mean: number;
  sd: number;
  low: number;
  high: number;
  sampleSize: number;
};

/** Rolling baseline from the `window` days *before* index `i`. */
export function baselineAt(
  rows: VitalRow[],
  key: MetricKey,
  i: number,
  window = BASELINE_WINDOW,
): Baseline {
  const slice = rows.slice(Math.max(0, i - window), i).map((r) => Number(r[key]));
  const m = mean(slice);
  const sd = stddev(slice);
  return { mean: m, sd, low: m - sd, high: m + sd, sampleSize: slice.length };
}

export type Deviation = {
  key: MetricKey;
  meta: MetricMeta;
  value: number;
  z: number;
  delta: number;
  baseline: Baseline;
  flagged: boolean;
};

export function evaluateDay(
  rows: VitalRow[],
  i: number,
  threshold = Z_THRESHOLD,
  window = BASELINE_WINDOW,
): Deviation[] {
  return METRICS.map((meta) => {
    const base = baselineAt(rows, meta.key, i, window);
    const value = Number(rows[i]![meta.key]);
    const z = base.sd > 0 ? (value - base.mean) / base.sd : 0;
    return {
      key: meta.key,
      meta,
      value,
      z,
      delta: value - base.mean,
      baseline: base,
      flagged: base.sampleSize >= 7 && Math.abs(z) > threshold,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Explainable insight composition                                     */
/* ------------------------------------------------------------------ */

export type Insight = {
  date: string;
  headline: string;
  body: string;
  contributor: MetricMeta;
  deviations: Deviation[];
};

export function formatValue(meta: MetricMeta, value: number) {
  if (meta.key === "steps") return Math.round(value).toLocaleString();
  return value.toFixed(meta.decimals);
}

function describe(d: Deviation) {
  const dir = d.delta >= 0 ? "above" : "below";
  const magnitude = formatValue(d.meta, Math.abs(d.delta));
  return `${d.meta.label.toLowerCase()} ${magnitude} ${d.meta.unit} ${dir} baseline`;
}

export function buildInsights(
  rows: VitalRow[],
  threshold = Z_THRESHOLD,
  window = BASELINE_WINDOW,
): Insight[] {
  const insights: Insight[] = [];

  for (let i = rows.length - 1; i >= 0; i--) {
    const evaluated = evaluateDay(rows, i, threshold, window);
    const flagged = evaluated.filter((d) => d.flagged);
    if (flagged.length < 2) continue;

    const sorted = [...flagged].sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
    const lead = sorted[0]!;
    const others = sorted.slice(1);

    const dirWord = lead.delta >= 0 ? "higher" : "lower";
    const headline = `${lead.meta.label} ${formatValue(lead.meta, Math.abs(lead.delta))} ${lead.meta.unit} ${dirWord} than usual`;

    const body =
      `${lead.meta.label} is ${formatValue(lead.meta, lead.value)} ${lead.meta.unit} ` +
      `(${lead.delta >= 0 ? "+" : "−"}${formatValue(lead.meta, Math.abs(lead.delta))} ${lead.meta.unit}, ` +
      `z = ${lead.z.toFixed(2)}) vs your ${window}-day baseline, coinciding with ` +
      `${others.map(describe).join(" and ")}. ` +
      `Most significant contributor: ${lead.meta.label}. This is not a diagnosis.`;

    insights.push({
      date: rows[i]!.entry_date,
      headline,
      body,
      contributor: lead.meta,
      deviations: sorted,
    });
  }

  return insights;
}

export function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function relativeDay(iso: string) {
  const today = todayIso();
  if (iso === today) return "Today";
  const d = new Date(`${iso}T00:00:00`);
  const t = new Date(`${today}T00:00:00`);
  const diff = Math.round((t.getTime() - d.getTime()) / 86400000);
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}
