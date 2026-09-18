CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  energy SMALLINT NOT NULL,
  stress SMALLINT NOT NULL,
  sleep_quality SMALLINT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

CREATE TABLE public.vitals_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL,
  resting_hr NUMERIC NOT NULL,
  hrv NUMERIC NOT NULL,
  sleep_hours NUMERIC NOT NULL,
  steps INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_ins TO authenticated;
GRANT ALL ON public.check_ins TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vitals_daily TO authenticated;
GRANT ALL ON public.vitals_daily TO service_role;

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own check-ins" ON public.check_ins FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own vitals" ON public.vitals_daily FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);