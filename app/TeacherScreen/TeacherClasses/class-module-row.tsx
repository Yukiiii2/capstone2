// app/TeacherScreen/TeacherClasses/class-module-row.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabaseClient";
import ModuleRow, { ModuleRowProps } from "@/components/TeacherModal/ModuleRow";

type Params = {
  classId?: string;
  className?: string;
  code?: string;
  grade?: "11" | "12";
  strand?: "ABM" | "STEM" | "HUMSS" | "GAS" | "TVL" | "ALL";
};

/** Parse ISO-ish strings safely to a timestamp (ms). */
function toMs(v?: string | null): number {
  if (!v) return 0;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : 0;
}

/** First non-empty string from a list. */
function firstStr(...vals: Array<string | null | undefined>) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length) return v;
  }
  return undefined;
}

export default function ClassModuleRowScreen() {
  const router = useRouter();
  const { classId, className, code, grade, strand } =
    useLocalSearchParams<Params>();

  const [rows, setRows] = useState<ModuleRowProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /** Fetch all modules assigned to this class (rows in class_modules where class_id = cid). */
  const fetchAssignedModules = useCallback(async (cid: string) => {
    const { data, error } = await supabase
      .from("class_modules")
      .select(
        "id, title, body, resource_url, due_at, grade_level, strand, created_at, class_id, teacher_id"
      )
      .eq("class_id", cid)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[class-module-row] assigned fetch error:", error);
      return [] as any[];
    }
    return data ?? [];
  }, []);

  /** Fetch teacher's unassigned modules (same table, class_id IS NULL). */
  const fetchTeacherUnassigned = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return [] as any[];

    const { data, error } = await supabase
      .from("class_modules")
      .select(
        "id, title, body, resource_url, due_at, grade_level, strand, created_at, class_id, teacher_id"
      )
      .eq("teacher_id", uid)
      .is("class_id", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[class-module-row] unassigned fetch error:", error);
      return [];
    }
    return data ?? [];
  }, []);

  /** (Optional) details keyed by class_modules.id if your details.module_id references that id. */
  const fetchDetailsByModuleIds = useCallback(async (moduleIds: string[]) => {
    if (moduleIds.length === 0) return new Map<string, any>();
    const { data, error } = await supabase
      .from("class_module_details")
      .select("*")
      .in("module_id", moduleIds);

    if (error) {
      console.warn("[class-module-row] details fetch error:", error);
      return new Map<string, any>();
    }
    const map = new Map<string, any>();
    (data ?? []).forEach((d: any) => {
      if (!d?.module_id) return;
      map.set(d.module_id, d);
    });
    return map;
  }, []);

  /** Normalize a class_modules row into ModuleRowProps. */
  const normalize = useCallback(
    (m: any, detail?: any, currentClassId?: string | number | null): ModuleRowProps => {
      const updatedAt =
        firstStr(m?.updated_at, m?.created_at, m?.due_at) &&
        new Date(firstStr(m?.updated_at, m?.created_at, m?.due_at) as string).toLocaleDateString();

      const lvl = (m?.grade_level ?? "11").toString();
      const gradeLevel = (lvl === "12" ? "12" : "11") as "11" | "12";

      const attachmentsCount = Array.isArray(detail?.resources) ? detail.resources.length : 0;
      const hasQuiz = Array.isArray(detail?.quiz) ? detail.quiz.length > 0 : false;

      return {
        id: m.id,
        title: m.title ?? "(Untitled module)",
        status: "Published", // table has no status; keep UI happy
        gradeLevel,
        strand: (m?.strand ?? "ALL") as ModuleRowProps["strand"],
        updatedAt,
        attachmentsCount,
        hasQuiz,
        assigned: String(m?.class_id ?? "") === String(currentClassId ?? ""),
      };
    },
    []
  );

  const fetchRows = useCallback(async () => {
    if (!classId) return;
    setLoading(true);

    // 1) Assigned to this class
    const assigned = await fetchAssignedModules(String(classId));

    // 2) Teacher's unassigned (so they can assign them)
    const unassigned = await fetchTeacherUnassigned();

    // 3) Merge (assigned first, avoid dups)
    const byId = new Map<string, any>();
    assigned.forEach((m: any) => byId.set(m.id, m));
    unassigned.forEach((m: any) => {
      if (!byId.has(m.id)) byId.set(m.id, m);
    });
    let modules = Array.from(byId.values());

    // 4) Pull details for all modules we’re showing
    const detailsMap = await fetchDetailsByModuleIds(modules.map((m: any) => m.id));

    // 5) Filters from query
    if (grade) {
      modules = modules.filter(
        (m: any) => String(m?.grade_level ?? "") === String(grade)
      );
    }
    if (strand && strand !== "ALL") {
      modules = modules.filter(
        (m: any) => String(m?.strand ?? "") === String(strand)
      );
    }

    // 6) Sort latest first
    modules.sort(
      (a: any, b: any) => toMs(b?.created_at ?? b?.due_at) - toMs(a?.created_at ?? a?.due_at)
    );

    // 7) Map to UI rows (now including counts)
    const mapped: ModuleRowProps[] = modules.map((m: any) =>
      normalize(m, detailsMap.get(m.id), classId)
    );

    setRows(mapped);
    setLoading(false);
  }, [classId, grade, strand, fetchAssignedModules, fetchTeacherUnassigned, fetchDetailsByModuleIds, normalize]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Realtime on class_modules (source of truth)
  useEffect(() => {
    const ch = supabase
      .channel("class-modules-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "class_modules" },
        (payload) => {
          const r: any = payload?.new ?? payload?.old;
          if (
            String(r?.class_id ?? "") === String(classId ?? "") ||
            payload.eventType === "UPDATE"
          ) {
            fetchRows();
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchRows, classId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRows();
    setRefreshing(false);
  }, [fetchRows]);

  /** Assign/unassign by updating class_id on the class_modules row. */
  const handleToggleAssign = async (moduleId: string, next: boolean) => {
    if (!classId) return;

    if (next) {
      const { error } = await supabase
        .from("class_modules")
        .update({ class_id: String(classId) })
        .eq("id", moduleId);
      if (error) console.warn("[assign] error:", error);
    } else {
      const { error } = await supabase
        .from("class_modules")
        .update({ class_id: null })
        .eq("id", moduleId);
      if (error) console.warn("[unassign] error:", error);
    }
    fetchRows();
  };

  return (
    <View className="flex-1 bg-[#0F172A]">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header */}
      <View className="px-5 pt-10 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-2xl font-bold">
            {className ?? "Class Modules"}
          </Text>
          <Text className="text-white/60 text-xs mt-1">
            Code: {code ?? "—"} • Grade {grade ?? "—"} •{" "}
            {strand === "ALL" ? "All Strands" : strand ?? "—"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-full bg-white/10"
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView
        className="flex-1 px-5"
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        {loading ? (
          <Text className="text-white/70 text-sm mt-4">Loading modules…</Text>
        ) : rows.length === 0 ? (
          <Text className="text-white/70 text-sm mt-4">
            No modules for this class yet.
          </Text>
        ) : (
          rows.map((m) => (
            <ModuleRow key={m.id} {...m} onToggleAssign={handleToggleAssign} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
