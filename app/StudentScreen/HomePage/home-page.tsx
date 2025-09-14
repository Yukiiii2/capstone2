// app/StudentScreen/HomePage/home-page.tsx
import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  Modal,
  Dimensions,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  PanResponder,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, usePathname, useFocusEffect } from "expo-router"; // ⬅️ added useFocusEffect
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LevelSelectionModal from "../../../components/StudentModal/LevelSelectionModal";
import ProfileMenu, { UserProfile } from "../../../components/ProfileModal/ProfileMenuNew";
import LivesessionCommunityModal from "../../../components/StudentModal/LivesessionCommunityModal";
import { useTransform } from "../../../hooks/useTransform";
import ModuleTrackingModal from "../../../components/StudentModal/ModuleTrackingModal";
import NavigationBar from "../../../components/NavigationBar/nav-bar";
import Svg, { Circle } from "react-native-svg";

// ⬇️ keep your project’s import style (same depth as assets)
import { supabase } from "@/lib/supabaseClient";

const TRANSPARENT_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

// ===== Constants =====
const TABS = ["Overview", "Speaking", "Reading", "Community"] as const;
const TAB_ICONS: Record<TabType, keyof typeof Ionicons.glyphMap> = {
  Overview: "home-outline",
  Speaking: "mic-outline",
  Reading: "book-outline",
  Community: "people-outline",
};
type TabType = (typeof TABS)[number];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function CircularProgress({
  size = 96,
  strokeWidth = 10,
  progress = 0, // 0..1
  color = "#a78bfa",
  trackColor = "rgba(255,255,255,0.15)",
  children,
}: {
  size?: number;
  strokeWidth?: number;
  progress?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animated = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress, animated]);

  const strokeDashoffset = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={trackColor}
          fill="none"
        />
        {/* progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="none"
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>

      {/* center content (the % text) */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
}

