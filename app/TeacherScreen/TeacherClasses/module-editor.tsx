// app/TeacherScreen/TeacherClasses/module-editor.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabaseClient";

type Params = {
  moduleId?: string;
  classId?: string;
  className?: string;
};

type ModuleHeader = {
  id: string;
  title: string | null;
  body: string | null;
  grade_level: string | number | null;
  strand: string | null;
  class_id: string | null;
  teacher_id: string | null;
  created_at?: string | null;
  due_at?: string | null;
};

type RubricItem = { label?: string; descriptions?: { high?: string; medium?: string; low?: string } };
type QuizItem = { question?: string; options?: string[]; correctAnswer?: number };
type ResourceItem = { name?: string; path?: string };

type ModuleDetails = {
  module_id: string;
  lessons?: string[] | null;
  importance?: string[] | null;
  tips?: string[] | null;
  task_body?: string | null;
  task_instructions?: string[] | null;
  rubric?: RubricItem[] | null;
  quiz?: QuizItem[] | null;
  resources?: ResourceItem[] | null;
  updated_at?: string | null;
};

function toDateLabel(...candidates: Array<string | null | undefined>) {
  for (const v of candidates) {
    if (!v) continue;
    const t = Date.parse(v);
    if (Number.isFinite(t)) return new Date(t).toLocaleDateString();
  }
  return undefined;
}
const asArray = <T,>(v: any, fallback: T[] = []): T[] => (Array.isArray(v) ? (v as T[]) : fallback);
function normalizeDetails(raw: any, moduleId: string): ModuleDetails {
  return {
    module_id: String(raw?.module_id ?? moduleId),
    lessons: asArray<string>(raw?.lessons),
    importance: asArray<string>(raw?.importance),
    tips: asArray<string>(raw?.tips),
    task_body: raw?.task_body ?? "",
    task_instructions: asArray<string>(raw?.task_instructions),
    rubric: asArray<RubricItem>(raw?.rubric),
    quiz: asArray<QuizItem>(raw?.quiz),
    resources: asArray<ResourceItem>(raw?.resources, []),
    updated_at: raw?.updated_at ?? null,
  };
}

