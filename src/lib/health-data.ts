import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateHistory, todayIso, type VitalRow } from "./vitals";

export type CheckIn = {
  id: string;
  entry_date: string;
  energy: number;
  stress: number;
  sleep_quality: number;
  note: string | null;
};

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not signed in");
  return data.user;
}

/**
 * Loads the person's vitals history. Wearable OAuth is out of scope for this
 * prototype, so the first visit lays down a believable 30-day personal history.
 */
async function loadVitals(): Promise<VitalRow[]> {
  const user = await requireUser();

  const select = () =>
    supabase
      .from("vitals_daily")
      .select("entry_date, resting_hr, hrv, sleep_hours, steps")
      .order("entry_date", { ascending: true });

  const { data, error } = await select();
  if (error) throw error;

  if (!data || data.length === 0) {
    const rows = generateHistory(user.id).map((r) => ({ ...r, user_id: user.id }));
    const { error: insertError } = await supabase
      .from("vitals_daily")
      .upsert(rows, { onConflict: "user_id,entry_date" });
    if (insertError) throw insertError;
    const retry = await select();
    if (retry.error) throw retry.error;
    return (retry.data ?? []).map(normalise);
  }

  return data.map(normalise);
}

function normalise(r: {
  entry_date: string;
  resting_hr: number | string;
  hrv: number | string;
  sleep_hours: number | string;
  steps: number;
}): VitalRow {
  return {
    entry_date: r.entry_date,
    resting_hr: Number(r.resting_hr),
    hrv: Number(r.hrv),
    sleep_hours: Number(r.sleep_hours),
    steps: Number(r.steps),
  };
}

export function useVitals() {
  return useQuery({ queryKey: ["vitals"], queryFn: loadVitals, staleTime: 60_000 });
}

export function useCheckIns() {
  return useQuery({
    queryKey: ["check-ins"],
    queryFn: async (): Promise<CheckIn[]> => {
      await requireUser();
      const { data, error } = await supabase
        .from("check_ins")
        .select("id, entry_date, energy, stress, sleep_quality, note")
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useSaveCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      energy: number;
      stress: number;
      sleep_quality: number;
      note: string;
    }) => {
      const user = await requireUser();
      const { error } = await supabase.from("check_ins").upsert(
        {
          user_id: user.id,
          entry_date: todayIso(),
          energy: input.energy,
          stress: input.stress,
          sleep_quality: input.sleep_quality,
          note: input.note.trim() || null,
        },
        { onConflict: "user_id,entry_date" },
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["check-ins"] }),
  });
}
