// app/TeacherScreen/TeacherClasses/class-module-progress.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabaseClient";

type Params = {
  classId?: string;
  className?: string;
  moduleId?: string;
  moduleTitle?: string;
};

type RosterRow = {
  id: string;            // student_id
  name: string;
  strand?: string | null;
  grade_level?: number | null;
  avatar_url?: string | null;
};

type AttemptRow = {
  student_id: string;
  status?: "not_started" | "in_progress" | "completed";
  score?: number | null;
  updated_at?: string | null;
  progress?: number | null; // 0..1
};

export default function ClassModuleProgressScreen() {
  const router = useRouter();
  const { classId, className, moduleId, moduleTitle } =
    useLocalSearchParams<Params>();

  const [loading, setLoading] = useState(true);
  const [moduleType, setModuleType] = useState<"SPEAKING" | "READING" | null>(null);

  const [students, setStudents] = useState<RosterRow[]>([]);
  const [attempts, setAttempts] = useState<Record<string, AttemptRow>>({}); // keyed by student_id

  const title = moduleTitle || "Module Progress";

  /* ───────── Module header (to know SPEAKING/READING) ───────── */
  const fetchModuleHeader = useCallback(async () => {
    if (!moduleId) return;
    const { data, error } = await supabase
      .from("class_modules")
      .select("module_type")
      .eq("id", moduleId)
      .maybeSingle();
    if (!error && data?.module_type) {
      const t = String(data.module_type).toUpperCase() as "SPEAKING" | "READING";
      setModuleType(t);
    }
  }, [moduleId]);

  /* ───────── Roster: strictly the students enrolled in THIS class ─────────
     1) Prefer class_enrollments (student_id,class_id,status='active') → profiles.
     2) If class_enrollments is empty or table not present, fall back:
        classes → (grade,strand) and filter teacher_students by class_id if available,
        else by grade/strand (best-effort).
  */
  const fetchRoster = useCallback(async () => {
    if (!classId) return;

    // ✅ Try real enrollment: class_enrollments → profiles
    const tryClassEnrollments = async (): Promise<RosterRow[] | null> => {
      const { data: ce, error: ceErr } = await supabase
        .from("class_enrollments")
        .select("student_id, profiles:student_id ( id, name, avatar_url )")
        .eq("class_id", classId)
        .eq("status", "active")
        .order("joined_at", { ascending: true });

      if (ceErr) return null;                 // table might not exist → fall back
      if (!ce?.length) return [];             // table exists but no one enrolled

      return ce.map((r: any) => {
        const p = r?.profiles || {};
        return {
          id: String(r.student_id),
          name: p?.name || "(No name)",
          avatar_url: p?.avatar_url ?? null,
          grade_level: null,
          strand: null,
        } as RosterRow;
      });
    };

    // 🔁 Fallback: classes meta + teacher_students
    const tryTeacherStudents = async (): Promise<RosterRow[] | null> => {
      const { data: cls, error: cErr } = await supabase
        .from("classes")
        .select("grade_level, strand")
        .eq("id", classId)
        .maybeSingle();

      if (cErr) return null;

      const grade = cls?.grade_level ?? null;
      const strandNorm = normalizeStrand(cls?.strand ?? null);

      // Need current teacher id
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return [];

      // If teacher_students has class_id, use it; otherwise filter by grade/strand.
      let roster: any[] = [];

      // attempt by class_id (if column exists & rows present)
      {
        const { data: tsByClass, error } = await supabase
          .from("teacher_students")
          .select("student_id, grade_level, strand, class_id")
          .eq("teacher_id", uid)
          .eq("class_id", classId);

        if (!error && tsByClass?.length) roster = tsByClass;
      }

      // fallback by grade/strand
      if (!roster.length) {
        let q = supabase
          .from("teacher_students")
          .select("student_id, grade_level, strand")
          .eq("teacher_id", uid);

        if (grade != null) q = q.eq("grade_level", grade);
        if (strandNorm && strandNorm !== "ALL") q = q.eq("strand", strandNorm);

        const { data: ts, error: tsErr } = await q;
        if (!tsErr && ts) roster = ts;
      }

      if (!roster.length) return [];

      const ids = Array.from(new Set(roster.map((r: any) => String(r.student_id))));
      const { data: profs, error: pErr } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", ids);

      if (pErr || !profs) return [];

      const mapMeta: Record<string, any> = {};
      roster.forEach((r: any) => (mapMeta[String(r.student_id)] = r));

      return profs.map((p: any) => ({
        id: String(p.id),
        name: p.name || "(No name)",
        avatar_url: p.avatar_url ?? null,
        grade_level: mapMeta[String(p.id)]?.grade_level ?? null,
        strand: normalizeStrand(mapMeta[String(p.id)]?.strand ?? null),
      }));
    };

    const fromEnrollments = await tryClassEnrollments();
    if (fromEnrollments && fromEnrollments.length >= 0) {
      setStudents(fromEnrollments);
      return;
    }
    const fromTeacherStudents = await tryTeacherStudents();
    setStudents(fromTeacherStudents ?? []);
  }, [classId]);

  /* ───────── Attempts/progress for this module ─────────
     Prefer module_attempts (module-specific).
     Fallback to student_progress (overall per skill area).
  */
  const fetchAttempts = useCallback(async () => {
    if (!moduleId) return;

    // 1) module_attempts (optionally filter by class_id if present)
    let ma: any[] | null = null;

    // try with class_id filter first (if column exists)
    {
      const { data, error } = await supabase
        .from("module_attempts")
        .select("student_id, status, score, progress, updated_at, class_id")
        .eq("module_id", moduleId)
        .eq("class_id", classId as any);

      if (!error && Array.isArray(data) && data.length) ma = data;
    }

    // fallback: same table without class_id filter
    if (!ma) {
      const { data, error } = await supabase
        .from("module_attempts")
        .select("student_id, status, score, progress, updated_at")
        .eq("module_id", moduleId);
      if (!error && Array.isArray(data)) ma = data;
    }

    if (ma) {
      const map: Record<string, AttemptRow> = {};
      ma.forEach((r: any) => {
        map[String(r.student_id)] = {
          student_id: String(r.student_id),
          status: (r.status as any) ?? undefined,
          score: r.score ?? null,
          updated_at: r.updated_at ?? null,
          progress:
            typeof r.progress === "number"
              ? clamp01(r.progress)
              : r.progress == null
              ? null
              : clamp01(Number(r.progress)),
        };
      });
      setAttempts(map);
      return;
    }

    // 2) Fallback: student_progress
    const { data: sp, error: spErr } = await supabase
      .from("student_progress")
      .select(
        "student_id, speaking_completed, speaking_total, reading_completed, reading_total, updated_at"
      );

    if (!spErr && Array.isArray(sp)) {
      const map: Record<string, AttemptRow> = {};
      sp.forEach((r: any) => {
        const sid = String(r.student_id);
        const prog =
          moduleType === "READING"
            ? ratio(r.reading_completed, r.reading_total)
            : ratio(r.speaking_completed, r.speaking_total);

        map[sid] = {
          student_id: sid,
          status:
            prog === 0 ? "not_started" : prog >= 1 ? "completed" : "in_progress",
          score: null,
          updated_at: r.updated_at ?? null,
          progress: prog,
        };
      });
      setAttempts(map);
    }
  }, [moduleId, classId, moduleType]);

  /* ───────── Initial load ───────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await fetchModuleHeader();
      await fetchRoster();
      await fetchAttempts();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchModuleHeader, fetchRoster, fetchAttempts]);

  /* ───────── Realtime: reflect new enrollments/leaves in THIS class ───────── */
  useEffect(() => {
    if (!classId) return;
    const ch = supabase
      .channel("rt-class-enrollments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "class_enrollments", filter: `class_id=eq.${classId}` },
        () => fetchRoster()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [classId, fetchRoster]);

  /* ───────── Realtime: keep attempts live for THIS module (and class if column exists) ───────── */
  useEffect(() => {
    if (!moduleId) return;
    const ch = supabase
      .channel("rt-module-attempts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "module_attempts", filter: `module_id=eq.${moduleId}` },
        () => fetchAttempts()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [moduleId, fetchAttempts]);

  /* ───────── Merge roster + attempts ───────── */
  const rows = useMemo(() => {
    return students.map((s) => {
      const a = attempts[s.id];
      const progress = a?.progress ?? 0;
      const status =
        a?.status ?? (progress === 0 ? "not_started" : progress >= 1 ? "completed" : "in_progress");
      return {
        ...s,
        progress,
        status,
        score: a?.score ?? null,
        updated_at: a?.updated_at ?? null,
      };
    });
  }, [students, attempts]);

  return (
    <View className="flex-1 bg-[#0F172A]">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header */}
      <View className="px-5 pt-10 pb-4 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-white text-xl font-bold" numberOfLines={1}>
            {className ?? "Class"}
          </Text>
          <Text className="text-white/70 text-sm" numberOfLines={1}>
            {moduleTitle || "Module Progress"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full bg-white/10">
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Subheader */}
      <View className="px-5 pb-2">
        <View className="flex-row items-center">
          <View className="px-2 py-1 rounded-full bg-white/10 mr-2">
            <Text className="text-white/80 text-xs">{moduleType ?? "MODULE"}</Text>
          </View>
          <Text className="text-white/60 text-xs">
            {rows.length} student{rows.length === 1 ? "" : "s"}
          </Text>
        </View>
      </View>

      {/* Body */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="text-white/70 mt-3">Loading progress…</Text>
        </View>
      ) : rows.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="people-outline" size={28} color="#fff" />
          <Text className="text-white/70 mt-2 text-center">
            No students currently enrolled in this class.
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 36 }}>
          {rows.map((r) => (
            <View key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
              {/* Top row: name + status pill */}
              <View className="flex-row items-center justify-between">
                <Text className="text-white font-semibold" numberOfLines={1}>
                  {r.name}
                </Text>
                <View
                  className={`px-2 py-1 rounded-full ${
                    r.status === "completed"
                      ? "bg-emerald-500/20"
                      : r.status === "in_progress"
                      ? "bg-blue-500/20"
                      : "bg-white/10"
                  }`}
                >
                  <Text
                    className={`text-[11px] ${
                      r.status === "completed"
                        ? "text-emerald-300"
                        : r.status === "in_progress"
                        ? "text-blue-300"
                        : "text-white/70"
                    }`}
                  >
                    {statusLabel(r.status)}
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View className="mt-3">
                <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-white/70 rounded-full"
                    style={{ width: `${Math.round((r.progress ?? 0) * 100)}%` }}
                  />
                </View>
                <View className="flex-row justify-between mt-1">
                  <Text className="text-white/70 text-xs">
                    {Math.round((r.progress ?? 0) * 100)}%
                  </Text>
                  {r.score != null && (
                    <Text className="text-white/70 text-xs">Score: {r.score}</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

/* ───────── helpers ───────── */
function normalizeStrand(s: string | null | undefined) {
  if (!s) return null;
  const up = String(s).toUpperCase();
  return up === "HUMMS" ? "HUMSS" : up;
}
function clamp01(n: number | null | undefined) {
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
function ratio(a?: number | null, b?: number | null) {
  const A = typeof a === "number" ? a : 0;
  const B = typeof b === "number" && b > 0 ? b : 0;
  if (B === 0) return 0;
  return clamp01(A / B);
}
function statusLabel(s?: AttemptRow["status"]) {
  if (s === "completed") return "Completed";
  if (s === "in_progress") return "In progress";
  return "Not started";
}
