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
import ProfileMenuNew from "../components/ProfileMenuNew";
import LevelSelectionModal from "../components/LevelSelectionModal";
import LivesessionCommunityModal from "../components/LivesessionCommunityModal";

// ===== CONSTANTS & TYPES =====
const PROFILE_PIC = { uri: "https://randomuser.me/api/portraits/women/44.jpg" };

const MODULES: ModuleType[] = [
  {
    key: "CriticalAnalysis",
    label: "ADVANCE",
    title: "Critical Analysis & Interpretation",
    desc: "Develop advanced analytical skills for complex texts, literary criticism, and argumentative analysis.",
    progress: 72 / 100,
    color: "#a78bfa",
    navigateTo: "/student-voice-reading-recording",
  },
  {
    key: "AcademicResearch",
    label: "ADVANCE",
    title: "Academic Research Reading",
    desc: "Navigate complex academic papers, research methodologies, and scholarly discourse effectively.",
    progress: 55 / 100,
    color: "#a78bfa",
    navigateTo: "/student-voice-reading-recording",
  },
  {
    key: "LiteraryAnalysis",
    label: "ADVANCE",
    title: "Literary Analysis Deep Dive",
    desc: "Explore advanced literary techniques, symbolism, and thematic analysis across genres.",
    progress: 40 / 100,
    color: "#a78bfa",
    navigateTo: "/student-voice-reading-recording",
  },
];

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

  // ===== REFS =====
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // ===== NAVIGATION HANDLERS =====
  const navigateToModule = (moduleKey: string, navigateTo: string) => {
    setSelectedModule(moduleKey);
    router.push(navigateTo);
  };

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") {
      router.replace("/login-page");
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
  }, [isProfileMenuVisible]);

  // ===== UTILITY FUNCTIONS =====
  const getProgressStatus = (progress: number) =>
    progress < 0.3
      ? "Getting Started"
      : progress < 0.7
        ? "In Progress"
        : "Almost There";

  // ===== SUB-COMPONENTS =====

  // Background decorator component
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

  // Module card component
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

  // Header Component
  const Header = () => (
    <View className="flex-row justify-between items-center mt-4 mb-3 w-full">
      <TouchableOpacity 
        className="flex-row items-center"
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Image
          source={require("../assets/Speaksy.png")}
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
              source={require("../assets/chatbot.png")}
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
              source={PROFILE_PIC}
              className="w-8 h-8 rounded-full"
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Live practice section component
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

  // Bottom navigation component
  const BottomNav = () => {
    const navItems = [
      {
        icon: "home-outline",
        label: "Home",
        route: "home-page",
        onPress: () => router.push("/home-page"),
      },
      {
        icon: "mic-outline",
        label: "Speaking",
        route: "exercise-speaking",
        onPress: () => router.push("/exercise-speaking"),
      },
      {
        icon: "book-outline",
        label: "Reading",
        route: "exercise-reading",
        onPress: () => setShowLevelModal(true),
      },
      {
        icon: "people-outline",
        label: "Community",
        route: "community",
        onPress: () => setShowCommunityModal(true),
      },
    ];

    return (
      <View className="absolute bottom-0 left-0 right-0 bg-[#0F172A]/90 backdrop-blur-lg rounded-t-3xl">
        <View className="flex-row justify-around items-center py-2">
          {navItems.map((item) => {
            const isActive = pathname.includes(item.route) || (item.route === 'exercise-reading' && pathname === '/advance-execise-reading');
            return (
              <TouchableOpacity
                key={item.route}
                className="items-center py-2 px-2 rounded-xl"
                style={{
                  backgroundColor: isActive
                    ? "rgba(255, 255, 255, 0.14)"
                    : "transparent",
                }}
                onPress={item.onPress}
              >
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={isActive ? "#A78BFA" : "rgb(255, 255, 255)"}
                />
                <Text
                  className="text-xs mt-1"
                  style={{ color: isActive ? "#A78BFA" : "rgb(255, 255, 255)" }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#0F172A] relative">
      <BackgroundDecor />

      {/* Profile Menu */}
      <ProfileMenuNew
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        user={{
          name: "Sarah Johnson",
          email: "sarah@gmail.com",
          image: PROFILE_PIC,
        }}
      />
      <LivesessionCommunityModal
        visible={showCommunityModal}
        onDismiss={() => setShowCommunityModal(false)}
        onSelectOption={handleCommunitySelect}
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
      <BottomNav />
    </View>
  );
};

export default React.memo(HomeScreen);