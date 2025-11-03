// app/StudentScreen/SpeakingExercise/class-module.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  ActivityIndicator,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabaseClient";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const { width } = Dimensions.get("window");

/* ────────────────────────────────────────────────────────────
   Types that mirror your SQL json/array shapes
   ──────────────────────────────────────────────────────────── */
type QuizQ = { id?: number; question: string; options: string[]; correct: number };
type RubricItem = {
  label: string;
  rating?: string;
  descriptions: { high: string; medium: string; low: string };
};

// NEW: storage-aware resource type (either private storage or public URL)
type StorageResource = {
  bucket?: string;       // e.g., "class_resources"
  path?: string;         // e.g., "teacher123/module456/lesson1.pdf"
  url?: string;          // public URL fallback
  name?: string;         // display name
  mime?: string;         // optional mime like "application/pdf"
};

type ClassModuleRow = {
  id: string;
  class_id: string | null;
  teacher_id: string;
  title: string;
  body: string | null;
  resource_url: string | null;
  module_type: "SPEAKING" | "READING" | string;
  due_at: string | null;
};

type DetailRow = {
  module_id: string;
  lessons: string[] | null;
  importance: string[] | null;
  tips: string[] | null;
  task_body: string | null;
  task_instructions: string[] | null;
  rubric: RubricItem[] | null;
  quiz: QuizQ[] | null;
  resources: StorageResource[] | null;   // storage-aware
  updated_at: string | null;
};

/* ────────────────────────────────────────────────────────────
   Shared UI bits
   ──────────────────────────────────────────────────────────── */
const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient colors={["#0F172A", "#1E293B", "#0F172A"]} className="flex-1" />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
  </View>
);

