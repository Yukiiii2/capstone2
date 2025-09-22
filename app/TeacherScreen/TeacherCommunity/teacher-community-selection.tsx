import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import NavigationBar from "@/components/NavigationBar/nav-bar-teacher";
import ProfileMenuTeacher from "@/components/ProfileModal/ProfileMenuTeacher";

/* ───────────── Supabase + avatar helpers (logic-only, no UI changes) ───────────── */
import { supabase } from "@/lib/supabaseClient";
const AVATAR_BUCKET = "avatars";
const TRANSPARENT_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

async function resolveSignedAvatar(userId: string, storedPath?: string | null) {
  const stored = (storedPath ?? userId).toString().replace(/^avatars\//, "");
  let objectPath: string | null = null;

  if (/\.[a-zA-Z0-9]+$/.test(stored)) {
    objectPath = stored;
  } else {
    const { data: listed, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list(stored, { sortBy: { column: "created_at", order: "desc" }, limit: 1 });
    if (error) return null;
    if (listed && listed.length > 0) objectPath = `${stored}/${listed[0].name}`;
  }
  if (!objectPath) return null;

  const signed = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(objectPath, 3600);
  if (signed.error) return null;
  return signed.data?.signedUrl ?? null;
}
/* ──────────────────────────────────────────────────────────────────────────────── */

const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#0F172A"]}
        className="flex-1"
      />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-60 h-60 bg-[#a78bfa]/5 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[120px] h-[120px] bg-[#a78bfa]/5 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-12 h-12 bg-[#a78bfa]/5 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-8 h-8 bg-[#a78bfa]/5 rounded-full" />
  </View>
);

/* ===== Types ===== */
type Student = {
  id: string;
  name: string;
  avatar: string;
  lastPractice: string;
  rating: number;
  isSelected?: boolean;
  isMyStudent?: boolean;
  grade?: string;
  strand?: string;
  status?: string;
  progress?: number;
  satisfaction?: number;
  initials?: string;
  color?: string;
  statusColor?: string;
  lesson?: {
    id: number;
    title: string;
    subtitle: string;
    desc: string;
    type: "Review" | "Start" | "Continue" | "New";
    progress: number;
    difficulty: "Basic" | "Advanced";
  };
};

/* ===== Your STATIC students (left untouched) ===== */
const STUDENTS: Student[] = [
  { id: "1", name: "Sarah Johnson", avatar: "https://randomuser.me/api/portraits/women/32.jpg", lastPractice: "2h ago", rating: 4.2, isMyStudent: false, lesson: { id: 1, title: "Persuasive Speech Building", subtitle: "Lesson 1", desc: "Master persuasive speech delivery", type: "Review", progress: 1, difficulty: "Advanced" } },
  { id: "2", name: "Earl Ang", avatar: "https://randomuser.me/api/portraits/men/44.jpg", lastPractice: "1d ago", rating: 4.8, isMyStudent: false, lesson: { id: 2, title: "Effective Non-Verbal Communication", subtitle: "Lesson 1", desc: "Master gestures and visual cues", type: "Review", progress: 1, difficulty: "Basic" } },
  { id: "3", name: "Yang Flores", avatar: "https://randomuser.me/api/portraits/women/68.jpg", lastPractice: "3h ago", rating: 3.9, isMyStudent: false, lesson: { id: 3, title: "Advanced Debate Practice", subtitle: "Lesson 2", desc: "Develop argumentation and rebuttal skills", type: "Start", progress: 0.5, difficulty: "Advanced" } },
  { id: "4", name: "John Park", avatar: "https://randomuser.me/api/portraits/men/67.jpg", lastPractice: "5h ago", rating: 4.1, isMyStudent: false, lesson: { id: 4, title: "Diaphragmatic Breathing Practice", subtitle: "Lesson 2", desc: "Control and project your voice", type: "Start", progress: 0.5, difficulty: "Basic" } },
  { id: "5", name: "Emma Wilson", avatar: "https://randomuser.me/api/portraits/women/12.jpg", lastPractice: "30m ago", rating: 4.5, isMyStudent: false, lesson: { id: 5, title: "Panel Interview Simulation", subtitle: "Lesson 3", desc: "Prepare effectively for interviews and Q&A", type: "Review", progress: 1, difficulty: "Advanced" } },
  { id: "6", name: "David Kim", avatar: "https://randomuser.me/api/portraits/men/31.jpg", lastPractice: "4h ago", rating: 4.0, isMyStudent: false, lesson: { id: 6, title: "Voice Warm-up and Articulation", subtitle: "Lesson 3", desc: "Clarity and pronunciation", type: "Review", progress: 1, difficulty: "Basic" } },
  { id: "7", name: "Jose Reyes", avatar: "https://ui-avatars.com/api/?name=JR&background=45B7D1&color=fff", lastPractice: "1d ago", rating: 3.9, isMyStudent: true, lesson: { id: 7, title: "Storytelling Techniques", subtitle: "Lesson 4", desc: "Engage your audience with compelling stories", type: "Continue", progress: 0.75, difficulty: "Advanced" } },
  { id: "8", name: "Ana Mercado", avatar: "https://ui-avatars.com/api/?name=AM&background=96CEB4&color=fff", lastPractice: "3h ago", rating: 4.1, isMyStudent: true, lesson: { id: 8, title: "Body Language Mastery", subtitle: "Lesson 4", desc: "Enhance your non-verbal communication", type: "Continue", progress: 0.6, difficulty: "Basic" } },
  { id: "9", name: "Pedro Bautista", avatar: "https://ui-avatars.com/api/?name=PB&background=FFEEAD&color=000", lastPractice: "5h ago", rating: 4.5, isMyStudent: true, lesson: { id: 9, title: "Public Speaking Fundamentals", subtitle: "Lesson 5", desc: "Build confidence in public speaking", type: "New", progress: 0.2, difficulty: "Basic" } },
  { id: "10", name: "Miguel Lopez", avatar: "https://ui-avatars.com/api/?name=ML&background=4ECDC4&color=fff", lastPractice: "30m ago", rating: 4.0, isMyStudent: true, lesson: { id: 10, title: "Advanced Presentation Skills", subtitle: "Lesson 5", desc: "Master professional presentations", type: "New", progress: 0.3, difficulty: "Advanced" } },
  { id: "11", name: "Sofia Reyes", avatar: "https://ui-avatars.com/api/?name=SR&background=45B7D1&color=fff", lastPractice: "4h ago", rating: 4.0, isMyStudent: true, lesson: { id: 11, title: "Voice Modulation Techniques", subtitle: "Lesson 6", desc: "Improve vocal variety and expression", type: "New", progress: 0.1, difficulty: "Basic" } },
  { id: "12", name: "Gabriel Cruz", avatar: "https://ui-avatars.com/api/?name=GC&background=96CEB4&color=fff", lastPractice: "4h ago", rating: 4.0, isMyStudent: true, lesson: { id: 12, title: "Debate and Argumentation", subtitle: "Lesson 6", desc: "Develop strong arguments and rebuttals", type: "New", progress: 0.25, difficulty: "Advanced" } },
  { id: "13", name: "Isabella Santos", avatar: "https://ui-avatars.com/api/?name=IS&background=FFEEAD&color=000", lastPractice: "4h ago", rating: 4.0, isMyStudent: true, lesson: { id: 13, title: "Overcoming Stage Fright", subtitle: "Lesson 7", desc: "Techniques to manage public speaking anxiety", type: "New", progress: 0.15, difficulty: "Basic" } },
  { id: "14", name: "Luis Mendoza", avatar: "https://ui-avatars.com/api/?name=LM&background=FF6B6B&color=fff", lastPractice: "4h ago", rating: 4.0, isMyStudent: true, lesson: { id: 14, title: "Advanced Storytelling", subtitle: "Lesson 7", desc: "Craft and deliver compelling narratives", type: "New", progress: 0.2, difficulty: "Advanced" } },
];

const StudentPresentation = () => {
  const router = useRouter();

  // your existing state
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("Everyone");
  const sheetY = useRef(new Animated.Value(300)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  // NEW: dynamic roster + profile/avatars for teacher
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [roster, setRoster] = useState<Student[]>([]);

  // animate your existing profile menu (unchanged)
  useEffect(() => {
    if (isProfileMenuVisible) {
      sheetY.setValue(300);
      sheetOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(sheetY, { toValue: 0, useNativeDriver: true, bounciness: 0 }),
        Animated.timing(sheetOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetY, { toValue: 300, duration: 200, useNativeDriver: true }),
        Animated.timing(sheetOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isProfileMenuVisible, sheetOpacity, sheetY]);

  // load current teacher id
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;
      if (!mounted) return;
      setTeacherId(uid);
    })();
    return () => { mounted = false; };
  }, []);

  // fetch teacher roster and map to Student shape (logic mirrors student-side patterns)
  const fetchRoster = useCallback(async () => {
    if (!teacherId) return;

    // get all student_id rows for this teacher
    const { data: trows, error } = await supabase
      .from("teacher_students")
      .select("student_id, status, grade_level, strand")
      .eq("teacher_id", teacherId);

    if (error || !trows || trows.length === 0) {
      setRoster([]);
      return;
    }

    const studentIds = Array.from(new Set(trows.map(r => r.student_id)));
    if (studentIds.length === 0) {
      setRoster([]);
      return;
    }

    // fetch student profiles
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, name, avatar_url")
      .in("id", studentIds);

    const profById = new Map((profs ?? []).map(p => [p.id, p]));

    // optionally fetch progress; if missing, use defaults like on student side
    const { data: progress } = await supabase
      .from("student_progress")
      .select("student_id, speaking_completed, speaking_total, confidence, anxiety, updated_at")
      .in("student_id", studentIds);

    const progById = new Map((progress ?? []).map(p => [p.student_id, p]));

    // sign avatars (best-effort)
    const signedMap = new Map<string, string | null>();
    await Promise.all(
      studentIds.map(async (sid) => {
        const aurl = profById.get(sid)?.avatar_url ?? null;
        const signed = await resolveSignedAvatar(sid, aurl);
        signedMap.set(sid, signed);
      })
    );

    const mapped: Student[] = trows.map((row, idx) => {
      const prof = profById.get(row.student_id) as any;
      const prog = progById.get(row.student_id) as any;
      const signed = signedMap.get(row.student_id) ?? null;

      const completed = prog?.speaking_completed ?? 0;
      const total = prog?.speaking_total ?? 0;
      const pct = total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0;

      return {
        id: row.student_id,
        name: (prof?.name ?? "Student").toString(),
        avatar: signed || TRANSPARENT_PNG,
        lastPractice: prog?.updated_at ? "Recently" : "No data yet",
        rating: 4.0, // placeholder; can be replaced by your metric
        isMyStudent: true,
        grade: row?.grade_level ?? undefined,
        strand: row?.strand ?? undefined,
        status: row?.status ?? undefined,
        progress: pct,
        satisfaction: 0,
        lesson: {
          id: 1000 + idx,
          title: "Speaking Progress",
          subtitle: "Auto",
          desc: "Student course progress",
          type: pct >= 1 ? "Review" : pct > 0 ? "Continue" : "Start",
          progress: pct,
          difficulty: "Basic",
        },
      };
    });

    // sort newest first (optional)
    setRoster(mapped);
  }, [teacherId]);

  // initial fetch + realtime
  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  useEffect(() => {
    if (!teacherId) return;
    const ch = supabase
      .channel(`teacher_roster:${teacherId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "teacher_students", filter: `teacher_id=eq.${teacherId}` }, () => fetchRoster())
      .on("postgres_changes", { event: "*", schema: "public", table: "student_progress" }, () => fetchRoster())
      .subscribe();
    return () => {
      try { supabase.removeChannel(ch); } catch {}
    };
  }, [teacherId, fetchRoster]);

  /* ===== Merge dynamic roster + your static list (keeps your UI intact) ===== */
  const mergedStudents: Student[] = useMemo(() => {
    // keep dynamic students first, then your static cards
    // avoid duplicates by id
    const seen = new Set<string>();
    const ordered: Student[] = [];
    roster.forEach(s => { if (!seen.has(s.id)) { ordered.push(s); seen.add(s.id); } });
    STUDENTS.forEach(s => { if (!seen.has(s.id)) { ordered.push(s); seen.add(s.id); } });
    return ordered;
  }, [roster]);

  /* ===== Your existing filtering logic, applied to merged list ===== */
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mergedStudents.filter(student => {
      const matchesSearch =
        q === "" ||
        student.name.toLowerCase().includes(q) ||
        (student.lesson?.title?.toLowerCase().includes(q) ?? false);
      const matchesFilter = selectedFilter === "Everyone" || !!student.isMyStudent;
      return matchesSearch && matchesFilter;
    });
  }, [mergedStudents, searchQuery, selectedFilter]);

  /* ===== Your existing handlers (kept the same) ===== */
  const handleAddStudent = () => {
    router.push("/ButtonIcon/add-student");
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilter(filter);
    setShowFilterDropdown(false);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const goToWatch = (student: Student) => {
    router.push({
      pathname: "/TeacherScreen/TeacherCommunity/teacher-community",
      params: {
        studentId: student.id,
        studentName: student.name,
        studentAvatar: student.avatar,
      },
    });
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  const Header = () => (
    <View className="z-10 bottom-6">
      <SafeAreaView>
        <View className="flex-row justify-between items-center top-6 px-4 py-3">
          <View className="flex-row items-center">
            <Image
              source={require("../../../assets/Speaksy.png")}
              className="w-12 h-12 right -mr-4"
              resizeMode="contain"
            />
            <Text className="text-white left-3 font-bold text-2xl">Voclaria</Text>
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
            <TouchableOpacity
              onPress={() => setIsProfileMenuVisible(true)}
              activeOpacity={0.7}
            >
              {/* Keep your existing avatar UI; this is just the teacher's profile trigger */}
              <Image
                source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }}
                className="w-9 h-9 rounded-full border-2 border-white/80"
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );

  return (
    <View className="flex-1">
      <BackgroundDecor />

      <SafeAreaView className="flex-1 top-4 z-10">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
        >
          <View className="flex-1 top-2">
            {/* Header */}
            <Header />

            {/* Page Title */}
            <View className="px-5 mb-4">
              <Text className="text-white text-2xl font-bold">
                Student Speech Practice
              </Text>
              <Text className="text-indigo-300 text-sm">
                Watch and learn from peers
              </Text>
            </View>

            {/* Search and Filter Row */}
            <View className="flex-row items-center space-x-3 px-4 mb-4">
              {/* Search Bar */}
              <View className="relative flex-1">
                <TextInput
                  className="bg-white/10 text-white rounded-xl pl-10 pr-6 py-2.5 text-sm"
                  placeholder="Search by name or ..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <Ionicons
                  name="search"
                  size={16}
                  color="#94a3b8"
                  style={{ position: "absolute", left: 12, top: 12 }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    style={{ position: "absolute", right: 12, top: 12 }}
                  >
                    <Ionicons name="close-circle" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Dropdown */}
              <View className="relative">
                <TouchableOpacity
                  className="flex-row items-center bg-white/15 px-4 py-2.5 rounded-xl"
                  onPress={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  <Text className="text-white mr-2 text-sm">{selectedFilter}</Text>
                  <Ionicons name="chevron-down" size={14} color="white" />
                </TouchableOpacity>

                {showFilterDropdown && (
                  <View className="absolute top-12 right-0 bg-[#1E293B] rounded-lg border border-white/20 z-10 w-40">
                    <TouchableOpacity
                      className="px-4 py-2.5 border-b border-white/10"
                      onPress={() => toggleFilter("Everyone")}
                    >
                      <Text className="text-white text-sm">Everyone</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="px-4 py-2.5"
                      onPress={() => toggleFilter("My Students")}
                    >
                      <Text className="text-white text-sm">My Students</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Selection Info */}
            {selectedStudents.length > 0 && (
              <View className="mx-5 mb-4 bg-indigo-500/20 rounded-xl p-3 flex-row justify-between items-center border border-indigo-500/30">
                <Text className="text-white font-medium">
                  {selectedStudents.length} selected
                </Text>
                <TouchableOpacity onPress={clearSelection}>
                  <Text className="text-indigo-300">Clear</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Students List */}
            <View className="px-5">
              {filteredStudents
                .filter(student =>
                  student.name.toLowerCase().includes(query.toLowerCase()) ||
                  (student.lesson?.title?.toLowerCase().includes(query.toLowerCase()) ?? false)
                ).length === 0 ? (
                <View key="no-students" className="items-center justify-center py-10">
                  <Ionicons name="people-outline" size={48} color="#4B5563" />
                  <Text className="text-gray-400 mt-4">No students found</Text>
                </View>
              ) : (
                <View>
                  {filteredStudents
                    .filter(student =>
                      student.name.toLowerCase().includes(query.toLowerCase()) ||
                      (student.lesson?.title?.toLowerCase().includes(query.toLowerCase()) ?? false)
                    )
                    .map((student) => (
                      <TouchableOpacity
                        key={student.id}
                        onPress={() => goToWatch(student)}
                        className="rounded-2xl overflow-hidden mb-4 border border-white/10 bg-white/5 backdrop-blur-sm"
                        activeOpacity={0.9}
                        onLongPress={() => toggleStudentSelection(student.id)}
                      >
                        <View className="p-4">
                          <View className="flex-row items-start">
                            <Image
                              source={{ uri: student.avatar || TRANSPARENT_PNG }}
                              className="w-12 h-12 rounded-full border-2 border-gray-200"
                              onError={() => { /* ignore image errors */ }}
                            />
                            <View className="flex-1 ml-3">
                              <View className="flex-row justify-between items-start">
                                <Text className="text-white font-semibold text-base">
                                  {student.name}
                                </Text>
                                <View className="flex-row items-center">
                                  <Ionicons name="star" size={14} color="#F59E0B" />
                                  <Text className="text-amber-600 text-sm font-medium ml-1">
                                    {typeof student.rating === "number" ? student.rating.toFixed(1) : "N/A"}
                                  </Text>
                                </View>
                              </View>

                              {student.lesson && (
                                <View className="mt-2">
                                  <Text className="text-indigo-200 text-sm font-medium">
                                    {student.lesson.title}
                                  </Text>
                                  <View className="mt-2">
                                    <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                      <View
                                        className="h-full bg-violet-600 rounded-full"
                                        style={{ width: `${(student.lesson?.progress || 0) * 100}%` }}
                                      />
                                    </View>
                                    <View className="flex-row justify-between mt-1">
                                      <Text className="text-gray-400 text-xs">
                                        {Math.round((student.lesson?.progress || 0) * 100)}% Complete
                                      </Text>
                                      <Text className="text-indigo-300 text-xs font-medium">
                                        {student.lesson.type === "Review" ? "Review" : "Continue"}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <NavigationBar defaultActiveTab="Community" />

      {/* Your profile menu trigger/visibility preserved */}
      <ProfileMenuTeacher
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
      />
    </View>
  );
}

export default StudentPresentation;
