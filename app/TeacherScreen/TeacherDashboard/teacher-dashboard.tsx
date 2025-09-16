import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
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
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import NavigationBar from "@/components/NavigationBar/nav-bar-teacher";
import StudentManagementModal from "@/components/TeacherModal/StudentManagementModal";
import TotalStudentModal from "@/components/TeacherModal/TotalStudentModal";
import ActiveStudentModal from "@/components/TeacherModal/ActiveStudentModal";
import ProfileMenuTeacher from "@/components/ProfileModal/ProfileMenuTeacher";

import { supabase } from "@/lib/supabaseClient";

/* ──────────────────────────────────────────────────────────────────── */
/*  Dimensions                                                          */
/* ──────────────────────────────────────────────────────────────────── */

const { width } = Dimensions.get("window");

/* ──────────────────────────────────────────────────────────────────── */
/*  Types                                                               */
/* ──────────────────────────────────────────────────────────────────── */

type ProgressRow = {
  student_id: string;
  // keep it loose so it won’t break your build if columns differ
  speaking_completed?: number | null;
  speaking_total?: number | null;
  reading_completed?: number | null;
  reading_total?: number | null;
  confidence?: number | null;
  anxiety?: number | null;
};

type StudentStatus = "active" | "inactive";

interface DashboardStudent {
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
}

/* DB rows used for mapping */
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

/* ──────────────────────────────────────────────────────────────────── */
/*  Avatar helper (same idea as Home page)                              */
/* ──────────────────────────────────────────────────────────────────── */

const TRANSPARENT_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

