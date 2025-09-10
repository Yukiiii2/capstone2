import NavigationBar from "../../../components/NavigationBar/nav-bar";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import ProfileMenuNew from "@/components/ProfileModal/ProfileMenuNew";
import LevelSelectionModal from "../../../components/StudentModal/LevelSelectionModal";
import LivesessionCommunityModal from "../../../components/StudentModal/LivesessionCommunityModal";

// 🔧 Added: Supabase client (functionality only; no UI changes)
import { supabase } from "@/lib/supabaseClient";

// ===== CONSTANTS & TYPES =====
const PROFILE_PIC = { uri: "https://randomuser.me/api/portraits/women/44.jpg" };

type ModuleType = {
  key: string;
  label: string;
  title: string;
  desc: string;
  progress: number;
  color: string;
  navigateTo: string;
  isActive?: boolean;
};

// Progress set to ZERO as requested
const MODULES: ModuleType[] = [
  {
    key: "CriticalAnalysis",
    label: "ADVANCE",
    title: "Critical Analysis & Interpretation",
    desc: "Develop advanced analytical skills for complex texts, literary criticism, and argumentative analysis.",
    progress: 0,
    color: "#a78bfa",
    navigateTo: "StudentScreen/ReadingExercise/student-voice-reading-recording",
  },
  {
    key: "AcademicResearch",
    label: "ADVANCE",
    title: "Academic Research Reading",
    desc: "Navigate complex academic papers, research methodologies, and scholarly discourse effectively.",
    progress: 0,
    color: "#a78bfa",
    navigateTo: "StudentScreen/ReadingExercise/student-voice-reading-recording",
  },
  {
    key: "LiteraryAnalysis",
    label: "ADVANCE",
    title: "Literary Analysis Deep Dive",
    desc: "Explore advanced literary techniques, symbolism, and thematic analysis across genres.",
    progress: 0,
    color: "#a78bfa",
    navigateTo: "StudentScreen/ReadingExercise/student-voice-reading-recording",
  },
];

