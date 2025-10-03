// lib/liveSessions.ts
import { supabase } from "@/lib/supabaseClient";

/** ---- Types (mirror your table) ---- */
export type LiveSession = {
  id: string;                 // uuid
  host_id: string | null;
  session_link: string | null;
  token: string | null;
  duration: number | null;
  participants: number | null;
  created_at: string | null;  // ISO
  slug: string | null;
  title: string | null;
  status: "live" | "scheduled" | "ended" | "hidden" | string | null;
  viewers: number;
};

type CreateLiveSessionInput = Partial<
  Pick<
    LiveSession,
    "title" | "slug" | "status" | "session_link" | "token" | "participants" | "duration"
  >
>;

/** Small helper to get current user id (host_id/attendance) */
async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

/** Create a session row (defaults status='live') and return the full row */
export async function createLiveSession(
  title: string = "Live Session",
  extra: CreateLiveSessionInput = {}
): Promise<LiveSession> {
  const host_id = (await getUserId()) || null;

  const payload = {
    host_id,
    title,
    status: (extra.status as LiveSession["status"]) ?? "live",
    slug: extra.slug ?? null,
    session_link: extra.session_link ?? null,
    token: extra.token ?? null,
    participants: extra.participants ?? null,
    duration: extra.duration ?? null,
  };

  const { data, error } = await supabase
    .from("live_sessions")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as LiveSession;
}

/** End/update a session (you can pass any fields you want to update) */
export async function endLiveSession(
  id: string,
  updates: Partial<Pick<LiveSession, "session_link" | "duration" | "participants" | "status">> = {}
): Promise<void> {
  const patch = {
    status: updates.status ?? "ended",
    ...(updates.session_link !== undefined ? { session_link: updates.session_link } : {}),
    ...(Number.isFinite(updates.duration as any) ? { duration: updates.duration } : {}),
    ...(Number.isFinite(updates.participants as any) ? { participants: updates.participants } : {}),
  };

  const { error } = await supabase.from("live_sessions").update(patch).eq("id", id);
  if (error) throw error;
}

/** Increment/decrement viewers via your RPC (recommended under RLS) */
export async function bumpViewers(id: string, delta: number): Promise<void> {
  const { error } = await supabase.rpc("live_sessions_bump_viewers", {
    p_session_id: id,
    p_delta: delta,
  });
  if (error) throw error;
}

/** Subscribe to a single session row (viewers/status/etc). Returns unsubscribe fn */
export function subscribeSessionRow(
  id: string,
  onChange: (row: LiveSession) => void
): () => void {
  const channel = supabase
    .channel(`live_sessions:${id}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "live_sessions", filter: `id=eq.${id}` },
      (payload: any) => {
        const row = (payload.new || payload.old) as LiveSession;
        if (row) onChange(row);
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {}
  };
}

/** List currently live sessions (for your discovery page) */
export async function listLiveNow(limit = 50): Promise<LiveSession[]> {
  const { data, error } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as LiveSession[];
}

/** Fetch one session by id */
export async function getSessionById(id: string): Promise<LiveSession | null> {
  const { data, error } = await supabase
    .from("live_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as LiveSession) ?? null;
}

/** ----- (Optional) Attendance helpers if you have live_attendances table ----- */
export async function markJoined(sessionId: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase
    .from("live_attendances")
    .upsert(
      [{ session_id: sessionId, user_id: userId, joined_at: new Date().toISOString(), left_at: null }],
      { onConflict: "session_id,user_id" }
    );
  if (error) throw error;

  await bumpViewers(sessionId, +1);
}

export async function markLeft(sessionId: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase
    .from("live_attendances")
    .update({ left_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .eq("user_id", userId);
  if (error) throw error;

  await bumpViewers(sessionId, -1);
}

/** Count distinct attendees for a session (used when ending) */
export async function countParticipants(sessionId: string): Promise<number> {
  const { count, error } = await supabase
    .from("live_attendances")
    .select("user_id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (error) throw error;
  return count ?? 0;
}
