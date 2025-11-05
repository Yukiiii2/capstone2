import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabaseClient";
import { Student, defaultPerformanceData } from "../../types";

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

type PerformanceType = "speaking" | "reading";

type AnxietyLevel = "low" | "medium" | "high";

type DerivedPerf = {
  moduleProgress: number; // %
  confidenceLevel: number; // %
  anxietyLevel: AnxietyLevel; // low/medium/high
  skillMastery: Record<string, number>;
  recentTasks: Array<{
    id: string;
    title: string;
    date: string;
    score: number;
  }>;
  areasToImprove: string[];
  recommendations: string[];
};

type ConfidenceAnxietyRow = {
  student_id: string;
  confidence_score_speaking: number | null;
  confidence_score_reading: number | null;
  anxiety_level_speaking: number | null;
  anxiety_level_reading: number | null;
  total_speaking_attempts: number | null;
  total_reading_attempts: number | null;
  updated_at: string | null;
};

type StudentProgressRow = {
  module_id: string | null;
  progress: number | null;
  completed: boolean | null;
  category: "speaking" | "reading" | null;
};

type FullAnalysisLevelRow = {
  module_id: string | null;
  level: "basic" | "advanced" | null;
  created_at: string;
};



type FullAnalysisMetricsRow = {
  id: string;
  created_at: string;
  metric_fluency: number | null;
  metric_clarity: number | null;
  metric_filler_reduction: number | null;
  metric_wpm: number | null; // 0–300, we'll normalize
  metric_accuracy: number | null;
  metric_volume: number | null;
  metric_phrasing: number | null;
  metric_grammar: number | null;
};


/* ▼▼▼ NEW: Class-related types (non-breaking) ▼▼▼ */
type ClassRow = {
  id: string;
  name: string | null;
  grade_level: string | null;
  strand: string | null;
  class_code?: string | null;
};
/* ▲▲▲ NEW ▲▲▲ */

/* ──────────────────────────────────────────────
   Component props
   ────────────────────────────────────────────── */
interface StudentManagementModalProps {
  visible: boolean;
  onClose: () => void;

  // base student list passed from dashboard as fallback
  students: Student[];

  // new UI passes these for header "GRADE 11 - STEM"
  grade?: string | null;
  strand?: string | null;

  // older logic version used this to seed filters
  initialFilter?: {
    grade?: string;
    strand?: string;
  };

  // add this so TeacherDashboard can pass it
  onStudentsUpdate?: (updatedStudents: Student[]) => void;
}

/* ──────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────── */

const toAnxietyLevel = (val?: number | null): AnxietyLevel => {
  if (val === null || val === undefined) return "medium";
  if (val <= 33) return "low";
  if (val <= 66) return "medium";
  return "high";
};

const getFallbackPerf = (
  type: PerformanceType
): DerivedPerf => {
  const fb = defaultPerformanceData[type];
  return {
    moduleProgress: fb.moduleProgress,
    confidenceLevel: fb.confidenceLevel,
    anxietyLevel: fb.anxietyLevel as AnxietyLevel,
    skillMastery: fb.skillMastery,
    recentTasks: fb.recentTasks as any,
    areasToImprove: fb.areasToImprove,
    recommendations: fb.recommendations,
  };
};

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */
const StudentManagementModal: React.FC<
  StudentManagementModalProps
