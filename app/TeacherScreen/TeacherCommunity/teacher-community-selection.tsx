import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  TextInput,
  Animated,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import ProfileMenuNew from "../../../components/ProfileModal/ProfileMenuTeacher";
import NavigationBar from "../../../components/NavigationBar/nav-bar-teacher";
import type { ImageSourcePropType } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

// ===== Supabase (wired) =====
import { supabase } from "@/lib/supabaseClient";

// ---- keep bucket name consistent with home-page ----
const AVATAR_BUCKET = "avatars";

// tiny transparent placeholder (same approach as in home-page)
const TRANSPARENT_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

// Background decoration component with gradient and floating circles
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

// ===== Utils =====
const getInitials = (nameOrEmail: string) => {
  if (!nameOrEmail) return "U";
  const s = nameOrEmail.trim();
  if (s.includes(" ")) {
    const parts = s.split(/\s+/).filter(Boolean);
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }
  const base = s.includes("@") ? s.split("@")[0] : s;
  return base.slice(0, 2).toUpperCase();
};

// nice compact "2h ago" style
function timeAgo(dateISO?: string | null) {
  if (!dateISO) return "";
  const seconds = Math.floor((Date.now() - new Date(dateISO).getTime()) / 1000);
  const steps = [60, 60, 24, 7, 4.345, 12];
  let acc = seconds;
  let i = 0;
  while (i < steps.length && acc >= steps[i]) {
    acc = Math.floor(acc / steps[i]);
    i++;
  }
  const labels = ["s", "m", "h", "d", "w", "mo", "y"];
  return `${acc}${labels[i] || "s"} ago`;
}

// ---------- Types ----------
type BaseCard = {
  id: string;
  name: string;
  avatar?: string | null;
  lastPractice: string;
  rating?: number | null;
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

type StudentCard = BaseCard & { kind: "student"; isMyStudent?: boolean };
type PostCard = BaseCard & { kind: "post" };
type AnyCard = StudentCard | PostCard;

// ===== Your STATIC list (kept as-is, just tagged kind: "student") =====
const STUDENTS: StudentCard[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    lastPractice: "2h ago",
    rating: 4.2,
    kind: "student",
    isMyStudent: false,
    lesson: {
      id: 1,
      title: "Persuasive Speech Building",
      subtitle: "Lesson 1",
      desc: "Master persuasive speech delivery",
      type: "Review",
      progress: 1,
      difficulty: "Advanced",
    },
  },
  {
    id: "2",
    name: "Earl Ang",
    avatar: "https://randomuser.me/api/portraits/men/44.jpg",
    lastPractice: "1d ago",
    rating: 4.8,
    kind: "student",
    isMyStudent: false,
    lesson: {
      id: 2,
      title: "Effective Non-Verbal Communication",
      subtitle: "Lesson 1",
      desc: "Master gestures and visual cues",
      type: "Review",
      progress: 1,
      difficulty: "Basic",
    },
  },
  {
    id: "3",
    name: "Yang Flores",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    lastPractice: "3h ago",
    rating: 3.9,
    kind: "student",
    isMyStudent: false,
    lesson: {
      id: 3,
      title: "Advanced Debate Practice",
      subtitle: "Lesson 2",
      desc: "Develop argumentation and rebuttal skills",
      type: "Start",
      progress: 0.5,
      difficulty: "Advanced",
    },
  },
  {
    id: "4",
    name: "John Park",
    avatar: "https://randomuser.me/api/portraits/men/67.jpg",
    lastPractice: "5h ago",
    rating: 4.1,
    kind: "student",
    isMyStudent: false,
    lesson: {
      id: 4,
      title: "Diaphragmatic Breathing Practice",
      subtitle: "Lesson 2",
      desc: "Control and project your voice",
      type: "Start",
      progress: 0.5,
      difficulty: "Basic",
    },
  },
  {
    id: "5",
    name: "Emma Wilson",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    lastPractice: "30m ago",
    rating: 4.5,
    kind: "student",
    isMyStudent: false,
    lesson: {
      id: 5,
      title: "Panel Interview Simulation",
      subtitle: "Lesson 3",
      desc: "Prepare effectively for interviews and Q&A",
      type: "Review",
      progress: 1,
      difficulty: "Advanced",
    },
  },
  {
    id: "6",
    name: "David Kim",
    avatar: "https://randomuser.me/api/portraits/men/31.jpg",
    lastPractice: "4h ago",
    rating: 4.0,
    kind: "student",
    isMyStudent: false,
    lesson: {
      id: 6,
      title: "Voice Warm-up and Articulation",
      subtitle: "Lesson 3",
      desc: "Clarity and pronunciation",
      type: "Review",
      progress: 1,
      difficulty: "Basic",
    },
  },
];