// ===== MAIN COMPONENT =====
const HomeScreen = () => {
  // ===== HOOKS =====
  const router = useRouter();
  const pathname = usePathname();

  // ===== STATE =====
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<"Basic" | "Advanced">("Advanced");

  // 🔧 Added: Real profile wiring (no layout changes)
  const [fullName, setFullName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // ===== REFS =====
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // ===== NAVIGATION HANDLERS =====
  const navigateToModule = (moduleKey: string, navigateTo: string) => {
    setSelectedModule(moduleKey);
    // Always pass module=advance when navigating to the recording screen
    if (navigateTo === "StudentScreen/ReadingExercise/student-voice-reading-recording") {
      router.push("StudentScreen/ReadingExercise/student-voice-reading-recording?module=advance");
    } else {
      router.push(navigateTo);
    }
  };

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") {
      router.replace("/login-page");
    } else if (iconName === "chatbot") {
      router.push("/ButtonIcon/chatbot");
    } else if (iconName === "notifications") {
      router.push("/ButtonIcon/notification");
    }
  };

  const handleCommunitySelect = (option: 'Live Session' | 'Community Post') => {
    setShowCommunityModal(false);
    if (option === 'Live Session') {
      router.push('/live-sessions-select');
    } else if (option === 'Community Post') {
      router.push('/community-selection');
    }
  };

  // Handle level selection
  const handleLevelSelect = useCallback(
    (level: "Basic" | "Advanced") => {
      setSelectedLevel(level);
      setShowLevelModal(false);
      if (level === "Advanced") {
        router.push("/advance-execise-reading");
      } else if (level === "Basic") {
        router.push("/basic-exercise-reading");
      }
    },
    [router]
  );

  // ===== ANIMATION EFFECTS =====
  useEffect(() => {
    const animations = isProfileMenuVisible
      ? [
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]
      : [
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ];

    Animated.parallel(animations).start();
  }, [isProfileMenuVisible, slideAnim, opacityAnim]);

  // 🔧 Added: Load Supabase user + signed private avatar (no UI changes)
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user || !mounted) return;

      setUserEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      const nameValue =
        (profile?.name ?? user.user_metadata?.full_name ?? user.email ?? "").trim();
      if (!mounted) return;
      setFullName(nameValue);

      const resolveSigned = async (): Promise<string | null> => {
        const stored = profile?.avatar_url?.toString() || user.id;
        const normalized = stored.replace(/^avatars\//, "");
        let objectPath: string | null = null;

        if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
          objectPath = normalized;
        } else {
          const { data: list, error: listErr } = await supabase.storage
            .from("avatars")
            .list(normalized, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
          if (listErr) return null;
          if (list && list.length > 0) objectPath = `${normalized}/${list[0].name}`;
        }

        if (!objectPath) return null;

        const { data: signed, error: signErr } = await supabase.storage
          .from("avatars")
          .createSignedUrl(objectPath, 60 * 60);
        if (signErr) return null;
        return signed?.signedUrl ?? null;
      };

      try {
        const url = await resolveSigned();
        if (!mounted) return;
        setAvatarUri(url);
      } catch {
        if (!mounted) return;
        setAvatarUri(null);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // ===== UTILITY FUNCTIONS =====
  const getProgressStatus = (progress: number) =>
    progress < 0.3
      ? "Getting Started"
      : progress < 0.7
        ? "In Progress"
        : "Almost There";

  // ===== SUB-COMPONENTS =====

  // Background decorator component (unchanged)
  const BackgroundDecor = () => (
      <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
        <View className="absolute left-0 right-0 top-0 bottom-0">
          <LinearGradient
            colors={["#0F172A", "#1E293B", "#0F172A"]}
            className="flex-1"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
        <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
        <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
        <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
        <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
        <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
      </View>
    );

  // Module card component (unchanged UI)
  const ModuleCard = ({ mod }: { mod: ModuleType }) => (
    <View className="bg-white/5 backdrop-blur-lg border border-white/30 rounded-2xl p-6 mb-4 w-full shadow-lg shadow-violet-900/20">
      <View className="mb-4">
        <Text className="text-violet-300 font-bold text-xs tracking-wider uppercase mb-1 -mt-2">
          {mod.label}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-white font-bold text-lg flex-1">
            {mod.title}
          </Text>
          <View className="bg-violet-500/10 px-3 py-1.5 rounded-full ml-3 -mt-10">
            <Text className="text-violet-300 text-xs font-medium">
              {Math.round(mod.progress * 100)}%
            </Text>
          </View>
        </View>
      </View>

      <Text className="text-white/80 text-sm leading-6 mb-5">{mod.desc}</Text>

      <View className="mb-5">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white/80 text-xs">Module Progress</Text>
          <Text className="text-violet-300 text-xs font-medium">
            {getProgressStatus(mod.progress)}
          </Text>
        </View>
        <View className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full bg-[#a78bfa]"
            style={{ width: `${mod.progress * 100}%` }}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={() => navigateToModule(mod.key, mod.navigateTo)}
        className="py-3.5 rounded-xl bg-violet-500/70 active:bg-violet-500/80 border border-violet-400/30"
        activeOpacity={0.7}
      >
        <Text className="font-semibold text-center text-base text-white">
          Start Module
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Header Component (unchanged layout; avatar now dynamic)
  const Header = () => (
    <View className="flex-row justify-between items-center mt-4 mb-3 w-full">
      <TouchableOpacity 
        className="flex-row items-center"
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Image
          source={require("../../../assets/Speaksy.png")}
          className="w-12 h-12 rounded-full right-2"
          resizeMode="contain"
        />
        <Text className="text-white font-bold text-2xl ml-2 -left-5">
          Voclaria
        </Text>
      </TouchableOpacity>

      <View className="flex-row items-center -right-1 space-x-3">
        <TouchableOpacity
          className="p-2 bg-white/10 rounded-full"
          onPress={() => handleIconPress("chatbot")}
          activeOpacity={0.7}
        >
          <View className="w-6 h-6 items-center justify-center">
            <Image
              source={require("../../../assets/chatbot.png")}
              className="w-5 h-5"
              resizeMode="contain"
              tintColor="white"
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          className="p-2 bg-white/10 rounded-full"
          onPress={() => handleIconPress("notifications")}
          activeOpacity={0.7}
        >
          <View className="w-6 h-6 items-center justify-center">
            <Ionicons name="notifications-outline" size={20} color="white" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          className="p-1"
          onPress={() => setIsProfileMenuVisible(true)}
          activeOpacity={0.7}
        >
          <View className="p-0.5 bg-white/10 rounded-full">
            <Image
              // 👇 dynamic avatar; styling/placement unchanged
              source={avatarUri ? { uri: avatarUri } : PROFILE_PIC}
              className="w-8 h-8 rounded-full"
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Live practice section component (unchanged)
  const LivePracticeSection = () => (
    <View className="mb-8 w-full">
      <Text className="text-white text-2xl font-bold mb-2">
      Advance Reading Practice Modules
      </Text>
      <Text className="text-gray-300 text-xs leading-5 text-justify">
      Enhance your reading skills through interactive
      </Text>
      <Text className="text-gray-300 text-xs leading-5 text-justify">
      modules and comprehensive exercises
      </Text>
    </View>
  );


  return (
    <View className="flex-1 bg-[#0F172A] relative">
      <BackgroundDecor />

      {/* Profile Menu (wired to Supabase user; layout unchanged) */}
      <ProfileMenuNew
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        user={{
          name: fullName || "Student",
          email: userEmail || "",
          image: avatarUri ? { uri: avatarUri } : PROFILE_PIC,
        }}
      />
      <LivesessionCommunityModal
        visible={showCommunityModal}
        onDismiss={() => setShowCommunityModal(false)}
        onSelectOption={handleCommunitySelect}
      />
      <LevelSelectionModal
        visible={showLevelModal}
        onDismiss={() => setShowLevelModal(false)}
        onSelectLevel={handleLevelSelect}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        <View className="flex-1 items-center p-5 w-full max-w-md mx-auto" style={{ paddingBottom: 0 }}>
          <Header />
          <LivePracticeSection />

          <View className="w-full -top-5">
            <Text className="text-white text-xl font-bold mb-4">
              Start Learning
            </Text>
            {MODULES.map((mod) => (
              <ModuleCard
                key={mod.key}
                mod={{ ...mod, isActive: selectedModule === mod.key }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
      <NavigationBar defaultActiveTab="Reading" />
    </View>
  );
};

export default React.memo(HomeScreen);
