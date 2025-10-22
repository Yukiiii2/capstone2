// app/StudentScreen/ReadingExercise/full-result-reading.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ViewStyle,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabaseClient";

/* ───────── helpers/typing (no UI changes) ───────── */
const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const fmtPct = (n: number) => `${clampPct(n)}%`;
const widthStyle = (n: number): ViewStyle => ({ width: `${clampPct(n)}%` as `${number}%` });

type Trend = "up" | "down";
type Metric = {
  label: string;
  value: number; // 0..100
  icon: keyof typeof Ionicons.glyphMap;
  trend: Trend;
};

export default function FullResultReading() {
  const router = useRouter();

  // -------- read params (same idea as speaking) ----------
  const { level, module_id, module_title, score } = useLocalSearchParams<{
    level?: string;          // "basic" | "advanced"
    module_id?: string;      // uuid
    module_title?: string;   // modules.title
    score?: string;          // e.g. "78"
  }>();

  // clamp + derive UI numbers (keeps your visuals intact)
  const uiScore = useMemo(() => {
    const n = Number(score);
    return Number.isFinite(n) ? clampPct(n) : 78;
  }, [score]);

  /* ───────── module resolution + next (mirrors speaking) ───────── */
  const [currentModule, setCurrentModule] = useState<{
    id: string | null;
    title: string | null;
    level: "basic" | "advanced";
    order_index: number | null;
  }>({
    id: module_id ?? null,
    title: module_title ?? null,
    level: level === "advanced" ? "advanced" : "basic",
    order_index: null,
  });

  const [nextModule, setNextModule] = useState<{ id: string | null; title: string | null } | null>(null);

  const resolveModule = useCallback(async () => {
    try {
      if (currentModule.id) {
        const { data } = await supabase
          .from("modules")
          .select("id, title, order_index")
          .eq("id", currentModule.id)
          .maybeSingle();
        if (data) {
          setCurrentModule((prev) => ({
            ...prev,
            order_index: data.order_index ?? prev.order_index,
            title: prev.title ?? data.title,
          }));
        }
        return;
      }

      if (currentModule.title) {
        const { data } = await supabase
          .from("modules")
          .select("id, title, level, order_index")
          .eq("category", "reading")
          .eq("level", currentModule.level)
          .eq("active", true)
          .ilike("title", currentModule.title)
          .limit(1);

        if (data && data.length) {
          const m = data[0];
          setCurrentModule({
            id: m.id,
            title: m.title,
            level: m.level === "advanced" ? "advanced" : "basic",
            order_index: m.order_index ?? null,
          });
          return;
        }
      }

      const { data: first } = await supabase
        .from("modules")
        .select("id, title, level, order_index")
        .eq("category", "reading")
        .eq("level", currentModule.level)
        .eq("active", true)
        .order("order_index", { ascending: true })
        .limit(1);

      if (first && first.length) {
        const m = first[0];
        setCurrentModule({
          id: m.id,
          title: m.title,
          level: m.level === "advanced" ? "advanced" : "basic",
          order_index: m.order_index ?? null,
        });
      }
    } catch {
      // no-op
    }
  }, [currentModule.id, currentModule.level, currentModule.title]);

  const resolveNextModule = useCallback(async () => {
    try {
      const curOrder = currentModule.order_index ?? -1;
      const { data } = await supabase
        .from("modules")
        .select("id, title, order_index")
        .eq("category", "reading")
        .eq("level", currentModule.level)
        .eq("active", true)
        .gt("order_index", curOrder)
        .order("order_index", { ascending: true })
        .limit(1);

      if (data && data.length) setNextModule({ id: data[0].id, title: data[0].title });
      else setNextModule(null);
    } catch {
      setNextModule(null);
    }
  }, [currentModule.level, currentModule.order_index]);

  /* ───────── attempts + progress (mirrors speaking logic) ───────── */

  // compute next attempt_number per (student, module)
  const computeNextAttemptNumber = useCallback(
    async (studentId: string): Promise<number> => {
      try {
        if (!currentModule.id) return 1;
        const { count } = await supabase
          .from("attempts")
          .select("id", { head: true, count: "exact" })
          .eq("student_id", studentId)
          .eq("module_id", currentModule.id)
          .eq("category", "reading");
        return (typeof count === "number" ? count : 0) + 1;
      } catch {
        return 1;
      }
    },
    [currentModule.id]
  );

  const logAttempt = useCallback(
    async (studentId: string, finalScore: number) => {
      try {
        const attempt_number = await computeNextAttemptNumber(studentId);
        await supabase.from("attempts").insert([
          {
            student_id: studentId,
            module_id: currentModule.id,
            attempt_number,
            score: finalScore,
            category: "reading",
            level: currentModule.level,
            session_id: null, // no session id for reading; adjust if you add one
          } as any,
        ]);
      } catch {
        // ignore
      }
    },
    [currentModule.id, currentModule.level, computeNextAttemptNumber]
  );

  // BASIC rule from speaking version:
  // on landing full-results, mark THIS module as 100% complete for the student.
  const applyFullResultsRuleInlineReading = useCallback(
    async (moduleId: string) => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user || !moduleId) return;

        const now = new Date().toISOString();
        await supabase
          .from("student_progress")
          .upsert(
            {
              student_id: user.id,
              module_id: moduleId,
              progress: 100,
              completed: true,
              category: "reading",
              updated_at: now,
            } as any,
            { onConflict: "student_id,module_id", ignoreDuplicates: false }
          );

        // hard-cap any rogue >100
        await supabase
          .from("student_progress")
          .update({ progress: 100, updated_at: now })
          .eq("student_id", user.id)
          .eq("module_id", moduleId)
          .gt("progress", 100);
      } catch {
        // swallow errors
      }
    },
    []
  );

  /* ───────── metrics derived from score (keeps your bar UI) ───────── */
  const [metrics, setMetrics] = useState<Metric[] | null>(null);
  const deriveMetrics = (p: number): Metric[] => ([
    { label: "Fluency Score", value: clampPct(p),        icon: "bar-chart",    trend: "up" },
    { label: "Clarity Precision", value: clampPct(p - 4), icon: "volume-high",  trend: "up" },
    { label: "Filler Word Reduction", value: clampPct(p - 2), icon: "time",        trend: "up" },
    { label: "Speaking Rate (WPM)", value: clampPct(p - 5), icon: "pulse",       trend: "up" },
  ]);

  useEffect(() => setMetrics(deriveMetrics(uiScore)), [uiScore]);

  // run once, like speaking
  const savedOnceRef = useRef(false);
  useEffect(() => {
    (async () => {
      await resolveModule();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentModule.order_index !== null || currentModule.id || currentModule.title) {
      resolveNextModule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModule.order_index, currentModule.id, currentModule.title]);

  // ⬇️ THIS is the key bit: when landing on this page, write attempt + progress (once)
  useEffect(() => {
    (async () => {
      if (savedOnceRef.current) return;
      if (!currentModule.id) return;

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      savedOnceRef.current = true;

      // 1) write attempt (use uiScore as the final score source here)
      await logAttempt(user.id, uiScore);

      // 2) mark module 100% (reading)
      await applyFullResultsRuleInlineReading(currentModule.id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModule.id, uiScore]);

  /**
   * Background decoration component
   */
  const BackgroundDecor = () => (
    <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
      {/* Gradient Background */}
      <View className="absolute inset-0">
        <LinearGradient colors={["#0F172A", "#1E293B", "#0F172A"]} style={{ flex: 1 }} />
      </View>

      {/* Decorative Circles */}
      <View className="absolute w-40 h-40 bg-[#a78bfa]/10 rounded-full -top-20 -left-20" />
      <View className="absolute w-24 h-24 bg-[#a78bfa]/10 rounded-full top-1/4 -right-12" />
      <View className="absolute w-32 h-32 bg-[#a78bfa]/5 rounded-full top-1/3 -left-16" />
      <View className="absolute w-48 h-48 bg-[#a78bfa]/5 rounded-full bottom-1/4 -right-24" />
      <View className="absolute w-28 h-28 bg-[#a78bfa]/5 rounded-full bottom-2 right-8" />
      <View className="absolute w-28 h-28 bg-[#a78bfa]/5 rounded-full top-15 right-12" />
      <View className="absolute w-32 h-32 bg-[#a78bfa]/5 rounded-full bottom-24 left-1/6" />
    </View>
  );

  return (
    <View className="flex-1 bg-gray-900">
      {/* Full screen background with status bar cover */}
      <View className="absolute top-0 left-0 right-0 bottom-0 bg-gray-900">
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View className="flex-1 bg-gray-900 pt-12">
          <BackgroundDecor />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="w-full max-w-[1000px] self-center px-4">
          {/* Header with back button only */}
          <View className="flex-row items-start w-full left-0.1 top-1 mt-4">
            <TouchableOpacity className="p-3 -ml-1" onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Detailed Analysis Heading */}
        <View className="mx-4 mb-5 -mt-3">
          <Text className="text-white font-bold text-xl text-center">AI DETAILED ANALYSIS</Text>
        </View>

        {/* Confidence Card */}
        <View className="mx-4 mb-6 p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl">
          <View className="flex-row items-start">
            {/* Left side - Confidence Circle */}
            <View className="relative w-24 h-24 items-center justify-center top-5">
              <View className="w-20 h-20 items-center justify-center">
                <View className="w-20 h-20 rounded-full border-4 border-[#8A5CFF] items-center justify-center">
                  <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center shadow-lg">
                    <Text className="text-2xl font-bold items-center justify-center text-white">
                      {fmtPct(uiScore)}
                    </Text>
                  </View>
                </View>
                <View className="bg-[#8A5CFF] px-2 py-1 rounded-lg -bottom-2 -mb-7 items-center justify-center top-3">
                  <Text className="text-xs font-normal items-center justify-center text-white">Confidence</Text>
                </View>
              </View>
            </View>

            {/* Right side - Details */}
            <View className="flex-1 ml-6">
              <Text className="text-white font-semibold text-lg mb-2">Reading Proficiency</Text>
              <Text className="text-sm text-gray-300 leading-relaxed">
                Your reading skills demonstrate strong comprehension and analysis.
                Build speed and vocabulary to improve further.
              </Text>
            </View>
          </View>
        </View>

        {/* Strengths & Improvements */}
        <View className="mx-4 flex-row space-x-4 mb-6">
          {/* Strengths Card */}
          <View className="flex-1 p-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/20">
            <View className="flex-row items-center mb-3">
              <View className="right-2.5 w-8 h-8 rounded-lg bg-[#FFFFFF]/10 items-center justify-center mr-2">
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              </View>
              <Text className="right-3 text-white font-medium text-lg">Key Strengths</Text>
            </View>
            <View className="bottom-1 space-y-4 top-4">
              {[
                { skill: "Volume",       level: clampPct(uiScore + 7), trend: "up" as Trend },
                { skill: "Pacing",       level: clampPct(uiScore + 0), trend: "up" as Trend },
                { skill: "Grammar",      level: clampPct(uiScore + 4), trend: "up" as Trend },
                { skill: "Phrasing",     level: clampPct(uiScore + 2), trend: "up" as Trend },
              ].map((item, i) => (
                <View key={i} className="space-y-1">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Text className="text-sm text-gray-300 mr-1">{item.skill}</Text>
                      <Ionicons
                        name={item.trend === "up" ? "trending-up" : "trending-down"}
                        size={12}
                        color={item.trend === "up" ? "#00FF00" : "#FF0000"}
                      />
                    </View>
                    <Text className="text-xs text-[#FFFFFF]">{fmtPct(item.level)}</Text>
                  </View>
                  <View className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-gradient-to-r from-[#8A5CFF] to-[#a78bfa]"
                      style={widthStyle(item.level)}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Improvements Card */}
          <View className="flex-1 p-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/20">
            <View className="flex-row items-center mb-3">
              <View className="bottom-2.5 right-2.5 w-8 h-8 rounded-lg bg-[#FFFFFF]/10 items-center justify-center mr-2">
                <Ionicons name="trending-up" size={16} color="#FFFFFF" />
              </View>
              <Text className="right-2 text-white font-medium text-base bottom-2">Improvement Areas</Text>
            </View>
            <View className="bottom-1 space-y-4">
              {[
                { skill: "Clarity",       level: clampPct(100 - (uiScore - 10)), trend: "down" as Trend },
                { skill: "Vocal Tone",    level: clampPct(100 - (uiScore - 6)),  trend: "down" as Trend },
                { skill: "Accuracy",      level: clampPct(100 - (uiScore - 8)),  trend: "down" as Trend },
                { skill: "Pronunciation", level: clampPct(100 - (uiScore - 2)),  trend: "down" as Trend },
              ].map((item, i) => (
                <View key={i} className="space-y-1">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Text className="text-sm text-gray-300 mr-1">{item.skill}</Text>
                      <Ionicons
                        name={item.trend === "up" ? "trending-up" : "trending-down"}
                        size={12}
                        color={item.trend === "up" ? "#00FF00" : "#FF0000"}
                      />
                    </View>
                    <Text className="text-xs text-[#FFFFFF]">{fmtPct(item.level)}</Text>
                  </View>
                  <View className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-gradient-to-r from-[#8A5CFF] to-[#a78bfa]"
                      style={widthStyle(item.level)}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Performance Breakdown */}
        <View className="mx-4 p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/20 mb-6">
          <View className="mb-6">
            <Text className="text-white font-semibold text-lg">Performance Metrics</Text>
            <Text className="text-gray-400 text-sm">Detailed analysis of your speaking performance</Text>
          </View>

          <View className="space-y-6">
            {(metrics ?? []).map((item, i) => {
              const isPositive = item.trend === "up";
              const trendColor = isPositive ? "#10B981" : "#EF4444";

              return (
                <View key={i} className="space-y-2">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-lg bg-white/10 items-center justify-center mr-3">
                        <Ionicons name={item.icon as any} size={16} color="#FFFFFF" />
                      </View>
                      <Text className="text-gray-300 text-sm font-medium">{item.label}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons
                        name={isPositive ? "trending-up" : "trending-down"}
                        size={16}
                        color={trendColor}
                        style={{ marginRight: 0.1 }}
                      />
                      <Text className="text-white font-semibold text-sm ml-3 w-10 text-right">
                        {fmtPct(item.value)}
                      </Text>
                    </View>
                  </View>
                  <View className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <View className="h-full rounded-full overflow-hidden" style={widthStyle(item.value)}>
                      <LinearGradient
                        colors={["#8A5CFF", "#A78BFA"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="w-full h-full rounded-full"
                      />
                    </View>
                  </View>
                </View>
              );
            })}
            {!metrics && (
              <View className="items-center justify-center py-6">
                <ActivityIndicator />
              </View>
            )}
          </View>
        </View>

        {/* Call to Action */}
        <View className="mx-4 p-6 bg-white/5 rounded-3xl border border-white/20 mb-10 overflow-hidden">
          <View className="relative z-10">
            <View className="flex-row items-center justify-center mb-4">
              <Text className="text-white font-semibold text-2xl">Next Steps</Text>
            </View>

            <Text className="text-gray-200 text-center text-sm leading-relaxed mb-6">
              Your speaking assessment is complete. Based on your performance,
              we've identified key areas to focus on in your learning journey.
            </Text>

            <View className="space-y-3 mb-6 top-2">
              <View className="flex-row items-start">
                <View className="w-5 h-5 rounded-full bg-[#90EE90]/70 items-center justify-center mt-0.5 mr-3 ">
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginTop: 1 }} />
                </View>
                <Text className="text-gray-200 bottom-1.5 text-sm flex-1">
                  <Text className="font-medium text-white">Personalized exercises tailored to your improvement areas</Text>
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-5 h-5 rounded-full bg-[#90EE90]/70 items-center justify-center mt-0.5 mr-3">
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginTop: 1 }} />
                </View>
                <Text className="text-gray-200 bottom-1 text-sm flex-1">
                  <Text className="font-medium text-white">Track your progress over time with detailed analytics</Text>
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-5 h-5 rounded-full bg-[#90EE90]/70 items-center justify-center mt-0.5 mr-3">
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginTop: 1 }} />
                </View>
                <Text className="text-gray-200 top-1 text-sm flex-1">
                  <Text className="font-medium text-white">Expert feedback on your speaking patterns</Text>
                </Text>
              </View>
            </View>

            <View className="flex-row space-x-4 mt-6">
              <TouchableOpacity
                className="flex-row items-center bg-violet-500/80 border border-white/30 px-6 py-2.5 rounded-xl w-[45%] justify-center"
                activeOpacity={0.9}
                onPress={() => router.replace("/student-voice-reading-recording")}
              >
                <Text className="text-white font-semibold text-base">Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center bg-white/30 border border-white/40 px-6 py-2.5 rounded-xl w-[47%] justify-center"
                activeOpacity={0.9}
                onPress={() => router.replace("/home-page")}
              >
                <Text className="text-white font-semibold text-base">Home</Text>
              </TouchableOpacity>
            </View>

            {nextModule?.title && (
              <View className="items-center mt-4">
                <Text className="text-gray-300 text-xs">
                  Next up: <Text className="text-white">{nextModule.title}</Text>
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
