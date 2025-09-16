// app/TeacherScreen/TeacherCommunity/community-selection.tsx
import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
  TextInput,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import NavigationBar from "@/components/NavigationBar/nav-bar-teacher";
import ProfileMenuTeacher from "@/components/ProfileModal/ProfileMenuTeacher";
import type { ImageSourcePropType } from "react-native";

// === Supabase
import { supabase } from "@/lib/supabaseClient";

// ---- keep bucket name consistent
const AVATAR_BUCKET = "avatars";

// tiny transparent placeholder
const TRANSPARENT_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

// Background decoration
const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient colors={["#0F172A", "#1E293B", "#0F172A"]} className="flex-1" />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-60 h-60 bg-[#a78bfa]/5 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[120px] h-[120px] bg-[#a78bfa]/5 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-12 h-12 bg-[#a78bfa]/5 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-8 h-8 bg-[#a78bfa]/5 rounded-full" />
  </View>
);

// ===== Utils
const getInitials = (s: string) => {
  if (!s) return "U";
  const str = s.trim();
  if (str.includes(" ")) {
    const parts = str.split(/\s+/).filter(Boolean);
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }
  const base = str.includes("@") ? str.split("@")[0] : str;
  return base.slice(0, 2).toUpperCase();
};

function timeAgo(dateISO?: string | null) {
  if (!dateISO) return "";
  const sec = Math.floor((Date.now() - new Date(dateISO).getTime()) / 1000);
  const steps = [60, 60, 24, 7, 4.345, 12];
  const labels = ["s", "m", "h", "d", "w", "mo", "y"];
  let v = sec, i = 0;
  while (i < steps.length && v >= steps[i]) { v = Math.floor(v / steps[i]); i++; }
  return `${v}${labels[i] || "s"} ago`;
}

// ===== Types
type ProfileJoin = { name: string | null; avatar_url: string | null };

type JoinedRow = {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  media_url: string | null;
  created_at: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
};