// ---------- NEW: minimal types for posts select ----------
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

function StudentPresentation() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"Everyone" | "Classmate">("Everyone");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const sheetY = useRef(new Animated.Value(300)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  // ===== Same profile logic as home-page =====
  const [fullName, setFullName] = useState<string>("");
  const [initials, setInitials] = useState<string>(""); // fallback avatar
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  // FEED (static students)
  const [studentsFeed] = useState<StudentCard[]>(STUDENTS);

  // ------ NEW: dynamic posts mapped to cards ------
  const [postCards, setPostCards] = useState<PostCard[]>([]);

  // Animate profile menu (unchanged UI)
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

  // ===== Load/refresh current user profile — EXACT flow from home-page =====
  const loadUser = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    setUserEmail(user.email ?? "");

    // profiles: name + avatar_url
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", user.id)
      .single();

    const fullNameValue =
      (profile?.name ?? user.user_metadata?.full_name ?? user.email ?? "").trim();
    const parts = fullNameValue.split(/\s+/).filter(Boolean);
    const inits =
      (parts[0]?.[0] ?? "").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
    setFullName(fullNameValue);
    setInitials(inits || getInitials(fullNameValue || user.email || "User"));

    // Resolve avatar from avatars bucket:
    const resolveAndSign = async (): Promise<string | null> => {
      const stored = profile?.avatar_url?.toString() || user.id; // folder or file
      const normalized = stored.replace(/^avatars\//, "");
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
    };

    try {
      const url = await resolveAndSign();
      setAvatarUri(url || null);
    } catch {
      setAvatarUri(null);
    }
  }, []);

  // ------ NEW: fetch posts and map them into PostCard, with ratings from comments ------
  const fetchPostsAsCards = useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
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
      `
      )
      .eq("status", "published")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !data) {
      setPostCards([]);
      return;
    }

    const rows = (data as unknown) as JoinedRow[];
    const postIds = rows.map(r => r.id);

    // Pull all ratings from comments in one query, grouped locally
    let commentRows: Array<{
      post_id: string;
      rating_delivery: number | null;
      rating_confidence: number | null;
    }> = [];

    if (postIds.length > 0) {
      const { data: cdata, error: cerr } = await supabase
        .from("comments")
        .select("post_id, rating_delivery, rating_confidence")
        .in("post_id", postIds);

      if (!cerr && cdata) {
        commentRows = cdata as any[];
      }
    }

    // Build averages: average of (delivery+confidence)/2 per post
    const byPost = new Map<
      string,
      { sum: number; count: number }
    >();

    for (const r of commentRows) {
      const hasDel = typeof r.rating_delivery === "number";
      const hasConf = typeof r.rating_confidence === "number";
      if (!hasDel && !hasConf) continue;

      const avgOne =
        (Number(hasDel ? r.rating_delivery : 0) +
          Number(hasConf ? r.rating_confidence : 0)) /
        (Number(hasDel) + Number(hasConf));
      if (!isFinite(avgOne)) continue;

      const acc = byPost.get(r.post_id) || { sum: 0, count: 0 };
      acc.sum += avgOne;
      acc.count += 1;
      byPost.set(r.post_id, acc);
    }

    const signAvatar = async (userId: string, avatar_url?: string | null) => {
      const stored = (avatar_url ?? userId).toString().replace(/^avatars\//, "");
      let objectPath: string | null = null;

      if (/\.[a-zA-Z0-9]+$/.test(stored)) {
        objectPath = stored;
      } else {
        const { data: files } = await supabase.storage
          .from(AVATAR_BUCKET)
          .list(stored, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
        if (files && files.length > 0) objectPath = `${stored}/${files[0].name}`;
      }

      if (!objectPath) return null;
      const { data: signed } = await supabase.storage
        .from(AVATAR_BUCKET)
        .createSignedUrl(objectPath, 60 * 60);
      return signed?.signedUrl ?? null;
    };

    const mapped: PostCard[] = await Promise.all(
      rows.map(async (p, idx) => {
        const prof: ProfileJoin | null = Array.isArray(p.profiles)
          ? (p.profiles[0] ?? null)
          : p.profiles;

        const name = prof?.name || "User";
        const avatar = await signAvatar(p.user_id, prof?.avatar_url ?? null);

        const agg = byPost.get(p.id);
        const rating = agg && agg.count > 0 ? Math.round((agg.sum / agg.count) * 10) / 10 : null;

        return {
          kind: "post",
          id: p.id, // post id
          name,
          avatar: avatar || null,
          lastPractice: timeAgo(p.created_at) || "Posted",
          rating, // <- from comments table
          lesson: {
            id: idx + 1000,
            title: p.title || "Shared to Community",
            subtitle: "Post",
            desc: p.content || "Community submission",
            type: "Review",
            progress: 1,
            difficulty: "Basic",
          },
        };
      })
    );

    setPostCards(mapped);
  }, []);

  useEffect(() => {
    loadUser();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });
    return () => {
      sub?.subscription?.unsubscribe();
    };
  }, [loadUser]);

  // Refresh on focus (same behavior you expect from home-page feel)
  useFocusEffect(
    useCallback(() => {
      loadUser();
      fetchPostsAsCards(); // refresh posts on focus for teacher
    }, [loadUser, fetchPostsAsCards])
  );

  // Filter items based on search query and selected filter
  // Merge posts first so they are visible again
  const mergedFeed: AnyCard[] = useMemo(() => {
    return [...postCards, ...studentsFeed];
  }, [postCards, studentsFeed]);

  const filteredStudents = useMemo(() => {
    return mergedFeed.filter((item) => {
      const matchesFilter =
        selectedFilter === "Everyone" ||
        (selectedFilter === "Classmate" && item.kind === "student" && item.isMyStudent);

      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lesson?.title?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [searchQuery, selectedFilter, mergedFeed]);

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // >>> Teacher route on press:
  // if it's a post card => pass postId
  // if it's a student card => pass studentId
  const goToWatch = (item: AnyCard) => {
    if (item.kind === "post") {
      router.push({
        pathname: "/TeacherScreen/TeacherCommunity/teacher-community",
        params: { postId: item.id },
      });
    } else {
      router.push({
        pathname: "/TeacherScreen/TeacherCommunity/teacher-community",
        params: { studentId: item.id, studentName: item.name, studentAvatar: item.avatar ?? "" },
      });
    }
  };

  const clearSelection = () => setSelectedStudents([]);

  // --------- UI ONLY (matches the sample you sent) ---------

  // Display label: keep internal "Classmate", show "My Students"
  const selectedFilterLabel =
    selectedFilter === "Classmate" ? "My Students" : "Everyone";

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
              onPress={() => router.push("/ButtonIcon/add-student")}
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
              <View className="w-9 h-9 rounded-full border-2 border-white/80 overflow-hidden items-center justify-center">
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} className="w-9 h-9" />
                ) : (
                  <View className="w-9 h-9 bg-violet-600 items-center justify-center">
                    <Text className="text-white text-xs font-bold">{initials || "U"}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );

  const ProfileMenu = () => (
    <ProfileMenuNew
      visible={isProfileMenuVisible}
      onDismiss={() => setIsProfileMenuVisible(false)}
      user={{
        name: fullName || "Teacher",
        email: userEmail || "",
        image: ({ uri: avatarUri || TRANSPARENT_PNG } as unknown) as ImageSourcePropType,
      }}
    />
  );

  return (
    <View className="flex-1 bg-[#0F172A]">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <BackgroundDecor />

      <SafeAreaView className="flex-1 top-4 z-10">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 80, maxWidth: 600, width: "100%", alignSelf: "center" }}
          showsVerticalScrollIndicator={false}
          bounces
          overScrollMode="always"
        >
          <View className="flex-1">
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

            {/* Search + Filter */}
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

              {/* Filter Dropdown (UI shows "My Students" while internal uses "Classmate") */}
              <View className="relative">
                <TouchableOpacity
                  className="flex-row items-center bg-white/15 px-4 py-2.5 rounded-xl"
                  onPress={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                  <Text className="text-white mr-2 text-sm">{selectedFilterLabel}</Text>
                  <Ionicons name="chevron-down" size={14} color="white" />
                </TouchableOpacity>

                {showFilterDropdown && (
                  <View className="absolute top-12 right-0 bg-[#1E293B] rounded-lg border border-white/20 z-10 w-40">
                    <TouchableOpacity
                      className="px-4 py-2.5 border-b border-white/10"
                      onPress={() => {
                        setSelectedFilter("Everyone");
                        setShowFilterDropdown(false);
                      }}
                    >
                      <Text className="text-white text-sm">Everyone</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="px-4 py-2.5"
                      onPress={() => {
                        // keep logic value "Classmate", show label "My Students"
                        setSelectedFilter("Classmate");
                        setShowFilterDropdown(false);
                      }}
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

            {/* Cards List (posts + students) */}
            <View className="px-5">
              {filteredStudents.length === 0 ? (
                <View key="no-students" className="items-center justify-center py-10">
                  <Ionicons name="people-outline" size={48} color="#4B5563" />
                  <Text className="text-gray-400 mt-4">No students found</Text>
                </View>
              ) : (
                <View>
                  {filteredStudents.map((item) => (
                    <TouchableOpacity
                      key={`${("kind" in item ? (item as AnyCard).kind : "student")}:${item.id}`}
                      onPress={() => goToWatch(item as AnyCard)}
                      onLongPress={() => toggleStudentSelection(item.id)}
                      className={`rounded-2xl overflow-hidden mb-4 border border-white/10 bg-white/5 backdrop-blur-sm ${
                        selectedStudents.includes(item.id) ? "border-indigo-500/50" : ""
                      }`}
                      activeOpacity={0.9}
                    >
                      <View className="p-4">
                        <View className="flex-row items-start">
                          <View className="w-12 h-12 rounded-full border-2 border-gray-200 overflow-hidden items-center justify-center">
                            {item.avatar ? (
                              <Image source={{ uri: item.avatar }} className="w-12 h-12" />
                            ) : (
                              <View className="w-12 h-12 bg-violet-600 items-center justify-center">
                                <Text className="text-white font-bold">{getInitials(item.name)}</Text>
                              </View>
                            )}
                          </View>

                          <View className="flex-1 ml-3">
                            <View className="flex-row justify-between items-start">
                              <Text className="text-white font-semibold text-base">
                                {item.name}
                              </Text>
                              <View className="flex-row items-center">
                                <Ionicons name="star" size={14} color="#F59E0B" />
                                <Text className="text-amber-600 text-sm font-medium ml-1">
                                  {typeof item.rating === "number" ? item.rating.toFixed(1) : "N/A"}
                                </Text>
                              </View>
                            </View>

                            {item.lesson && (
                              <View className="mt-2">
                                <Text className="text-indigo-200 text-sm font-medium">
                                  {item.lesson.title}
                                </Text>
                                <Text className="text-gray-300/80 text-xs mt-0.5">
                                  {item.lesson.desc}
                                </Text>
                                <View className="mt-2">
                                  <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <View
                                      className="h-full bg-violet-600 rounded-full"
                                      style={{
                                        width: `${(item.lesson?.progress || 0) * 100}%`,
                                      }}
                                    />
                                  </View>
                                  <View className="flex-row justify-between mt-1">
                                    <Text className="text-gray-400 text-xs">
                                      {Math.round((item.lesson?.progress || 0) * 100)}% Complete
                                    </Text>
                                    <Text className="text-indigo-300 text-xs font-medium">Continue</Text>
                                  </View>
                                </View>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* keep original lastPractice label */}
                        <View className="mt-2">
                          <Text className="text-gray-400 text-xs">{item.lastPractice}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Profile Menu */}
            <ProfileMenu />
          </View>
        </ScrollView>
      </SafeAreaView>

      <NavigationBar defaultActiveTab="Community" />
    </View>
  );
}

export default StudentPresentation;
