
// MERGED FINAL: TeacherDashboard.tsx
// UI from FILE B + Supabase logic, data loading, realtime, profile, stats from FILE A

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import NavigationBar from "@/components/NavigationBar/nav-bar-teacher";
// import StrandGradeModal from "@/components/TeacherModal/StrandGradeModal"; // ❌ REMOVED
import TotalStudentModal from "@/components/TeacherModal/TotalStudentModal";
import ActiveStudentModal from "@/components/TeacherModal/ActiveStudentModal";
import StudentManagementModal from "@/components/TeacherModal/StudentManagementModal";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ProfileMenuTeacher from "@/components/ProfileModal/ProfileMenuTeacher";
import { supabase } from "@/lib/supabaseClient";


/* ────────────────────────────────────────────────────────────────────
   Layout helpers
   ──────────────────────────────────────────────────────────────────── */
const { width } = Dimensions.get("window");

/* ────────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────────── */
type StudentStatus = "active" | "inactive";

type ConfidenceAnxietyScore = {
  student_id: string;
  confidence_score_speaking: number;
  confidence_score_reading: number;
  anxiety_level_speaking: number | null;
  anxiety_level_reading: number | null;
  total_speaking_attempts: number;
  total_reading_attempts: number;
};
type ConfidenceScores = {
  speaking: number;
  reading: number;
  anxietySpeaking: number;
  anxietyReading: number;
};

interface Student {
  id: string;
  name: string;
  grade: string;
  strand: string;
  status: StudentStatus;
  progress: number;
  satisfaction: number;
  confidence?: number;
  anxiety?: number;
  initials: string;
  color: string;
  statusColor: string;
}

interface Stats {
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  averageSatisfaction: number;
  averageConfidence: number;
  averageAnxiety: number; // Add this
}

type ProgressRow = {
  student_id: string;
  speaking_completed?: number | null;
  speaking_total?: number | null;
  reading_completed?: number | null;
  reading_total?: number | null;
  confidence?: number | null;
  anxiety?: number | null;
};

type TeacherStudentRow = {
  teacher_id: string;
  student_id: string;
  grade_level: string | null;
  strand: string | null;
  status: string | null;
  inserted_at?: string | null;
};

type ProfileRow = {
  id: string;
  name: string | null;
  avatar_url?: string | null;
};

/* ────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────── */
const TRANSPARENT_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

async function resolveSignedAvatar(userId: string, storedPath?: string | null) {
  const stored = (storedPath ?? userId).toString();
  const normalized = stored.replace(/^avatars\//, "");
  let objectPath: string | null = null;

  if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
    objectPath = normalized;
  } else {
    const { data: listed, error } = await supabase.storage
      .from("avatars")
      .list(normalized, {
        sortBy: { column: "created_at", order: "desc" },
        limit: 1,
      });
    if (error) return null;
    if (listed && listed.length > 0) {
      objectPath = `${normalized}/${listed[0].name}`;
    }
  }

  if (!objectPath) return null;
  const signedRes = await supabase.storage
    .from("avatars")
    .createSignedUrl(objectPath, 60 * 60);
  if (signedRes.error) return null;
  return signedRes.data?.signedUrl ?? null;
}

const initialsFrom = (name?: string | null) => {
  const n = (name || "").trim();
  if (!n) return "??";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
};

const safeStrand = (s?: string | null) =>
  s === "HUMMS" ? "HUMSS" : s || "";

const pickColorFromId = (id: string) => {
  const palette = [
    "#a78bfa",
    "#60a5fa",
    "#f472b6",
    "#34d399",
    "#f59e0b",
    "#f87171",
    "#22d3ee",
    "#4ade80",
  ];
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum = (sum + id.charCodeAt(i)) % 9973;
  return palette[sum % palette.length];
};

