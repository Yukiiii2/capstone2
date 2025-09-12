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
import LivesessionCommunityModal from "../../../components/StudentModal/LivesessionCommunityModal";
import LevelSelectionModal from "../../../components/StudentModal/LevelSelectionModal";
import ProfileMenuNew from "../../../components/ProfileModal/ProfileMenuNew";
import NavigationBar from "../../../components/NavigationBar/nav-bar";
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

type Student = {
  id: string;
  name: string;
  avatar?: string | null;
  lastPractice: string;
  rating?: number | null;
  isSelected?: boolean;
  isMyTeacher?: boolean; // Added for filtering
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

// ===== Your STATIC list (kept as-is) =====
const STUDENTS: Student[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    lastPractice: "2h ago",
    rating: 4.2,
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

// ---------- NEW: minimal types for posts select (no UI change) ----------
type ProfileJoin = { name: string | null; avatar_url: string | null };

type JoinedRow = {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  media_url: string | null;
  created_at: string;
  // Supabase can return an object OR an array for the join, depending on relation config
  profiles: ProfileJoin | ProfileJoin[] | null;
};

function StudentPresentation() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"Everyone" | "Classmate">("Everyone");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const sheetY = useRef(new Animated.Value(300)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  // ===== Same profile logic as home-page =====
  const [fullName, setFullName] = useState<string>("");
  const [initials, setInitials] = useState<string>(""); // fallback avatar
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  // FEED stays static per your request
  const [studentsFeed] = useState<Student[]>(STUDENTS);

  // ------ NEW: dynamic posts mapped to Student cards (no UI change) ------
  const [postStudents, setPostStudents] = useState<Student[]>([]);

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") {
      router.replace("/login-page");
    } else if (iconName === "chatbot") {
      router.push("/ButtonIcon/chatbot");
    } else if (iconName === "notifications" || iconName === "notifications-outline") {
      router.push("/ButtonIcon/notification");
    }
  };

  const handleOptionSelect = (option: "Live Session" | "Community Post") => {
    setShowCommunityModal(false);
    if (option === "Live Session") {
      router.push("/live-sessions-select");
    } else {
      router.push("/community-selection");
    }
  };

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

    // name → fullName + initials
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

  // ------ NEW: fetch posts and map them into Student cards (keeps UI) ------
  const fetchPostsAsStudents = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    console.log("[community-selection] user", auth?.user?.id ?? "(anon)");

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

    if (error) {
      console.warn("[community-selection] posts error:", error);
      setPostStudents([]);
      return;
    }
    if (!data || data.length === 0) {
      console.log("[community-selection] no posts matched filters");
      setPostStudents([]);
      return;
    }

    // cast once to the union-typed shape that matches Supabase behavior
    const rows = (data as unknown) as JoinedRow[];

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

    const mapped = await Promise.all(
      rows.map(async (p, idx) => {
        const prof: ProfileJoin | null = Array.isArray(p.profiles)
          ? (p.profiles[0] ?? null)
          : p.profiles;

        const name = prof?.name || "User";
        const avatar = await signAvatar(p.user_id, prof?.avatar_url ?? null);

        return {
          id: p.id, // keep post id (unique)
          name,
          avatar: avatar || null,
          lastPractice: timeAgo(p.created_at) || "Posted",
          rating: null,
          lesson: {
            id: idx + 1000,
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
      fetchPostsAsStudents(); // <-- NEW: refresh posts on focus
    }, [loadUser, fetchPostsAsStudents])
  );

  // Filter students based on search query and selected filter
  const mergedFeed = useMemo(() => {
    return [...postStudents, ...studentsFeed];
  }, [postStudents, studentsFeed]);

  const filteredStudents = useMemo(() => {
    return mergedFeed.filter((student) => {
      // Apply filter
      const matchesFilter = selectedFilter === "Everyone" || 
        (selectedFilter === "Classmate" && student.isMyTeacher);
      
      // Apply search
      const matchesSearch = searchQuery === "" || 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.lesson?.title?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });
  }, [searchQuery, selectedFilter, mergedFeed]);

  // Toggle student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Navigate to student watch page
  const goToWatch = (student: Student) => {
    router.push({
      pathname: "/StudentScreen/StudentCommunity/community-page",
      params: { studentId: student.id },
    });
  };

  // Clear all selected students
  const clearSelection = () => setSelectedStudents([]);

  // Header Component (avatar reflects real user or initials; clicking opens your profile menu)
  const Header = () => (
    <View className="flex-row top-2 justify-between items-center mt-4 mb-3 w-full px-5">
      <TouchableOpacity
        className="flex-row items-center"
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Image
          source={require("../../../assets/Speaksy.png")}
          className="w-12 h-12 -ml-2 right-1"
          resizeMode="contain"
        />
        <Text className="text-white right-4 font-bold text-2xl ml-2">
          Voclaria
        </Text>
      </TouchableOpacity>

      <View className="flex-row items-center space-x-2">
        <TouchableOpacity
          className="p-2 bg-white/10 rounded-full"
          onPress={() => handleIconPress("chatbot")}
          activeOpacity={0.7}
        >
          <Image
            source={require("../../../assets/chatbot.png")}
            className="w-5 h-5"
            resizeMode="contain"
            tintColor="white"
          />
        </TouchableOpacity>
        <TouchableOpacity
          className="p-2 bg-white/10 rounded-full"
          onPress={() => handleIconPress("notifications")}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={20} color="white" />
        </TouchableOpacity>

        {/* Avatar: photo if available (signed URL), else initials */}
        <TouchableOpacity onPress={() => setIsProfileMenuVisible(true)} activeOpacity={0.7}>
          <View className="w-8 h-8 rounded-full border border-white/20 overflow-hidden items-center justify-center">
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                className="w-8 h-8"
                onError={() => setAvatarUri(null)}
              />
            ) : (
              <View className="w-8 h-8 bg-violet-600 items-center justify-center">
                <Text className="text-white text-xs font-bold">{initials || "U"}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Profile menu component (wired to Supabase profile)
  const ProfileMenu = () => (
    <ProfileMenuNew
      visible={isProfileMenuVisible}
      onDismiss={() => setIsProfileMenuVisible(false)}
      user={{
        name: fullName || "Student",
        email: userEmail || "",
        image: ({ uri: avatarUri || TRANSPARENT_PNG } as unknown) as ImageSourcePropType,
      }}
    />
  );

  return (
    <View className="flex-1 bg-[#0F172A]">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <BackgroundDecor />

      {/* Selection Modals */}
      <LivesessionCommunityModal
        visible={showCommunityModal}
        onDismiss={() => setShowCommunityModal(false)}
        onSelectOption={handleOptionSelect}
      />

      <LevelSelectionModal
        visible={showSelectionModal}
        onDismiss={() => setShowSelectionModal(false)}
        onSelectLevel={(level: "Basic" | "Advanced") => {
          setShowSelectionModal(false);
          const route = level === "Basic" ? "/basic-exercise-reading" : "/advance-execise-reading";
          router.push(route);
        }}
      />

      <SafeAreaView className="flex-1 z-10">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 80, maxWidth: 600, width: "100%", alignSelf: "center" }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-1">
            {/* Header */}
            <Header />

            {/* Page Title */}
            <View className="px-4 mb-3">
              <Text className="text-white text-2xl font-bold">Student Speech Practice</Text>
              <Text className="text-indigo-300 text-sm">Watch and learn from peers</Text>
            </View>

            {/* Search and Filter Row */}
            <View className="flex-row items-center space-x-3 px-4 mb-4">
              {/* Search Bar */}
              <View className="relative flex-1">
                <TextInput
                  className="bg-white/10 text-white rounded-xl pl-10 pr-8 py-2.5 text-sm"
                  placeholder="Search by name or title..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <Ionicons 
                  name="search" 
                  size={16} 
                  color="#94a3b8" 
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: 12,
                  }} 
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 12,
                    }}
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
                        setSelectedFilter("Classmate");
                        setShowFilterDropdown(false);
                      }}
                    >
                      <Text className="text-white text-sm">Classmate</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Selection Info */}
            {selectedStudents.length > 0 && (
              <View className="mx-4 mb-3 bg-indigo-500/30 rounded-xl p-2 flex-row justify-between items-center border border-indigo-500/30">
                <Text className="text-white font-medium">{selectedStudents.length} selected</Text>
                <TouchableOpacity onPress={clearSelection}>
                  <Text className="text-indigo-300">Clear</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Students List (STATIC + dynamic posts; UI unchanged) */}
            <View className="px-4">
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
                    activeOpacity={0.9}
                    className={`rounded-2xl overflow-hidden mb-4 border border-white/10 bg-white/5 backdrop-blur-sm ${
                      selectedStudents.includes(student.id) ? "border-indigo-500/50" : ""
                    }`}
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
                                    style={{
                                      width: `${(student.lesson?.progress || 0) * 100}%`,
                                    }}
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

                      {/* keep original lastPractice label */}
                      <View className="mt-2">
                        <Text className="text-gray-400 text-xs">{student.lastPractice}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
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