const SectionIndicator = ({ currentSection }: { currentSection: number }) => {
  if (currentSection === 2) return null; // hide on recording section
  return (
    <View className="flex-row justify-center gap-6 mt-1 mb-1">
      {[0, 1, 2].map((i) => {
        const isActive = i === currentSection;
        const isDone = i < currentSection;
        return (
          <View key={i} className="items-center">
            <View className={`w-2 h-2 rounded-full ${isActive ? "bg-violet-500" : isDone ? "bg-violet-400" : "bg-white/20"}`} />
            <Text className={`text-xs mt-1 ${isActive ? "text-violet-400" : "text-white/40"}`}>
              {i === 0 ? "Lesson" : i === 1 ? "Quiz" : "Record"}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

/* ────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────── */
const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const QUIZ_PROGRESS_PCT = 50;
const FINAL_PROGRESS_PCT = 100;

/** Normalize quiz rows coming from DB (accepts `correct` or `correctAnswer`) */
const normalizeQuiz = (raw: any[]): QuizQ[] =>
  (raw || []).map((q: any, i: number) => {
    // coerce options
    const options = Array.isArray(q?.options) ? q.options.map(String) : [];
    // accept zero- or one-based index; accept string/number
    let idx = Number(q?.correct ?? q?.correctAnswer ?? 0);
    if (!Number.isFinite(idx)) idx = 0;
    // if someone stored 1-based, shift down into 0-based safely
    if (idx >= 1 && idx <= options.length && !(q?.correct >= 0)) {
      idx = idx - 1;
    }
    return {
      id: q?.id ?? i + 1,
      question: String(q?.question ?? ""),
      options,
      correct: Math.max(0, Math.min(options.length - 1, idx)),
    };
  });

/** Save progress for this specific class module */
async function saveProgressForClassModule(moduleId: string, percent: number) {
  const pct = clampPct(percent);
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return;

  const { data: existing } = await supabase
    .from("student_progress")
    .select("id")
    .eq("student_id", user.id)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("student_progress")
      .update({
        progress: pct,
        completed: pct >= FINAL_PROGRESS_PCT,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("student_progress").insert({
      student_id: user.id,
      module_id: moduleId,
      progress: pct,
      completed: pct >= FINAL_PROGRESS_PCT,
      updated_at: new Date().toISOString(),
    });
  }
}

/** Guard: check student is enrolled in class_id (status active) */
async function assertStudentEnrolled(classId: string | null): Promise<boolean> {
  if (!classId) return true;
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return false;
  const { data, error } = await supabase
    .from("class_enrollments")
    .select("id")
    .eq("class_id", classId)
    .eq("student_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  return !error && !!data;
}

// File helpers
const nameFrom = (r: StorageResource) =>
  r.name || r.path?.split("/").pop() || r.url || "Resource";

const isImage = (r: StorageResource) => {
  const n = (r.name || r.path || "").toLowerCase();
  return (
    (r.mime?.startsWith("image/") ?? false) ||
    n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg") ||
    n.endsWith(".gif") || n.endsWith(".webp")
  );
};
const isPDF = (r: StorageResource) => {
  const n = (r.name || r.path || "").toLowerCase();
  return r.mime === "application/pdf" || n.endsWith(".pdf");
};
const isDocLike = (r: StorageResource) => {
  const n = (r.name || r.path || "").toLowerCase();
  return (
    r.mime?.includes("word") ||
    n.endsWith(".doc") || n.endsWith(".docx") ||
    n.endsWith(".rtf") || n.endsWith(".odt") || n.endsWith(".ppt") || n.endsWith(".pptx")
  );
};

// 🔧 Default bucket for storage paths that come without a bucket
const DEFAULT_BUCKET = "class_resources";

/** Resolve a usable URL:
 *  - If r.url provided → use as-is.
 *  - Else if {bucket?, path} → create signed URL (1h) using r.bucket || DEFAULT_BUCKET.
 *  - Guard against leading "/" in path.
 *  - Log problems for fast debugging.
 */
async function resolveResourceUrl(r: StorageResource): Promise<string | null> {
  try {
    if (r.url) return r.url;
    const bucket = (r.bucket ?? DEFAULT_BUCKET)?.trim();
    const rawPath = r.path?.trim();

    if (bucket && rawPath) {
      const cleanPath = rawPath.startsWith("/") ? rawPath.slice(1) : rawPath;
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(cleanPath, 60 * 60);
      if (error) {
        console.warn("createSignedUrl error:", { bucket, path: cleanPath, error });
        return null;
      }
      return data?.signedUrl ?? null;
    }

    console.warn("resolveResourceUrl: missing bucket/path or url", r);
    return null;
  } catch (e) {
    console.warn("resolveResourceUrl exception:", e);
    return null;
  }
}

// Online viewers (WebView can't render PDFs natively on Android)
const GV = (u: string) => `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(u)}`;
const OFFICE = (u: string) => `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(u)}`;

/* ────────────────────────────────────────────────────────────
   Sections (Lesson / Quiz / Recording) fed by DB details
   ──────────────────────────────────────────────────────────── */
function LessonSection({
  details,
  onNext,
  onBack,
  onOpenResource,
}: {
  details: DetailRow;
  onNext: () => void;
  onBack: () => void;
  onOpenResource: (r: StorageResource) => void;
}) {
  const [fade] = useState(new Animated.Value(0));
  const [slide] = useState(new Animated.Value(30));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const intro = useMemo(() => {
    const l0 = (details.lessons && details.lessons[0]) || "";
    return (l0 || "").toString();
  }, [details.lessons]);

  const importance = (details.importance || []) as string[];
  const tips = (details.tips || []) as string[];
  const resources = (details.resources || []) as StorageResource[];

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }} className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="bg-gradient-to-b from-white/5 to-white/10 rounded-2xl p-4 border border-white/10 mb-4 mx-4">
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity onPress={onBack} className="p-2 bg-white/10 rounded-full">
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">Lesson Content</Text>
            <View className="w-10" />
          </View>

          {!!intro && <Text className="text-white leading-6 text-lg mb-6">{intro}</Text>}

          {importance.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-1">
                <Ionicons name="alert-circle-outline" size={20} color="#ffffff" />
                <Text className="text-white text-lg font-semibold ml-2">Importance</Text>
              </View>
              {importance.map((imp, i) => (
                <View key={i} className="flex-row items-start mt-3 bg-white/10 p-1 rounded-lg">
                  <View className="w-5 h-5 bg-white/5 rounded-full items-center justify-center mr-3 mt-0.5">
                    <Ionicons name="star" size={10} color="#ffffff" />
                  </View>
                  <Text className="text-white/90 text-xs top-0.5 flex-1">{imp}</Text>
                </View>
              ))}
            </View>
          )}

          {tips.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="bulb-outline" size={20} color="#ffffff" />
                <Text className="text-white text-lg font-semibold ml-2">Tips & Strategies</Text>
              </View>
              {tips.map((t, i) => (
                <View key={i} className="flex-row items-start mt-3 bg-white/10 p-1 rounded-lg">
                  <View className="w-5 h-5 bg-white/5 rounded-full items-center justify-center mr-3 mt-0.5">
                    <Ionicons name="bulb" size={10} color="#ffffff" />
                  </View>
                  <Text className="text-white/90 text-xs top-0.5 flex-1">{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── RESOURCES: file list with in-app preview ── */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="folder-open-outline" size={20} color="#ffffff" />
              <Text className="text-white text-lg font-semibold ml-2">Resources</Text>
            </View>

            {resources.length === 0 ? (
              <Text className="text-white/60 text-sm">No files attached.</Text>
            ) : (
              <View>
                {resources.map((r, i) => {
                  const title = nameFrom(r);
                  const icon: keyof typeof Ionicons.glyphMap =
                    isPDF(r) ? "document-text-outline"
                    : isImage(r) ? "image-outline"
                    : isDocLike(r) ? "document-outline"
                    : "attach-outline";

                  return (
                    <TouchableOpacity
                      key={`${title}-${i}`}
                      className="flex-row items-center py-2 px-2 rounded-lg active:bg-white/10"
                      onPress={() => onOpenResource(r)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name={icon} size={20} color="#a78bfa" />
                      <Text className="text-violet-300 text-xs underline ml-3 flex-1">
                        {title}
                      </Text>
                      <Ionicons name="open-outline" size={18} color="#a78bfa" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View className="flex-row justify-between mt-1 mb-2 px-2">
            <TouchableOpacity
              onPress={onBack}
              className="py-3 px-8 rounded-xl bg-white/20 border border-white/20 flex-1 mr-3 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-white font-medium text-base">Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onNext}
              className="py-3 px-8 rounded-xl bg-violet-600 flex-1 ml-3 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

function QuizSection({
  moduleId,
  details,
  onBack,
  onNext,
}: {
  moduleId: string;
  details: DetailRow;
  onBack: () => void;
  onNext: () => void;
}) {
  const quiz = (details.quiz || []) as QuizQ[];
  const [answers, setAnswers] = useState<Record<number, number | null>>(
    Object.fromEntries(quiz.map((q, idx) => [q.id ?? idx + 1, null]))
  );
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // shuffle per question
  const [shuffled, setShuffled] = useState<Record<number, { text: string; isCorrect: boolean }[]>>({});

  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  useEffect(() => {
    const map: Record<number, { text: string; isCorrect: boolean }[]> = {};
    quiz.forEach((q, idx) => {
      const id = q.id ?? idx + 1;
      map[id] = shuffle(q.options.map((opt, oi) => ({ text: opt, isCorrect: oi === q.correct })));
    });
    setShuffled(map);
  }, [JSON.stringify(quiz)]);

  const allAnswered = useMemo(() => Object.values(answers).every((v) => v !== null), [answers]);

  const handleSubmit = () => setSubmitted(true);

  const handleDone = async () => {
    try {
      setSaving(true);
      await saveProgressForClassModule(moduleId, QUIZ_PROGRESS_PCT);
    } finally {
      setSaving(false);
      onNext();
    }
  };

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="bg-gradient-to-b from-white/5 to-white/10 rounded-2xl p-4 border border-white/10 mb-4 mx-4">
          <View className="items-center mb-3">
            <Text className="text-white text-4xl font-bold">Quiz</Text>
          </View>

          {quiz.length === 0 && (
            <Text className="text-white/70 text-center mb-6">No quiz for this module.</Text>
          )}

          {quiz.map((q, qi) => {
            const id = q.id ?? qi + 1;
            const options = shuffled[id] ?? [];
            return (
              <View key={id} className="mb-6 bg-white/5 p-4 rounded-lg border border-white/10">
                <Text className="text-white font-medium text-base mb-3">
                  {qi + 1}. {q.question}
                </Text>

                {options.map((opt, idx) => {
                  const sel = answers[id] === idx;
                  const ok = submitted && opt.isCorrect;
                  const bad = submitted && sel && !opt.isCorrect;
                  return (
                    <TouchableOpacity
                      key={idx}
                      className={`flex-row items-center px-4 py-3 rounded-lg mb-2 border ${
                        ok
                          ? "border-green-500/60 bg-green-500/10"
                          : bad
                          ? "border-red-500/60 bg-red-500/10"
                          : sel
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-white/10 bg-white/5"
                      }`}
                      onPress={() => !submitted && setAnswers((p) => ({ ...p, [id]: idx }))}
                      activeOpacity={0.8}
                    >
                      <View
                        className={`w-6 h-6 mr-3 rounded-full border-2 flex items-center justify-center ${
                          sel ? "bg-violet-600 border-violet-600" : "border-white/40"
                        }`}
                      >
                        {sel && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <Text
                        className={`text-base flex-1 ${
                          ok ? "text-green-200" : bad ? "text-red-200" : "text-white/90"
                        }`}
                      >
                        {opt.text}
                      </Text>
                      {ok && <Ionicons name="checkmark-circle" size={20} color="#22c55e" />}
                      {bad && <Ionicons name="close-circle" size={20} color="#ef4444" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}

          {!submitted ? (
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={onBack}
                className="py-4 px-6 rounded-xl bg-white/20 border border-white/20 flex-1 mr-3 items-center justify-center"
                activeOpacity={0.7}
              >
                <Text className="text-white font-medium text-base">Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                className="py-4 px-6 rounded-xl bg-violet-600 flex-1 ml-3 items-center justify-center"
                disabled={!allAnswered && quiz.length > 0}
                style={{ opacity: allAnswered || quiz.length === 0 ? 1 : 0.6 }}
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-base">
                  {quiz.length === 0 ? "Skip" : "Submit Quiz"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mt-2 mb-1">
              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={() => {
                    // retake
                    setSubmitted(false);
                    const init = Object.fromEntries(quiz.map((q, idx) => [q.id ?? idx + 1, null]));
                    setAnswers(init);
                    // reshuffle
                    const map: Record<number, { text: string; isCorrect: boolean }[]> = {};
                    quiz.forEach((q, idx) => {
                      const id2 = q.id ?? idx + 1;
                      map[id2] = shuffle(q.options.map((opt, oi) => ({ text: opt, isCorrect: oi === q.correct })));
                    });
                    setShuffled(map);
                  }}
                  className="py-3 px-6 rounded-xl bg-white/10 border border-white/20 items-center justify-center flex-1 mr-2"
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-medium text-base">Retake Quiz</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    await handleDone();
                  }}
                  className="py-3 px-6 rounded-xl bg-violet-600 items-center justify-center flex-1 ml-2"
                  activeOpacity={0.8}
                  disabled={saving}
                  style={{ opacity: saving ? 0.7 : 1 }}
                >
                  <Text className="text-white font-semibold text-base">{saving ? "Saving…" : "Done"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function RecordingSection({
  moduleId,
  moduleTitle, // NEW
  details,
  onBack,
}: {
  moduleId: string;
  moduleTitle: string; // NEW
  details: DetailRow;
  onBack: () => void;
}) {
  const rubric = (details.rubric || []) as RubricItem[];
  const taskBody = (details.task_body || "").toString();

  const handleStartRecording = async () => {
  try {
    await saveProgressForClassModule(moduleId, FINAL_PROGRESS_PCT);

    // Keep your three fields:
    const lessonPrompt =
      (details.task_instructions?.[0]?.trim()) ||
      "List an instruction sentence so that the student states their name, grade level, and hobby.";

    const topic = (moduleTitle || "").trim() || "Class Module Task";

    const criteria =
      (details.rubric?.map(r => r?.label).filter(Boolean).slice(0, 6).join(", ")) ||
      "Clarity, Delivery, Organization";

    // Build script ONLY from task_body + task_instructions (NO lessons)
    const scriptLines: string[] = [];

    if (details.task_body && String(details.task_body).trim()) {
      scriptLines.push(String(details.task_body).trim());
    }

    if (Array.isArray(details.task_instructions) && details.task_instructions.length > 0) {
      scriptLines.push(
        ...details.task_instructions
          .map(t => (t == null ? "" : String(t).trim()))
          .filter(Boolean)
      );
    }

    if (scriptLines.length === 0) {
      // final fallback so screen still works
      scriptLines.push(lessonPrompt);
    }

    const generatedScript = scriptLines.join("\n").slice(0, 4000);

    router.push({
      pathname: "/StudentScreen/SpeakingExercise/private-video-recording",
      params: {
        lessonPrompt,
        topic,
        criteria,
        module_id: moduleId,
        module_title: encodeURIComponent(topic),
        generatedScript, // now tasks-only
      },
    });
  } catch (e) {
    Alert.alert("Error", "Failed to save progress. Please try again.");
  }
};


  return (
    <View className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="bg-gradient-to-b from-white/5 to-white/10 rounded-2xl p-4 border border-white/10 mt-10 mb-4 mx-4">
          <View className="items-center">
            <Text className="text-white text-2xl font-bold">Recording Task</Text>
          </View>

          {!!taskBody && (
            <View className="mb-10">
              <Text className="text-white text-sm top-4 leading-5">{taskBody}</Text>
            </View>
          )}

          {rubric.length > 0 && (
            <View className="mb-5">
              <View className="flex-row items-center mb-3">
                <Ionicons name="list-outline" size={18} color="#ffffff" />
                <Text className="text-white text-base font-semibold ml-2">Evaluation Rubric</Text>
              </View>

              <View className="border-2 border-white/20 rounded-lg overflow-hidden">
                {/* Header */}
                <View className="flex-row bg-white/10">
                  <View className="w-1/4 p-2 border-r-2 border-white/20">
                    <Text className="text-white font-medium text-xs">Criteria</Text>
                  </View>
                  <View className="w-1/4 p-2 border-r-2 border-white/20 items-center justify-center">
                    <Text className="text-white font-bold text-sm">High</Text>
                  </View>
                  <View className="w-1/4 p-2 border-r-2 border-white/20 items-center justify-center">
                    <Text className="text-white font-bold text-sm">Medium</Text>
                  </View>
                  <View className="w-1/4 p-2 items-center justify-center">
                    <Text className="text-white font-bold text-sm">Low</Text>
                  </View>
                </View>

                {rubric.slice(0, 6).map((item, i) => (
                  <View key={i} className="border-t-2 border-white/10">
                    <View className="flex-row min-h-[90px]">
                      <View className="w-1/4 p-2 border-r-2 border-white/10">
                        <Text className="text-white text-xs font-medium">{item.label}</Text>
                      </View>
                      <View className="w-1/4 p-2 border-r-2 border-white/10">
                        <Text className="text-white/90 text-[11px] leading-4">{item.descriptions?.high}</Text>
                      </View>
                      <View className="w-1/4 p-2 border-r-2 border-white/10">
                        <Text className="text-white/90 text-[11px] leading-4">{item.descriptions?.medium}</Text>
                      </View>
                      <View className="w-1/4 p-2">
                        <Text className="text-white/90 text-[11px] leading-4">{item.descriptions?.low}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View className="flex-row justify-between mt-2 space-x-3">
            <TouchableOpacity
              onPress={onBack}
              className="py-3 px-4 rounded-xl bg-white/10 border border-white/20 flex-1 items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-white font-medium text-sm">Back to Quiz</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleStartRecording}
              className="py-3 px-4 rounded-xl bg-violet-600 flex-1 items-center justify-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-sm">Start Recording</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────
   Screen
   ──────────────────────────────────────────────────────────── */
export default function ClassModuleScreen() {
  const params = useLocalSearchParams();
  const moduleId = (params.moduleId as string) || "";
  const classId = (params.classId as string) || "";

  const [loading, setLoading] = useState(true);
  const [notAllowed, setNotAllowed] = useState(false);
  const [cm, setCM] = useState<ClassModuleRow | null>(null);
  const [details, setDetails] = useState<DetailRow | null>(null);
  const [section, setSection] = useState<number>(0); // 0 lesson / 1 quiz / 2 record
  const scrollRef = useRef<ScrollView>(null);

  // Preview modal state (lifted to screen so LessonSection can trigger it)
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);      // viewer URL
  const [previewType, setPreviewType] = useState<"pdf" | "image" | "doc" | "other">("other");
  const [previewLoading, setPreviewLoading] = useState(false);

  // NEW: original signed URL + download states
  const [previewRawUrl, setPreviewRawUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadPct, setDownloadPct] = useState(0);

  // Helpers for external open / download
  const sanitizeFilename = (name: string) =>
    name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").slice(0, 120) || "file";

  const handleOpenExternally = useCallback(async () => {
    if (!previewRawUrl) return;
    const can = await Linking.canOpenURL(previewRawUrl);
    if (!can) {
      Alert.alert("Can't open", "No app can open this file link.");
      return;
    }
    Linking.openURL(previewRawUrl);
  }, [previewRawUrl]);

  const handleDownload = useCallback(async () => {
    if (!previewRawUrl) return;
    try {
      setDownloading(true);
      setDownloadPct(0);

      const filename = sanitizeFilename(previewTitle || "download");
      const localUri = FileSystem.documentDirectory + filename;

      const downloadResumable = FileSystem.createDownloadResumable(
        previewRawUrl,
        localUri,
        {},
        (progress) => {
          const pct = progress.totalBytesExpectedToWrite
            ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
            : 0;
          setDownloadPct(Math.round(pct * 100));
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (!result?.uri) {
        Alert.alert("Download failed", "The file could not be saved.");
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri);
      } else {
        Alert.alert("Downloaded", `Saved to: ${result.uri}`);
      }
    } catch (e) {
      console.warn("download error", e);
      Alert.alert("Download error", "We couldn't download this file.");
    } finally {
      setDownloading(false);
      setDownloadPct(0);
    }
  }, [previewRawUrl, previewTitle]);

  const openResource = useCallback(async (r: StorageResource) => {
    setPreviewLoading(true);
    setPreviewTitle(nameFrom(r));
    try {
      // raw (signed or public) URL
      let rawUrl = await resolveResourceUrl(r);
      if (!rawUrl) {
        Alert.alert("Unable to open file", "This resource could not be resolved.");
        setPreviewLoading(false);
        return;
      }
      setPreviewRawUrl(rawUrl);

      // viewer URL for WebView
      let url = rawUrl;
      if (isImage(r)) {
        setPreviewType("image");
      } else if (isPDF(r)) {
        url = GV(rawUrl);
        setPreviewType("doc");
      } else if (isDocLike(r)) {
        url = OFFICE(rawUrl);
        setPreviewType("doc");
      } else {
        setPreviewType("other");
      }

      setPreviewUrl(url);
      setPreviewVisible(true);
    } catch (e) {
      console.warn("openResource error:", e, r);
      Alert.alert("Preview error", "We couldn't open this file.");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // Scroll to top on section change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ y: 0, animated: true });
  }, [section]);

  // Load + guard
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        if (!moduleId) {
          setNotAllowed(true);
          return;
        }

        const { data: mod, error: modErr } = await supabase
          .from("class_modules")
          .select("id, class_id, teacher_id, title, body, resource_url, module_type, due_at")
          .eq("id", moduleId)
          .maybeSingle();

        if (modErr || !mod) {
          setNotAllowed(true);
          return;
        }

        const ok = await assertStudentEnrolled(mod.class_id);
        if (!ok) {
          setNotAllowed(true);
          return;
        }

        const { data: det, error: detErr } = await supabase
          .from("class_module_details")
          .select("*")
          .eq("module_id", moduleId)
          .maybeSingle();

        if (detErr) {
          setNotAllowed(true);
          return;
        }

        if (cancelled) return;
        setCM(mod as ClassModuleRow);

        const coerced: DetailRow = {
          module_id: mod.id,
          lessons: det?.lessons ?? [],
          importance: det?.importance ?? [],
          tips: det?.tips ?? [],
          task_body: det?.task_body ?? "",
          task_instructions: det?.task_instructions ?? [],
          rubric: det?.rubric ?? [],
          quiz: normalizeQuiz(det?.quiz ?? []),            // <-- normalized here
          resources: (det?.resources ?? []) as StorageResource[],
          updated_at: det?.updated_at ?? null,
        };
        setDetails(coerced);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  // Realtime refresh
  useEffect(() => {
    if (!moduleId) return;

    const ch1 = supabase
      .channel(`cmdetails:${moduleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "class_module_details", filter: `module_id=eq.${moduleId}` },
        async () => {
          const { data: det } = await supabase
            .from("class_module_details")
            .select("*")
            .eq("module_id", moduleId)
            .maybeSingle();

          const next: DetailRow = {
            module_id: moduleId,
            lessons: det?.lessons ?? [],
            importance: det?.importance ?? [],
            tips: det?.tips ?? [],
            task_body: det?.task_body ?? "",
            task_instructions: det?.task_instructions ?? [],
            rubric: det?.rubric ?? [],
            quiz: normalizeQuiz(det?.quiz ?? []),          // <-- normalized here too
            resources: (det?.resources ?? []) as StorageResource[],
            updated_at: det?.updated_at ?? null,
          };
          setDetails(next);
        }
      )
      .subscribe();

    const ch2 = supabase
      .channel(`class_modules:${moduleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "class_modules", filter: `id=eq.${moduleId}` },
        async () => {
          const { data } = await supabase
            .from("class_modules")
            .select("id, class_id, teacher_id, title, body, resource_url, module_type, due_at")
            .eq("id", moduleId)
            .maybeSingle();
          setCM((data as ClassModuleRow) || null);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(ch1);
        supabase.removeChannel(ch2);
      } catch {}
    };
  }, [moduleId]);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <BackgroundDecor />
        <StatusBar barStyle="light-content" />
        <Text className="text-white/80">Loading module…</Text>
      </View>
    );
  }

  if (notAllowed || !cm || !details) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center px-6">
        <BackgroundDecor />
        <StatusBar barStyle="light-content" />
        <Ionicons name="lock-closed-outline" size={28} color="#fff" />
        <Text className="text-white font-semibold text-lg mt-2 text-center">
          You don't have access to this module.
        </Text>
        <Text className="text-white/70 text-xs mt-1 text-center">
          Make sure you're enrolled in this class and the module is available.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-4 py-2 rounded-lg bg-white/10 border border-white/20"
        >
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const headerSubtitle =
    (cm.module_type === "SPEAKING" ? "Speaking" : "Reading") +
    (cm.due_at ? ` • Due ${new Date(cm.due_at).toLocaleString()}` : "");

  return (
    <View className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" />
      <BackgroundDecor />

      <ScrollView
        ref={scrollRef}
        className="flex-1 z-10"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 0 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-10 px-4 pb-2">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()} className="p-2 bg-white/10 rounded-full">
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold" numberOfLines={1}>
              {cm.title || "Class Module"}
            </Text>
            <View className="w-10" />
          </View>

          <Text className="text-violet-400 text-xs mt-2">{headerSubtitle}</Text>
          <SectionIndicator currentSection={section} />
        </View>

        <View className="flex-1">
          {section === 0 && (
            <LessonSection
              details={details}
              onNext={() => setSection(1)}
              onBack={() => router.back()}
              onOpenResource={openResource}
            />
          )}
          {section === 1 && (
            <QuizSection
              moduleId={cm.id}
              details={details}
              onBack={() => setSection(0)}
              onNext={() => setSection(2)}
            />
          )}
          {section === 2 && (
            <RecordingSection
              moduleId={cm.id}
              moduleTitle={cm.title}   // NEW: so topic = module title
              details={details}
              onBack={() => setSection(1)}
            />
          )}
        </View>
      </ScrollView>

      {/* ─────────────── Preview Modal ─────────────── */}
      <Modal visible={previewVisible} animationType="slide" onRequestClose={() => setPreviewVisible(false)}>
        <View className="flex-1 bg-slate-900">
          {/* Header with Close / Open / Download */}
          <View className="px-4 pt-12 pb-3 flex-row items-center">
            <TouchableOpacity
              onPress={() => setPreviewVisible(false)}
              className="bg-white/10 rounded-full p-2"
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>

            <Text className="text-white text-sm ml-3 flex-1" numberOfLines={1}>
              {previewTitle}
            </Text>

            <TouchableOpacity
              onPress={handleOpenExternally}
              className="bg-white/10 rounded-lg px-3 py-2 mr-2"
              activeOpacity={0.8}
              disabled={!previewRawUrl}
              style={{ opacity: previewRawUrl ? 1 : 0.6 }}
            >
              <Text className="text-white text-xs">Open</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDownload}
              className="bg-violet-600 rounded-lg px-3 py-2"
              activeOpacity={0.8}
              disabled={!previewRawUrl || downloading}
              style={{ opacity: (!previewRawUrl || downloading) ? 0.7 : 1 }}
            >
              <Text className="text-white text-xs">
                {downloading ? `Downloading… ${downloadPct}%` : "Download"}
              </Text>
            </TouchableOpacity>
          </View>

          {previewLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" />
              <Text className="text-white mt-3">Loading file…</Text>
            </View>
          ) : !previewUrl ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-white/70">No preview available.</Text>
            </View>
          ) : previewType === "image" ? (
            <View className="flex-1 items-center justify-center px-4">
              <Image
                source={{ uri: previewUrl }}
                style={{ width: width - 24, height: (width - 24) * 1.3, resizeMode: "contain" }}
              />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <WebView
                originWhitelist={["*"]}
                source={{ uri: previewUrl }}
                startInLoadingState
                renderLoading={() => (
                  <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" />
                  </View>
                )}
                allowsInlineMediaPlayback
                javaScriptEnabled
                domStorageEnabled
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
