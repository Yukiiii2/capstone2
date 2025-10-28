import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  PanResponder,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/* ✅ Supabase client for auth / data / realtime */
import { supabase } from "@/lib/supabaseClient";

const { height } = Dimensions.get("window");

/* ─────────────────────────────────────────
   Types
   ───────────────────────────────────────── */
export interface Student {
  id: string;
  name: string;
  grade: string;
  strand: string;
  status: "active" | "inactive";
  progress: number;
  satisfaction: number;
  confidence?: number;
  anxiety?: number;
  initials: string;
  color: string;
  statusColor: string;
}

interface ActiveStudentModalProps {
  visible: boolean;
  onClose: () => void;
  students: Student[]; // fallback from dashboard
}

/* rows from DB we'll map */
type TeacherStudentsRow = {
  student_id: string;
  grade_level: string | null;
  strand: string | null;
  status: string | null;
};

type ProfileRow = {
  id: string;
  name: string | null;
};

type Prog = {
  student_id: string;
  module_id: string | null;
  progress: number | null;
  completed: boolean | null;
  category: "speaking" | "reading" | null;
};

type ConfidenceRow = {
  student_id: string;
  confidence_score_speaking?: number | null;
  confidence_score_reading?: number | null;
  anxiety_level_speaking?: number | null;
  anxiety_level_reading?: number | null;
  updated_at?: string | null;
};

/* ─────────────────────────────────────────
   Helpers for transforming DB → UI
   ───────────────────────────────────────── */
const clamp0to100 = (n: number) =>
  Math.max(0, Math.min(100, Math.round(n)));

function pctFromRows(rows: Prog[] | undefined, cat: "speaking" | "reading") {
  // We treat completion as 12 modules total (6 basic + 6 advanced)
  // each worth 100pts ⇒ 1200 max
  const MODULES_PER_CATEGORY = 12;
  const TOTAL_PTS = MODULES_PER_CATEGORY * 100; // 1200

  const rs = (rows || []).filter((r) => r.category === cat);

  const earned = rs.reduce((sum, r) => {
    const val =
      typeof r.progress === "number" && Number.isFinite(r.progress)
        ? clamp0to100(r.progress)
        : r.completed
        ? 100
        : 0;
    return sum + val;
  }, 0);

  return clamp0to100((earned / TOTAL_PTS) * 100);
}

function makeInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return "ST";
}

/* ─────────────────────────────────────────
   StudentCard subcomponent (UI from your new version)
   ───────────────────────────────────────── */
