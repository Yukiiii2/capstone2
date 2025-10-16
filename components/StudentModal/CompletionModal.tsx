import React, { useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import Markdown from "react-native-simple-markdown";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabaseClient";

interface CompletionModalProps {
  visible: boolean;
  onClose: () => void;
  onLater: () => void;
  onSeeResults: () => void;

  // existing
  ai_feedback: string | null;
  isProcessing: boolean;
  showResultsPrompt?: boolean;

  // NEW (optional) – pass these when you have them so we can unlock the next module
  attempt_id?: string | null;
  session_id?: string | null;
  module_id?: string | null;         // REQUIRED to update the correct row
  module_title?: string | null;      // optional; used only as fallback
  level?: "basic" | "advanced" | string | null; // defaults to "basic" if missing
}

const clampPct = (n: number) =>
  Math.max(0, Math.min(100, Math.round(Number.isFinite(n as any) ? (n as any) : 0)));

const CompletionModal: React.FC<CompletionModalProps> = ({
  visible,
  onClose,
  onLater,
  onSeeResults,
  ai_feedback,
  isProcessing,
  showResultsPrompt,

  // NEW
  attempt_id,
  session_id,
  module_id,
  module_title,
  level,
}) => {
  const didSaveRef = useRef(false);
  const lvl = useMemo<"basic" | "advanced">(
    () => (level === "advanced" ? "advanced" : "basic"),
    [level]
  );

  // Pull last AI score from feedback_ai (attempt OR session), fallback to 100 if none.
  const fetchFinalScore = useCallback(async (): Promise<number> => {
    const key = attempt_id || session_id;
    if (!key) return 100;

    const col = attempt_id ? "attempt_id" : "session_id";
    const { data, error } = await supabase
      .from("feedback_ai")
      .select("evaluation")
      .eq(col, key)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !data?.length) return 100;

    // find first numeric score
    for (const row of data) {
      const ev = row?.evaluation as any;
      const s =
        typeof ev?.final_score === "number"
          ? ev.final_score
          : typeof ev?.score === "number"
          ? ev.score
          : null;
      if (s != null) return clampPct(s);
    }
    return 100;
  }, [attempt_id, session_id]);

  // Insert attempts (optional) – safe to keep; won’t break anything if table exists
  const logAttempt = useCallback(
    async (userId: string, score: number) => {
      try {
        await supabase.from("attempts").insert([
          {
            user_id: userId,
            module_id: module_id ?? null,
            score,
            category: "speaking",
            level: lvl,
            session_id: session_id ?? null,
            attempt_ref: attempt_id ?? null,
          } as any,
        ]);
      } catch {
        // ignore
      }
    },
    [attempt_id, session_id, module_id, lvl]
  );

  // Upsert student_progress so the next module unlocks (basic-contents/advanced-contents read this)
  const upsertStudentProgress = useCallback(
    async (userId: string, score: number) => {
      if (!module_id && !module_title) return; // need at least one key

      // You’ve been reading with student_id in other screens, so use student_id here too.
      const payload: any = {
        student_id: userId,
        category: "speaking",
        level: lvl,
        progress: clampPct(score), // set to 100 if you want to force complete; uses score here
        completed: clampPct(score) >= 100,
        updated_at: new Date().toISOString(),
      };
      if (module_id) payload.module_id = module_id;
      if (module_title) payload.module = module_title;

      // Try upsert on the unique key (module_id if present; otherwise on (student_id, module))
      if (module_id) {
        const { error } = await supabase
          .from("student_progress")
          .upsert(payload, { onConflict: "student_id,module_id" });

        if (!error) return;

        // fallback defensive update/insert
        const { data: existing } = await supabase
          .from("student_progress")
          .select("id")
          .eq("student_id", userId)
          .eq("module_id", module_id)
          .maybeSingle();

        if (existing?.id) {
          await supabase.from("student_progress").update(payload).eq("id", existing.id);
        } else {
          await supabase.from("student_progress").insert(payload);
        }
      } else {
        // no module_id – fall back on module title (not ideal but better than nothing)
        const { error } = await supabase
          .from("student_progress")
          .upsert(payload, { onConflict: "student_id,module" });

        if (!error) return;

        const { data: existing } = await supabase
          .from("student_progress")
          .select("id")
          .eq("student_id", userId)
          .eq("module", module_title ?? "")
          .maybeSingle();

        if (existing?.id) {
          await supabase.from("student_progress").update(payload).eq("id", existing.id);
        } else {
          await supabase.from("student_progress").insert(payload);
        }
      }
    },
    [module_id, module_title, lvl]
  );

  // Aggregate (optional): keeps your overall % row updated per level
  const upsertAggregateRow = useCallback(
    async (userId: string) => {
      try {
        const { data: allMods } = await supabase
          .from("modules")
          .select("id")
          .eq("category", "speaking")
          .eq("level", lvl)
          .eq("active", true);

        const total = allMods?.length ?? 0;

        const { data: done } = await supabase
          .from("student_progress")
          .select("id")
          .eq("student_id", userId)
          .eq("category", "speaking")
          .eq("level", lvl)
          .eq("completed", true);

        const completed = done?.length ?? 0;
        const overall = total > 0 ? completed / total : 0;

        const aggregateRow: any = {
          student_id: userId,
          category: "speaking",
          level: lvl,
          module: null,
          module_id: null,
          progress: Math.round(overall * 100), // store as 0..100 like the rest of your app
          completed: completed >= total && total > 0,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("student_progress")
          .upsert(aggregateRow, { onConflict: "student_id,category,level,module_id" });

        if (error) {
          const { data: existing } = await supabase
            .from("student_progress")
            .select("id")
            .is("module_id", null)
            .eq("student_id", userId)
            .eq("category", "speaking")
            .eq("level", lvl)
            .maybeSingle();

          if (existing?.id) {
            await supabase.from("student_progress").update(aggregateRow).eq("id", existing.id);
          } else {
            await supabase.from("student_progress").insert(aggregateRow);
          }
        }
      } catch {
        // ignore
      }
    },
    [lvl]
  );

  // Wrap your "See Results" to first write progress, then call parent callback
  const handleSeeResults = useCallback(async () => {
    if (didSaveRef.current) {
      onSeeResults();
      return;
    }

    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        onSeeResults();
        return;
      }

      // 1) get score from feedback_ai (fallback to 100)
      const finalScore = await fetchFinalScore();

      // 2) log attempt (optional)
      await logAttempt(user.id, finalScore);

      // 3) upsert progress for this module (this unlocks the next one)
      await upsertStudentProgress(user.id, finalScore);

      // 4) update the aggregate row so header % matches right away
      await upsertAggregateRow(user.id);

      didSaveRef.current = true;
    } catch {
      // even if write fails, let user continue
    }

    onSeeResults();
  }, [fetchFinalScore, logAttempt, upsertStudentProgress, upsertAggregateRow, onSeeResults]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View className="flex-1 bg-gray-900 pt-6">
        <View className="absolute inset-0">
          <LinearGradient
            colors={["#0F172A", "#1E293B", "#0F172A"]}
            className="flex-1"
          />
        </View>

        <View className="flex-1 justify-center items-center p-1 py-4">
          <View className="bg-[#1A1F2E]/95 border border-white/10 backdrop-blur-xl rounded-2xl p-10 w-[95%] h-70 max-w-[400px]">
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: 20 }}>
              {isProcessing ? (
                <>
                  <ActivityIndicator size="large" color="#8F00FF" />
                  <Text className="text-xl font-bold mt-4 mb-1 text-center text-white">
                    Processing AI Feedback...
                  </Text>
                  <Text className="text-base text-white text-center mb-6">
                    Please wait while we analyze your performance.
                  </Text>
                </>
              ) : (
                <>
                  <View className="w-6 h-6 items-center justify-center">
                    <Image
                      source={require("@/assets/ai.png")}
                      className="w-10 h-10 bottom-2"
                      resizeMode="contain"
                      tintColor="white"
                    />
                  </View>
                  <Text className="text-xl font-bold mt-4 mb-1 text-center text-white">
                    Analysis Complete!
                  </Text>
                  <Markdown
                    styles={{
                      text: { color: "white", fontSize: 14 },
                      heading1: { color: "white", fontSize: 18, fontWeight: "bold" },
                      bullet: { marginVertical: 5 },
                    }}
                  >
                    {ai_feedback || "No feedback available."}
                  </Markdown>
                  <View className="flex-row gap-3 mt-4">
                    <TouchableOpacity
                      className="bg-gray-500/40 py-3 px-6 rounded-xl min-w-[120px]"
                      onPress={onLater}
                    >
                      <Text className="text-white text-base font-semibold text-center">
                        Later
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-violet-500/80 py-3 px-6 rounded-xl min-w-[120px]"
                      onPress={handleSeeResults}
                    >
                      <Text className="text-white text-base font-semibold text-center">
                        See Results
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CompletionModal;
