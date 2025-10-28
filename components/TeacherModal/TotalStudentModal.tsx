import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
  PanResponder,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/* ⬇️ Supabase client */
import { supabase } from "@/lib/supabaseClient";

const { height } = Dimensions.get("window");

/* ──────────────────────────────────────────────
   Row types (for strong typing from Supabase)
   ────────────────────────────────────────────── */
type TeacherStudentsRow = {
  teacher_id: string;
  student_id: string;
  grade_level: string | null;
  strand: string | null;
  status: "active" | "inactive" | null;
};

type ProfileRow = {
  id: string;
  name: string | null;
};

type StudentProgressRow = {
  student_id: string;
  progress: number | null;
  satisfaction: number | null;
  // optionally present; safe to ignore if not in schema
  confidence?: number | null;
  anxiety?: number | null;
};

type ConfidenceAnxietyRow = {
  student_id: string;
  confidence_score_speaking: number | null;
  confidence_score_reading: number | null;
  anxiety_level_speaking: number | null;
  anxiety_level_reading: number | null;
  updated_at: string | null;
};

/* ──────────────────────────────────────────────
   UI Student type (what dashboard expects)
   ────────────────────────────────────────────── */
interface Student {
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

interface TotalStudentModalProps {
  visible: boolean;
  onClose: () => void;
  students: Student[]; // fallback if live fetch fails / before auth
  onRemoveStudent?: (studentId: string) => void;
}

/* ──────────────────────────────────────────────
   Small helpers (logic only)
   ────────────────────────────────────────────── */
const makeInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return "ST";
};

const clampPct = (n: number | null | undefined) =>
  Math.max(0, Math.min(100, Math.round(Number(n ?? 0))));

/**
 * Build a "latest per student" map for confidence/anxiety rows
 */
function latestConfidenceAnxietyMap(rows: ConfidenceAnxietyRow[]) {
  const map: Record<
    string,
    {
      confidence_score_speaking?: number | null;
      confidence_score_reading?: number | null;
      anxiety_level_speaking?: number | null;
      anxiety_level_reading?: number | null;
      updated_at?: string | null;
    }
  > = {};

  for (const r of rows) {
    const sid = r.student_id;
    const prev = map[sid];
    if (!prev) {
      map[sid] = {
        confidence_score_speaking: r.confidence_score_speaking,
        confidence_score_reading: r.confidence_score_reading,
        anxiety_level_speaking: r.anxiety_level_speaking,
        anxiety_level_reading: r.anxiety_level_reading,
        updated_at: r.updated_at,
      };
      continue;
    }
    const prevTime = prev.updated_at ? new Date(prev.updated_at).getTime() : 0;
    const currTime = r.updated_at ? new Date(r.updated_at).getTime() : 0;
    if (currTime > prevTime) {
      map[sid] = {
        confidence_score_speaking: r.confidence_score_speaking,
        confidence_score_reading: r.confidence_score_reading,
        anxiety_level_speaking: r.anxiety_level_speaking,
        anxiety_level_reading: r.anxiety_level_reading,
        updated_at: r.updated_at,
      };
    }
  }
  return map;
}

/**
 * Decide which confidence/anxiety % to show.
 * We average speaking+reading if both exist, else fallback to whichever exists.
 * If nothing, default 0 for confidence / 100 for anxiety.
 */
const deriveConfidence = (r?: {
  confidence_score_speaking?: number | null;
  confidence_score_reading?: number | null;
}) => {
  const s =
    typeof r?.confidence_score_speaking === "number"
      ? r.confidence_score_speaking
      : null;
  const rd =
    typeof r?.confidence_score_reading === "number"
      ? r.confidence_score_reading
      : null;
  if (s == null && rd == null) return 0;
  if (s != null && rd == null) return clampPct(s);
  if (s == null && rd != null) return clampPct(rd);
  return clampPct(Math.round(((s ?? 0) + (rd ?? 0)) / 2));
};