> = ({
  visible,
  onClose,
  students,
  grade,
  strand,
  initialFilter = {},
}) => {
  // simple color mapping for progress bars
  const getBarColor = (n: number) => {
    if (n >= 80) return "#10b981"; // green-500
    if (n >= 60) return "#f59e0b"; // amber-500
    return "#ef4444"; // red-500
  };
  // ---------- local UI state ----------
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);
  const [
    showPerformanceTypeModal,
    setShowPerformanceTypeModal,
  ] = useState(false);
  const [
    showPerformanceModal,
    setShowPerformanceModal,
  ] = useState(false);
  const [
    selectedPerformanceType,
    setSelectedPerformanceType,
  ] = useState<PerformanceType>("speaking");

  // we keep teacher-bound live list so we don't trust only `students` prop
  const [teacherId, setTeacherId] = useState<string | null>(
    null
  );
  const [liveStudents, setLiveStudents] = useState<
    Student[]
  >([]);

  // this holds performance data cache
  const [perfCache, setPerfCache] = useState<
    Record<string, DerivedPerf>
  >({});
  const [perfLoading, setPerfLoading] =
    useState<boolean>(false);

  const perfKey = (studentId: string, type: PerformanceType) =>
    `${studentId}::${type}`;

  // seed default grade/strand filter from props
  const [selectedGradeFilter, setSelectedGradeFilter] =
    useState<string | null>(
      grade ??
        initialFilter.grade ??
        null
    );
  const [selectedStrandFilter, setSelectedStrandFilter] =
    useState<string | null>(
      strand ??
        initialFilter.strand ??
        null
    );

  /* ▼▼▼ NEW: Class dropdown state (non-breaking) ▼▼▼ */
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [studentClassMap, setStudentClassMap] = useState<Record<string, string[]>>({});
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  /* ▲▲▲ NEW ▲▲▲ */

  // effective "roster": live from supabase if we have it, else dashboard prop
  const allStudents: Student[] =
    liveStudents.length > 0 ? liveStudents : students;

  /* ─────────────────────────────
     AUTH bootstrap (teacherId)
     ───────────────────────────── */
  useEffect(() => {
    let ok = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (ok) setTeacherId(data?.user?.id ?? null);
    })();
    return () => {
      ok = false;
    };
  }, []);

  /* ─────────────────────────────
     Fetch live student list
     (teacher_students + profiles)
     ───────────────────────────── */
  const fetchLive = useCallback(async () => {
    if (!teacherId) return;

    const { data: ts, error: tsErr } = await supabase
      .from("teacher_students")
      .select("student_id, grade_level, strand, status")
      .eq("teacher_id", teacherId);

    if (tsErr) {
      console.warn("teacher_students error:", tsErr);
      setLiveStudents([]);
      return;
    }

    if (!ts?.length) {
      setLiveStudents([]);
      return;
    }

    const ids = Array.from(
      new Set(
        ts.map((r: any) => r.student_id)
      )
    ).filter(Boolean) as string[];

    const { data: profs, error: profErr } =
      await supabase
        .from("profiles")
        .select("id, name")
        .in("id", ids);

    if (profErr) {
      console.warn("profiles error:", profErr);
    }

    const byProf: Record<string, any> = {};
    (profs || []).forEach(
      (p) => (byProf[p.id] = p)
    );

    const mapped: Student[] = (ts || []).map(
      (r: any) => {
        const name = (
          byProf[r.student_id]?.name ||
          "Unknown Student"
        ).trim();
        const parts = name
          .split(/\s+/)
          .filter(Boolean);
        const initials =
          (parts[0]?.[0] || "?") +
          (parts[1]?.[0] || "?");

        return {
          id: r.student_id,
          name,
          grade: r.grade_level || "",
          strand: r.strand || "",
          status:
            (r.status as "active" | "inactive") ||
            "active",
          progress: 0,
          satisfaction: 0,
          initials,
          color: "#4F46E5",
          statusColor:
            r.status === "active"
              ? "text-green-400"
              : "text-gray-400",
        } as Student;
      }
    );

    setLiveStudents(mapped);
  }, [teacherId]);

  // refetch + subscribe in realtime whenever modal is visible
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

    return () => {
      try {
        supabase.removeChannel(chA);
      } catch {}
    };
  }, [teacherId, visible, fetchLive]);

  /* ─────────────────────────────
     Performance loader
     (confidence/anxiety/progress/skills)
     ───────────────────────────── */
  const loadPerformance = useCallback(
    async (studentId: string, type: PerformanceType) => {
      if (!teacherId) return;

      setPerfLoading(true);
      try {
        // verify teacher-student membership
        const { data: membership, error: memErr } =
          await supabase
            .from("teacher_students")
            .select("student_id")
            .eq("teacher_id", teacherId)
            .eq("student_id", studentId)
            .limit(1);

        if (memErr) {
          console.warn(
            "teacher_students verify error:",
            memErr
          );
          return;
        }
        if (
          !membership ||
          membership.length === 0
        ) {
          console.warn(
            "Student is not under this teacher."
          );
          return;
        }

        // get fallback data
        const fallback = getFallbackPerf(type);
        const cached =
          perfCache[
            perfKey(studentId, type)
          ];

        /* 1. Confidence / Anxiety */
        const {
          data: casMaybe,
          error: casErr,
        } = await supabase
          .from("confidence_anxiety_score")
          .select(
            "student_id, confidence_score_speaking, confidence_score_reading, anxiety_level_speaking, anxiety_level_reading, total_speaking_attempts, total_reading_attempts, updated_at"
          )
          .eq("student_id", studentId)
          .order("updated_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (casErr)
          console.warn(
            "confidence_anxiety_score error:",
            casErr
          );

        const casRow =
          (casMaybe ??
            null) as ConfidenceAnxietyRow | null;

        const confidenceLevelRaw =
  type === "speaking"
    ? casRow?.confidence_score_speaking
    : casRow?.confidence_score_reading;

// pick a base before clamping/rounding
const confidenceBase =
  confidenceLevelRaw ?? fallback.confidenceLevel ?? 0;

const confidenceLevel = Math.max(
  0,
  Math.min(
    100,
    Math.round(confidenceBase)
  )
);

        const anxietyLevel: AnxietyLevel =
          type === "speaking"
            ? toAnxietyLevel(
                casRow?.anxiety_level_speaking
              )
            : toAnxietyLevel(
                casRow?.anxiety_level_reading
              );

        /* 2. Module progress across basic/advanced */
        const MODULES_PER_LEVEL = 6;
        const TOTAL_MODULES =
          MODULES_PER_LEVEL * 2; // 12

        const {
          data: spRowsRaw,
          error: spErr,
        } = await supabase
          .from("student_progress")
          .select(
            "module_id, progress, completed, category"
          )
          .eq("student_id", studentId)
          .eq("category", type);

        if (spErr)
          console.warn(
            "student_progress error:",
            spErr
          );

        const spRows =
          (spRowsRaw ?? []) as StudentProgressRow[];

        let moduleProgress =
          fallback.moduleProgress;

        if (spRows && spRows.length > 0) {
          const moduleIds = Array.from(
            new Set(
              spRows
                .map((r) => r.module_id)
                .filter(
                  (
                    m
                  ): m is string =>
                    typeof m ===
                      "string" &&
                    m.length > 0
                )
            )
          );

          let faLevelMap: Record<
            string,
            "basic" | "advanced"
          > = {};

          if (moduleIds.length > 0) {
            const {
              data: faRowsRaw,
              error: faErr,
            } = await supabase
              .from("full_analysis")
              .select(
                "module_id, level, created_at"
              )
              .eq("user_id", studentId)
              .eq("category", type)
              .in("module_id", moduleIds)
              .order("created_at", {
                ascending: false,
              });

            if (faErr) {
              console.warn(
                "full_analysis(level) error:",
                faErr
              );
            } else {
              const faRows =
                (faRowsRaw ??
                  []) as FullAnalysisLevelRow[];
              for (const row of faRows) {
                const mid =
                  row.module_id ?? "";
                if (!mid) continue;
                if (
                  !faLevelMap[mid] &&
                  (row.level ===
                    "basic" ||
                    row.level ===
                      "advanced")
                ) {
                  // first seen = latest
                  faLevelMap[mid] =
                    row.level;
                }
              }
            }
          }

          const clamp0to100 = (n: number) =>
            Math.max(
              0,
              Math.min(
                100,
                Math.round(n)
              )
            );

          let sumBasic = 0;
          let sumAdvanced = 0;

          for (const r of spRows) {
            const mid =
              r.module_id ?? "";
            const lvl =
              faLevelMap[mid] ?? "basic";
            const score =
              typeof r.progress ===
                "number" &&
              Number.isFinite(
                r.progress
              )
                ? clamp0to100(
                    r.progress
                  )
                : r.completed
                ? 100
                : 0;

            if (lvl === "advanced")
              sumAdvanced += score;
            else sumBasic += score;
          }

          const totalPossible =
            TOTAL_MODULES * 100;
          const totalEarned =
            sumBasic + sumAdvanced;
          moduleProgress = clamp0to100(
            (totalEarned /
              totalPossible) *
              100
          );
        }

        /* 3. Skill mastery (avg of last 10 attempts in full_analysis) */
        const {
          data: faMetricsRaw,
          error: faMetricsErr,
        } = await supabase
          .from("full_analysis")
          .select(
            "id, created_at, metric_fluency, metric_clarity, metric_filler_reduction, metric_wpm, metric_accuracy, metric_volume, metric_phrasing, metric_grammar"
          )
          .eq("user_id", studentId)
          .eq("category", type)
          .order("created_at", {
            ascending: false,
          })
          .limit(10);

        if (faMetricsErr)
          console.warn(
            "full_analysis(metrics) error:",
            faMetricsErr
          );

        const rows =
          (faMetricsRaw ??
            []) as FullAnalysisMetricsRow[];

        const takeNums = (
          xs: Array<
            number | null | undefined
          >
        ) =>
          xs.filter(
            (
              n
            ): n is number =>
              typeof n ===
                "number" &&
              Number.isFinite(n)
          );

        const avg = (xs: number[]) =>
          xs.length
            ? Math.round(
                xs.reduce(
                  (a, b) => a + b,
                  0
                ) / xs.length
              )
            : 0;

        const normalizeWpmToPct = (
          n: number
        ) =>
          Math.max(
            0,
            Math.min(
              100,
              Math.round(
                (n / 300) * 100
              )
            )
          );

        const fluencyArr = takeNums(
          rows.map(
            (r) => r.metric_fluency
          )
        );
        const clarityArr = takeNums(
          rows.map(
            (r) => r.metric_clarity
          )
        );
        const fillerArr = takeNums(
          rows.map(
            (r) =>
              r.metric_filler_reduction
          )
        );
        const wpmArr = takeNums(
          rows.map(
            (r) => r.metric_wpm
          )
        );
        const accuracyArr = takeNums(
          rows.map(
            (r) => r.metric_accuracy
          )
        );
        const volumeArr = takeNums(
          rows.map(
            (r) => r.metric_volume
          )
        );
        const phrasingArr = takeNums(
          rows.map(
            (r) => r.metric_phrasing
          )
        );
        const grammarArr = takeNums(
          rows.map(
            (r) => r.metric_grammar
          )
        );

        const wpmPctArr = wpmArr.map(
          normalizeWpmToPct
        );

        const skillMastery: Record<
  string,
  number
> = {
  speaking_pace: avg(wpmPctArr),      // formerly wpm
  filler_words: avg(fillerArr),       // formerly filler_reduction
  clarity_score: avg(clarityArr),     // formerly clarity
  vocabulary_score: avg(phrasingArr),  // formerly phrasing
  grammar_score: avg(grammarArr),      // formerly grammar
  pause_score: avg(volumeArr)         // formerly volume
};
        // final derived perf
        const derived: DerivedPerf = {
          ...(cached ??
            getFallbackPerf(type)),
          confidenceLevel,
          anxietyLevel,
          moduleProgress,
          skillMastery,
        };

        setPerfCache((prev) => ({
          ...prev,
          [perfKey(studentId, type)]:
            derived,
        }));
      } finally {
        setPerfLoading(false);
      }
    },
    [teacherId, perfCache]
  );

  /* ─────────────────────────────
     ▼▼▼ NEW: classes + membership fetch (non-breaking) ▼▼▼
     ───────────────────────────── */
  useEffect(() => {
    if (!teacherId || !visible) return;
    (async () => {
      // 1) Teacher's classes
      const { data: cls, error: clsErr } = await supabase
        .from("classes")
        .select("id, name, grade_level, strand, class_code")
        .eq("teacher_id", teacherId);

      if (clsErr) {
        console.warn("classes error:", clsErr);
        setClasses([]);
        setStudentClassMap({});
        return;
      }

      const classRows = (cls ?? []) as ClassRow[];
      setClasses(classRows);

      if (!classRows.length) {
        setStudentClassMap({});
        return;
      }

      const classIds = classRows.map(c => c.id);

      // 2) Enrollments for those classes
      const { data: enr, error: enrErr } = await supabase
        .from("class_enrollments")
        .select("class_id, student_id, status")
        .in("class_id", classIds);

      if (enrErr) {
        console.warn("class_enrollments error:", enrErr);
        setStudentClassMap({});
        return;
      }

      // 3) Build student -> [class_id[]] map (active only)
      const map: Record<string, string[]> = {};
      for (const r of (enr ?? []) as Array<{class_id: string; student_id: string; status?: string}>) {
        if (!r.student_id || !r.class_id) continue;
        if (r.status && r.status !== "active") continue;
        if (!map[r.student_id]) map[r.student_id] = [];
        map[r.student_id].push(r.class_id);
      }
      setStudentClassMap(map);
    })();
  }, [teacherId, visible]);
  /* ▲▲▲ NEW ▲▲▲ */

  /* ─────────────────────────────
     student list filtering logic
     ───────────────────────────── */
  const filteredStudents = useMemo(() => {
    return allStudents.filter((student) => {
      // text match
      const q = searchQuery
        .trim()
        .toLowerCase();
      const matchesSearch = q
        ? student.name
            .toLowerCase()
            .includes(q) ||
          (student.grade || "")
            .toLowerCase()
            .includes(q) ||
          (student.strand || "")
            .toLowerCase()
            .includes(q)
        : true;

      // grade/strand match (from props or initialFilter)
      const matchesGrade =
        !selectedGradeFilter ||
        student.grade ===
          selectedGradeFilter;
      const matchesStrand =
        !selectedStrandFilter ||
        student.strand ===
          selectedStrandFilter;

      // ▼▼▼ NEW: class filter (uses class_enrollments map, by class_id) ▼▼▼
      const inSelectedClass =
        !selectedClassId ||
        (studentClassMap[student.id]?.includes(selectedClassId) ?? false);

      return (
        matchesSearch &&
        matchesGrade &&
        matchesStrand &&
        inSelectedClass
      );
    });
  }, [
    allStudents,
    searchQuery,
    selectedGradeFilter,
    selectedStrandFilter,
    selectedClassId,           // NEW
    studentClassMap            // NEW
  ]);

  /* ─────────────────────────────
     handlers for taps
     ───────────────────────────── */
  const handleStudentPress = (
    student: Student
  ) => {
    setSelectedStudent(student);
    setShowPerformanceTypeModal(true);
  };

  const handlePerformanceTypeSelect =
    async (type: PerformanceType) => {
      setSelectedPerformanceType(type);
      setShowPerformanceTypeModal(false);

      if (selectedStudent?.id) {
        await loadPerformance(
          selectedStudent.id,
          type
        );
      }
      setShowPerformanceModal(true);
    };

  /* ─────────────────────────────
     performance modal UI
     (uses REAL data from perfCache)
     ───────────────────────────── */
  const renderPerformanceModal = () => {
    if (
      !selectedStudent ||
      !showPerformanceModal
    )
      return null;

    const cached =
      perfCache[
        perfKey(
          selectedStudent.id,
          selectedPerformanceType
        )
      ];
    const fallback = getFallbackPerf(
      selectedPerformanceType
    );
    const data: DerivedPerf =
      cached ?? fallback;

    const anxietyColors = {
      low: {
        text: "text-green-400",
        dot: "bg-green-400",
        progress: 30,
        progressColor: "#10b981",
      },
      medium: {
        text: "text-yellow-400",
        dot: "bg-yellow-400",
        progress: 60,
        progressColor: "#f59e0b",
      },
      high: {
        text: "text-red-400",
        dot: "bg-red-400",
        progress: 90,
        progressColor: "#ef4444",
      },
    } as Record<
      AnxietyLevel,
      {
        text: string;
        dot: string;
        progress: number;
        progressColor: string;
      }
    >;

    const currentAnxiety =
      anxietyColors[
        data.anxietyLevel
      ];

    return (
      <Modal
        transparent
        visible={showPerformanceModal}
        animationType="fade"
        onRequestClose={() =>
          setShowPerformanceModal(false)
        }
      >
        <View className="flex-1 bg-black/30 justify-center items-center p-3">
          <View className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <BlurView
              intensity={30}
              tint="dark"
              className="w-full"
            >
              <View className="p-6 bg-[#1A1F2E]/95 border border-white/10 rounded-3xl">
                {/* Header */}
                <View className="flex-row justify-between items-start mb-6">
                  <View className="flex-1 pr-4">
                    <Text className="text-2xl font-bold text-white mb-2">
                      {selectedStudent.name}
                      's
                      Performance
                    </Text>
                    <View className="flex-row items-center">
                      <View className="px-3 py-1 rounded-full bg-white/10 mr-2 border border-white/10">
                        <Text className="text-white text-xs font-medium capitalize">
                          {
                            selectedPerformanceType
                          }
                        </Text>
                      </View>
                      <Text className="text-white/70 text-sm">
                        {selectedStudent.grade} •{" "}
                        {
                          selectedStudent.strand
                        }
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      setShowPerformanceModal(
                        false
                      )
                    }
                    className="p-2 bg-white/20 rounded-full w-10 h-10 items-center justify-center"
                    activeOpacity={0.8}
                  >
                    <Text className="text-white text-3xl bottom-2">
                      ×
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  className="pr-2"
                  style={{
                    maxHeight:
                      Dimensions.get(
                        "window"
                      ).height * 0.7,
                  }}
                  showsVerticalScrollIndicator={
                    false
                  }
                >
                  {/* Module Progress */}
                  <View className="bg-white/10 border border-white/30 rounded-2xl p-4 shadow-lg mb-6 backdrop-blur-md">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1 pr-2">
                        <Text className="text-base font-semibold text-white mb-1">
                          Module
                          Progress
                        </Text>
                        <Text className="text-white/60 text-sm">
                          Overall completion
                          of{" "}
                          {
                            selectedPerformanceType
                          }{" "}
                          modules
                        </Text>
                      </View>
                      <View className="bg-white/10 border border-white/20 rounded-full px-2 py-0.5 min-w-[40px] items-center justify-center">
                        <Text className="text-white font-semibold text-xs">
                          {data.moduleProgress}
                          %
                        </Text>
                      </View>
                    </View>
                    <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${data.moduleProgress}%`,
                          backgroundColor: getBarColor(data.moduleProgress),
                        }}
                      />
                    </View>
                  </View>

                  {/* Confidence and Anxiety */}
                  <View className="flex-row justify-between mb-6 space-x-4">
                    {/* Confidence */}
                    <View className="bg-white/10 border border-white/30 rounded-2xl p-5 shadow-lg flex-1 backdrop-blur-md">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-sm font-medium text-white/80">
                          Confidence
                        </Text>
                        <View className="w-2 h-2 rounded-full bg-green-400"></View>
                      </View>
                      <View className="mb-3">
                        <Text
                          className={`text-3xl font-bold ${
                            data.confidenceLevel >=
                            80
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {data.confidenceLevel}
                          %
                        </Text>
                      </View>
                      <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${data.confidenceLevel}%`,
                            backgroundColor: getBarColor(data.confidenceLevel),
                          }}
                        />
                      </View>
                    </View>

                    {/* Anxiety */}
                    <View className="bg-white/10 border border-white/30 rounded-2xl p-5 shadow-lg flex-1 backdrop-blur-md">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-sm font-medium text-white/80">
                          Anxiety Level
                        </Text>
                        <View
                          className={`w-2 h-2 rounded-full ${currentAnxiety.dot}`}
                        ></View>
                      </View>
                      <View className="mb-3">
                        <Text
                          className={`text-2xl font-bold ${currentAnxiety.text}`}
                        >
                          {data.anxietyLevel
                            .charAt(0)
                            .toUpperCase() +
                            data.anxietyLevel.slice(
                              1
                            )}
                        </Text>
                      </View>
                      <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${currentAnxiety.progress}%`,
                            backgroundColor:
                              currentAnxiety.progressColor,
                          }}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Skill Mastery */}
                  <View className="bg-white/10 border border-white/30 rounded-2xl p-5 shadow-lg mb-6 backdrop-blur-md">
                    <View className="flex-row justify-between items-center mb-5">
                      <Text className="text-base font-semibold text-white">
                        Skill Mastery
                      </Text>
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-violet-500 mr-1"></View>
                        <Text className="text-xs text-white/60">
                          Progress
                        </Text>
                      </View>
                    </View>

                    <View className="space-y-5">
                      {Object.entries(
                        data.skillMastery
                      ).map(
                        ([skill, value]) => {
                          const valNum =
                            typeof value ===
                            "number"
                              ? value
                              : 0;

                          return (
                            <View
                              key={skill}
                              className="space-y-2"
                            >
                              <View className="flex-row justify-between items-center">
                                <Text className="text-sm font-medium text-white/90 capitalize">
                                  {skill.replace(
                                    /_/g,
                                    " "
                                  )}
                                </Text>
                                <Text className="text-sm font-semibold text-white">
                                  {valNum}
                                  %
                                </Text>
                              </View>
                              <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <View
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${valNum}%`,
                                    backgroundColor: getBarColor(valNum),
                                  }}
                                />
                              </View>
                            </View>
                          );
                        }
                      )}
                    </View>
                  </View>

                  {/* Recent Tasks (from fallback/defaultPerformanceData, unless you wire real tasks later) */}
                  <View className="bg-white/10 border border-white/30 rounded-2xl p-5 shadow-lg mb-6 overflow-hidden backdrop-blur-md">
                    <View className="flex-row justify-between items-center mb-6">
                      <View>
                        <Text className="text-lg font-bold text-white">
                          Recent Tasks
                        </Text>
                        <Text className="text-sm text-white/60 mt-0.5">
                          Student's latest
                          activities
                        </Text>
                      </View>
                      <View className="px-4 bottom-2 py-1.5">
                        <Text className="text-white text-sm font-medium">
                          {data.recentTasks.length}{" "}
                          completed
                        </Text>
                      </View>
                    </View>

                    <View className="space-y-3">
                      {data.recentTasks.map(
                        (task) => {
                          const scoreColor =
                            task.score >=
                            80
                              ? "text-green-400"
                              : task.score >=
                                70
                              ? "text-yellow-400"
                              : "text-red-400";

                          return (
                            <View
                              key={task.id}
                              className="bg-white/5 border border-white/30 rounded-xl p-4 mb-3 backdrop-blur-sm"
                            >
                              <View className="flex-row justify-between items-start">
                                <View className="flex-1 pr-3">
                                  <Text className="font-semibold text-white mb-2">
                                    {
                                      task.title
                                    }
                                  </Text>
                                  <View className="flex-row items-center">
                                    <Ionicons
                                      name="calendar-outline"
                                      size={12}
                                      color="rgba(255,255,255,0.5)"
                                    />
                                    <Text className="text-xs text-white/60 ml-1.5">
                                      {new Date(
                                        task.date
                                      ).toLocaleDateString(
                                        "en-US",
                                        {
                                          month:
                                            "short",
                                          day: "numeric",
                                          year: "numeric",
                                        }
                                      )}
                                    </Text>
                                  </View>
                                </View>
                                <View className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full min-w-[70px] items-center">
                                  <Text
                                    className={`text-sm font-bold ${scoreColor}`}
                                  >
                                    {
                                      task.score
                                    }
                                    %
                                  </Text>
                                </View>
                              </View>

                              <View className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <View
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${task.score}%`,
                                    backgroundColor:
                                      task.score >=
                                      80
                                        ? "#10b981"
                                        : task.score >=
                                          70
                                        ? "#f59e0b"
                                        : "#ef4444",
                                  }}
                                />
                              </View>
                            </View>
                          );
                        }
                      )}
                    </View>
                  </View>

                  {/* Insights / Recommendations */}
                  <View className="space-y-4">
                    <View className="pb-2 border-b border-white/10 mb-2">
                      <Text className="text-base font-semibold text-white">
                        Performance Insights
                      </Text>
                      <Text className="text-white/60 text-xs mt-1">
                        Key observations and
                        suggestions
                      </Text>
                    </View>

                    {data.areasToImprove
                      .length > 0 && (
                      <View className="bg-white/10 border border-white/30 rounded-xl p-4 backdrop-blur-sm">
                        <View className="flex-row items-center mb-3">
                          <View className="w-2 h-2 rounded-full bg-amber-400 mr-3"></View>
                          <Text className="text-sm font-medium text-amber-400">
                            Areas to
                            Improve
                          </Text>
                        </View>
                        <View className="space-y-3">
                          {data.areasToImprove.map(
                            (
                              item,
                              idx
                            ) => (
                              <Text
                                key={idx}
                                className="text-white/90 text-sm leading-relaxed"
                              >
                                {item}
                              </Text>
                            )
                          )}
                        </View>
                      </View>
                    )}

                    {data.recommendations
                      .length > 0 && (
                      <View className="bg-white/10 border border-white/30 rounded-xl p-4 backdrop-blur-sm">
                        <View className="flex-row items-center mb-3">
                          <View className="w-2 h-2 rounded-full bg-blue-400 mr-3"></View>
                          <Text className="text-sm font-medium text-blue-400">
                            Recommendations
                          </Text>
                        </View>
                        <View className="space-y-3">
                          {data.recommendations.map(
                            (
                              item,
                              idx
                            ) => (
                              <Text
                                key={idx}
                                className="text-white/90 text-sm leading-relaxed"
                              >
                                {item}
                              </Text>
                            )
                          )}
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

  /* ─────────────────────────────
     performance type selector modal
     ───────────────────────────── */
  const renderPerformanceTypeModal =
    () => (
      <Modal
        transparent
        visible={showPerformanceTypeModal}
        animationType="fade"
        onRequestClose={() =>
          setShowPerformanceTypeModal(false)
        }
      >
        <View className="flex-1 bg-black/60 justify-center items-center p-4">
          <BlurView
            intensity={30}
            tint="dark"
            className="w-full max-w-md rounded-2xl overflow-hidden"
          >
            <View className="p-6 bg-[#1A1F2E] rounded-2xl">
              <Text className="text-2xl font-bold text-white mb-6 text-center">
                Select Performance
                Type
              </Text>

              <View className="space-y-4 mb-6">
                {(
                  ["speaking", "reading"] as PerformanceType[]
                ).map((type) => (
                  <TouchableOpacity
                    key={type}
                    className="p-2 bg-white/10 rounded-xl active:bg-white/10"
                    onPress={() =>
                      handlePerformanceTypeSelect(
                        type
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full items-center justify-center mr-4">
                        <Ionicons
                          name={
                            type ===
                            "speaking"
                              ? "mic-outline"
                              : "book-outline"
                          }
                          size={20}
                          color="#ffffff"
                        />
                      </View>
                      <Text className="text-white text-lg font-medium capitalize">
                        {type}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                className="mt-2 p-4 bg-white/5 border border-white/10 rounded-xl items-center active:bg-white/10"
                onPress={() =>
                  setShowPerformanceTypeModal(
                    false
                  )
                }
                activeOpacity={0.8}
              >
                <Text className="text-gray-300 font-medium">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    );

  /* ─────────────────────────────
     main modal body
     ───────────────────────────── */
  if (!visible) return null;

  // the header text should match the new UI:
  // if we have grade+strand we show "GRADE 11 - STEM"
  // else we fall back
  const headerLabel =
    selectedGradeFilter && selectedStrandFilter
      ? `GRADE ${selectedGradeFilter} - ${selectedStrandFilter}`
      : grade && strand
      ? `GRADE ${grade} - ${strand}`
      : "Select a Class";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-[100px] bg-[#1A1F2E]/95 backdrop-blur-3xl rounded-t-2xl p-5 border-t border-white/10">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-white text-xl font-semibold">
              {headerLabel}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="p-2"
            >
              <Text className="text-gray-400 text-xl font-bold">
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-white/10 border border-white/20 rounded-xl px-3 mb-4">
            <View className="mr-2">
              <Ionicons
                name="search"
                size={18}
                color="#6B7280"
              />
            </View>
            <TextInput
              className="flex-1 text-white h-10"
              placeholder="Search students..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* ▼▼▼ NEW: Class Dropdown (same width as search bar) ▼▼▼ */}
          <View className="relative mb-4">
            <TouchableOpacity
              onPress={() => setShowClassDropdown((s) => !s)}
              activeOpacity={0.8}
              className="flex-row items-center bg-white/10 border border-white/20 rounded-xl px-3 h-10"
            >
              <Ionicons name="school-outline" size={18} color="#6B7280" />
              <Text className="text-white ml-2 flex-1" numberOfLines={1}>
                {selectedClassId
                  ? (() => {
                      const c = classes.find(
                        (x) => x.id === selectedClassId
                      );
                      const label = c?.name || c?.class_code || "Class";
                      const meta =
                        (c?.grade_level ? `Grade ${c.grade_level}` : "") +
                        (c?.strand ? (c?.grade_level ? " • " : "") + c.strand : "");
                      return meta ? `${label} — ${meta}` : label;
                    })()
                  : "Select a class"}
              </Text>
              <Ionicons
                name={showClassDropdown ? "chevron-up" : "chevron-down"}
                size={18}
                color="#cbd5e1"
              />
            </TouchableOpacity>

            {showClassDropdown && (
              <View className="absolute z-10 w-full mt-2 bg-[#2A3142] border border-white/10 rounded-lg max-h-64">
                <ScrollView>
                  <TouchableOpacity
                    className="px-4 py-2 border-b border-white/10"
                    onPress={() => {
                      setSelectedClassId(null);
                      setShowClassDropdown(false);
                    }}
                  >
                    <Text className="text-white/80">All classes</Text>
                  </TouchableOpacity>

                  {classes.map((c) => {
                    const meta =
                      (c.grade_level ? `Grade ${c.grade_level}` : "") +
                      (c.strand ? (c.grade_level ? " • " : "") + c.strand : "");
                    return (
                      <TouchableOpacity
                        key={c.id}
                        className="px-4 py-2 border-b border-white/10"
                        onPress={() => {
                          setSelectedClassId(c.id); // use canonical class_id for filtering
                          setShowClassDropdown(false);
                        }}
                      >
                        <Text className="text-white">
                          {(c.name || c.class_code || "Class") + (meta ? ` — ${meta}` : "")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
          {/* ▲▲▲ NEW ▲▲▲ */}

          {/* Student List */}
          <ScrollView className="flex-1">
            {filteredStudents.length > 0 ? (
              filteredStudents.map(
                (student) => (
                  <TouchableOpacity
                    key={student.id}
                    className="flex-row items-center p-3 rounded-2xl mb-2.5"
                    style={{
                      backgroundColor:
                        "rgba(255,255,255,0.07)",
                      borderWidth: 2,
                      borderColor:
                        "rgba(255,255,255,0.1)",
                      shadowColor: "#000",
                      shadowOffset: {
                        width: 0,
                        height: 1,
                      },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                    }}
                    onPress={() =>
                      handleStudentPress(
                        student
                      )
                    }
                  >
                    <View
                      className="w-12 h-12 items-center justify-center mr-4"
                      style={{
                        backgroundColor:
                          student.color,
                        borderRadius: 9999,
                        width: 48,
                        height: 48,
                        shadowColor:
                          "#000",
                        shadowOffset: {
                          width: 0,
                          height: 2,
                        },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 3,
                        overflow:
                          "hidden",
                      }}
                    >
                      <Text className="text-white text-base font-semibold">
                        {student.initials}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text
                          className="text-white text-base font-semibold flex-1 mr-2"
                          numberOfLines={
                            1
                          }
                          ellipsizeMode="tail"
                        >
                          {student.name}
                        </Text>

                        <View className="flex-row items-center">
                          <View
                            className={`w-2.5 h-2.5 rounded-full mx-1 ${
                              student.status ===
                              "active"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          />
                          <Text
                            className={`text-xs font-medium ${
                              student.status ===
                              "active"
                                ? "text-green-300"
                                : "text-gray-300"
                            }`}
                          >
                            {student.status
                              .charAt(
                                0
                              )
                              .toUpperCase() +
                              student.status.slice(
                                1
                              )}
                          </Text>
                        </View>
                      </View>

                      <Text className="text-white/70 text-sm">
                        Grade {student.grade} •{" "}
                        {student.strand}
                      </Text>
                    </View>

                    <View className="ml-2">
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="rgba(255, 255, 255, 0.5)"
                      />
                    </View>
                  </TouchableOpacity>
                )
              )
            ) : (
              <View className="items-center justify-center py-10">
                <Text className="text-white/60 text-base text-center mb-4">
                  No students found
                  matching your
                  criteria
                </Text>
                <Text className="text-white/60 text-base text-center">
                  No students found in
                  this class
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Performance Type Selection Modal */}
        {renderPerformanceTypeModal()}

        {/* Performance Modal */}
        {renderPerformanceModal()}
      </View>
    </Modal>
  );
};

export default StudentManagementModal;
