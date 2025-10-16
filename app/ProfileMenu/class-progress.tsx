// app/StudentScreen/ClassProgress/class-progress.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabaseClient";

/* -------------------- Background Decor -------------------- */
const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#0F172A"]}
        className="flex-1"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
  </View>
);

/* -------------------- Avatar helpers (initials fallback) -------------------- */
function splitName(name?: string | null) {
  const n = (name ?? "").trim();
  if (!n) return { first: "", last: "" };
  const parts = n.split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") ?? "" };
}
function initialsFrom(name?: string | null) {
  const { first, last } = splitName(name);
  const a = first?.[0]?.toUpperCase() ?? "";
  const b = last?.[0]?.toUpperCase() ?? "";
  return (a + b) || "U";
}
const AvatarOrInitials: React.FC<{
  uri?: string | null;
  name?: string | null;
  size?: number;
  rounded?: number;
}> = ({ uri, name, size = 40, rounded = 12 }) => {
  const initials = initialsFrom(name);
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: rounded }} />;
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        backgroundColor: "rgba(167,139,250,0.25)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "white", fontWeight: "700" }}>{initials}</Text>
    </View>
  );
};

/* ===========================================================
   INLINE HOOKS (no UI changes)
   =========================================================== */

/** reliable current user id */
function useUserId() {
  const [uid, setUid] = React.useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setUid(data.user?.id ?? null);
    })();
    return () => {
      mounted = false;
    };
  }, []);
  return uid;
}