interface StudentCardProps {
  student: Student;
  isInactive?: boolean;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, isInactive = false }) => (
  <View
    className={`p-4 mb-3 rounded-xl border ${
      isInactive
        ? "bg-white/5 border-white/20 opacity-70"
        : "bg-white/10 border-white/50"
    }`}
  >
    {/* top row: avatar + info */}
    <View className="flex-row items-center mb-3">
      <View
        className={`w-10 h-10 rounded-full bg-white/10 border border-white/30 items-center justify-center mr-3 ${
          isInactive ? "opacity-70" : ""
        }`}
      >
        <Text
          className={`text-white font-bold ${
            isInactive ? "opacity-70" : ""
          }`}
        >
          {student.initials}
        </Text>
      </View>

      <View>
        <Text
          className={`font-bold text-base ${
            isInactive ? "text-white/60" : "text-white"
          }`}
        >
          {student.name}
        </Text>
        <Text
          className={`text-xs ${
            isInactive ? "text-white/60" : "text-white opacity-80"
          }`}
        >
          Grade {student.grade} - {student.strand}
        </Text>
      </View>
    </View>

    {/* progress metric */}
    <View className="mt-2">
      <View className="mb-2">
        <View className="flex-row justify-between mb-1">
          <Text
            className={`text-xs ${
              isInactive ? "text-white/60" : "text-white opacity-80"
            }`}
          >
            Progress
          </Text>
          <Text
            className={`text-xs font-medium ${
              isInactive ? "text-white/60" : "text-white"
            }`}
          >
            {student.progress}%
          </Text>
        </View>
        <View className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${student.progress}%`,
              backgroundColor: isInactive ? "#6b7280" : "#a78bfa",
              opacity: isInactive ? 0.6 : 1,
            }}
          />
        </View>
      </View>
    </View>
  </View>
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────── */
const ActiveStudentModal: React.FC<ActiveStudentModalProps> = ({
  visible,
  onClose,
  students,
}) => {
  // which tab ("active"/"inactive")
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active");

  // teacher + live data state
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);
  const idsRef = useRef<Set<string>>(new Set());

  // we show live supabase students if we have them, else fallback from parent prop
  const sourceStudents =
    liveStudents.length > 0 ? liveStudents : students;

  // filter list based on tab
  const filteredStudents = sourceStudents.filter((student) =>
    activeTab === "active"
      ? student.status === "active"
      : student.status === "inactive"
  );

  /* ─────────────────────────────────────────
     Bottom sheet animation / swipe to dismiss
     (exactly like your new UI version)
     ───────────────────────────────────────── */
  const slideAnim = useRef(new Animated.Value(height)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const lastGestureDy = useRef(0);

  const resetPosition = useCallback(() => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  }, [pan]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical drag
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 3);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          pan.setValue({ x: 0, y: gestureState.dy });
        }
        lastGestureDy.current = gestureState.dy;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          onClose();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  // open/close animation
  useEffect(() => {
    if (visible) {
      pan.setValue({ x: 0, y: 0 });
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, pan, slideAnim]);

  /* ─────────────────────────────────────────
     Auth bootstrap: get teacherId once
     ───────────────────────────────────────── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (alive) {
          setTeacherId(data?.user?.id ?? null);
        }
      } catch {
        if (alive) {
          setTeacherId(null);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* ─────────────────────────────────────────
     Live fetch + mapping from Supabase
     (this is the big logic from old file)
     ───────────────────────────────────────── */
  const fetchLiveRaw = useCallback(async () => {
    if (!teacherId) return;

    try {
      // 1. Get teacher_students for this teacher
      const { data: ts, error: e1 } = await supabase
        .from("teacher_students")
        .select("student_id, grade_level, strand, status")
        .eq("teacher_id", teacherId);

      if (e1) throw e1;

      if (!ts || ts.length === 0) {
        setLiveStudents([]);
        idsRef.current = new Set();
        return;
      }

      const rowsTS = ts as TeacherStudentsRow[];

      const ids = Array.from(
        new Set(rowsTS.map((r) => r.student_id))
      ).filter(Boolean) as string[];

      idsRef.current = new Set(ids);

      // 2. Parallel fetch: profiles, student_progress, confidence/anxiety
      const [
        { data: profs, error: e2 },
        { data: progRows, error: e3 },
        { data: caRows, error: e4 },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name")
          .in("id", ids),

        supabase
          .from("student_progress")
          .select(
            "student_id, module_id, progress, completed, category"
          )
          .in("student_id", ids),

        supabase
          .from("confidence_anxiety_score")
          .select(
            "student_id, confidence_score_speaking, confidence_score_reading, anxiety_level_speaking, anxiety_level_reading, updated_at"
          )
          .in("student_id", ids)
          .order("updated_at", { ascending: false }),
      ]);

      if (e2) throw e2;
      if (e3) throw e3;
      if (e4) throw e4;

      // Index profiles by id
      const byProf: Record<string, ProfileRow> = {};
      (profs || []).forEach((p: ProfileRow) => {
        byProf[p.id] = p;
      });

      // Keep only the latest confidence/anxiety row per student
      const latestCA: Record<string, ConfidenceRow> = {};
      (caRows || []).forEach((r: ConfidenceRow) => {
        if (!latestCA[r.student_id]) {
          latestCA[r.student_id] = r;
        }
      });

      // Group progress rows by student
      const progByStudent: Record<string, Prog[]> = {};
      (progRows || []).forEach((row: Prog) => {
        if (!progByStudent[row.student_id]) {
          progByStudent[row.student_id] = [];
        }
        progByStudent[row.student_id].push(row);
      });

      // Build Student objects
      const mapped: Student[] = rowsTS.map((r) => {
        const prof = byProf[r.student_id];
        const rawName = (prof?.name || "Student").trim();
        const initials = makeInitials(rawName);

        const theseProgRows = progByStudent[r.student_id] || [];
        const speakingPct = pctFromRows(theseProgRows, "speaking");
        const readingPct = pctFromRows(theseProgRows, "reading");
        const overall = Math.round((speakingPct + readingPct) / 2);

        const ca = latestCA[r.student_id] || {};

        const confidenceSource =
          typeof ca.confidence_score_speaking === "number"
            ? ca.confidence_score_speaking
            : typeof ca.confidence_score_reading === "number"
            ? ca.confidence_score_reading
            : 0;

        const anxietySource =
          typeof ca.anxiety_level_speaking === "number"
            ? ca.anxiety_level_speaking
            : typeof ca.anxiety_level_reading === "number"
            ? ca.anxiety_level_reading
            : 100;

        return {
          id: r.student_id,
          name: rawName,
          grade: r.grade_level || "",
          strand: r.strand || "",
          status: (r.status as "active" | "inactive") || "active",
          progress: overall,
          satisfaction: 0,
          confidence: clamp0to100(confidenceSource ?? 0),
          anxiety: clamp0to100(anxietySource ?? 100),
          initials,
          color: "#4F46E5",
          statusColor:
            r.status === "active"
              ? "text-green-400"
              : "text-gray-400",
        };
      });

      setLiveStudents(mapped);
    } catch (err: any) {
      console.warn(
        "ActiveStudentModal fetchLiveRaw error:",
        err?.message || err
      );
      // we'll just fall back to the students prop if fetch fails
    }
  }, [teacherId]);

  /* ─────────────────────────────────────────
     Realtime subscription logic
     ───────────────────────────────────────── */
  useEffect(() => {
    if (!teacherId || !visible) return;

    let chA: ReturnType<typeof supabase.channel> | null = null;
    let chB: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      await fetchLiveRaw();

      // Subscribe: any change in teacher_students for this teacher
      chA = supabase
        .channel(`teacher_students:${teacherId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "teacher_students",
            filter: `teacher_id=eq.${teacherId}`,
          },
          fetchLiveRaw
        )
        .subscribe();

      // Subscribe: any change in student_progress
      // We refetch only if that student is in the teacher's roster
      chB = supabase
        .channel(`student_progress:${teacherId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "student_progress",
          },
          (payload: any) => {
            const sid =
              payload?.new?.student_id ??
              payload?.old?.student_id;
            if (!sid) return;
            if (!idsRef.current.has(sid)) return;
            fetchLiveRaw();
          }
        )
        .subscribe();
    })();

    return () => {
      try {
        if (chA) supabase.removeChannel(chA);
      } catch {}
      try {
        if (chB) supabase.removeChannel(chB);
      } catch {}
    };
  }, [teacherId, visible, fetchLiveRaw]);

  /* ─────────────────────────────────────────
     RENDER (this is 100% your new UI JSX)
     ───────────────────────────────────────── */

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1">
          {/* dark overlay */}
          <View className="absolute inset-0 bg-black/50" />

          {/* bottom sheet */}
          <Animated.View
            {...panResponder.panHandlers}
            className="absolute bottom-0 left-0 right-0 bg-[#1A1F2E] rounded-t-3xl p-6"
            style={{
              height: height * 0.85,
              transform: [
                {
                  translateY: Animated.add(slideAnim, pan.y),
                },
              ],
            }}
          >
            {/* header row */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-2xl font-bold">
                {activeTab === "active" ? "Active" : "Inactive"} Students (
                {filteredStudents.length})
              </Text>
              <TouchableOpacity onPress={onClose} className="p-2">
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Tab Selector */}
            <View className="flex-row border-b border-white/10 mb-4 px-4">
              <TouchableOpacity
                className={`flex-1 py-3 items-center ${
                  activeTab === "active"
                    ? "border-b-2 border-indigo-400"
                    : ""
                }`}
                onPress={() => setActiveTab("active")}
              >
                <Text
                  className={`font-medium text-base ${
                    activeTab === "active"
                      ? "text-white"
                      : "text-gray-400"
                  }`}
                >
                  Active
                </Text>
                {activeTab === "active" && (
                  <View className="absolute bottom-0 h-0.5 w-full bg-indigo-400" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 py-3 items-center ${
                  activeTab === "inactive"
                    ? "border-b-2 border-indigo-400"
                    : ""
                }`}
                onPress={() => setActiveTab("inactive")}
              >
                <Text
                  className={`font-medium text-base ${
                    activeTab === "inactive"
                      ? "text-white"
                      : "text-gray-400"
                  }`}
                >
                  Inactive
                </Text>
                {activeTab === "inactive" && (
                  <View className="absolute bottom-0 h-0.5 w-full bg-indigo-400" />
                )}
              </TouchableOpacity>
            </View>

            {/* Student list */}
            <ScrollView className="flex-1">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    isInactive={student.status === "inactive"}
                  />
                ))
              ) : (
                <View className="items-center justify-center py-10">
                  <Ionicons
                    name="people-outline"
                    size={48}
                    color="#6B7280"
                    className="opacity-50 mb-3"
                  />
                  <Text className="text-gray-400 text-base text-center">
                    No {activeTab} students found
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Close button */}
            <TouchableOpacity
              onPress={onClose}
              className="bg-purple-600 py-3 rounded-xl mt-4"
            >
              <Text className="text-white font-medium text-center">
                Close
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ActiveStudentModal;