export default function ModuleEditorScreen() {
  const router = useRouter();
  const { moduleId, classId, className } = useLocalSearchParams<Params>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [header, setHeader] = useState<ModuleHeader | null>(null);
  const [details, setDetails] = useState<ModuleDetails | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const assignedToThisClass = useMemo(() => {
    if (!header) return false;
    return String(header.class_id ?? "") === String(classId ?? "");
  }, [header, classId]);

  const statusBadge: "Published" | "Draft" = assignedToThisClass ? "Published" : "Draft";

  const fetchAll = useCallback(async () => {
    if (!moduleId) return;
    setLoading(true);
    try {
      const { data: h, error: hErr } = await supabase
        .from("class_modules")
        .select("id, title, body, grade_level, strand, class_id, teacher_id, created_at, due_at")
        .eq("id", moduleId)
        .limit(1)
        .single();
      if (hErr) throw hErr;
      setHeader(h as ModuleHeader);

      const { data: d, error: dErr } = await supabase
        .from("class_module_details")
        .select("*")
        .eq("module_id", moduleId)
        .limit(1)
        .maybeSingle();
      if (dErr) throw dErr;

      setDetails(d ? normalizeDetails(d, String(moduleId)) : normalizeDetails({}, String(moduleId)));
    } catch (e) {
      console.warn("[module-editor] fetch error:", e);
      Alert.alert("Error", "Could not load module.");
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const handleToggleAssign = useCallback(async () => {
    if (!header || !moduleId) return;
    try {
      if (!classId) {
        Alert.alert("Missing class", "No class context was provided.");
        return;
      }
      if (assignedToThisClass) {
        const { error } = await supabase
          .from("class_modules")
          .update({ class_id: null })
          .eq("id", moduleId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("class_modules")
          .update({ class_id: String(classId) })
          .eq("id", moduleId);
        if (error) throw error;
      }
      await fetchAll();
    } catch (e) {
      console.warn("[module-editor] toggle assign error:", e);
      Alert.alert("Error", "Could not update assignment.");
    }
  }, [assignedToThisClass, classId, header, moduleId, fetchAll]);

  // ✅ Route fixed: opens the builder at app/ButtonIcon/post-module.tsx
  const handleOpenBuilder = useCallback(() => {
    router.push({
      pathname: "/ButtonIcon/post-module",
      params: {
        mode: "edit",
        moduleId: String(moduleId ?? ""),
        classId: String(classId ?? ""),
        from: "module-editor",
      },
    });
  }, [router, moduleId, classId]);

  const handleSave = useCallback(async () => {
    if (!header || !details) return;
    setSaving(true);
    try {
      const { error: hErr } = await supabase
        .from("class_modules")
        .update({
          title: (header.title ?? "").trim() || "(Untitled module)",
          body: header.body ?? null,
          grade_level: header.grade_level ?? null,
          strand: header.strand ?? null,
        })
        .eq("id", header.id);
      if (hErr) throw hErr;

      const payload = {
        module_id: header.id,
        lessons: asArray(details.lessons),
        importance: asArray(details.importance),
        tips: asArray(details.tips),
        task_body: details.task_body ?? "",
        task_instructions: asArray(details.task_instructions),
        rubric: asArray(details.rubric),
        quiz: asArray(details.quiz),
        resources: asArray(details.resources, []),
        updated_at: new Date().toISOString(),
      };

      const { error: dErr } = await supabase
        .from("class_module_details")
        .upsert(payload, { onConflict: "module_id" });
      if (dErr) throw dErr;

      setEditing(false);
      await fetchAll();
      Alert.alert("Saved", "Module updated successfully.");
    } catch (e) {
      console.warn("[module-editor] save error:", e);
      Alert.alert("Error", "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }, [header, details, fetchAll]);

  const updatedLabel = useMemo(
    () => toDateLabel(details?.updated_at, header?.created_at, header?.due_at) ?? "—",
    [details?.updated_at, header]
  );

  return (
    <View className="flex-1 bg-[#0F172A]">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header */}
      <View className="px-5 pt-10 pb-4 flex-row items-center justify-between">
        <View className="flex-1 min-w-0">
          <Text className="text-white text-2xl font-bold" numberOfLines={1}>
            {className ?? "Module"}
          </Text>
          <Text className="text-white/60 text-xs mt-1" numberOfLines={1}>
            {header?.title ?? "(Untitled module)"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} className="ml-3 p-2 rounded-full bg-white/10">
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Actions bar — responsive, wraps on small screens */}
      <View className="px-5 pb-3">
        <View className="flex-row flex-wrap items-center">
          {/* Badge */}
          <View
            className={`px-2 py-1 rounded-full mr-2 mb-2 ${
              statusBadge === "Published" ? "bg-emerald-500/20" : "bg-yellow-500/20"
            }`}
          >
            <Text
              className={`text-[11px] font-medium ${
                statusBadge === "Published" ? "text-emerald-300" : "text-yellow-300"
              }`}
            >
              {statusBadge}
            </Text>
          </View>

          {/* Edit inline / Save */}
          <TouchableOpacity
            disabled={loading || saving}
            onPress={() => (editing ? handleSave() : setEditing(true))}
            className={`px-2 py-2 rounded-xl flex-row items-center border mr-2 mb-2 ${
              editing ? "bg-emerald-600 border-emerald-400/40" : "bg-white/10 border-white/15"
            }`}
          >
            <Ionicons name={editing ? "checkmark-outline" : "create-outline"} size={14} color="#fff" />
            <Text className="text-white text-[11px] ml-2">
              {editing ? (saving ? "Saving…" : "Save changes") : "Edit inline"}
            </Text>
          </TouchableOpacity>

          {/* Assign toggle */}
          <TouchableOpacity
            onPress={handleToggleAssign}
            className={`px-2 py-2 rounded-xl flex-row items-center border mr-2 mb-2 ${
              assignedToThisClass
                ? "bg-emerald-600 border-emerald-400/40"
                : "bg-white/10 border-white/15"
            }`}
          >
            <Ionicons
              name={assignedToThisClass ? "checkmark-circle-outline" : "add-circle-outline"}
              size={14}
              color="#fff"
            />
            <Text className="text-white text-[11px] ml-2">
              {assignedToThisClass ? "Assigned to class" : "Assign to class"}
            </Text>
          </TouchableOpacity>

          {/* Open in builder */}
          <TouchableOpacity
            onPress={handleOpenBuilder}
            className="px-2 py-2 rounded-xl flex-row items-center border bg-white/10 border-white/15 mr-2 mb-2"
          >
            <Ionicons name="create-outline" size={14} color="#fff" />
            <Text className="text-white text-[11px] ml-2">Open in Builder</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Body */}
      <ScrollView
        className="flex-1 px-5"
        refreshControl={<RefreshControl tintColor="#fff" refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        {loading ? (
          <Text className="text-white/70 text-sm mt-4">Loading module…</Text>
        ) : !header ? (
          <Text className="text-white/70 text-sm mt-4">Module not found.</Text>
        ) : (
          <View className="space-y-6">
            {/* Meta */}
            <View className="bg-white/5 rounded-2xl border border-white/10 p-5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white font-semibold text-lg">Details</Text>
                <Ionicons name="information-circle-outline" size={20} color="#fff" />
              </View>
              <Text className="text-white/80 text-sm">
                Grade: <Text className="text-white">{header.grade_level ?? "—"}</Text>
              </Text>
              <Text className="text-white/80 text-sm">
                Strand: <Text className="text-white">{header.strand ?? "All Strands"}</Text>
              </Text>
              <Text className="text-white/60 text-xs mt-1">Updated {updatedLabel}</Text>

              {editing ? (
                <View className="mt-3 bg-white/5 rounded-xl p-3 border border-white/10">
                  <Text className="text-white/60 text-xs mb-1">Module title</Text>
                  <TextInput
                    value={header.title ?? ""}
                    onChangeText={(v) => setHeader((h) => (h ? { ...h, title: v } : h))}
                    placeholder="Enter module title"
                    placeholderTextColor="#9CA3AF"
                    className="text-white mb-3"
                  />
                  <Text className="text-white/60 text-xs mb-1">Module description</Text>
                  <TextInput
                    multiline
                    value={header.body ?? ""}
                    onChangeText={(v) => setHeader((h) => (h ? { ...h, body: v } : h))}
                    placeholder="Describe the module…"
                    placeholderTextColor="#9CA3AF"
                    className="text-white"
                    style={{ minHeight: 80 }}
                  />
                </View>
              ) : header.body ? (
                <View className="mt-3 bg-white/5 rounded-xl p-3 border border-white/10">
                  <Text className="text-white/90">{header.body}</Text>
                </View>
              ) : null}
            </View>

            {/* Lesson */}
            {details?.lessons?.[0] ? (
              <View className="bg-white/5 rounded-2xl border border-white/10 p-5">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-semibold text-lg">Lesson Content</Text>
                  <Ionicons name="book-outline" size={20} color="#fff" />
                </View>
                <Text className="text-white/90">{details.lessons[0]}</Text>
              </View>
            ) : null}

            {/* Importance */}
            {Array.isArray(details?.importance) && details!.importance!.length > 0 ? (
              <View className="bg-white/5 rounded-2xl border border-white/10 p-5">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-semibold text-lg">Key Points</Text>
                  <Ionicons name="key-outline" size={20} color="#fff" />
                </View>
                {details!.importance!.map((p, i) => (
                  <View key={`imp-${i}`} className="flex-row items-start mb-1">
                    <View className="w-5 h-5 bg-white/10 rounded-full items-center justify-center mt-0.5 mr-2">
                      <Text className="text-white text-[10px] font-bold">{i + 1}</Text>
                    </View>
                    <Text className="text-white/90 flex-1">{p}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Tips */}
            {Array.isArray(details?.tips) && details!.tips!.length > 0 ? (
              <View className="bg-white/5 rounded-2xl border border-white/10 p-5">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-semibold text-lg">Learning Tips</Text>
                  <Ionicons name="bulb-outline" size={20} color="#fff" />
                </View>
                {details!.tips!.map((t, i) => (
                  <View key={`tip-${i}`} className="flex-row items-start mb-1">
                    <Ionicons name="star-outline" size={14} color="#fff" style={{ marginTop: 2, marginRight: 6 }} />
                    <Text className="text-white/90 flex-1">{t}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Quiz */}
            {Array.isArray(details?.quiz) && details!.quiz!.filter(q => q?.question?.trim()).length > 0 ? (
              <View className="bg-white/5 rounded-2xl border border-white/10 p-5">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-semibold text-lg">Quiz</Text>
                  <Ionicons name="help-circle-outline" size={20} color="#fff" />
                </View>
                {details!.quiz!.map((q, qi) =>
                  q?.question?.trim() ? (
                    <View key={`q-${qi}`} className="mb-3">
                      <Text className="text-white font-medium">{qi + 1}. {q.question}</Text>
                      {q.options?.map((o, oi) => (
                        <View key={`opt-${qi}-${oi}`} className="flex-row items-start ml-4 mt-1">
                          <View className="w-4 h-4 rounded-full border-2 border-white/30 mr-2 mt-0.5" />
                          <Text className="text-white/90">{o || `Option ${String.fromCharCode(65 + oi)}`}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null
                )}
              </View>
            ) : null}

            {/* Task & Instructions */}
            {(details?.task_body || (details?.task_instructions?.length ?? 0) > 0 || editing) ? (
              <View className="bg-white/5 rounded-2xl border border-white/10 p-5">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-semibold text-lg">Task</Text>
                  <Ionicons name="create-outline" size={20} color="#fff" />
                </View>

                {editing ? (
                  <View className="bg-white/5 rounded-xl p-3 border border-white/10 mb-3">
                    <Text className="text-white/60 text-xs mb-1">Task body</Text>
                    <TextInput
                      multiline
                      value={details?.task_body ?? ""}
                      onChangeText={(v) =>
                        setDetails((d) =>
                          d ? { ...d, task_body: v } : { module_id: String(moduleId ?? ""), task_body: v }
                        )
                      }
                      placeholder="Describe the task…"
                      placeholderTextColor="#9CA3AF"
                      className="text-white"
                      style={{ minHeight: 80 }}
                    />
                  </View>
                ) : details?.task_body ? (
                  <View className="bg-white/5 rounded-xl p-3 border border-white/10 mb-3">
                    <Text className="text-white/90">{details.task_body}</Text>
                  </View>
                ) : null}

                {Array.isArray(details?.task_instructions) && details!.task_instructions!.length > 0 ? (
                  <View>
                    <Text className="text-white font-medium mb-2">Instructions:</Text>
                    {details!.task_instructions!.map((ins, ii) => (
                      <View key={`ins-${ii}`} className="flex-row items-start">
                        <View className="w-5 h-5 bg-white/10 rounded-full items-center justify-center mt-0.5 mr-2">
                          <Text className="text-white text-[10px] font-bold">{ii + 1}</Text>
                        </View>
                        <Text className="text-white/90 flex-1">{ins}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Rubric */}
            {Array.isArray(details?.rubric) && details!.rubric!.length > 0 ? (
              <View className="bg-white/5 rounded-2xl border border-white/10 p-5">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-semibold text-lg">Assessment Rubric</Text>
                  <Ionicons name="ribbon-outline" size={20} color="#fff" />
                </View>
                {details!.rubric!.map((r, ri) => (
                  <View key={`rub-${ri}`} className="mb-3">
                    <Text className="text-white font-medium">{ri + 1}. {r.label || "Criterion"}</Text>
                    <View className="ml-4 mt-1">
                      {r.descriptions?.high ? (
                        <Text className="text-white/90"><Text className="font-medium">Excellent:</Text> {r.descriptions.high}</Text>
                      ) : null}
                      {r.descriptions?.medium ? (
                        <Text className="text-white/90 mt-1"><Text className="font-medium">Good:</Text> {r.descriptions.medium}</Text>
                      ) : null}
                      {r.descriptions?.low ? (
                        <Text className="text-white/90 mt-1"><Text className="font-medium">Needs Improvement:</Text> {r.descriptions.low}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Materials */}
            {Array.isArray(details?.resources) && details!.resources!.length > 0 ? (
              <View className="bg-white/5 rounded-2xl border border-white/10 p-5">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-semibold text-lg">Materials / Attachments</Text>
                  <Ionicons name="link-outline" size={20} color="#fff" />
                </View>
                {details!.resources!.map((res, i) => (
                  <View key={`res-${i}`} className="flex-row items-center mb-1">
                    <View className="w-5 h-5 bg-white/10 rounded-full items-center justify-center mr-2">
                      <Ionicons name="document-text-outline" size={12} color="#fff" />
                    </View>
                    <Text className="text-white/90 flex-1" numberOfLines={1}>
                      {res?.name || res?.path || "(file)"}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
