// lib/progress.ts
import { supabase } from "./supabaseClient";

/**
 * Low-level upsert. Prefer the high-level helpers below.
 */
export async function upsertProgress(moduleId: string, progress: number) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) throw new Error("Not authenticated");

  // Keep the **max** of what's already stored vs new progress (so we never regress)
  const { data: existing } = await supabase
    .from("student_progress")
    .select("progress")
    .eq("student_id", uid)
    .eq("module_id", moduleId)
    .maybeSingle();

  const next = Math.max(existing?.progress ?? 0, Math.max(0, Math.min(100, progress)));

  const { error } = await supabase
    .from("student_progress")
    .upsert(
      { student_id: uid, module_id: moduleId, progress: next },
      { onConflict: "student_id,module_id" }
    );

  if (error) throw error;
  return next;
}

/**
 * BASIC: set partial progress from in-lesson tasks/quizzes (capped at 50% here).
 * Call your quiz-complete handler with the % you want (e.g., 50).
 */
export async function setBasicPartialProgress(moduleId: string, percent: number) {
  const capped = Math.min(50, Math.max(0, percent));
  return upsertProgress(moduleId, capped);
}

/**
 * ADVANCED: mark complete (100%). Call this ONLY on the full-result page.
 */
export async function completeAdvancedModule(moduleId: string) {
  return upsertProgress(moduleId, 100);
}

/**
 * Utility: fetch current progress (optional).
 */
export async function getModuleProgress(moduleId: string) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) throw new Error("Not authenticated");

  const { data } = await supabase
    .from("student_progress")
    .select("progress")
    .eq("student_id", uid)
    .eq("module_id", moduleId)
    .maybeSingle();

  return data?.progress ?? 0;
}