// 🔧 helper to resolve avatar signed URL (private bucket)
async function resolveSignedAvatar(userId: string, storedPath?: string | null) {
  const stored = (storedPath ?? userId).toString();
  const normalized = stored.replace(/^avatars\//, "");
  let objectPath: string | null = null;

  if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
    objectPath = normalized;
  } else {
    const { data: files, error: listErr } = await supabase.storage
      .from("avatars")
      .list(normalized, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
    if (listErr) return null;
    if (files && files.length > 0) objectPath = `${normalized}/${files[0].name}`;
  }

  if (!objectPath) return null;

  const { data: signed, error: signErr } = await supabase.storage
    .from("avatars")
    .createSignedUrl(objectPath, 60 * 60);
  if (signErr) return null;
  return signed?.signedUrl ?? null;
}

function HomePage() {
  // ===== Hooks =====
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const windowWidth = Dimensions.get("window").width;
  const { translateX: layoutTranslateX, resetTransform, setTransform } = useTransform();

  // State for class joining
  const [hasJoinedClass, setHasJoinedClass] = useState(false);
  const [showLiveSessionModal, setShowLiveSessionModal] = useState(false);

  const handleSignOut = () => {
    // Handle sign out logic here
    router.replace("/landing-page");
  };

  // ===== State =====
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);

  // Use layout transform instead of local transform
  const sidebarAnim = layoutTranslateX;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Handle sidebar width changes on layout
  const onSidebarLayout = useCallback(
    (event: any) => {
      const { width } = event.nativeEvent.layout;
      if (width > 0 && width !== sidebarWidth) setSidebarWidth(width);
    },
    [sidebarWidth]
  );

  // Optimized sidebar toggle to prevent scheduling conflicts
  const toggleSidebar = useCallback(() => {
    if (showSidebar) {
      setTransform(256);
      Animated.timing(overlayAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start(
        () => setShowSidebar(false)
      );
    } else {
      setShowSidebar(true);
      setTransform(0);
      Animated.timing(overlayAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
    }
  }, [showSidebar, setTransform, overlayAnim]);

  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleModalType, setModuleModalType] = useState<"completed" | "upcoming">("completed");
  const [moduleModalCategory, setModuleModalCategory] = useState<"speaking" | "reading">(
    "speaking"
  );

  // ⬇️ Start everything at ZERO
  const [moduleCounts, setModuleCounts] = useState({
    upcomingSpeaking: 0,
    completedSpeaking: 0,
    upcomingReading: 0,
    completedReading: 0,
  });

  const speakingProgress = React.useMemo(() => {
    const total = moduleCounts.completedSpeaking + moduleCounts.upcomingSpeaking;
    return total ? moduleCounts.completedSpeaking / total : 0; // 0..1
  }, [moduleCounts]);

  const readingProgress = React.useMemo(() => {
    const total = moduleCounts.completedReading + moduleCounts.upcomingReading;
    return total ? moduleCounts.completedReading / total : 0; // 0..1
  }, [moduleCounts]);

  // 🔢 Derived percents for display
  const speakingPercent = Math.round(speakingProgress * 100);
  const readingPercent = Math.round(readingProgress * 100);

  const [showReadingLevelModal, setShowReadingLevelModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);

  // ⬇️ Start confidence at ZERO
  const [stats, setStats] = useState({
    averageConfidence: 0,
  });

  // Simplified animation refs without scheduling conflicts
  const sheetY = useRef(new Animated.Value(0)).current;
  const sheetOpacity = useRef(new Animated.Value(1)).current;

  // ===== NEW: user/profile state (greeting + avatar) =====
  const [firstName, setFirstName] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [initials, setInitials] = useState<string>(""); // fallback avatar
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  // ---- mount: initial profile load (kept) ----
  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user || !mounted) return;

      setUserEmail(user.email ?? "");

      // profile: name + avatar_url
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      // Name → first name + initials
      const fullNameValue =
        (profile?.name ?? user.user_metadata?.full_name ?? user.email ?? "").trim();
      const parts = fullNameValue.split(/\s+/).filter(Boolean);
      const f = parts[0] ?? "";
      const inits = (parts[0]?.[0] ?? "").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();

      if (!mounted) return;
      setFullName(fullNameValue);
      setFirstName(f || "Student");
      setInitials(inits || (f[0]?.toUpperCase() ?? "S"));

      try {
        const url = await resolveSignedAvatar(user.id, profile?.avatar_url?.toString());
        if (!mounted) return;
        setAvatarUri(url);
      } catch {
        if (!mounted) return;
        setAvatarUri(null);
      }
    };

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  // ===== Navigation Handlers =====
  const handleIconPress = useCallback(
    (iconName: string) => {
      if (iconName === "log-out-outline") {
        router.replace("/login-page");
      } else if (iconName === "chatbot") {
        router.push("/ButtonIcon/chatbot");
      } else if (iconName === "notifications") {
        router.push("/ButtonIcon/notification");
      }
    },
    [router]
  );

  const navigateToTab = useCallback(
    (tab: TabType) => {
      const routes: Record<TabType, () => void> = {
        Overview: () => router.push("/StudentScreen/HomePage/home-page"),
        Speaking: () => router.push("/exercise-speaking"),
        Reading: () => setShowReadingLevelModal(true),
        Community: () => setShowCommunityModal(true),
      };
      routes[tab]();
    },
    [router]
  );

  const handleLevelSelect = useCallback(
    (level: "Basic" | "Advanced") => {
      setShowLevelModal(false);
      if (level === "Basic") {
        router.push("/basic-exercise-reading");
      } else {
        router.push("/advance-execise-reading");
      }
    },
    [router]
  );

  const handleReadingLevelSelect = useCallback(
    (level: "Basic" | "Advanced") => {
      setShowReadingLevelModal(false);
      if (level === "Basic") {
        router.push("/basic-exercise-reading");
      } else {
        router.push("/advance-execise-reading");
      }
    },
    [router]
  );

  // ===== Derived Values =====
  const getActiveTab = useCallback((): TabType => {
    if (pathname?.includes("home-page")) return "Overview";
    if (pathname?.includes("exercise-speaking")) return "Speaking";
    if (pathname?.includes("exercise-reading")) return "Reading";
    return "Overview";
  }, [pathname]);

  const activeTab = getActiveTab();

  // Add pan responder for swipe to close gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => showSidebar,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return showSidebar && Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 2);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (showSidebar && gestureState.dx > 0) {
          const newPosition = Math.min(gestureState.dx, sidebarWidth);
          sidebarAnim.setValue(newPosition);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (showSidebar) {
          if (gestureState.dx > 50 || gestureState.vx > 0.5) {
            setTransform(sidebarWidth);
            setShowSidebar(false);
            resetTransform();
          } else {
            resetTransform();
          }
        }
      },
    })
  ).current;

  // ====== COUNTERS: only unlocked count as "upcoming" ======
  const fetchCounts = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return;

    type Cat = "speaking" | "reading";

    const countFor = async (category: Cat) => {
      // pull active modules for this category
      const { data: mods } = await supabase
        .from("modules")
        .select("id, level, order_index, active")
        .eq("category", category)
        .eq("active", true);

      if (!mods || mods.length === 0) return { upcoming: 0, completed: 0 };

      // pull progress for this user in these modules
      const ids = mods.map((m: any) => m.id);
      const { data: prog } = await supabase
        .from("student_progress")
        .select("module_id, progress")
        .eq("student_id", uid)
        .in("module_id", ids);

      const pMap = new Map<string, number>();
      (prog ?? []).forEach((p: any) => pMap.set(p.module_id, p.progress ?? 0));

      // group by level (or 'default' if missing)
      const groups = new Map<string, any[]>();
      (mods as any[]).forEach((m) => {
        const key = (m.level ? String(m.level).toLowerCase() : "default") as string;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(m);
      });

      let completed = 0;
      let upcoming = 0;

      // evaluate each level-sequence independently
      for (const [, list] of groups) {
        list.sort((a, b) => {
          const ai = Number.isFinite(a.order_index) ? a.order_index : 0;
          const bi = Number.isFinite(b.order_index) ? b.order_index : 0;
          return ai - bi;
        });

        let previousCompleted = false;
        list.forEach((m, idx) => {
          const progress = pMap.get(m.id) ?? 0;
          const isCompleted = progress >= 100;

          // unlocked if first in sequence OR previous is completed
          const unlocked = idx === 0 ? true : previousCompleted;

          if (isCompleted) {
            completed += 1;
          } else {
            // upcoming only counts if progress==0 AND unlocked
            if (progress === 0 && unlocked) {
              upcoming += 1;
            }
          }

          previousCompleted = isCompleted;
        });
      }

      return { upcoming, completed };
    };

    const [s, r] = await Promise.all([countFor("speaking"), countFor("reading")]);

    setModuleCounts((prev) => ({
      ...prev,
      upcomingSpeaking: s.upcoming,
      completedSpeaking: s.completed,
      upcomingReading: r.upcoming,
      completedReading: r.completed,
    }));
  }, []);

  // refresh on screen focus (avatar + counts)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user || cancelled) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", user.id)
          .single();

        const fullNameValue =
          (profile?.name ?? user.user_metadata?.full_name ?? user.email ?? "").trim();
        if (cancelled) return;

        setFullName(fullNameValue);
        const f = fullNameValue.split(/\s+/)[0] ?? "Student";
        const inits =
          (fullNameValue.split(/\s+/)[0]?.[0] ?? "S").toUpperCase() +
          (fullNameValue.split(/\s+/)[1]?.[0] ?? "").toUpperCase();
        setFirstName(f);
        setInitials(inits || (f[0]?.toUpperCase() ?? "S"));

        const url = await resolveSignedAvatar(user.id, profile?.avatar_url?.toString());
        if (cancelled) return;
        setAvatarUri(url);

        await fetchCounts();
      })();

      return () => {
        cancelled = true;
      };
    }, [fetchCounts])
  );

  // realtime: recompute when this user's progress changes
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;

      channel = supabase
        .channel("rt-student-progress-home")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "student_progress",
            filter: `student_id=eq.${uid}`,
          },
          () => {
            fetchCounts();
          }
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchCounts]);

  // initial fetch so numbers show on very first mount
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // ===== UI Components =====

  // Sidebar Component
  const Sidebar = ({
    showSidebar,
    toggleSidebar,
    sidebarAnim,
    panResponder,
    router,
    setShowReadingLevelModal,
    setShowCommunityModal,
  }: {
    showSidebar: boolean;
    toggleSidebar: () => void;
    sidebarAnim: Animated.Value;
    panResponder: any;
    router: any;
    setShowReadingLevelModal: (show: boolean) => void;
    setShowCommunityModal: (show: boolean) => void;
  }) => (
    <Animated.View
      className="absolute right-0 top-0 bottom-0 w-64 bg-[#0F172A]/95 drop-shadow-xl rounded-3xl z-50"
      onLayout={onSidebarLayout}
      style={[
        {
          right: 0,
          top: 0,
          bottom: 0,
          width: sidebarWidth,
          position: "absolute",
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          borderRadius: 12,
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 4, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          transform: [{ translateX: sidebarAnim }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View className="p-5 pt-14">
        {/* Quick Actions Header */}
        <View className="flex-row items-center justify-between mb-8">
          <Text className="text-white font-bold text-2xl">Quick Actions</Text>
          <TouchableOpacity onPress={toggleSidebar}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Quick Action Items */}
        <TouchableOpacity
          className="py-3 px-2 border border-white/10  rounded-lg bg-white/5 mb-2"
          activeOpacity={0.7}
          onPress={() => {
            toggleSidebar();
            router.push("/exercise-speaking");
          }}
        >
          <View className="flex-row items-center">
            <Ionicons name="mic-outline" size={20} color="#FFFFFF" />
            <Text className="text-violet-500 ml-3 font-medium">SPEAKING EXERCISE</Text>
          </View>
          <Text className="text-gray-400 text-xs mt-1 ml-8">Practice Speaking with AI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="py-3 px-2 border border-white/10  rounded-lg bg-white/5 mb-2"
          activeOpacity={0.7}
          onPress={() => {
            toggleSidebar();
            setShowReadingLevelModal(true);
          }}
        >
          <View className="flex-row items-center">
            <Ionicons name="book-outline" size={20} color="#FFFFFF" />
            <Text className="text-violet-500 ml-3 font-medium">READING EXERCISES</Text>
          </View>
          <Text className="text-gray-400 text-xs mt-1 ml-8">Practice Reading with AI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="py-3 px-2 border border-white/10  rounded-lg bg-white/5 mb-2"
          activeOpacity={0.7}
          onPress={() => {
            toggleSidebar();
            setShowCommunityModal(true);
          }}
        >
          <View className="flex-row items-center">
            <Ionicons name="people-outline" size={20} color="#FFFFFF" />
            <Text className="text-violet-500 ml-3 font-medium">PEER REVIEW</Text>
          </View>
          <Text className="text-gray-400 text-xs mt-1 ml-8">Community Feedback</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="py-3 px-2 border border-white/10 rounded-lg bg-white/5"
          activeOpacity={0.7}
          onPress={() => {
            toggleSidebar();
            router.push("/live-sessions-select");
          }}
        >
          <View className="flex-row items-center">
            <Ionicons name="videocam-outline" size={20} color="#FFFFFF" />
            <Text className="text-violet-500 ml-3 font-medium">LIVE SESSION</Text>
          </View>
          <Text className="text-gray-400 text-xs mt-1 ml-8">Join sessions with peers</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Overlay Component - Optimized to prevent scheduling conflicts
  const Overlay = useCallback(
    () => (
      <Animated.View
        className="absolute inset-0 bg-black/50 z-40"
        style={{
          opacity: overlayAnim,
        }}
      >
        <Pressable className="flex-1" onPress={toggleSidebar} />
      </Animated.View>
    ),
    [overlayAnim, toggleSidebar]
  );

  // Welcome Text component - Memoized (uses Supabase first name)
  const WelcomeText = useCallback(
    () => (
      <View className="mt-2 top-1 mb-1">
        <Text className="text-white text-[28px] font-bold">
          {`Welcome back${firstName ? `, ${firstName}` : ""}!`}
        </Text>
      </View>
    ),
    [firstName]
  );

  // Header with dynamic avatar (signed URL) or initials fallback
  const Header = useCallback(
    () => (
      <View className="w-full">
        <View className="flex-row justify-between bottom-4 items-center">
          <View className="flex-row items-center">
            <Image
              source={require("../../../assets/Speaksy.png")}
              className="w-14 h-14 right-2 top-2 rounded-full"
              resizeMode="contain"
            />
            <Text className="text-white font-bold top-2 right-6 text-3xl ml-3">Voclaria</Text>
          </View>
          <View className="flex-row items-center top-2 space-x-2">
            <TouchableOpacity
              className="p-1.5 rounded-full bg-white/5 active:bg-white/10"
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
              className="p-1.5 rounded-full bg-white/5 active:bg-white/10"
              onPress={() => handleIconPress("notifications")}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              className="rounded-full active:opacity-80 bg-white/5 active:bg-white/10"
              onPress={() => setIsProfileMenuVisible(true)}
              activeOpacity={0.7}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.6)",
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: 32, height: 32 }} />
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
                  <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
                    {initials || "U"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ),
    [handleIconPress, setIsProfileMenuVisible, avatarUri, initials]
  );

  // Background decoration with gradient and floating elements - Memoized
  const BackgroundDecor = useCallback(
    () => (
      <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
        <View className="absolute left-0 right-0 top-0 bottom-0">
          <LinearGradient colors={["#0F172A", "#1E293B", "#0F172A"]} className="flex-1" />
        </View>
        <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
        <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
        <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
        <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
      </View>
    ),
    []
  );

  // Handle community option selection
  const handleCommunityOptionSelect = (option: "Live Session" | "Community Post") => {
    setShowCommunityModal(false);
    if (option === "Live Session") {
      router.push("/live-sessions-select");
    } else if (option === "Community Post") {
      router.push("/community-selection");
    }
  };

  // Handle join session
  const handleJoinSession = (sessionId: string) => {
    setShowLiveSessionModal(false);
    setHasJoinedClass(true);
    router.push(`/live-session/${sessionId}`);
  };

  // ===== Effects =====
  useEffect(() => {
    const animations = isProfileMenuVisible
      ? [
          Animated.spring(sheetY, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 0,
          }),
          Animated.timing(sheetOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
          }),
        ]
      : [
          Animated.timing(sheetY, {
            toValue: 300,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(sheetOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ];

    if (isProfileMenuVisible) {
      sheetY.setValue(300);
      sheetOpacity.setValue(0);
    }

    Animated.parallel(animations).start();
  }, [isProfileMenuVisible, sheetY, sheetOpacity]);

  // User data for ProfileMenu (now dynamic)
  const userProfile: UserProfile = {
    name: fullName || "Student",
    email: userEmail,
    image: { uri: avatarUri || TRANSPARENT_PNG },
  };

  // ...existing code...

  return (
    <View className="flex-1 bg-[#0F172A]">
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          showSidebar={showSidebar}
          toggleSidebar={toggleSidebar}
          sidebarAnim={sidebarAnim}
          panResponder={panResponder}
          router={router}
          setShowReadingLevelModal={setShowReadingLevelModal}
          setShowCommunityModal={setShowCommunityModal}
        />
      )}
      {showSidebar && <Overlay />}

      {/* Selection Modal */}
      <LivesessionCommunityModal
        visible={showCommunityModal}
        onDismiss={() => setShowCommunityModal(false)}
        onSelectOption={handleCommunityOptionSelect}
      />

      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <BackgroundDecor />

      {/* Profile Menu Modal */}
      <ProfileMenu
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        user={userProfile}
        onSignOut={handleSignOut}
        hasJoinedClass={hasJoinedClass}
        setHasJoinedClass={setHasJoinedClass}
        onLeaveClass={() => {
          setHasJoinedClass(false);
        }}
      />

      {/* Main Scrollable Content with Status Bar Area */}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 60,
          paddingTop: insets.top + 10,
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Section */}
        <View className="w-full px-4 pt-2">
          <Header />
          <WelcomeText />
        </View>

        {/* Page Content */}
        <View className="px-4">
          {/* Dashboard Section */}
          <View className="mb-6">
            <View className="bg-white/5 backdrop-blur-xl top-3 rounded-2xl p-4 border border-white/25 shadow-lg">
              {/* Track your progress header with menu icon */}
              <View className="flex-row justify-between items-center">
                <Text className="text-white text-xl font-semibold pl-2">
                  Track your progress
                </Text>
                <TouchableOpacity onPress={toggleSidebar} className="p-2" activeOpacity={0.7}>
                  <Ionicons name="menu" size={24} color="white" />
                </TouchableOpacity>
              </View>

              {/* Stats Cards Section - Compact Design */}
              <View className="flex-row gap-2.5 mb-3 h-20">
                {/* Upcoming Sessions Card */}
                <TouchableOpacity
                  className="top-1.5 bg-gradient-to-br from-violet-600/20 to-violet-900/20 backdrop-blur-sm rounded-lg p-2.5 flex-1 border border-white/10 shadow-md active:scale-[0.98] transition-all"
                  activeOpacity={0.85}
                  onPress={() => {
                    setModuleModalType("upcoming");
                    setModuleModalCategory("speaking");
                    setShowModuleModal(true);
                  }}
                >
                  <View className="flex-row items-center justify-between h-full">
                    <View className="p-1.5 bg-white/10 bottom-2 rounded-md">
                      <Ionicons name="calendar" size={16} color="#FFFFFF" />
                    </View>
                    <View className="items-end">
                      <Text className="text-white text-2xl font-bold">
                        {moduleCounts.upcomingSpeaking + moduleCounts.upcomingReading}
                      </Text>
                      <Text className="text-white text-[10px] top-2 font-medium mt-[-5px]">
                        SESSIONS
                      </Text>
                    </View>
                  </View>
                  <View className="absolute bottom-1.5 left-2.5 right-2.5 flex-row items-center justify-between">
                    <Text className="text-white/70 text-[10px] font-medium">Upcoming</Text>
                  </View>
                </TouchableOpacity>

                {/* Completed Modules Card */}
                <TouchableOpacity
                  className="top-1.5 bg-gradient-to-br from-violet-600/20 to-violet-900/20 backdrop-blur-sm rounded-lg p-2.5 flex-1 border border-white/10 shadow-md active:scale-[0.98] transition-all"
                  activeOpacity={0.85}
                  onPress={() => {
                    setModuleModalType("completed");
                    setModuleModalCategory("speaking");
                    setShowModuleModal(true);
                  }}
                >
                  <View className="flex-row items-center justify-between h-full">
                    <View className="p-1.5 bg-white/10 bottom-2 rounded-md">
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                    <View className="items-end">
                      <Text className="text-white text-2xl font-bold">
                        {moduleCounts.completedSpeaking + moduleCounts.completedReading}
                      </Text>
                      <Text className="text-white text-[10px] top-2 font-medium mt-[-5px]">
                        MODULES
                      </Text>
                    </View>
                  </View>
                  <View className="absolute bottom-1.5 left-2.5 right-2.5 flex-row items-center justify-between">
                    <Text className="text-white/70 text-[10px] font-medium">Completed</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Text className="text-white text-xl font-semibold text-start top-1">
                Speaking Skills
              </Text>

              {/* Speaking Results Section */}
              <View className="bg-white/5 top-3 backdrop-blur-xl rounded-xl p-4 mb-5 border border-white/20 shadow-lg shadow-violet-900/20">
                <View className="flex-row items-center justify-between">
                  {/* Progress Circle */}
                  <View className="items-center justify-center">
                    <CircularProgress size={96} strokeWidth={10} progress={speakingProgress}>
                      <Text className="text-white text-2xl font-bold">{`${speakingPercent}%`}</Text>
                      <Text className="text-violet-200 text-[10px] mt-[-2px]">Score</Text>
                    </CircularProgress>
                  </View>

                  {/* Performance Stats */}
                  <View className="flex-1 ml-4">
                    <View className="mb-4">
                      <Text className="text-violet-300 text-xs font-medium mb-1">
                        Overall Performance
                      </Text>
                      <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <View
                          className="bg-gradient-to-r from-violet-500 to-violet-400 rounded-full h-2"
                          style={{ width: `${speakingPercent}%` }}
                        />
                      </View>
                    </View>
                    <View className="flex-row items-center px-3 py-1.5 self-start">
                      <View className="w-7 h-7 bg-violet-500 right-3 rounded-full items-center justify-center mr-2">
                        <Ionicons name="checkmark" size={20} color="white" />
                      </View>
                      <Text className="text-white/90 text-lg right-3 font-medium">
                        Confident Level
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Reading Results Section */}
              <Text className="text-white text-xl font-semibold text-start mt-1">
                Reading Skills
              </Text>
              <View className="bg-white/5 top-3 backdrop-blur-xl rounded-xl p-4 mb-5 border border-white/20 shadow-lg shadow-violet-900/20">
                <View className="flex-row items-center justify-between">
                  {/* Progress Circle */}
                  <View className="items-center justify-center">
                    <CircularProgress size={96} strokeWidth={10} progress={readingProgress}>
                      <Text className="text-white text-2xl font-bold">{`${readingPercent}%`}</Text>
                      <Text className="text-violet-200 text-[10px] mt-[-2px]">Score</Text>
                    </CircularProgress>
                  </View>

                  {/* Performance Stats */}
                  <View className="flex-1 ml-4">
                    <View className="mb-4">
                      <Text className="text-violet-300 text-xs font-medium mb-1">
                        Overall Performance
                      </Text>
                      <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <View
                          className="bg-gradient-to-r from-violet-500 to-violet-400 rounded-full h-2"
                          style={{ width: `${readingPercent}%` }}
                        />
                      </View>
                    </View>
                    <View className="flex-row items-center px-3 py-1.5 self-start">
                      <View className="w-7 h-7 bg-violet-500 right-3 rounded-full items-center justify-center mr-2">
                        <Ionicons name="checkmark" size={20} color="white" />
                      </View>
                      <Text className="text-white/90 text-lg right-3 font-medium">
                        Confident Level
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Anxiety & Confidence Tracking Section */}
        <View className="mb-6 p-4">
          <Text className="text-xl font-bold text-white mb-3">Anxiety & Confidence Tracking</Text>
          <View className="bg-white/10 border border-white/20 rounded-2xl p-5">
            <View className="flex-row justify-between items-center mb-4">
              <View className="items-center flex-1">
                <Text className="text-white font-bold text-2xl">
                  {stats.averageConfidence}%
                </Text>
                <Text className="text-white/80 text-xs">Confidence Level</Text>
              </View>
              <View className="h-10 w-px bg-white/20" />
              <View className="items-center flex-1">
                <Text className="text-white font-bold text-2xl">
                  {100 - stats.averageConfidence}%
                </Text>
                <Text className="text-white/80 text-xs">Anxiety Level</Text>
              </View>
            </View>

            <View className="mt-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-white font-medium text-sm">
                  Confidence During Exercises
                </Text>
                <Text className="text-white/80 text-sm">{stats.averageConfidence}%</Text>
              </View>
              <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                <View
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${stats.averageConfidence}%` }}
                />
              </View>

              <View className="flex-row justify-between mt-4 mb-2">
                <Text className="text-white font-medium text-sm">Anxiety During Exercises</Text>
                <Text className="text-white/80 text-sm">
                  {100 - stats.averageConfidence}%
                </Text>
              </View>
              <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                <View
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${100 - stats.averageConfidence}%` }}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <NavigationBar />

      {/* Level Selection Modal */}
      <LevelSelectionModal
        visible={showLevelModal}
        onDismiss={() => setShowLevelModal(false)}
        onSelectLevel={handleLevelSelect}
      />

      {/* Module Tracking Modal */}
      <ModuleTrackingModal
        visible={showModuleModal}
        onClose={() => setShowModuleModal(false)}
        filterType={moduleModalType}
      />
    </View>
  );
}

export default HomePage;