async function resolveSignedAvatar(
  userId: string,
  storedPath?: string | null
) {
  const stored = (storedPath ?? userId).toString();

  const normalized = stored.replace(/^avatars\//, "");

  let objectPath: string | null = null;

  if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
    objectPath = normalized;
  } else {
    const { data: listed, error } = await supabase
      .storage
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

  const signedRes = await supabase
    .storage
    .from("avatars")
    .createSignedUrl(objectPath, 60 * 60);

  if (signedRes.error) return null;

  return signedRes.data?.signedUrl ?? null;
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Small helpers                                                       */
/* ──────────────────────────────────────────────────────────────────── */

function mergeProgressIntoStudents(
  base: DashboardStudent[],
  rows: ProgressRow[]
): DashboardStudent[] {
  const byId = new Map<string, ProgressRow>(rows.map(r => [r.student_id, r]));
  return base.map(s => {
    const p = byId.get(s.id);
    if (!p) {
      // no progress rows yet → your “no activity” defaults
      return {
        ...s,
        progress: 0,
        confidence: 0,
        anxiety: 100,
        satisfaction: 0,
      };
    }

    // compute overall progress safely
    const sc = Number(p.speaking_completed ?? 0);
    const st = Number(p.speaking_total ?? 0);
    const rc = Number(p.reading_completed ?? 0);
    const rt = Number(p.reading_total ?? 0);
    const total = st + rt;
    const done = sc + rc;

    const progress = total > 0 ? Math.max(0, Math.min(100, Math.round((done / total) * 100))) : 0;

    return {
      ...s,
      progress,
      confidence: p.confidence ?? 0, // 0 when there’s no data yet
      anxiety: p.anxiety ?? 100,      // 100 when there’s no data yet
      satisfaction: 0,                // keep 0 unless you track it elsewhere
    };
  });
}


const TEACHER_STUDENTS = "teacher_students";

const initialsFrom = (name?: string | null) => {
  const n = (name || "").trim();
  if (!n) return "??";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
};

const safeStrand = (s?: string | null) => (s === "HUMMS" ? "HUMSS" : (s || ""));

const pickColorFromId = (id: string) => {
  const palette = [
    "#a78bfa", "#60a5fa", "#f472b6", "#34d399",
    "#f59e0b", "#f87171", "#22d3ee", "#4ade80",
  ];
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum = (sum + id.charCodeAt(i)) % 9973;
  return palette[sum % palette.length];
};

/* ──────────────────────────────────────────────────────────────────── */
/*  Metric Card (UI UNCHANGED)                                          */
/* ──────────────────────────────────────────────────────────────────── */

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
        width: (width - 40) / 2 - 10,
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
        <View className="rounded-xl">
          {icon}
        </View>

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
        <Text className="text-2xl font-bold text-white">
          {value}
        </Text>

        {onPress && (
          <TouchableOpacity
            onPress={onPress}
            className="px-2 py-1 rounded-xl"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <Text className="text-white text-xs">
              View All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {progress !== undefined && (
        <View className="w-full">
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-gray-200">
              Progress
            </Text>
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
                shadowColor: "#8b5cf6",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
                elevation: 5,
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
};

/* ──────────────────────────────────────────────────────────────────── */
/*  Student Card (UI UNCHANGED)                                         */
/* ──────────────────────────────────────────────────────────────────── */

const StudentCard = ({
  student,
  rank,
}: {
  student: DashboardStudent;
  rank?: number;
}) => {
  const confidence = student.confidence ?? 0;   // ← reflect “no progress” as 0
  const anxiety    = student.anxiety    ?? 100; // ← reflect “no progress” as 100

  let borderColor = "transparent";

  if (rank === 1) borderColor = "#FFD700";
  else if (rank === 2) borderColor = "#C0C0C0";
  else if (rank === 3) borderColor = "#CD7F32";
  else if (rank === 4 || rank === 5) borderColor = "#8b5cf6";

  const ProgressBar = ({
    value,
    label,
  }: {
    value: number;
    label: string;
  }) => (
    <View className="mb-1">
      <View className="flex-row justify-between mb-0.5">
        <Text className="text-xs text-white">
          {label}
        </Text>
        <Text className="text-xs font-medium text-white">
          {value}%
        </Text>
      </View>

      <View className="h-1.5 bg-violet-500/20 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            backgroundColor: "#8b5cf6",
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
          position: "relative",
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
              name={
                rank === 1
                  ? "trophy"
                  : rank === 2
                  ? "medal"
                  : "ribbon"
              }
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
              <Text className="text-white text-xs">
                • Top {rank === 1 ? "1" : rank}
              </Text>
            )}
          </View>

          <Text className="text-white/70 text-xs mt-1">
            {student.strand} • Grade {student.grade}
          </Text>
        </View>

        <View className="space-y-2">
          <ProgressBar
            value={confidence}
            label="Confidence Level"
          />
          <ProgressBar
            value={anxiety}
            label="Anxiety Level"
          />
        </View>
      </View>
    </View>
  );
};

/* ──────────────────────────────────────────────────────────────────── */
/*  Decorative Background (UNCHANGED)                                   */
/* ──────────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────────── */
/*  Main Screen                                                         */
/* ──────────────────────────────────────────────────────────────────── */

export default function TeacherDashboard() {
  const router = useRouter();

  /* profile */
  const [fullName, setFullName] = useState<string>("Teacher");
  const [email, setEmail]       = useState<string>("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const initials = useMemo(() => {
    const parts = fullName.trim().split(/\s+/);
    return (
      ((parts[0]?.[0] ?? "T") + (parts[1]?.[0] ?? "")).toUpperCase()
    );
  }, [fullName]);

  /* modals */
  const [isStudentModalVisible, setIsStudentModalVisible]         = useState(false);
  const [isTotalStudentsModalVisible, setIsTotalStudentsModalVisible] = useState(false);
  const [isActiveStudentsModalVisible, setIsActiveStudentsModalVisible] = useState(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible]           = useState(false);

  /* students + stats */
  const [students, setStudents] = useState<DashboardStudent[]>([]);

  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    activeStudents: 0,
    averageProgress: 0,
    averageSatisfaction: 0,
    averageConfidence: 0,
  });

  const activeStudents = useMemo(
    () => students.filter((s) => s.status === "active"),
    [students]
  );

  const profileUser = useMemo(
    () => ({
      name: fullName || "Teacher",
      email,
      image: { uri: avatarUri || TRANSPARENT_PNG },
    }),
    [fullName, email, avatarUri]
  );

  /* actions */
  const handleAddStudent = () => {
    router.push("/ButtonIcon/add-student");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  /* load logged-in teacher profile + avatar (same logic as Home page) */
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

      const name =
        (profile?.name ??
          auth?.user?.user_metadata?.full_name ??
          auth?.user?.email ??
          "Teacher")
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

  /* ──────────────────────────────────────────────────────────────── */
  /*  Load roster + realtime from Supabase                            */
  /* ──────────────────────────────────────────────────────────────── */

  const teacherIdRef = useRef<string | null>(null);

  const computeStats = useCallback((list: DashboardStudent[]): Stats => {
    const total  = list.length;
    const active = list.filter((s) => s.status === "active").length;

    const avg = (arr: number[]) =>
      arr.length
        ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        : 0;

    return {
      totalStudents: total,
      activeStudents: active,
      averageProgress: avg(list.map((s) => s.progress || 0)),
      averageSatisfaction: avg(list.map((s) => s.satisfaction || 0)),
      averageConfidence: avg(list.map((s) => s.confidence ?? 0)),
    };
  }, []);

  const loadRoster = useCallback(async () => {
    const teacherId = teacherIdRef.current;
    if (!teacherId) return;

    try {
      const { data: rows, error: rErr } = await supabase
        .from(TEACHER_STUDENTS)
        .select("teacher_id, student_id, grade_level, strand, status, inserted_at")
        .eq("teacher_id", teacherId);

      if (rErr) throw rErr;

      // Cast the returned rows to your row type
      const list = (rows as TeacherStudentRow[]) ?? [];

      if (list.length === 0) {
        setStudents([]);
        setStats({
          totalStudents: 0,
          activeStudents: 0,
          averageProgress: 0,
          averageSatisfaction: 0,
          averageConfidence: 0,
        });
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

      const mapped: DashboardStudent[] = list.map((r) => {
        const p     = byId.get(r.student_id);
        const name  = (p?.name || "Unknown Student").trim();
        const color = pickColorFromId(r.student_id);
        const stat  = (r.status || "active") as StudentStatus;

        return {
          id: r.student_id,
          name,
          grade: r.grade_level || "",
          strand: safeStrand(r.strand),
          status: stat,
          progress: 0,
          satisfaction: 0,
          confidence: 0,   // ← reflect “no progress” as 0
          anxiety: 100,    // ← reflect “no progress” as 100
          initials: initialsFrom(name),
          color,
          statusColor: stat === "active" ? "text-green-400" : "text-gray-400",
        };
      });

      // ── NEW: pull live progress and merge into mapped students
      let merged = mapped;
      try {
        const { data: progRows, error: progErr } = await supabase
          .from("student_progress")
          .select("*")
          .in("student_id", ids);

        if (!progErr) {
          merged = mergeProgressIntoStudents(mapped, (progRows as ProgressRow[]) ?? []);
        }
      } catch {
        // keep mapped (zeros) if progress table not ready
      }

      setStudents(merged);
      setStats(computeStats(merged));
    } catch (e) {
      console.warn("[TeacherDashboard] roster load error:", e);
      setStudents([]);
      setStats({
        totalStudents: 0,
        activeStudents: 0,
        averageProgress: 0,
        averageSatisfaction: 0,
        averageConfidence: 0,
      });
    }
  }, [computeStats]);

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
          () => {
            loadRoster();
          }
        )
        .subscribe();

      return () => {
        try { supabase.removeChannel(channel); } catch {}
      };
    })();

    return () => { mounted = false; };
  }, [loadRoster]);

  // ── NEW: realtime for student_progress for the currently loaded students
  useEffect(() => {
    const uid = teacherIdRef.current;
    if (!uid) return;
    if (students.length === 0) return;

    const ids = Array.from(new Set(students.map(s => s.id)));
    const filter = `student_id=in.(${ids.join(",")})`;

    const ch = supabase
      .channel(`student_progress:${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_progress", filter },
        () => loadRoster()
      )
      .subscribe();

    return () => {
      try { supabase.removeChannel(ch); } catch {}
    };
  }, [students, loadRoster]);

  /* ──────────────────────────────────────────────────────────────── */
  /*  UI                                                              */
  /* ──────────────────────────────────────────────────────────────── */

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

            {/* Avatar — signed URL or initials fallback */}
            <TouchableOpacity
              onPress={() => setIsProfileMenuVisible(!isProfileMenuVisible)}
              className="w-10 h-10 rounded-full items-center justify-center overflow-hidden"
              style={{
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.6)",
              }}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  className="w-10 h-10"
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
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
                    {initials}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {isProfileMenuVisible && (
              <View>
                <ProfileMenuTeacher
                  user={profileUser}
                  visible={isProfileMenuVisible}
                  onDismiss={() => setIsProfileMenuVisible(false)}
                />
              </View>
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
        <View className="flex-row flex-wrap justify-between mb-4">
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
            trend={{ value: 0, isPositive: true }}
            progress={0}
            onPress={() => setIsTotalStudentsModalVisible(true)}
          />

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
            trend={{ value: 0, isPositive: true }}
            progress={0}
            onPress={() => setIsActiveStudentsModalVisible(true)}
          />

          <MetricCard
            title="Avg. Progress"
            value={`${stats.averageProgress}%`}
            color="#3b82f6"
            icon={
              <Image
                source={require("../../../assets/progress.png")}
                style={{ width: 40, height: 36 }}
                resizeMode="contain"
              />
            }
            trend={{ value: 0, isPositive: true }}
            progress={stats.averageProgress}
          />

          <MetricCard
            title="Satisfaction"
            value={`${stats.averageSatisfaction}%`}
            color="#8b5cf6"
            icon={
              <Image
                source={require("../../../assets/satisfaction.png")}
                style={{ width: 40, height: 36 }}
                resizeMode="contain"
              />
            }
            trend={{ value: 0, isPositive: true }}
            progress={stats.averageSatisfaction}
          />
        </View>

        {/* Student Management */}
        <View className="mb-6">
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
                View and manage all your students in one place. Track their
                progress, check performance metrics, and provide
                personalized support.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setIsStudentModalVisible(true)}
              className="bg-violet-600 py-3 bottom-2 w-full rounded-xl flex-row items-center justify-center space-x-2"
              activeOpacity={0.9}
            >
              <Text className="text-white font-base">
                Open Student Manager
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ranking Students (design kept; renders from students[]) */}
        <View className="mb-6">
          <Text className="text-lg top-3 font-bold text-white mb-3">
            Ranking Students
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingRight: 20,
              paddingVertical: 4,
              alignItems: "flex-start",
              gap: 6,
            }}
            decelerationRate="fast"
            snapToAlignment="start"
            alwaysBounceHorizontal={false}
          >
            {students.slice(0, 5).map((student, index) => (
              <View
                key={student.id}
                className="w-48"
                style={{
                  minHeight: 180,
                  marginRight: 12,
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

        {/* Strand Performance (UI intact) */}
        <View className="mb-6 bottom-8">
          <Text className="text-lg font-bold text-white mb-3">
            Strand Performance
          </Text>

          <View className="bg-white/10 border border-white/20 rounded-2xl p-5">
            <View className="flex-row justify-between mb-4">
              <Text className="text-white/80 text-sm">
                Strand
              </Text>
              <Text className="text-white/80 text-sm">
                Avg. Progress
              </Text>
            </View>

            {["ABM", "STEM", "HUMSS", "GAS", "TVL"]
              .map((strand) => {
                const list = students.filter((s) => s.strand === strand);
                const avg =
                  list.length > 0
                    ? Math.round(
                        list.reduce((acc, s) => acc + (s.progress || 0), 0) /
                        list.length
                      )
                    : 0;
                return { strand, avg };
              })
              .sort((a, b) => b.avg - a.avg)
              .map(({ strand, avg }) => (
                <View key={strand} className="mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-white font-medium">
                      {strand}
                    </Text>
                    <Text className="text-white font-medium">
                      {avg}%
                    </Text>
                  </View>

                  <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${avg}%`,
                        backgroundColor: "#8b5cf6",
                      }}
                    />
                  </View>
                </View>
              ))}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <ActiveStudentModal
        visible={isActiveStudentsModalVisible}
        onClose={() => setIsActiveStudentsModalVisible(false)}
        students={activeStudents}
      />

      <StudentManagementModal
        visible={isStudentModalVisible}
        onClose={() => setIsStudentModalVisible(false)}
        students={students}
      />

      <TotalStudentModal
        visible={isTotalStudentsModalVisible}
        onClose={() => setIsTotalStudentsModalVisible(false)}
        students={students}
        onRemoveStudent={(studentId) => {
          const next = students.filter((s) => s.id !== studentId);
          setStudents(next);
          setStats((prev) => ({
            ...prev,
            ...computeStats(next),
          }));
        }}
      />

      <NavigationBar defaultActiveTab="Dashboard" />
    </View>
  );
}