type Student = {
  id: string;
  name: string;
  avatar?: string | null;
  lastPractice: string;
  rating?: number | null;
  isMyStudent?: boolean;
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

// ===== Your existing STATIC list (left intact)
const STATIC_STUDENTS: Student[] = [
  // (keep your existing entries – shortened here for brevity)
  {
    id: "7",
    name: "Jose Reyes",
    avatar: "https://ui-avatars.com/api/?name=JR&background=45B7D1&color=fff",
    lastPractice: "1d ago",
    rating: 3.9,
    isMyStudent: true,
    lesson: {
      id: 7,
      title: "Storytelling Techniques",
      subtitle: "Lesson 4",
      desc: "Engage your audience with compelling stories",
      type: "Continue",
      progress: 0.75,
      difficulty: "Advanced",
    },
  },
  // ...include the rest of your static items here
];

export default function TeacherCommunitySelection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"Everyone" | "My Students">("Everyone");

  const sheetY = useRef(new Animated.Value(300)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  // ---- Teacher profile (avatar + name/email)
  const [teacherName, setTeacherName] = useState<string>("");
  const [teacherEmail, setTeacherEmail] = useState<string>("");
  const [teacherInitials, setTeacherInitials] = useState<string>("T");
  const [teacherAvatarUri, setTeacherAvatarUri] = useState<string | null>(null);

  // ---- dynamic community posts mapped into Student cards
  const [postStudents, setPostStudents] = useState<Student[]>([]);

  // ========== helpers
  const signAvatarFromBucket = useCallback(async (storedOrUid: string) => {
    const normalized = storedOrUid.replace(/^avatars\//, "");
    let objectPath: string | null = null;

    if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
      objectPath = normalized;
    } else {
      const { data: files } = await supabase.storage
        .from(AVATAR_BUCKET)
        .list(normalized, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
      if (files && files.length > 0) objectPath = `${normalized}/${files[0].name}`;
    }

    if (!objectPath) return null;
    const { data: signed } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(objectPath, 60 * 60);
    return signed?.signedUrl ?? null;
  }, []);

  const loadTeacherProfile = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    setTeacherEmail(user.email ?? "");

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", user.id)
      .single();

    const fullName =
      (profile?.name ?? user.user_metadata?.full_name ?? user.email ?? "").trim();
    setTeacherName(fullName);
    setTeacherInitials(getInitials(fullName || user.email || "Teacher"));

    try {
      const key = (profile?.avatar_url?.toString() || user.id).replace(/^avatars\//, "");
      const url = await signAvatarFromBucket(key);
      setTeacherAvatarUri(url || null);
    } catch {
      setTeacherAvatarUri(null);
    }
  }, [signAvatarFromBucket]);

  const fetchPublicPostsAsStudents = useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        id,
        user_id,
        title,
        content,
        media_url,
        created_at,
        profiles!posts_user_id_fkey (
          name,
          avatar_url
        )
      `)
      .eq("status", "published")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !data || data.length === 0) {
      setPostStudents([]);
      return;
    }

    const rows = (data as unknown) as JoinedRow[];

    const mapped = await Promise.all(
      rows.map(async (p, idx) => {
        const prof: ProfileJoin | null = Array.isArray(p.profiles)
          ? (p.profiles[0] ?? null)
          : p.profiles;

        const name = prof?.name || "Student";
        const avatar = await signAvatarFromBucket((prof?.avatar_url ?? p.user_id).toString());

        return {
          id: p.id, // keep post id for navigation
          name,
          avatar: avatar || null,
          lastPractice: timeAgo(p.created_at) || "Posted",
          rating: null,
          isMyStudent: false, // keep default; your filter still works with static items
          lesson: {
            id: idx + 10_000,
            title: p.title || "Shared to Community",
            subtitle: "Post",
            desc: p.content || "Community submission",
            type: "Review",
            progress: 1,
            difficulty: "Basic",
          },
        } as Student;
      })
    );

    setPostStudents(mapped);
  }, [signAvatarFromBucket]);

  // animate profile menu
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

  // initial + auth change
  useEffect(() => {
    loadTeacherProfile();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadTeacherProfile();
    });
    return () => sub?.subscription?.unsubscribe();
  }, [loadTeacherProfile]);

  // refresh when focused
  useFocusEffect(
    useCallback(() => {
      loadTeacherProfile();
      fetchPublicPostsAsStudents();
    }, [loadTeacherProfile, fetchPublicPostsAsStudents])
  );

  // merge dynamic posts (from students) + your static teacher list
  const mergedFeed = useMemo(() => {
    // teacher view should see community posts first, then your static sample data
    return [...postStudents, ...STATIC_STUDENTS];
  }, [postStudents]);

  // filtering + search (keeps your “Everyone/My Students” behavior)
  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = mergedFeed.filter((s) => {
      const matchesSearch =
        q.length === 0 ||
        s.name.toLowerCase().includes(q) ||
        s.lesson?.title?.toLowerCase().includes(q);
      const matchesFilter = selectedFilter === "Everyone" ? true : !!s.isMyStudent;
      return matchesSearch && matchesFilter;
    });
    return base;
  }, [mergedFeed, query, selectedFilter]);

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const clearSelection = () => setSelectedStudents([]);

  const goToWatch = (student: Student) => {
    // Navigate to teacher post page with postId if this card came from Supabase
    router.push({
      pathname: "/TeacherScreen/TeacherCommunity/teacher-community",
      params: { postId: student.id, from: "selection" },
    });
  };

  const handleAddStudent = () => {
    router.push("/ButtonIcon/add-student");
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

            {/* Teacher avatar: signed URL or initials */}
            <TouchableOpacity onPress={() => setIsProfileMenuVisible(true)} activeOpacity={0.7}>
              <View className="w-9 h-9 rounded-full border-2 border-white/80 overflow-hidden items-center justify-center">
                {teacherAvatarUri ? (
                  <Image source={{ uri: teacherAvatarUri }} className="w-9 h-9" />
                ) : (
                  <View className="w-9 h-9 bg-violet-600 items-center justify-center">
                    <Text className="text-white text-xs font-bold">{teacherInitials}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );

  return (
    <View className="flex-1 bg-[#0F172A]">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <BackgroundDecor />

      <SafeAreaView className="flex-1 top-4 z-10">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          bounces
          overScrollMode="always"
        >
          <View className="flex-1 top-2">
            <Header />

            {/* Title */}
            <View className="px-5 mb-4">
              <Text className="text-white text-2xl font-bold">Student Speech Practice</Text>
              <Text className="text-indigo-300 text-sm">Watch and learn from peers</Text>
            </View>

            {/* Search + Filter */}
            <View className="mb-6 px-6">
              <View className="flex-row items-center">
                <View className="flex-1 rounded-xl bg-white/10 border border-white/10 flex-row items-center shadow-lg">
                  <View className="pl-1 left-2">
                    <Ionicons name="search" size={20} color="#a78bfa" />
                  </View>
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search students..."
                    placeholderTextColor="#9ca3af"
                    className="text-white flex-1 ml-3 text-base"
                    style={{ fontFamily: "Inter_400Regular" }}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="ml-3 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 flex-row items-center"
                >
                  <Text className="text-white mr-2">
                    {selectedFilter === "Everyone" ? "Everyone" : "My Students"}
                  </Text>
                  <Ionicons
                    name={showFilterDropdown ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#a78bfa"
                  />
                </TouchableOpacity>
              </View>

              {showFilterDropdown && (
                <View className="absolute right-6 top-12 mt-1 w-48 bg-gray-800 rounded-xl border border-white/10 z-50 overflow-hidden">
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedFilter("Everyone");
                      setShowFilterDropdown(false);
                    }}
                    className={`px-4 py-3 flex-row items-center ${
                      selectedFilter === "Everyone" ? "bg-indigo-600/20" : ""
                    }`}
                  >
                    <Ionicons
                      name="people-outline"
                      size={18}
                      color={selectedFilter === "Everyone" ? "#a78bfa" : "#9ca3af"}
                    />
                    <Text className={`ml-2 ${selectedFilter === "Everyone" ? "text-indigo-300" : "text-gray-300"}`}>
                      Everyone
                    </Text>
                  </TouchableOpacity>

                  <View className="h-px bg-white/10 w-full" />

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedFilter("My Students");
                      setShowFilterDropdown(false);
                    }}
                    className={`px-4 py-3 flex-row items-center ${
                      selectedFilter === "My Students" ? "bg-indigo-600/20" : ""
                    }`}
                  >
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={selectedFilter === "My Students" ? "#a78bfa" : "#9ca3af"}
                    />
                    <Text className={`ml-2 ${selectedFilter === "My Students" ? "text-indigo-300" : "text-gray-300"}`}>
                      My Students
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Selection info */}
            {selectedStudents.length > 0 && (
              <View className="mx-5 mb-4 bg-indigo-500/20 rounded-xl p-3 flex-row justify-between items-center border border-indigo-500/30">
                <Text className="text-white font-medium">{selectedStudents.length} selected</Text>
                <TouchableOpacity onPress={() => setSelectedStudents([])}>
                  <Text className="text-indigo-300">Clear</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* List */}
            <View className="px-5">
              {filteredStudents.length === 0 ? (
                <View className="items-center justify-center py-10">
                  <Ionicons name="people-outline" size={48} color="#4B5563" />
                  <Text className="text-gray-400 mt-4">No students found</Text>
                </View>
              ) : (
                filteredStudents.map((student) => (
                  <TouchableOpacity
                    key={student.id}
                    onPress={() => goToWatch(student)}
                    onLongPress={() => toggleStudentSelection(student.id)}
                    className={`rounded-2xl overflow-hidden mb-4 border border-white/10 bg-white/5 backdrop-blur-sm ${
                      selectedStudents.includes(student.id) ? "border-indigo-500/50" : ""
                    }`}
                    activeOpacity={0.9}
                  >
                    <View className="p-4">
                      <View className="flex-row items-start">
                        <View className="w-12 h-12 rounded-full border-2 border-gray-200 overflow-hidden items-center justify-center">
                          {student.avatar ? (
                            <Image source={{ uri: student.avatar }} className="w-12 h-12" />
                          ) : (
                            <View className="w-12 h-12 bg-violet-600 items-center justify-center">
                              <Text className="text-white font-bold">{getInitials(student.name)}</Text>
                            </View>
                          )}
                        </View>

                        <View className="flex-1 ml-3">
                          <View className="flex-row justify-between items-start">
                            <Text className="text-white font-semibold text-base">{student.name}</Text>
                            <View className="flex-row items-center">
                              <Ionicons name="star" size={14} color="#F59E0B" />
                              <Text className="text-amber-600 text-sm font-medium ml-1">
                                {typeof student.rating === "number" ? student.rating.toFixed(1) : "N/A"}
                              </Text>
                            </View>
                          </View>

                          {student.lesson && (
                            <View className="mt-2">
                              <Text className="text-indigo-200 text-sm font-medium">{student.lesson.title}</Text>
                              <Text className="text-gray-300/80 text-xs mt-0.5">{student.lesson.desc}</Text>
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
                                  <Text className="text-indigo-300 text-xs font-medium">Continue</Text>
                                </View>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>

                      <View className="mt-2">
                        <Text className="text-gray-400 text-xs">{student.lastPractice}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <NavigationBar defaultActiveTab="Community" />

      {/* Teacher profile menu (wired) */}
      <ProfileMenuTeacher
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        user={{
          name: teacherName || "Teacher",
          email: teacherEmail || "",
          image: ({ uri: teacherAvatarUri || TRANSPARENT_PNG } as unknown) as ImageSourcePropType,
        }}
      />
    </View>
  );
}
