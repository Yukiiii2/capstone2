import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";


export type UIModule = {
  id: string;
  title: string;
  description: string | null;
  category: "speaking" | "reading";
  level: "basic" | "advanced";
  order_index: number | null;
  subtitle: string; // "Lesson N"
};

export function useModules(
  exercise: "speaking" | "reading",
  level?: "basic" | "advanced"
) {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<UIModule[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("modules")
      .select("id, title, description, category, level, order_index, active")
      .eq("active", true)
      .eq("category", exercise)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });

    if (level) query = query.eq("level", level);

    const { data, error } = await query;
    if (error || !data) { setModules([]); setLoading(false); return; }

    const rows = data.map((m, idx) => ({
      id: m.id,
      title: m.title ?? "Untitled Module",
      description: m.description ?? null,
      category: m.category as "speaking" | "reading",
      level: m.level as "basic" | "advanced",
      order_index: m.order_index ?? null,
      subtitle: `Lesson ${typeof m.order_index === "number" ? m.order_index + 1 : idx + 1}`,
    }));

    setModules(rows);
    setLoading(false);
  }, [exercise, level]);

  useEffect(() => { load(); }, [load]);

  return { loading, modules, reload: load };
}