const deriveAnxiety = (r?: {
  anxiety_level_speaking?: number | null;
  anxiety_level_reading?: number | null;
}) => {
  const s =
    typeof r?.anxiety_level_speaking === "number"
      ? r.anxiety_level_speaking
      : null;
  const rd =
    typeof r?.anxiety_level_reading === "number"
      ? r.anxiety_level_reading
      : null;
  if (s == null && rd == null) return 100; // default high if none
  if (s != null && rd == null) return clampPct(s);
  if (s == null && rd != null) return clampPct(rd);
  return clampPct(Math.round(((s ?? 0) + (rd ?? 0)) / 2));
};

/* ──────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────── */
const TotalStudentModal: React.FC<TotalStudentModalProps> = ({
  visible,
  onClose,
  students,
  onRemoveStudent,
}) => {
  // ====== UI state (from new UI version)
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null);

  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedStrand, setSelectedStrand] = useState<string | null>(null);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showStrandDropdown, setShowStrandDropdown] = useState(false);

  // ====== animation / drag-to-close (from logic version, ported to new UI classes)
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
        // only vertical, not horizontal scroll
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

      // reset filters when closed
      setSelectedGrade(null);
      setSelectedStrand(null);
      setShowGradeDropdown(false);
      setShowStrandDropdown(false);
    }
  }, [visible, pan, slideAnim]);

  // ====== Supabase state + live sync (all logic from old version)
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);

  // choose which list to render:
  // - use liveStudents if we successfully loaded from DB
  // - otherwise fallback to the prop `students` passed by dashboard
  const renderStudents: Student[] =
    liveStudents.length > 0 ? liveStudents : students;

  // auth bootstrap
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (mounted) {
        setTeacherId(error ? null : data?.user?.id ?? null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // row mapping (copied from logic version, but does NOT touch UI)
  const mapRowsToStudents = useCallback(
    (
      tsRows: TeacherStudentsRow[],
      profRows: ProfileRow[],
      progRows: StudentProgressRow[],
      caRows: ConfidenceAnxietyRow[]
    ): Student[] => {
      const byProf: Record<string, ProfileRow> = {};
      const byProg: Record<string, StudentProgressRow> = {};

      (profRows || []).forEach((p) => {
        byProf[p.id] = p;
      });
      (progRows || []).forEach((p) => {
        byProg[p.student_id] = p;
      });

      const latestCA = latestConfidenceAnxietyMap(caRows || []);

      return (tsRows || []).map((r) => {
        const prof = byProf[r.student_id];
        const name = (prof?.name || "Unknown Student").trim();
        const initials = makeInitials(name);

        const pv = byProg[r.student_id] || {};
        const ca = latestCA[r.student_id]; // may be undefined

        // Prefer student_progress confidence/anxiety if stored there;
        // else derive from CA table
        const confidence = typeof pv.confidence === "number"
          ? clampPct(pv.confidence)
          : deriveConfidence(ca);

        const anxiety = typeof pv.anxiety === "number"
          ? clampPct(pv.anxiety)
          : deriveAnxiety(ca);

        return {
          id: r.student_id,
          name,
          grade: r.grade_level || "",
          strand: r.strand || "",
          status: (r.status as "active" | "inactive") || "active",
          progress: clampPct(pv.progress ?? 0),
          satisfaction: clampPct(pv.satisfaction ?? 0),
          confidence,
          anxiety,
          initials,
          color: "#4F46E5",
          statusColor:
            r.status === "active" ? "text-green-400" : "text-gray-400",
        } as Student;
      });
    },
    []
  );

  // live fetch (logic)
  const fetchLive = useCallback(async () => {
    if (!teacherId) return;

    // teacher_students
    const { data: ts, error: tsErr } = await supabase
      .from("teacher_students")
      .select("teacher_id, student_id, grade_level, strand, status")
      .eq("teacher_id", teacherId)
      .returns<TeacherStudentsRow[]>();

    if (tsErr || !ts?.length) {
      setLiveStudents([]);
      return;
    }

    const ids = Array.from(
      new Set(ts.map((r) => r.student_id))
    ).filter(Boolean) as string[];

    // profiles
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", ids)
      .returns<ProfileRow[]>();

    // student_progress (progress/satisfaction; confidence/anxiety MAY also be here)
    const { data: prog } = await supabase
      .from("student_progress")
      .select("student_id, progress, satisfaction, confidence, anxiety")
      .in("student_id", ids)
      .returns<StudentProgressRow[]>();

    // confidence_anxiety_score (take latest per student)
    const { data: caRows } = await supabase
      .from("confidence_anxiety_score")
      .select(
        "student_id, confidence_score_speaking, confidence_score_reading, anxiety_level_speaking, anxiety_level_reading, updated_at"
      )
      .in("student_id", ids)
      .order("updated_at", { ascending: false })
      .returns<ConfidenceAnxietyRow[]>();

    setLiveStudents(
      mapRowsToStudents(ts, profs ?? [], prog ?? [], caRows ?? [])
    );
  }, [teacherId, mapRowsToStudents]);

  // realtime subs (logic)
  useEffect(() => {
    if (!teacherId || !visible) return;

    fetchLive();

    const chA = supabase
      .channel(`teacher_students:${teacherId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teacher_students",
          filter: `teacher_id=eq.${teacherId}`,
        },
        fetchLive
      )
      .subscribe();

    const chB = supabase
      .channel(`student_progress:${teacherId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_progress" },
        fetchLive
      )
      .subscribe();

    const chC = supabase
      .channel(`confidence_anxiety_score:${teacherId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "confidence_anxiety_score" },
        fetchLive
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(chA);
      } catch {}
      try {
        supabase.removeChannel(chB);
      } catch {}
      try {
        supabase.removeChannel(chC);
      } catch {}
    };
  }, [teacherId, visible, fetchLive]);

  // ====== filter logic (from new UI, but use renderStudents instead of raw students)
  const filteredStudents = useMemo(() => {
    return renderStudents.filter((student) => {
      const matchesGrade =
        !selectedGrade || student.grade === selectedGrade;
      const matchesStrand =
        !selectedStrand || student.strand === selectedStrand;
      return matchesGrade && matchesStrand;
    });
  }, [renderStudents, selectedGrade, selectedStrand]);

  const clearFilters = useCallback(() => {
    setSelectedGrade(null);
    setSelectedStrand(null);
  }, []);

  // dropdown renderer from new UI
  const renderDropdownItem = (
    value: string,
    currentValue: string | null,
    onSelect: (value: string | null) => void,
    closeDropdown: () => void
  ) => {
    const isSelected = value === currentValue;
    return (
      <TouchableOpacity
        key={value}
        className={`p-3 flex-row justify-between items-center ${
          isSelected ? "bg-white/20" : ""
        }`}
        onPress={() => {
          onSelect(isSelected ? null : value);
          closeDropdown();
        }}
      >
        <Text
          className={`text-white text-sm ${
            isSelected ? "font-medium" : ""
          }`}
        >
          {value}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={16} color="#ffffff" />
        )}
      </TouchableOpacity>
    );
  };

  // ====== remove student logic (merge old logic + new UI flow)
  const handleRemoveStudent = (student: Student) => {
    setStudentToRemove(student);
  };

  const confirmRemoveStudent = async () => {
    try {
      if (studentToRemove && onRemoveStudent) {
        // parent wants to handle removal (maybe optimistic on client only)
        onRemoveStudent(studentToRemove.id);
      } else if (studentToRemove && teacherId) {
        // hard-remove from teacher_students in supabase (RLS must allow)
        const { error } = await supabase
          .from("teacher_students")
          .delete()
          .eq("teacher_id", teacherId)
          .eq("student_id", studentToRemove.id);

        if (error) throw error;

        // refresh live list
        await fetchLive();
      }
    } catch (e: any) {
      Alert.alert(
        "Unable to remove",
        e?.message || "Please try again."
      );
    } finally {
        setStudentToRemove(null);
    }
  };

  const cancelRemoveStudent = () => {
    setStudentToRemove(null);
  };

  // ====== RENDER
  return (
    <>
      {/* MAIN SLIDE-UP MODAL */}
      <Modal
        transparent
        visible={visible}
        onRequestClose={onClose}
        animationType="none"
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="flex-1">
            {/* overlay */}
            <View className="absolute inset-0 bg-black/50" />

            {/* panel */}
            <Animated.View
              {...panResponder.panHandlers}
              className="absolute bottom-0 left-0 right-0 bg-[#1A1F2E] rounded-t-3xl p-6"
              style={[
                {
                  height: height * 0.85,
                  transform: [
                    { translateY: Animated.add(slideAnim, pan.y) },
                  ],
                },
              ]}
            >
              {/* Header row */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-white text-2xl font-bold">
                  All Students ({filteredStudents.length})
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  className="p-2"
                >
                  <Text className="text-white text-lg">✕</Text>
                </TouchableOpacity>
              </View>

              {/* Filters */}
              <View className="mb-4">
                <View className="flex-row justify-between mb-2.5">
                  {/* Grade Filter */}
                  <View className="flex-1 mx-1.5 relative">
                    <TouchableOpacity
                      className={`flex-row items-center justify-between rounded-xl py-2.5 px-4 border ${
                        selectedGrade
                          ? "bg-white/10 border-white/30"
                          : "bg-white/5 border-white/20"
                      }`}
                      onPress={() => {
                        setShowGradeDropdown(!showGradeDropdown);
                        setShowStrandDropdown(false);
                      }}
                    >
                      <Text
                        className={`text-sm ${
                          selectedGrade
                            ? "text-white font-medium"
                            : "text-white/70"
                        }`}
                      >
                        {selectedGrade
                          ? `Grade ${selectedGrade}`
                          : "Select Grade"}
                      </Text>
                      <Text className="text-white/50 text-xs ml-2">
                        {showGradeDropdown ? "▲" : "▼"}
                      </Text>
                    </TouchableOpacity>

                    {showGradeDropdown && (
                      <View className="absolute top-full left-0 right-0 bg-[#2A3142] rounded-xl border border-white/10 mt-1.5 z-50 shadow-lg shadow-black/25">
                        {["11", "12"].map((grade) =>
                          renderDropdownItem(
                            `Grade ${grade}`,
                            selectedGrade,
                            (val) =>
                              setSelectedGrade(
                                val?.replace("Grade ", "") || null
                              ),
                            () => setShowGradeDropdown(false)
                          )
                        )}
                      </View>
                    )}
                  </View>

                  {/* Strand Filter */}
                  <View className="flex-1 mx-1.5 relative">
                    <TouchableOpacity
                      className={`flex-row items-center justify-between rounded-xl py-2.5 px-4 border ${
                        selectedStrand
                          ? "bg-white/10 border-white/30"
                          : "bg-white/5 border-white/20"
                      }`}
                      onPress={() => {
                        setShowStrandDropdown(!showStrandDropdown);
                        setShowGradeDropdown(false);
                      }}
                    >
                      <Text
                        className={`text-sm ${
                          selectedStrand
                            ? "text-white font-medium"
                            : "text-white/70"
                        }`}
                      >
                        {selectedStrand || "Select Strand"}
                      </Text>
                      <Text className="text-white/50 text-xs ml-2">
                        {showStrandDropdown ? "▲" : "▼"}
                      </Text>
                    </TouchableOpacity>

                    {showStrandDropdown && (
                      <View className="absolute top-full left-0 right-0 bg-[#2A3142] rounded-xl border border-white/10 mt-1.5 z-50 shadow-lg shadow-black/25">
                        {["STEM", "HUMSS", "ABM", "GAS", "TVL"].map(
                          (strand) =>
                            renderDropdownItem(
                              strand,
                              selectedStrand,
                              setSelectedStrand,
                              () => setShowStrandDropdown(false)
                            )
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {/* Clear Filters Button (only if something is selected) */}
                {(selectedGrade || selectedStrand) && (
                  <TouchableOpacity
                    className="bg-purple-500 rounded-xl py-2.5 items-center mt-2.5"
                    onPress={clearFilters}
                  >
                    <Text className="text-white font-medium text-sm">
                      Clear All Filters
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Student list */}
              <ScrollView className="flex-1">
                {filteredStudents.map((student) => (
                  <View
                    key={student.id}
                    className="p-4 mb-3 bg-white/10 rounded-xl border border-white/20"
                  >
                    {/* top row: avatar + info */}
                    <View className="flex-row items-center mb-3">
                      <View className="w-10 h-10 rounded-full bg-white/10 border border-white/30 items-center justify-center mr-3">
                        <Text className="text-white font-bold">
                          {student.initials}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-white font-bold text-base">
                          {student.name}
                        </Text>
                        <Text className="text-white text-xs opacity-80">
                          Grade {student.grade} - {student.strand}
                        </Text>
                      </View>
                    </View>

                    {/* remove button (top-right) */}
                    <View className="absolute top-4 right-4">
                      <TouchableOpacity
                        onPress={() => handleRemoveStudent(student)}
                        className="flex-row items-center justify-center py-2 px-4 rounded-lg bg-white/5 border border-white/10 min-w-[100px]"
                      >
                        <Text className="text-white/90 text-sm font-medium">
                          Remove
                        </Text>
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#FFFFFF"
                          className="ml-1"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* metrics: Confidence / Anxiety */}
                    <View className="mt-2">
                      {/* Confidence */}
                      <View className="mb-2">
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-white text-xs opacity-80">
                            Confidence Level
                          </Text>
                          <Text className="text-white text-xs font-medium">
                            {student.confidence ??
                              Math.floor(Math.random() * 30) + 70}
                            %
                          </Text>
                        </View>
                        <View className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${
                                student.confidence ??
                                Math.floor(Math.random() * 30) + 70
                              }%`,
                              backgroundColor: "#a78bfa",
                            }}
                          />
                        </View>
                      </View>

                      {/* Anxiety */}
                      <View>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-white text-xs opacity-80">
                            Anxiety Level
                          </Text>
                          <Text className="text-white text-xs font-medium">
                            {student.anxiety ??
                              Math.floor(Math.random() * 30) + 10}
                            %
                          </Text>
                        </View>
                        <View className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${
                                student.anxiety ??
                                Math.floor(Math.random() * 30) + 10
                              }%`,
                              backgroundColor: "#a78bfa",
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Close button bottom */}
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

      {/* CONFIRMATION POPUP */}
      <Modal
        transparent
        visible={!!studentToRemove}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={cancelRemoveStudent}
      >
        <View className="flex-1 bg-black/60 justify-center items-center p-6">
          <View className="bg-[#1A1F2E]/95 rounded-2xl w-full max-w-[380px] border border-white/10 shadow-xl shadow-black/30 overflow-hidden">
            <View className="p-6 pb-5">
              <Text className="text-white text-xl font-bold mb-3 text-center tracking-wide">
                Remove Student
              </Text>
              <Text className="text-white/80 text-base leading-6 text-center mt-2">
                Are you sure you want to remove{" "}
                <Text className="text-white font-semibold">
                  {studentToRemove?.name}
                </Text>{" "}
                from your class? This action cannot be undone.
              </Text>
            </View>

            <View className="flex-row border-t border-white/5 p-5 bg-black/20 justify-between items-center gap-6">
              <TouchableOpacity
                className="flex-1 max-w-[140px] py-3 rounded-lg bg-white/5 border border-white/10 items-center justify-center"
                onPress={cancelRemoveStudent}
                activeOpacity={0.8}
              >
                <Text className="text-white/95 font-semibold text-base tracking-wide">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 max-w-[140px] py-3 rounded-lg bg-red-500/20 border border-red-500/30 items-center justify-center"
                onPress={confirmRemoveStudent}
                activeOpacity={0.8}
              >
                <Text className="text-red-400 font-semibold text-base tracking-wide">
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default TotalStudentModal;