/** Active class for current student (from teacher_students) */
function useStudentClass() {
  const [row, setRow] = useState<{
    id: string;
    teacher_id: string | null;
    grade_level: string | null;
    strand: string | null;
    status: string;
    joined_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ch: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("teacher_students")
        .select("id, teacher_id, grade_level, strand, status, joined_at")
        .eq("student_id", uid)
        .eq("status", "active")
        .order("joined_at", { ascending: false })
        .limit(1);

      if (!error) setRow(data?.[0] ?? null);
      setLoading(false);

      ch = supabase
        .channel(`rt-teacher-students-${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "teacher_students", filter: `student_id=eq.${uid}` },
          async () => {
            const { data } = await supabase
              .from("teacher_students")
              .select("id, teacher_id, grade_level, strand, status, joined_at")
              .eq("student_id", uid)
              .eq("status", "active")
              .order("joined_at", { ascending: false })
              .limit(1);
            setRow(data?.[0] ?? null);
          }
        )
        .subscribe();
    })();

    return () => {
      if (ch) supabase.removeChannel(ch);
    };
  }, []);

  return {
    membership: row,
    teacherId: row?.teacher_id ?? null,
    gradeLevel: row?.grade_level ?? null,
    strand: row?.strand ?? null,
    loading,
  };
}

/** Class roster (teacher card + classmates list), filtered by grade/strand and excluding self */
function useClassRoster(
  teacherId: string | null,
  gradeLevel: string | null,
  strand: string | null,
  currentUserId: string | null
) {
  const [teacher, setTeacher] = useState<{ id: string; name: string | null; avatar_url: string | null } | null>(null);
  const [classmates, setClassmates] = useState<
    Array<{ student_id: string; name: string | null; avatar_url: string | null }>
  >([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRoster = useCallback(async () => {
    if (!teacherId || !currentUserId) return;
    setLoading(true);

    // teacher card
    const { data: t } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .eq("id", teacherId)
      .single();
    setTeacher(t || null);

    // classmates: same grade & strand, active, not me (case-insensitive)
    let q = supabase
      .from("teacher_students")
      .select(
        "student_id, grade_level, strand, profiles!teacher_students_student_id_fkey(id,name,avatar_url)"
      )
      .eq("teacher_id", teacherId)
      .eq("status", "active")
      .neq("student_id", currentUserId);

    if (gradeLevel) q = q.ilike("grade_level", gradeLevel);
    if (strand) q = q.ilike("strand", strand);

    const { data: rows } = await q;

    const list =
      (rows ?? [])
        .filter((r: any) => r.student_id !== currentUserId)
        .map((r: any) => ({
          student_id: r.student_id,
          name: r.profiles?.name ?? null,
          avatar_url: r.profiles?.avatar_url ?? null,
        })) ?? [];

    setClassmates(list);
    setLoading(false);
  }, [teacherId, gradeLevel, strand, currentUserId]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  useEffect(() => {
    if (!teacherId || !currentUserId) return;
    const ch = supabase
      .channel(`rt-teacher-students-roster-${teacherId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teacher_students", filter: `teacher_id=eq.${teacherId}` },
        fetchRoster
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [teacherId, currentUserId, fetchRoster]);

  return { teacher, classmates, loading, refetch: fetchRoster };
}

/** Compute % summaries using same logic as HomePage */
function useStudentProgressSummary(studentId: string | null) {
  const [summary, setSummary] = useState({ speaking: 0, reading: 0, confidenceAvg: 0 });

  const refetch = useCallback(async () => {
    if (!studentId) return;

    const getActiveModules = async (category: "speaking" | "reading") => {
      const { data } = await supabase
        .from("modules")
        .select("id, level, order_index, active")
        .eq("category", category)
        .eq("active", true);
      return (data ?? []) as Array<{ id: string; level: string | null; order_index: number | null }>;
    };

    const [modsSpeaking, modsReading] = await Promise.all([getActiveModules("speaking"), getActiveModules("reading")]);

    const ids = [...modsSpeaking, ...modsReading].map((m) => m.id);
    const { data: prog } = await supabase
      .from("student_progress")
      .select("module_id, progress, confidence")
      .eq("student_id", studentId)
      .in("module_id", ids);

    const computePercent = (
      mods: Array<{ id: string; level: string | null; order_index: number | null }>,
      rows: Array<{ module_id: string; progress: number | null }>
    ) => {
      if (!mods.length) return 0;
      const pMap = new Map(rows.map((r) => [r.module_id, r.progress ?? 0]));
      const groups = new Map<string, typeof mods>();
      mods.forEach((m) => {
        const key = (m.level ? String(m.level).toLowerCase() : "default") as string;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(m);
      });

      let completed = 0;
      let upcoming = 0;
      for (const [, list] of groups) {
        list.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        let prevDone = false;
        list.forEach((m, idx) => {
          const pr = pMap.get(m.id) ?? 0;
          const done = pr >= 100;
          const unlocked = idx === 0 ? true : prevDone;
          if (done) completed += 1;
          else if (pr === 0 && unlocked) upcoming += 1;
          prevDone = done;
        });
      }
      const total = completed + upcoming;
      return total ? Math.round((completed / total) * 100) : 0;
    };

    const speaking = computePercent(
      modsSpeaking,
      (prog ?? []).filter((p) => modsSpeaking.some((m) => m.id === p.module_id))
    );
    const reading = computePercent(
      modsReading,
      (prog ?? []).filter((p) => modsReading.some((m) => m.id === p.module_id))
    );

    const confidences = (prog ?? [])
      .map((p) => Number(p.confidence))
      .filter((n) => Number.isFinite(n) && n >= 0);
    const confidenceAvg = confidences.length
      ? Math.max(0, Math.min(100, Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)))
      : 0;

    setSummary({ speaking, reading, confidenceAvg });
  }, [studentId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!studentId) return;
    const ch1 = supabase
      .channel(`rt-sp-${studentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_progress", filter: `student_id=eq.${studentId}` },
        () => refetch()
      )
      .subscribe();

    const ch2 = supabase
      .channel(`rt-modules-summary`)
      .on("postgres_changes", { event: "*", schema: "public", table: "modules" }, () => refetch())
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [studentId, refetch]);

  return summary;
}

/* ===========================================================
   PERFORMANCE MODALS (UI kept intact)
   =========================================================== */

type SkillMastery = Record<string, number>;
interface StudentPerformanceData {
  moduleProgress: number;
  confidenceLevel: number;
  anxietyLevel: number;
  skillMastery: SkillMastery;
  recentTasks: Array<{ id: number; title: string; score: number; date: string }>;
  areasToImprove: string[];
  recommendations: string[];
}
interface PerformanceModalProps {
  visible: boolean;
  onClose: () => void;
  performanceData: StudentPerformanceData;
}
const PerformanceModal: React.FC<PerformanceModalProps> = ({ visible, onClose, performanceData }) => {
  if (!visible) return null;
  const anxietyColors = {
    low: { dot: "bg-green-400", progress: 30, progressColor: "#10b981", text: "text-green-400" },
    medium: { dot: "bg-yellow-400", progress: 60, progressColor: "#f59e0b", text: "text-yellow-400" },
    high: { dot: "bg-red-400", progress: 90, progressColor: "#ef4444", text: "text-red-400" },
  };
  const currentAnxiety =
    performanceData.anxietyLevel >= 67 ? anxietyColors.high : performanceData.anxietyLevel >= 34 ? anxietyColors.medium : anxietyColors.low;
  const performanceType =
    performanceData.moduleProgress === 0 && performanceData.confidenceLevel <= 60 ? "reading" : "speaking";

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/30 justify-center items-center p-3">
        <View className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
          <BlurView intensity={30} tint="dark" className="w-full">
            <View className="p-6 bg-[#1A1F2E]/95 border border-white/10 backdrop-blur-2xl rounded-3xl">
              <View className="flex-row justify-between items-start mb-6">
                <View className="flex-1 pr-4">
                  <Text className="text-2xl font-bold text-white mb-2">Performance Details</Text>
                  <View className="flex-row items-center">
                    <View className="px-3 py-1 rounded-full bg-white/10 mr-2 border border-white/10">
                      <Text className="text-white text-xs font-medium capitalize">{performanceType}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} className="p-2 bg-white/20 rounded-full w-10 h-10 items-center justify-center" activeOpacity={0.8}>
                  <Text className="text-white text-3xl bottom-2">×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView className="pr-2" style={{ maxHeight: Dimensions.get("window").height * 0.7 }} showsVerticalScrollIndicator={false}>
                {/* Module Progress */}
                <View className="bg-white/10 border border-white/30 rounded-2xl p-4 shadow-lg mb-6 backdrop-blur-md">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 pr-2">
                      <Text className="text-base font-semibold text-white mb-1">Module Progress</Text>
                      <Text className="text-white/60 text-sm">Overall completion</Text>
                    </View>
                    <View className="bg-white/10 border border-white/20 rounded-full px-2 py-0.5 min-w-[40px] items-center justify-center">
                      <Text className="text-white font-semibold text-xs">{performanceData.moduleProgress}%</Text>
                    </View>
                  </View>
                  <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <View className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600" style={{ width: `${performanceData.moduleProgress}%` }} />
                  </View>
                </View>

                {/* Confidence & Anxiety */}
                <View className="flex-row justify-between mb-6 space-x-4">
                  <View className="bg-white/10 border border-white/30 rounded-2xl p-5 shadow-lg flex-1 backdrop-blur-md">
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-sm font-medium text-white/80">Confidence</Text>
                      <View className="w-2 h-2 rounded-full bg-green-400" />
                    </View>
                    <View className="mb-3">
                      <Text className={`text-3xl font-bold ${performanceData.confidenceLevel >= 60 ? "text-green-400" : "text-amber-400"}`}>
                        {performanceData.confidenceLevel}%
                      </Text>
                    </View>
                    <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <View className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500" style={{ width: `${performanceData.confidenceLevel}%` }} />
                    </View>
                  </View>

                  <View className="bg-white/10 border border-white/30 rounded-2xl p-5 shadow-lg flex-1 backdrop-blur-md">
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-sm font-medium text-white/80">Anxiety Level</Text>
                      <View className={`w-2 h-2 rounded-full ${currentAnxiety.dot}`} />
                    </View>
                    <View className="mb-3">
                      <Text className={`text-2xl font-bold ${currentAnxiety.text}`}>
                        {performanceData.anxietyLevel >= 67 ? "High" : performanceData.anxietyLevel >= 34 ? "Medium" : "Low"}
                      </Text>
                    </View>
                    <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <View className="h-full rounded-full" style={{ width: `${performanceData.anxietyLevel}%`, backgroundColor: currentAnxiety.progressColor }} />
                    </View>
                  </View>
                </View>

                {/* Skill Mastery */}
                <View className="bg-white/10 border border-white/30 rounded-2xl p-5 shadow-lg mb-6 backdrop-blur-md">
                  <View className="flex-row justify-between items-center mb-5">
                    <Text className="text-base font-semibold text-white">Skill Mastery</Text>
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-violet-500 mr-1" />
                      <Text className="text-xs text-white/60">Progress</Text>
                    </View>
                  </View>
                  <View className="space-y-5">
                    {Object.entries(performanceData.skillMastery).map(([skill, value]) => (
                      <View key={skill} className="space-y-2">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-sm font-medium text-white/90 capitalize">{skill}</Text>
                          <Text className="text-sm font-semibold text-white">{value}%</Text>
                        </View>
                        <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <View
                            className={`h-full rounded-full bg-gradient-to-r ${
                              value >= 80 ? "from-emerald-500 to-green-400" : value >= 60 ? "from-amber-500 to-yellow-400" : "from-rose-500 to-pink-400"
                            }`}
                            style={{ width: `${value}%` }}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Recent Tasks & Insights */}
                <View className="bg-white/10 border border-white/30 rounded-2xl p-5 shadow-lg mb-6 backdrop-blur-md">
                  <Text className="text-base font-semibold text-white mb-4">Recent Tasks</Text>
                  <View className="space-y-3">
                    {performanceData.recentTasks.map((task) => (
                      <View key={task.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                        <View className="flex-row justify-between items-center mb-1">
                          <Text className="text-white font-medium">{task.title}</Text>
                          <View className="flex-row items-center">
                            <Text className="text-white font-semibold mr-1">{task.score}%</Text>
                            <View className="w-2 h-2 rounded-full bg-green-400" />
                          </View>
                        </View>
                        <Text className="text-white/50 text-xs">{task.date}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="space-y-4">
                  <View className="pb-2 border-b border-white/10 mb-2">
                    <Text className="text-base font-semibold text-white">Performance Insights</Text>
                    <Text className="text-white/60 text-xs mt-1">Key observations and suggestions</Text>
                  </View>
                  {performanceData.areasToImprove.length > 0 && (
                    <View className="bg-white/10 border border-white/30 rounded-xl p-4 backdrop-blur-sm">
                      <View className="flex-row items-center mb-3">
                        <View className="w-2 h-2 rounded-full bg-amber-400 mr-3" />
                        <Text className="text-sm font-medium text-amber-400">Areas to Improve</Text>
                      </View>
                      <View className="space-y-3">
                        {performanceData.areasToImprove.map((item, i) => (
                          <View key={i} className="flex-row items-start">
                            <Text className="text-white/90 text-sm leading-relaxed">{item}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  {performanceData.recommendations.length > 0 && (
                    <View className="bg-white/10 border border-white/30 rounded-xl p-4 backdrop-blur-sm">
                      <View className="flex-row items-center mb-3">
                        <View className="w-2 h-2 rounded-full bg-blue-400 mr-3" />
                        <Text className="text-sm font-medium text-blue-400">Recommendations</Text>
                      </View>
                      <View className="space-y-3">
                        {performanceData.recommendations.map((item, i) => (
                          <View key={i} className="flex-row items-start">
                            <Text className="text-white/90 text-sm leading-relaxed">{item}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
};

interface PerformanceTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: "speaking" | "reading") => void;
}
const PerformanceTypeModal: React.FC<PerformanceTypeModalProps> = ({ visible, onClose, onSelect }) => {
  if (!visible) return null;
  const Opt = (type: "speaking" | "reading", icon: string, label: string) => (
    <TouchableOpacity
      className="flex-row items-center p-5 mb-4 bg-white/5 border border-white/10 rounded-2xl"
      onPress={() => onSelect(type)}
      activeOpacity={0.8}
    >
      <View className="w-12 h-12 bg-white/10 rounded-xl items-center justify-center mr-4">
        <Ionicons name={icon as any} size={24} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <Text className="text-white text-base font-semibold">{label}</Text>
        <Text className="text-white/60 text-sm mt-1">View detailed {type} performance metrics</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/30 justify-center items-center p-3">
        <View className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
          <BlurView intensity={30} tint="dark" className="w-full">
            <View className="p-6 bg-[#1A1F2E] backdrop-blur-2xl rounded-3xl">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-white">Performance Type</Text>
                <TouchableOpacity onPress={onClose} className="p-2 -m-2" activeOpacity={0.8}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <View className="mb-4">
                {Opt("speaking", "mic", "Speaking Performance")}
                {Opt("reading", "book", "Reading Performance")}
              </View>
              <TouchableOpacity onPress={onClose} className="mt-2 py-3 rounded-xl items-center border border-white/10" activeOpacity={0.8}>
                <Text className="text-white/80 font-medium">Cancel</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
};

/* ===========================================================
   REUSABLE LEAVE / REJOIN HELPERS (for Settings too)
   =========================================================== */

export async function leaveClass(studentId: string, teacherId: string) {
  // 1) Soft-leave: keep row, set status='left' and left_at=now()
  const { error: leaveErr } = await supabase
    .from("teacher_students")
    .update({ status: "left", left_at: new Date().toISOString() })
    .eq("student_id", studentId)
    .eq("teacher_id", teacherId)
    .neq("status", "left");

  if (leaveErr) throw leaveErr;

  // 2) Also remove any approved join request for this teacher so the student can join again
  const { error: delReqErr } = await supabase
    .from("class_join_requests")
    .delete()
    .eq("student_id", studentId)
    .eq("teacher_id", teacherId)
    .eq("status", "approved");

  if (delReqErr) throw delReqErr;
}

export async function rejoinClass(studentId: string, teacherId: string) {
  // Re-activate: set status='active', joined_at=now()
  const { error } = await supabase
    .from("teacher_students")
    .update({ status: "active", joined_at: new Date().toISOString() })
    .eq("student_id", studentId)
    .eq("teacher_id", teacherId)
    .eq("status", "left");

  if (error) throw error;
}

/* ===========================================================
   MAIN SCREEN (wired to Supabase)
   =========================================================== */

const ClassProgress = () => {
  const router = useRouter();

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showPerformanceTypeModal, setShowPerformanceTypeModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedPerformanceType, setSelectedPerformanceType] = useState<"speaking" | "reading">("speaking");

  // animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const fadeIn = () => {
    setShowLeaveModal(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  };
  const fadeOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 50, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowLeaveModal(false));
  };

  // reliable current user id
  const uid = useUserId();

  // resolve active class + my grade/strand
  const { membership, teacherId, gradeLevel, strand } = useStudentClass();

  // roster under this teacher, same grade/strand, excluding me
  const { teacher, classmates } = useClassRoster(teacherId, gradeLevel, strand, uid);

  // my summary (%s like HomePage)
  const mySummary = useStudentProgressSummary(uid);

  // LIVE perfData derived from mySummary + selectedPerformanceType
  const perfData: StudentPerformanceData = useMemo(() => {
    const moduleProgress = selectedPerformanceType === "speaking" ? (mySummary?.speaking ?? 0) : (mySummary?.reading ?? 0);
    const confidenceLevel = mySummary?.confidenceAvg ?? 0;
    const anxietyLevel = Math.max(0, 100 - confidenceLevel);

    return {
      moduleProgress,
      confidenceLevel,
      anxietyLevel,
      // placeholders until wired to real sources
      skillMastery: { pronunciation: 0, fluency: 0, vocabulary: 0, grammar: 0, comprehension: 0 },
      recentTasks: [],
      areasToImprove: [],
      recommendations: [],
    };
  }, [mySummary, selectedPerformanceType]);

  // “View Detailed Stats”
  const handleViewDetailedStats = () => setShowPerformanceTypeModal(true);
  const handlePerformanceTypeSelect = (type: "speaking" | "reading") => {
    setSelectedPerformanceType(type);
    setShowPerformanceTypeModal(false);
    setShowPerformanceModal(true);
  };

  // SOFT leave + clear approved join request, then push to join screen
  const handleLeaveClass = async () => {
    try {
      if (!uid || !teacherId) return;
      setIsLeaving(true);

      await leaveClass(uid, teacherId);

      setIsLeaving(false);
      setShowLeaveModal(false);

      // Go to your Join Class screen so they can join again
      router.replace("/StudentScreen/ClassProgress/join-class");
    } catch (e: any) {
      console.warn("Leave class failed:", e?.message ?? e);
      setIsLeaving(false);
    }
  };

  const renderProgressBar = (progress: number, color: string, label: string) => (
    <View className="mb-4 w-full">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-gray-200 text-sm font-medium">{label}</Text>
        <Text className="text-white text-sm font-semibold">{progress}%</Text>
      </View>
      <View className="h-2 bg-white/10 rounded-full w-full overflow-hidden">
        <View className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color, minWidth: progress > 0 ? 6 : 0 }} />
      </View>
    </View>
  );

  // Per-classmate card
  const ClassmateCard: React.FC<{ id: string; name?: string | null; avatar?: string | null; lastActive?: string }> = ({
    id,
    name,
    avatar,
    lastActive,
  }) => {
    const s = useStudentProgressSummary(id);
    return (
      <View
        className="rounded-2xl mr-4 relative"
        style={{
          backgroundColor: "rgba(255,255,255,0.04)",
          borderWidth: 0.5,
          borderColor: "rgba(223, 212, 212, 0.18)",
          width: 240,
        }}
      >
        <View className="p-2.5">
          {/* header */}
          <View className="flex-row items-start mb-2">
            <View className="relative mr-3">
              <View className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/10 items-center justify-center">
                <AvatarOrInitials uri={avatar ?? undefined} name={name ?? ""} size={40} rounded={8} />
              </View>
              <View className="absolute -bottom-0.5 -right-0.5 bg-indigo-500 rounded-full p-0.5 border border-gray-900">
                <Ionicons name="school" size={8} color="white" />
              </View>
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-white text-sm font-semibold truncate">{name ?? "Student"}</Text>
              <View className="flex-row items-center mt-0.5">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                <Text className="text-gray-400 text-[11px] truncate">Active {lastActive ?? "recently"}</Text>
              </View>
            </View>
          </View>

          {/* progress */}
          <View className="mb-2">
            {/* Reading */}
            <View className="mb-2">
              <View className="flex-row justify-between items-center mb-1.5">
                <View className="flex-row items-center flex-1 min-w-0">
                  <View className="w-1.5 h-1.5 rounded-full bg-[#8A5CFF] mr-1.5" />
                  <Text className="text-gray-300 text-[11px] font-medium truncate">Reading</Text>
                </View>
                <Text className="text-white text-[11px] font-semibold ml-2">{s.reading}%</Text>
              </View>
              <View className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <LinearGradient colors={["#8A5CFF", "#8A5CFF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="h-full rounded-full" style={{ width: `${s.reading}%`, minWidth: s.reading > 0 ? 8 : 0 }} />
              </View>
            </View>
            {/* Speaking */}
            <View>
              <View className="flex-row justify-between items-center mb-1.5">
                <View className="flex-row items-center flex-1 min-w-0">
                  <View className="w-1.5 h-1.5 rounded-full bg-[#8A5CFF] mr-1.5" />
                  <Text className="text-gray-300 text-[11px] font-medium truncate">Speaking</Text>
                </View>
                <Text className="text-white text-[11px] font-semibold ml-2">{s.speaking}%</Text>
              </View>
              <View className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <LinearGradient colors={["#8A5CFF", "#8A5CFF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="h-full rounded-full" style={{ width: `${s.speaking}%`, minWidth: s.speaking > 0 ? 8 : 0 }} />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // derived counts (exclude me)
  const studentCount = classmates.length;

  return (
    <View className="flex-1">
      <BackgroundDecor />
      <View className="flex-1">
        {/* Header */}
        <View className="px-5 pt-8 pb-2">
          <View className="flex-row items-center top-2 justify-between mb-3">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <Text className="text-white text-xl font-semibold ml-2">Class Progress</Text>
            </View>

            {/** Leave in-page */}
            <TouchableOpacity
              onPress={() => (membership ? fadeIn() : router.push("/StudentScreen/ClassProgress/join-class"))}
              className="flex-row items-center bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg"
            >
              <Ionicons name={membership ? "exit-outline" : "log-in-outline"} size={14} color={membership ? "#EF4444" : "#22C55E"} />
              <Text className={`text-xs font-medium ml-1 ${membership ? "text-red-400" : "text-green-400"}`}>
                {membership ? "Leave" : "Join"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Teacher & Strand Info or Join prompt when no class */}
          {membership ? (
            <View className="bg-white/5 top-4 rounded-2xl p-3 mb-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full mr-3 overflow-hidden border-2 border-indigo-400/30">
                  <AvatarOrInitials uri={teacher?.avatar_url} name={teacher?.name ?? ""} size={48} rounded={24} />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm font-medium">{teacher?.name ?? "Instructor"}</Text>
                  <Text className="text-indigo-300 text-xs font-medium">
                    {strand ? `${String(strand).toUpperCase()}` : "—"} - Grade {gradeLevel ?? "—"}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View className="flex-row items-center">
                      <Ionicons name="people" size={12} color="#9CA3AF" />
                      <Text className="text-gray-300 text-xs ml-1">{studentCount} Students</Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <View className=" px-3 py-2 items-center flex-row">
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text className="text-white text-base font-bold ml-1">4.8</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View className="bg-green-500/10 border border-green-400/30 top-4 rounded-2xl p-3 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-white font-semibold">You’re not in a class yet</Text>
                  <Text className="text-white/70 text-xs mt-1">
                    Join with a class code from your teacher, or re-join a class you left.
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-green-500/80 px-3 py-2 rounded-lg"
                  onPress={() => router.push("/StudentScreen/ClassProgress/join-class")}
                >
                  <Text className="text-white text-xs font-semibold">Join Class</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* My Progress (only when in a class) */}
        {membership && (
          <View className="px-5 top-3 mb-6">
            <View className="bg-white/5 rounded-2xl p-4 border border-white/20">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-white text-xl font-semibold">My Progress</Text>
                <View className="flex-row items-center bg-white/5 rounded-full px-3 py-1">
                  <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                  <Text className="text-xs text-white/80">Active</Text>
                </View>
              </View>

              <View className="space-y-3">
                {renderProgressBar(mySummary.reading, "#8A5CFF", "Reading")}
                {renderProgressBar(mySummary.speaking, "#8A5CFF", "Speaking")}
              </View>

              <View className="flex-row justify-between mt-4 space-x-3">
                <View className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                  <View className="flex-row items-center mb-1">
                    <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "#10B981" }} />
                    <Text className="text-xs text-gray-400">Confidence</Text>
                  </View>
                  <Text className="text-base font-semibold" style={{ color: "#10B981" }}>
                    {mySummary.confidenceAvg >= 67 ? "High" : mySummary.confidenceAvg >= 34 ? "Medium" : "Low"}
                  </Text>
                </View>

                <View className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                  <View className="flex-row items-center mb-1">
                    <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: "#F59E0B" }} />
                    <Text className="text-xs text-gray-400">Anxiety</Text>
                  </View>
                  <Text className="text-base font-semibold" style={{ color: "#F59E0B" }}>
                    {100 - mySummary.confidenceAvg >= 67 ? "High" : 100 - mySummary.confidenceAvg >= 34 ? "Medium" : "Low"}
                  </Text>
                </View>
              </View>

              <View className="mt-4 w-full">
                <TouchableOpacity
                  className="flex-row items-center justify-center bg-white/10 border border-white/10 px-4 py-3 rounded-lg w-full"
                  onPress={handleViewDetailedStats}
                >
                  <Ionicons name="stats-chart" size={16} color="#818CF8" />
                  <Text className="text-sm text-white font-medium ml-2">View Detailed Stats</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Classmates */}
        {membership && (
          <View className="mb-4 top-2 px-5">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Text className="text-white text-lg font-bold mr-2">Classmates</Text>
                <View className="bg-white/20 px-1.5 py-0.5 rounded-full">
                  <Text className="text-white text-[11px] font-medium">{Math.max(classmates.length, 0)} Students</Text>
                </View>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 0, paddingBottom: 10, paddingLeft: 20 }}
              className="-ml-5"
              style={{ marginRight: -20 }}
            >
              {classmates.map((s) => (
                <ClassmateCard key={s.student_id} id={s.student_id} name={s.name} avatar={s.avatar_url ?? undefined} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Leave Class Confirmation Modal */}
        <Modal visible={showLeaveModal} transparent animationType="fade" statusBarTranslucent onRequestClose={fadeOut}>
          <View className="flex-1 justify-center items-center bg-black/70">
            <Animated.View
              className="bg-slate-800 rounded-2xl p-6 w-11/12 max-w-md border border-white/10"
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 5,
              }}
            >
              <View className="items-center mb-6">
                <Ionicons name="warning" size={32} color="#FFFFFF" />
                <Text className="text-white text-xl font-bold mt-3 mb-2">Leave Class?</Text>
                <Text className="text-gray-400 text-sm text-center">
                  Are you sure you want to leave this class? You'll lose access to class progress and materials.
                </Text>
              </View>

              <View className="flex-row justify-between">
                <TouchableOpacity className="flex-1 bg-white/10 py-4 rounded-xl mr-2 items-center" onPress={fadeOut} disabled={isLeaving}>
                  <Text className="text-gray-200 text-base font-semibold">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-1 bg-violet-600/80 py-4 rounded-xl ml-2 items-center" onPress={handleLeaveClass} disabled={isLeaving}>
                  {isLeaving ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-white text-base font-semibold">Yes, Leave Class</Text>}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </View>

      {/* Type picker + details modal */}
      <PerformanceTypeModal visible={showPerformanceTypeModal} onClose={() => setShowPerformanceTypeModal(false)} onSelect={handlePerformanceTypeSelect} />
      <PerformanceModal visible={showPerformanceModal} onClose={() => setShowPerformanceModal(false)} performanceData={perfData} />
    </View>
  );
};

export default ClassProgress;
