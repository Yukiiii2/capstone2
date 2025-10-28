// app/StudentScreen/SpeakingExercise/full-results-speaking.tsx
import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabaseClient";

/* ─────────── helpers ─────────── */
const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const fmtPct = (n: number) => `${clampPct(n)}%`;
const widthStyle = (n: number): ViewStyle => ({ width: `${clampPct(n)}%` as `${number}%` });

const getFinalAnalysis = async (feedback: string, speechText: string): Promise<FullAnalysisResponse> => {
  try {
    // Get auth session properly
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('No valid auth session:', sessionError);
      return getDefaultResponse();
    }

    const response = await fetch(`https://unbalanceable-lyman-microstomatous.ngrok-free.dev/full-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        feedback: feedback.trim(),
        speech_text: speechText.trim(),
        category: 'speaking',
        student_id: session.user.id,
        attempt_id: null,
        session_id: null
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Analysis API error:', response.status, data);
      return getDefaultResponse();
    }

    // Validate and return response
    return {
      success: true,
      confidence_score: data.confidence_score ?? 75,
      metrics: Array.isArray(data.metrics) ? data.metrics : [],
      skills: {
        strengths: Array.isArray(data.skills?.strengths) ? data.skills.strengths : [],
        improvements: Array.isArray(data.skills?.improvements) ? data.skills.improvements : []
      }
    };

  } catch (error) {
    console.error('Error getting full analysis:', error);
    return getDefaultResponse();
  }
};

// Add helper function for default response
const getDefaultResponse = (): FullAnalysisResponse => ({
  success: false,
  confidence_score: 75,
  metrics: [],
  skills: {
    strengths: [],
    improvements: []
  }
});

type Trend = "up" | "down";

type StrengthItem = { skill: string; level: number; trend: Trend };

type ImprovementItem = { skill: string; level: number; trend: Trend };

type FullAnalysisResponse = {
  success: boolean;
  confidence_score: number;
  metrics: MetricBlock[];
  skills: {
    strengths: StrengthItem[];
    improvements: ImprovementItem[];
  };
};

type MetricBlock = {
  label: string;
  value: number; // 0..100
  icon: keyof typeof Ionicons.glyphMap;
  trend: "up" | "down";
  change: number;
};

/* ─────────── progress rule (INLINE) ───────────
   BASIC ONLY (do not touch advanced here):
   On full-results, always mark the basic module as 100% complete,
   creating or updating the row as needed. Advanced is handled elsewhere.
*/
async function applyFullResultsRuleInline(moduleId: string, level: "basic" | "advanced") {
  try {
    if (level !== "basic") return; // 🚫 never modify Advanced here

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user || !moduleId) return;

    const now = new Date().toISOString();

    // Always upsert the BASIC module to 100% on full-results.
    await supabase
      .from("student_progress")
      .upsert(
        {
          student_id: user.id,
          module_id: moduleId,
          progress: 100,
          completed: true,
          updated_at: now,
          category: "speaking",
        },
        { onConflict: "student_id,module_id", ignoreDuplicates: false }
      );

    // Safety: hard-cap any rogue scales >100 (rare but cheap to enforce)
    await supabase
      .from("student_progress")
      .update({ progress: 100, updated_at: now })
      .eq("student_id", user.id)
      .eq("module_id", moduleId)
      .gt("progress", 100);
  } catch {
    // swallow errors to avoid UX interruption
  }
}

export default function FullResultsSpeaking() {
  const router = useRouter();

  // Add these two new state declarations
  const [metrics, setMetrics] = useState<MetricBlock[] | null>(null);
  const [speechText, setSpeechText] = useState('');
  const [strengths, setStrengths] = useState<StrengthItem[]>([]);
  const [improvements, setImprovements] = useState<ImprovementItem[]>([]);
  const [storedAiFeedback, setStoredAiFeedback] = useState<string | null>(null);

  const { session_id, attempt_id, level, module_id, module_title, score, ai_feedback } =
    useLocalSearchParams<{
      session_id?: string;
      attempt_id?: string;
      level?: "basic" | "advanced" | string;
      module_id?: string;
      module_title?: string;
      score?: string;
      ai_feedback?: string; // Add this line
    }>();

  // lock level strictly to the URL param (prevents any cross-over)
  const levelParam: "basic" | "advanced" = level === "advanced" ? "advanced" : "basic";

  // ---------- score (param) with live override from feedback_ai ----------
  const initialScore = useMemo(() => {
    const n = Number(score);
    return Number.isFinite(n) ? clampPct(n) : 78;
  }, [score]);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const uiScore = liveScore ?? initialScore;

  // current module (for saving progress + computing next module)
  const [currentModule, setCurrentModule] = useState<{
    id: string | null;
    title: string | null;
    level: "basic" | "advanced";
    order_index: number | null;
  }>({
    id: module_id ?? null,
    title: (module_title as string) ?? null,
    level: levelParam, // use locked param here
    order_index: null,
  });

  const [nextModule, setNextModule] = useState<{ id: string | null; title: string | null } | null>(null);

  // AI feedback (from feedback_ai.evaluation jsonb)
  const [loadingTips, setLoadingTips] = useState(false);
  const [tips, setTips] = useState<string[]>([]);
  

  /* ─────────── pull tips & a better score from feedback_ai ─────────── */
  const loadFeedbackFromAI = useCallback(async () => {
    if (ai_feedback) return; // Skip if we have direct AI feedback
    
    const keyId = attempt_id || session_id;
    if (!keyId && !storedAiFeedback) return;
    try {
      setLoadingTips(true);

      // If we have stored AI feedback, use it directly
      if (storedAiFeedback) {
        const analysisResult = await getFinalAnalysis(storedAiFeedback, speechText);
        if (analysisResult) {
          setMetrics(analysisResult.metrics);
          setStrengths(analysisResult.skills.strengths);
          setImprovements(analysisResult.skills.improvements);
          if (analysisResult.confidence_score) {
            setLiveScore(analysisResult.confidence_score);
          }
        }
        setTips([storedAiFeedback]); // Add the feedback as a tip
        return;
      }

      const col = attempt_id ? "attempt_id" : "session_id";
      const { data, error } = await supabase
        .from("feedback_ai")
        .select("evaluation")
        .eq(col, keyId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;

      const newTips: string[] = [];
      let latestScore: number | null = null;
      let feedback = '';
      let transcribedText = ''; // Renamed to avoid conflict

      (data ?? []).forEach((row: any) => {
        const ev = row?.evaluation;
        if (!ev) return;

        // Collect feedback and speech text for analysis
        if (typeof ev?.summary === "string") {
          feedback += ev.summary + ' ';
        }
        if (typeof ev?.transcript === "string") {
          transcribedText = ev.transcript; // Use new variable name
          setSpeechText(ev.transcript); // Set the state
        }

        // Rest of existing feedback processing...
        if (typeof ev?.summary === "string" && ev.summary.trim()) {
          newTips.push(ev.summary.trim());
        }
        if (Array.isArray(ev?.tips)) {
          ev.tips.forEach((t: any) => {
            if (typeof t === "string" && t.trim()) newTips.push(t.trim());
          });
        }
      });

      // Get full analysis if we have feedback and speech text
      if (feedback && transcribedText) { // Use new variable name
        const analysisResult = await getFinalAnalysis(feedback.trim(), transcribedText);
        if (analysisResult) {
          setMetrics(analysisResult.metrics);
          setStrengths(analysisResult.skills.strengths);
          setImprovements(analysisResult.skills.improvements);
          if (analysisResult.confidence_score) {
            setLiveScore(analysisResult.confidence_score);
          }
        }
      }

      if (latestScore != null) setLiveScore(latestScore);
      if (newTips.length) setTips(newTips.slice(0, 10));
    } finally {
      setLoadingTips(false);
    }
  }, [attempt_id, session_id, storedAiFeedback, speechText, ai_feedback]);

  // Add new effect to handle ai_feedback
  useEffect(() => {
    const analyzeAiFeedback = async () => {
    if (!ai_feedback) return;
    
    try {
      setLoadingTips(true);
      const { data: authData } = await supabase.auth.getUser();
      
      if (!authData?.user) {
        console.error('No authenticated user');
        return;
      }

      const analysisResult = await getFinalAnalysis(ai_feedback, speechText);
      
      if (analysisResult) {
        // Update states only if we have valid data
        if (analysisResult.metrics?.length > 0) {
          setMetrics(analysisResult.metrics);
        }
        if (analysisResult.skills?.strengths?.length > 0) {
          setStrengths(analysisResult.skills.strengths);
        }
        if (analysisResult.skills?.improvements?.length > 0) {
          setImprovements(analysisResult.skills.improvements);
        }
        if (typeof analysisResult.confidence_score === 'number') {
          setLiveScore(analysisResult.confidence_score);
        }
        
        // Always set feedback as tip even if analysis fails
        setTips([ai_feedback]);
      }
      
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      // Set feedback as tip even if analysis fails
      setTips([ai_feedback]);
    } finally {
      setLoadingTips(false);
    }
  };

  analyzeAiFeedback();
}, [ai_feedback, speechText]);

  /* ─────────── realtime feedback_ai inserts ─────────── */
  useEffect(() => {
    const keyId = attempt_id || session_id;
    if (!keyId) return;
    const filter = attempt_id ? `attempt_id=eq.${keyId}` : `session_id=eq.${keyId}`;

    const channel = supabase
      .channel(`feedback_ai:${keyId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feedback_ai", filter },
        (payload: any) => {
          const ev = payload?.new?.evaluation;
          if (!ev) return;

          const s =
            typeof ev?.final_score === "number"
              ? ev.final_score
              : typeof ev?.score === "number"
              ? ev.score
              : null;
          if (s != null) setLiveScore(clampPct(s));

          const collected: string[] = [];
          if (typeof ev?.summary === "string" && ev.summary.trim()) collected.push(ev.summary.trim());
          if (Array.isArray(ev?.tips)) {
            ev.tips.forEach((t: any) => {
              if (typeof t === "string" && t.trim()) collected.push(t.trim());
            });
          }
          if (collected.length) {
            setTips((prev) => {
              const merged = [...collected, ...prev];
              const seen = new Set<string>();
              const unique = merged.filter((x) => {
                const k = x.trim();
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
              });
              return unique.slice(0, 12);
            });
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [attempt_id, session_id]);

  /* ─────────── resolve module + next module ─────────── */
  const resolveModule = useCallback(async () => {
    try {
      // If we already have an id, hydrate title/order and exit
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

      // If id missing, try resolve by title + level
      if (currentModule.title) {
        const { data } = await supabase
          .from("modules")
          .select("id, title, level, order_index")
          .eq("category", "speaking")
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

      // Fallback: first active module for this level
      const { data: first } = await supabase
        .from("modules")
        .select("id, title, level, order_index")
        .eq("category", "speaking")
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
      const curOrder = currentModule.order_index ?? 0;
      const { data } = await supabase
        .from("modules")
        .select("id, title, order_index")
        .eq("category", "speaking")
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

  /* ─────────── attempts + progress writing ─────────── */
  const fetchFinalScore = useCallback(async (): Promise<number> => {
    const key = attempt_id || session_id;
    if (!key) return clampPct(uiScore);
    const col = attempt_id ? "attempt_id" : "session_id";
    const { data } = await supabase
      .from("feedback_ai")
      .select("evaluation")
      .eq(col, key)
      .order("created_at", { ascending: false })
      .limit(5);

    if (data && data.length) {
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
    }
    return clampPct(uiScore);
  }, [attempt_id, session_id, uiScore]);

  // compute next attempt_number per (student, module)
  const computeNextAttemptNumber = useCallback(
    async (studentId: string): Promise<number> => {
      try {
        if (!currentModule.id) return 1;
        const { count } = await supabase
          .from("attempts")
          .select("id", { head: true, count: "exact" })
          .eq("student_id", studentId)
          .eq("module_id", currentModule.id);
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
        const sessionNumeric = Number(session_id);
        await supabase.from("attempts").insert([
          {
            student_id: studentId,
            module_id: currentModule.id,
            attempt_number,
            score: finalScore,
            category: "speaking",
            level: currentModule.level,
            session_id: Number.isFinite(sessionNumeric) ? sessionNumeric : null,
          } as any,
        ]);
      } catch {
        // ignore
      }
    },
    [currentModule.id, currentModule.level, session_id, computeNextAttemptNumber]
  );

  /* ─────────── metrics derived from score ─────────── */
  
  
  const recalcMetrics = async (feedback: string, speechText: string) => {
    const analysisResult = await getFinalAnalysis(feedback, speechText);
    if (analysisResult?.metrics) {
      setMetrics(analysisResult.metrics);
    }
    if (analysisResult?.skills) {
      setStrengths(analysisResult.skills.strengths);
      setImprovements(analysisResult.skills.improvements);
    }
  };

  // react to live score changes
  useEffect(() => {
    (async () => {
        await resolveModule();
        await loadFeedbackFromAI();
        if (tips.length > 0) {
            const combinedFeedback = tips.join(' ');
            recalcMetrics(combinedFeedback, speechText);
        }
    })();
}, [loadFeedbackFromAI, tips, resolveModule, speechText]); // Fixed syntax and added speechText dependency

  useEffect(() => {
    if (currentModule.order_index !== null || currentModule.id || currentModule.title) {
      resolveNextModule();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModule.order_index, currentModule.id, currentModule.title]);

  // save once when landing here — waits until we know module_id
  const savedOnceRef = useRef(false);
  useEffect(() => {
    (async () => {
      if (savedOnceRef.current) return;

      // Ensure module is resolved before writing progress
      if (!currentModule.id) {
        await resolveModule();
      }
      if (!currentModule.id) return;

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      savedOnceRef.current = true;

      // record attempt (score is for history only)
      const finalScore = await fetchFinalScore();
      await logAttempt(user.id, finalScore);

      // 🔑 BASIC-ONLY PROGRESS RULE on full-results (locked to URL level)
      await applyFullResultsRuleInline(currentModule.id, levelParam);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModule.id, currentModule.level]);

  /* ─────────── nav actions ─────────── */
  const goRetake = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (user && currentModule.id) {
        const finalScore = await fetchFinalScore();
        await logAttempt(user.id, finalScore);
        await applyFullResultsRuleInline(currentModule.id, levelParam); // basic only
      }
    } catch {}
    router.replace("StudentScreen/SpeakingExercise/live-vid-selection");
  };

  const goHome = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      console.log('[goHome] User:', user?.id);
      console.log('[goHome] Current Module ID:', currentModule.id);

      if (user && currentModule.id) {
        const finalScore = await fetchFinalScore();
        console.log('[goHome] Final Score:', finalScore);
        
        await logAttempt(user.id, finalScore);
        console.log('[goHome] Attempt logged successfully');

        // Match exact table structure
        const progressData = {
          student_id: user.id,         // uuid
          module_id: currentModule.id, // uuid
          progress: 100,               // integer
          completed: true,             // boolean
          category: "speaking",        // character varying
          updated_at: new Date().toISOString(), // timestamp with time zone
          confidence: finalScore,      // integer
          anxiety: null                // integer (optional)
        };

        // Try to fetch existing progress
        const { data: existing } = await supabase
          .from("student_progress")
          .select("id")
          .eq("student_id", user.id)
          .eq("module_id", currentModule.id)
          .maybeSingle();

        if (existing?.id) {
          const { error: updateError } = await supabase
            .from("student_progress")
            .update(progressData)
            .eq("id", existing.id);

          console.log('[goHome] Update result:', { error: updateError });
        } else {
          const { error: insertError } = await supabase
            .from("student_progress")
            .insert([progressData]);

          console.log('[goHome] Insert result:', { error: insertError });
        }
      }
    } catch (error) {
      console.error("[goHome] Error updating progress:", error);
    }
    console.log('[goHome] Navigating to home page...');
    router.replace("StudentScreen/HomePage/home-page");
  };

  /* ─────────── UI (unchanged core) ─────────── */
  const BackgroundDecor = () => (
    <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
      <View className="absolute inset-0">
        <LinearGradient colors={["#0F172A", "#1E293B", "#0F172A"]} style={{ flex: 1 }} />
      </View>
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
      <View className="absolute top-0 left-0 right-0 bottom-0 bg-gray-900">
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View className="flex-1 bg-gray-900 pt-12">
          <BackgroundDecor />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="w-full max-w-[1000px] self-center px-4">
          <View className="flex-row items-start w-full left-0.1 top-1 mt-4">
            <TouchableOpacity className="p-3 -ml-1" onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mx-4 mb-5 -mt-3">
          <Text className="text-white font-bold text-xl text-center">AI DETAILED ANALYSIS</Text>
        </View>

        <View className="mx-4 mb-6 p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl">
          <View className="flex-row items-start">
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
                  <Text className="text-xs font-normal items-center justify-center text-white">
                    Confidence
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-1 ml-6">
              <Text className="text-white font-semibold text-lg mb-2">Speaking Proficiency</Text>
              <Text className="text-sm text-gray-300 leading-relaxed">
                Your speaking skills demonstrate strong command of language and clear articulation.
                Focus on varying your tone for greater impact.
              </Text>
            </View>
          </View>
        </View>

        <View className="mx-4 flex-row space-x-4 mb-6">
          <View className="flex-1 p-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/20">
            <View className="flex-row items-center mb-3">
              <View className="right-2.5 w-8 h-8 rounded-lg bg-[#FFFFFF]/10 items-center justify-center mr-2">
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              </View>
              <Text className="right-3 text-white font-medium text-lg">Key Strengths</Text>
            </View>
            <View className="bottom-1 space-y-4 top-4">
              {strengths.map((item, i) => (
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

          <View className="flex-1 p-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/20">
            <View className="flex-row items-center mb-3">
              <View className="bottom-2.5 right-2.5 w-8 h-8 rounded-lg bg-[#FFFFFF]/10 items-center justify-center mr-2">
                <Ionicons name="trending-up" size={16} color="#FFFFFF" />
              </View>
              <Text className="right-2 text-white font-medium text-base bottom-2">Improvement Areas</Text>
            </View>
            <View className="bottom-1 space-y-4">
              {improvements.map((item, i) => (
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
                    <Text className="text-xs text-[#FFFFFF]">{fmtPct(100 - item.level)}</Text>
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

        {!!(attempt_id || session_id) && (
          <View className="mx-4 p-4 bg-white/5 rounded-2xl border border-white/20 mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">AI Feedback (This Session)</Text>
            </View>
            {loadingTips && tips.length === 0 ? (
              <Text className="text-gray-300 text-sm">Loading tips…</Text>
            ) : tips.length > 0 ? (
              tips.map((t, i) => (
                <Text key={i} className="text-gray-300 text-sm mb-1">
                  • {t}
                </Text>
              ))
            ) : (
              <Text className="text-gray-400 text-sm">No feedback captured yet.</Text>
            )}
          </View>
        )}

        <View className="mx-4 p-6 bg-white/5 rounded-3xl border border-white/20 mb-10 overflow-hidden">
          <View className="relative z-10">
            <View className="flex-row items-center justify-center mb-4">
              <Text className="text-white font-semibold text-2xl">Next Steps</Text>
            </View>

            <Text className="text-gray-200 text-center text-sm leading-relaxed mb-6">
              Your speaking assessment is complete. Based on your performance, we've identified key
              areas to focus on in your learning journey.
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
                onPress={goRetake}
              >
                <Text className="text-white font-semibold text-base">Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center bg-white/30 border border-white/40 px-6 py-2.5 rounded-xl w-[47%] justify-center"
                activeOpacity={0.9}
                onPress={goHome}
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