function mergeProgressIntoStudents(base: Student[], rows: ProgressRow[]): Student[] {
  const byId = new Map<string, ProgressRow>(rows.map((r) => [r.student_id, r]));
  return base.map((s) => {
    const p = byId.get(s.id);
    if (!p) {
      return {
        ...s,
        progress: 0,
        confidence: 0,
        anxiety: 100,
        satisfaction: 0,
      };
    }

    const sc = Number(p.speaking_completed ?? 0);
    const st = Number(p.speaking_total ?? 0);
    const rc = Number(p.reading_completed ?? 0);
    const rt = Number(p.reading_total ?? 0);
    

    const total = st + rt;
    const done = sc + rc;
    const progress =
      total > 0
        ? Math.max(0, Math.min(100, Math.round((done / total) * 100)))
        : 0;

    return {
      ...s,
      progress,
      confidence: p.confidence ?? 0,
      anxiety: p.anxiety ?? 100,
      satisfaction: 0,
    };
  });
}

/* ────────────────────────────────────────────────────────────────────
   Presentational cards
   ──────────────────────────────────────────────────────────────────── */
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  progress?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onPress?: () => void;
}

const MetricCard = ({
  title,
  value,
  icon,
  progress,
  trend,
  onPress,
}: MetricCardProps) => {
  return (
    <View
      className="p-4 mb-4 rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "rgba(155, 146, 146, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      }}
    >
      <View className="flex-row items-start justify-between mb-3 relative">
        <View className="rounded-xl">{icon}</View>

        {trend && (
          <View
            className="flex-row items-center px-2 py-1 rounded-full"
            style={{
              backgroundColor: trend.isPositive
                ? "rgba(16, 185, 129, 0.2)"
                : "rgba(239, 68, 68, 0.2)",
            }}
          >
            <Text
              className={`text-xs font-medium ${
                trend.isPositive ? "text-green-400" : "text-red-400"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}%
            </Text>
          </View>
        )}
      </View>

      <Text className="text-gray-100 text-sm font-medium mb-1">
        {title}
      </Text>

      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-2xl font-bold text-white">{value}</Text>
        {onPress && (
          <TouchableOpacity
            onPress={onPress}
            className="px-2 py-1 rounded-xl"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            <Text className="text-white text-xs">View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {progress !== undefined && (
        <View className="w-full">
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-gray-200">Progress</Text>
            <Text className="text-xs font-medium text-white">
              {progress}%
            </Text>
          </View>
          <View className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: "#8b5cf6",
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const StudentCard = ({ student, rank }: { student: Student; rank?: number }) => {
  const confidence = student.confidence ?? 0;
  const anxiety = student.anxiety ?? 0;
  const borderColor = student.color ?? "#a78bfa";

  const ProgressBar = ({ value, label }: { value: number; label: string }) => (
    <View className="mb-1">
      <View className="flex-row justify-between mb-0.5">
        <Text className="text-xs text-white">{label}</Text>
        <Text className="text-xs font-medium text-white">{value}%</Text>
      </View>
      <View className="h-1.5 bg-violet-500/20 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            backgroundColor: label.includes("Anxiety") ? "#ef4444" : "#8b5cf6",
          }}
        />
      </View>
    </View>
  );

  
  

  return (
    <View className="relative">
      <View
        className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl p-4 my-1.5"
        style={{
          borderTopWidth: 3,
          borderTopColor: borderColor,
          marginRight: 0,
          position: "relative",
          overflow: "visible",
        }}
      >
        {rank && rank <= 5 && (
          <View
            className={`absolute -top-3 -right-2 w-7 h-7 rounded-full items-center justify-center z-10 ${
              rank === 1
                ? "bg-amber-400"
                : rank === 2
                ? "bg-gray-300"
                : rank === 3
                ? "bg-amber-700"
                : "bg-violet-500"
            }`}
          >
            <Ionicons
              name={rank === 1 ? "trophy" : rank === 2 ? "medal" : "ribbon"}
              size={16}
              color="#FFFFFF"
            />
          </View>
        )}

        <View className="mb-3">
          <View className="flex-row flex-wrap items-baseline">
            <Text className="font-bold text-white text-base mr-2">
              {student.name}
            </Text>
            {rank && rank <= 3 && (
              <Text className="text-white text-xs">• Top {rank === 1 ? "1" : rank}</Text>
            )}
          </View>
          <Text className="text-white/70 text-xs mt-1">
            {student.strand} • Grade {student.grade}
          </Text>
        </View>

        <View className="space-y-2">
          <ProgressBar value={confidence} label="Confidence Level" />
          <ProgressBar value={anxiety} label="Anxiety Level" />
        </View>
      </View>
    </View>
  );
};

/* ────────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────────── */
export default function TeacherDashboard() {
  // Modal / UI state
  // const [isStrandModalVisible, setIsStrandModalVisible] = useState(false); // ❌ REMOVED
  const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
  const [selectedGrade11Strand, setSelectedGrade11Strand] = useState<string | null>(null); // (kept for structure)
  const [selectedGrade12Strand, setSelectedGrade12Strand] = useState<string | null>(null); // (kept for structure)
  const [selectedStrand, setSelectedStrand] = useState<string | null>(null); // (kept for structure)
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);   // (kept for structure)
  const [isActiveStudentsModalVisible, setIsActiveStudentsModalVisible] =
    useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [isTotalStudentsModalVisible, setIsTotalStudentsModalVisible] =
    useState(false);
  const [confidenceScores, setConfidenceScores] = useState<ConfidenceScores>({
  speaking: 0,
  reading: 0,
  anxietySpeaking: 0,
  anxietyReading: 0
});

  // Teacher profile state
  const [fullName, setFullName] = useState<string>("Teacher");
  const [email, setEmail] = useState<string>("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  

  const user = useMemo(
    () => ({
      name: fullName || "Teacher Name",
      email: email || "teacher@example.com",
      image: { uri: avatarUri || TRANSPARENT_PNG },
    }),
    [fullName, email, avatarUri]
  );

  // Students state
  
  const activeStudents = students.filter((student) => student.status === "active");
const rankedStudents = useMemo(() => {
    return [...students]
      .sort((a, b) => {
        // Sort by confidence score (high to low) and anxiety score (low to high)
        const confidenceDiff = (b.confidence ?? 0) - (a.confidence ?? 0);
        if (confidenceDiff !== 0) return confidenceDiff;
        return (a.anxiety ?? 100) - (b.anxiety ?? 100);
      })
      .slice(0, 5);
  }, [students]);
  // Featured (not removed)
  const [featuredStudents, setFeaturedStudents] = useState<Student[]>([]);

  // Stats state
  const [stats, setStats] = useState<Stats>({
  totalStudents: 0,
  activeStudents: 0,
  averageProgress: 0,
  averageSatisfaction: 0,
  averageConfidence: 0,
  averageAnxiety: 0  // Add this
});

  const router = useRouter();
  const handleAddStudent = () => {
    router.push("/ButtonIcon/add-student");
  };
  const handleModules = () => {
    router.push("/ButtonIcon/post-module");
  };

  // ⬇️ CHANGED: when no grade/strand selection, default to ALL students
  const filteredStudents = useMemo(() => {
    if (!selectedGrade || !selectedStrand) return students;
    return students.filter(
      (student) =>
        student.grade === selectedGrade && student.strand === selectedStrand
    );
  }, [students, selectedGrade, selectedStrand]);
const fetchConfidenceScores = useCallback(async () => {
  try {
    const { data: scores, error } = await supabase
      .from('confidence_anxiety_score')
      .select(`
        confidence_score_speaking,
        confidence_score_reading,
        anxiety_level_speaking,
        anxiety_level_reading
      `);

    if (error) throw error;

    if (scores && scores.length > 0) {
      // Calculate averages across all students
      const totalScores = scores.reduce((acc, curr) => ({
        speaking: acc.speaking + (curr.confidence_score_speaking || 0),
        reading: acc.reading + (curr.confidence_score_reading || 0),
        anxietySpeaking: acc.anxietySpeaking + (curr.anxiety_level_speaking || 0),
        anxietyReading: acc.anxietyReading + (curr.anxiety_level_reading || 0)
      }), {
        speaking: 0,
        reading: 0,
        anxietySpeaking: 0,
        anxietyReading: 0
      });

      const count = scores.length;
      const averages = {
        speaking: Math.round(totalScores.speaking / count),
        reading: Math.round(totalScores.reading / count),
        anxietySpeaking: Math.round(totalScores.anxietySpeaking / count),
        anxietyReading: Math.round(totalScores.anxietyReading / count)
      };

      setConfidenceScores(averages);

      // Update stats with new averages
      setStats(prev => ({
        ...prev,
        averageConfidence: Math.round((averages.speaking + averages.reading) / 2),
        averageAnxiety: Math.round((averages.anxietySpeaking + averages.anxietyReading) / 2)
      }));
    }
  } catch (error) {
    console.error('Error fetching confidence scores:', error);
  }
}, []);
  // Stats calc
  const computeStats = useCallback((list: Student[]): Stats => {
  const total = list.length;
  const active = list.filter((s) => s.status === "active").length;
  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  
  return {
    totalStudents: total,
    activeStudents: active,
    averageProgress: avg(list.map((s) => s.progress || 0)),
    averageSatisfaction: avg(list.map((s) => s.satisfaction || 0)),
    averageConfidence: avg(list.map((s) => s.confidence ?? 0)),
    averageAnxiety: avg(list.map((s) => s.anxiety ?? 0))
  };
}, []);

  // refresh stats whenever students change
  useEffect(() => {
    setStats(computeStats(students));
  }, [students, computeStats]);
  useEffect(() => {
  fetchConfidenceScores();
}, [fetchConfidenceScores]);

  // gentle stat jitter loop
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        averageSatisfaction: Math.min(
          100,
          Math.max(0, prev.averageSatisfaction + (Math.random() > 0.5 ? 1 : -1))
        ),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // handlers
  const handleTotalStudentsPress = () => {
    setIsTotalStudentsModalVisible(true);
  };
  const handleCloseModal = () => {
    setIsTotalStudentsModalVisible(false);
  };
  const handleRemoveStudent = (studentId: string) => {
    setStudents((prevStudents) =>
      prevStudents.filter((student) => student.id !== studentId)
    );
  };
  const handleActiveStudentsPress = () => {
    setIsActiveStudentsModalVisible(true);
  };

  // ❌ Strand picker flow removed. Keep function stub for structure (unused).
  const handleSelectStrand = (grade: "11" | "12", strand: string) => {
    setSelectedGrade(grade);
    setSelectedStrand(strand);
    // setIsStrandModalVisible(false);
    setIsStudentModalVisible(true);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const BackgroundDecor = () => (
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#0F172A"]}
        className="flex-1"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
    </View>
  );

  /* ────────────────────────────────────────────────────────────────
     Supabase profile load
     ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid || !mounted) return;

      setEmail(auth?.user?.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", uid)
        .single();

      const name = (
        profile?.name ??
        auth?.user?.user_metadata?.full_name ??
        auth?.user?.email ??
        "Teacher"
      )
        .toString()
        .trim();

      if (!mounted) return;
      setFullName(name);

      const signed = await resolveSignedAvatar(
        uid,
        profile?.avatar_url?.toString()
      );
      if (!mounted) return;
      setAvatarUri(signed);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ────────────────────────────────────────────────────────────────
     Supabase roster + progress load
     ──────────────────────────────────────────────────────────────── */
  const TEACHER_STUDENTS = "teacher_students";
  const teacherIdRef = useRef<string | null>(null);

  // Update the loadConfidenceAnxietyScores function
const loadConfidenceAnxietyScores = useCallback(async (studentIds: string[]) => {
  if (!studentIds.length) return;

  try {
    const { data, error } = await supabase
      .from('confidence_anxiety_score')
      .select(`
        student_id,
        confidence_score_speaking,
        confidence_score_reading,
        anxiety_level_speaking,
        anxiety_level_reading,
        total_speaking_attempts,
        total_reading_attempts
      `)
      .in('student_id', studentIds);

    if (error) throw error;

    setStudents(prevStudents => 
      prevStudents.map(student => {
        const studentScore = data?.find(score => score.student_id === student.id);
        if (!studentScore) return student;

        const avgConfidence = Math.round(
          (studentScore.confidence_score_speaking + studentScore.confidence_score_reading) / 2
        );
        
        const avgAnxiety = Math.round(
          ((studentScore.anxiety_level_speaking ?? 0) + (studentScore.anxiety_level_reading ?? 0)) / 2
        );

        return {
          ...student,
          confidence: avgConfidence,
          anxiety: avgAnxiety,
          totalAttempts: studentScore.total_speaking_attempts + studentScore.total_reading_attempts
        };
      })
    );

  } catch (err) {
    console.error('Error loading confidence/anxiety scores:', err);
  }
}, []);

  const loadRoster = useCallback(async () => {
    const teacherId = teacherIdRef.current;
    if (!teacherId) return;

    try {
      const { data: rows, error: rErr } = await supabase
        .from(TEACHER_STUDENTS)
        .select(
          "teacher_id, student_id, grade_level, strand, status, inserted_at"
        )
        .eq("teacher_id", teacherId);
      if (rErr) throw rErr;

      const list = (rows as TeacherStudentRow[]) ?? [];
      if (list.length === 0) {
        setStudents([]);
        return;
      }

      const ids = Array.from(new Set(list.map((r) => r.student_id)));
      const { data: profs, error: pErr } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", ids);
      if (pErr) throw pErr;

      const byId = new Map<string, ProfileRow>(
        ((profs as ProfileRow[]) ?? []).map((p) => [p.id, p])
      );

      const mapped: Student[] = list.map((r) => {
        const p = byId.get(r.student_id);
        const name = (p?.name || "Unknown Student").trim();
        const color = pickColorFromId(r.student_id);
        const stat = (r.status || "active") as StudentStatus;
        return {
          id: r.student_id,
          name,
          grade: r.grade_level || "",
          strand: safeStrand(r.strand),
          status: stat,
          progress: 0,
          satisfaction: 0,
          confidence: 0,
          anxiety: 100,
          initials: initialsFrom(name),
          color,
          statusColor: stat === "active" ? "text-green-400" : "text-gray-400",
        };
      });

      let merged = mapped;
      try {
        const { data: progRows, error: progErr } = await supabase
          .from("student_progress")
          .select("*")
          .in("student_id", ids);
        if (!progErr) {
          merged = mergeProgressIntoStudents(
            mapped,
            (progRows as ProgressRow[]) ?? []
          );
        }
      } catch {
        // swallow
      }

      setStudents(merged);
    } catch (e) {
      console.warn("[TeacherDashboard] roster load error:", e);
      setStudents([]);
    }
  }, []);

  useEffect(() => {
  if (students.length > 0) {
    const studentIds = students.map(s => s.id);
    loadConfidenceAnxietyScores(studentIds);
  }
}, [students, loadConfidenceAnxietyScores]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id ?? null;
      if (!mounted) return;

      teacherIdRef.current = uid;
      await loadRoster();

      if (!uid) return;

      const channel = supabase
        .channel(`${TEACHER_STUDENTS}:teacher:${uid}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: TEACHER_STUDENTS,
            filter: `teacher_id=eq.${uid}`,
          },
          () => loadRoster()
        )
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch {}
      };
    })();
    return () => {
      mounted = false;
    };
  }, [loadRoster]);

  useEffect(() => {
    const uid = teacherIdRef.current;
    if (!uid) return;
    if (students.length === 0) return;

    const ids = Array.from(new Set(students.map((s) => s.id)));
    const filter = `student_id=in.(${ids.join(",")})`;

    const ch = supabase
      .channel(`student_progress:${uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_progress",
          filter,
        },
        () => loadRoster()
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(ch);
      } catch {}
    };
  }, [students, loadRoster]);

  /* ────────────────────────────────────────────────────────────────
     RENDER
     ──────────────────────────────────────────────────────────────── */
  return (
    <View className="flex-1 bg-[#0F172A] relative">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <BackgroundDecor />

      <ScrollView
        className="flex-1 bottom-3 p-4 z-10"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 30,
          paddingTop: 10,
        }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mt-4 mb-3 w-full">
          <View className="flex-row items-center">
            <Image
              source={require("../../../assets/Speaksy.png")}
              className="w-12 h-12 rounded-full right-2"
              resizeMode="contain"
            />
            <Text className="text-white font-bold text-2xl ml-2 -left-5">
              Voclaria
            </Text>
          </View>

          <View className="flex-row items-center right-2">
            <TouchableOpacity
              onPress={handleModules}
              activeOpacity={0.7}
              className="p-2 bg-white/10 rounded-full mr-4"
            >
              <Image
                source={require("../../../assets/Modules.png")}
                className="w-5 h-5"
                resizeMode="contain"
                tintColor="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddStudent}
              activeOpacity={0.7}
              className="p-2 bg-white/10 rounded-full mr-4"
            >
              <Image
                source={require("../../../assets/add-student.png")}
                className="w-5 h-5"
                resizeMode="contain"
                tintColor="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsProfileMenuVisible(!isProfileMenuVisible)}
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              {user?.image?.uri && user.image.uri !== TRANSPARENT_PNG ? (
                <Image
                  source={user.image}
                  className="w-8 h-8 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "rgba(167,139,250,0.25)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "700",
                    }}
                  >
                    {initialsFrom(user.name)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {isProfileMenuVisible && (
              <ProfileMenuTeacher
                user={user}
                visible={isProfileMenuVisible}
                onDismiss={() => setIsProfileMenuVisible(false)}
              />
            )}
          </View>
        </View>

        {/* Greeting */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-white">
            {getGreeting()}, Teacher!
          </Text>
          <Text className="text-gray-400">
            Here's your classroom overview
          </Text>
        </View>

        {/* Metrics Grid */}
        <View className="flex-row flex-wrap justify-between mb-1">
          {/* Total Students */}
          <View style={{ width: "48%" }}>
            <MetricCard
              title="Total Students"
              value={stats.totalStudents.toString()}
              color="#4f46e5"
              icon={
                <Image
                  source={require("../../../assets/Students.png")}
                  style={{ width: 40, height: 40 }}
                  resizeMode="contain"
                />
              }
              trend={{ value: 12, isPositive: true }}
              onPress={handleTotalStudentsPress}
            />
          </View>

          {/* Active Students (NO PROGRESS BAR ANYMORE) */}
          <View style={{ width: "48%" }}>
            <MetricCard
              title="Active Students"
              value={stats.activeStudents.toString()}
              color="#10b981"
              icon={
                <Image
                  source={require("../../../assets/active.png")}
                  style={{ width: 40, height: 40 }}
                  resizeMode="contain"
                />
              }
              trend={{ value: 8, isPositive: true }}
              onPress={handleActiveStudentsPress}
            />
          </View>
        </View>

        {/* Student Management Section */}
        <View className="mb-4">
          <Text className="text-lg font-bold text-white mb-3">
            Student Management
          </Text>
          <View className="bg-white/5 border border-white/30 rounded-2xl p-6">
            <View className="items-center mb-4">
              <View className="mb-3">
                <Image
                  source={require("../../../assets/manage-student.png")}
                  style={{
                    width: 40,
                    height: 36,
                    tintColor: "white",
                  }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-lg font-semibold text-white mb-1">
                Manage Your Students
              </Text>
              <Text className="text-white/60 text-center text-xs mb-4">
                View and manage all your students. Track
                their progress, check performance metrics,
                and provide personalized support.
              </Text>
            </View>

            {/* ⬇️ CHANGED: open StudentManagementModal directly */}
            <TouchableOpacity
              onPress={() => {
                // Default to all students; you can prefill grade/strand if you want
                setSelectedGrade(null);
                setSelectedStrand(null);
                setIsStudentModalVisible(true);
              }}
              className="bg-violet-600 py-3 bottom-2 w-full rounded-xl flex-row items-center justify-center space-x-2"
              activeOpacity={0.9}
            >
              <Text className="text-white font-base">
                Open Student Manager
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Student Ranking Section */}
        <View className="mb-6">
          <Text className="text-lg top-3 font-bold text-white mb-3">
            Student Rankings
          </Text>
          // Update the Student Ranking render section
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{
    paddingLeft: 0,
    paddingRight: 20,
    paddingVertical: 4,
    alignItems: "flex-start",
    gap: 6,
  }}
  snapToAlignment="start"
  decelerationRate="fast"
  alwaysBounceHorizontal={false}
  snapToStart
  snapToEnd
>
  {rankedStudents.map((student, index) => (
    <View
      key={student.id}
      className="w-48"
      style={{
        minHeight: 180,
        marginRight: 12,
        marginLeft: 0,
      }}
    >
      <StudentCard 
        student={student} 
        rank={index + 1}
      />
    </View>
  ))}
</ScrollView>
        </View>

        {/* Strand Performance */}
<View className="mb-6">
  <Text className="text-lg font-bold text-white mb-3">
    Strand Performance
  </Text>
  <View className="bg-white/10 border border-white/20 rounded-2xl p-5">
    <View className="flex-row justify-between mb-4">
      <Text className="text-white/80 text-sm">Strand</Text>
      <Text className="text-white/80 text-sm"></Text>
    </View>

    {["ABM", "STEM", "HUMSS", "GAS", "TVL"]
      .map((strand) => {
        const strandStudents = students.filter(
          (s) => s.strand === strand
        );
        if (strandStudents.length === 0) {
          return { strand, avgConfidence: 0, avgAnxiety: 0 };
        }
        
        const avgConfidence = Math.round(
          strandStudents.reduce(
            (sum, s) => sum + (s.confidence ?? 0),
            0
          ) / strandStudents.length
        );
        
        const avgAnxiety = Math.round(
          strandStudents.reduce(
            (sum, s) => sum + (s.anxiety ?? 0),
            0
          ) / strandStudents.length
        );

        return { strand, avgConfidence, avgAnxiety };
      })
      .sort((a, b) => b.avgConfidence - a.avgConfidence)
      .map(({ strand, avgConfidence, avgAnxiety }) => (
        <View key={strand} className="mb-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-white font-medium">
              {strand}
            </Text>
            <Text className="text-white font-medium">
              {avgConfidence}% / {avgAnxiety}%
            </Text>
          </View>
          <View className="space-y-1">
            <View className="h-2 bg-white/10 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full bg-violet-500"
                style={{
                  width: `${avgConfidence}%`,
                }}
              />
            </View>
            <View className="h-2 bg-white/10 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full bg-red-500"
                style={{
                  width: `${avgAnxiety}%`,
                }}
              />
            </View>
          </View>
        </View>
      ))}
  </View>
</View>
      </ScrollView>

      {/* Active Students Modal */}
      <ActiveStudentModal
        visible={isActiveStudentsModalVisible}
        onClose={() => setIsActiveStudentsModalVisible(false)}
        students={activeStudents}
      />

      {/* ❌ Strand & Grade Picker Modal REMOVED */}
      {/* <StrandGradeModal ... /> */}

      {/* Student Management Modal */}
      <StudentManagementModal
        visible={isStudentModalVisible}
        onClose={() => {
          setIsStudentModalVisible(false);
          setSelectedGrade(null);
          setSelectedStrand(null);
        }}
        students={filteredStudents}
        grade={selectedGrade || ""}
        strand={selectedStrand || ""}
        onStudentsUpdate={(updatedStudents) => {
          setStudents((prev) => {
            const map = new Map(prev.map((s) => [s.id, s]));
            for (const upd of updatedStudents) {
              map.set(
                upd.id,
                {
                  ...map.get(upd.id),
                  ...upd,
                } as Student
              );
            }
            return Array.from(map.values());
          });
        }}
      />

      {/* Total Students Modal */}
      <TotalStudentModal
        visible={isTotalStudentsModalVisible}
        onClose={handleCloseModal}
        students={students}
        onRemoveStudent={handleRemoveStudent}
      />

      <NavigationBar defaultActiveTab="Dashboard" />
    </View>
  );
}
