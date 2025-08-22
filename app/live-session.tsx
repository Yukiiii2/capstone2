import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import ProfileMenuNew from "../components/ProfileMenuNew";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams, usePathname } from "expo-router";
import { BlurView } from "expo-blur";
import LevelSelectionModal from "../components/LevelSelectionModal";
import LivesessionCommunityModal from "../components/LivesessionCommunityModal";

const TABS = ["Home", "Speaking", "Reading", "Community"] as const;
type TabType = (typeof TABS)[number];

const TAB_ICONS: Record<TabType, keyof typeof Ionicons.glyphMap> = {
  Home: "home-outline",
  Speaking: "mic-outline",
  Reading: "book-outline",
  Community: "people-outline",
};

// Bottom Navigation Component
interface BottomNavProps {
  onNavigate: (tab: TabType) => void;
  currentPath: string;
  setShowLevelModal: (show: boolean) => void;
}

function BottomNav({
  onNavigate,
  currentPath,
  setShowLevelModal,
}: BottomNavProps) {
  const navItems = [
    {
      icon: "home-outline",
      label: "Home",
      route: "home-page",
      onPress: () => onNavigate("Home" as TabType),
    },
    {
      icon: "mic-outline",
      label: "Speaking",
      route: "exercise-speaking",
      onPress: () => onNavigate("Speaking" as TabType),
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
      route: "community-selection",
      onPress: () => onNavigate("Community" as TabType),
    },
  ];

  // Get active tab based on current path
  const getActiveTab = (path: string): string => {
    if (path.includes("home-page")) return "Home";
    if (
      path.includes("exercise-speaking") ||
      path.includes("basic-contents") ||
      path.includes("advanced-contents")
    )
      return "Speaking";
    if (
      path.includes("exercise-reading") ||
      path.includes("basic-exercise-reading") ||
      path.includes("advance-execise-reading")
    )
      return "Reading";
    if (path.includes("community-selection") || path.includes("community"))
      return "Community";
    return "Community"; // Default to Community tab
  };

  const activeTab = getActiveTab(currentPath);

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-[#0F172A]/90 backdrop-blur-lg rounded-t-3xl">
      <View className="flex-row justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.label;
          return (
            <TouchableOpacity
              key={item.route}
              className="items-center py-2 px-1 rounded-xl"
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
}

const { width, height } = Dimensions.get("window");

export default function LiveSession() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const pathname = usePathname?.() || "";
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Get parameters with type safety
  const getParam = (key: string, defaultValue: string = ""): string => {
    const value = params[key];
    if (Array.isArray(value)) return value[0] || defaultValue;
    return value || defaultValue;
  };

  // Session data with fallbacks
  const sessionData = {
    id: getParam("id", "1"),
    title: getParam("title", "Public Speaking Practice"),
    name: getParam("name", "Professional Coach"),
    viewers: getParam("viewers", "0"),
  };

  const handleNavigation = (page: string) => {
    router.push(page);
  };

  const handleReaction = (reaction: string) => {
    setActiveReaction(reaction === activeReaction ? null : reaction);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  useEffect(() => {
    if (isProfileMenuVisible) {
      Animated.parallel([
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
      ]).start();
    } else {
      Animated.parallel([
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
      ]).start();
    }
  }, [isProfileMenuVisible]);

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") router.replace("/login-page");
  };

  const handleCommunitySelect = (option: 'Live Session' | 'Community Post') => {
    setShowCommunityModal(false);
    if (option === 'Live Session') {
      router.push('/live-sessions-select');
    } else if (option === 'Community Post') {
      router.push('/community-selection');
    }
  };

  // Background Decorations
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

  const handleTabPress = (tab: TabType) => {
    if (tab === "Community") {
      setShowCommunityModal(true);
      return;
    }
    const routes: Record<TabType, string> = {
      Home: "/home-page",
      Speaking: "/exercise-speaking",
      Reading: "/exercise-reading",
      Community: "/community-selection",
    };

    if (routes[tab]) {
      router.push(routes[tab]);
    }
  };

  return (
    <View className="flex-1 bg-[#0F172A]">
      <BackgroundDecor />
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 pt-4">
{/* Header */}
        <View className="flex-row top-1 justify-between items-center px-4 py-3">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Image
              source={require("../assets/Speaksy.png")}
              className="w-12 h-12 rounded-full right-8"
              resizeMode="contain"
            />
            <Text className="text-white font-bold text-2xl ml-2 -left-11">
              Voclaria
            </Text>
          </TouchableOpacity>
  
          <View className="flex-row items-center -right-7 space-x-2">
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
                  source={{
                    uri: "https://randomuser.me/api/portraits/women/44.jpg"
                  }}
                  className="w-8 h-8 rounded-full"
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

            {/* Main Content */}
            <View className="mt-2 mb-4">
              {/* Host Card */}
              <View className="flex-row items-center right-3 mb-4">
                <View className="w-14 h-14 rounded-full bg-white/20 justify-center items-center mr-4">
                  <Text className="text-white font-bold text-lg">MC</Text>
                </View>
                <View className="flex-1 flex-row justify-between items-center">
                  <View>
                    <Text className="text-white font-bold text-xl">
                      Michael Chen
                    </Text>
                    <Text className="text-violet-300 text-base">Student</Text>
                  </View>
                  <View className="flex-row items-center -right-2">
                    <Ionicons name="star" size={18} color="white" />
                    <Text className="text-white text-xl font-medium ml-1">
                      4.9
                    </Text>
                  </View>
                </View>
              </View>

              {/* Video Container */}
              <View className="mb-4 -mx-4">
                <View className="border-2 border-white/30 rounded-2xl overflow-hidden">
                  <TouchableOpacity
                    activeOpacity={1}
                    className="w-full aspect-[4/3] bg-black"
                    onPress={toggleControls}
                  >
                    <Image
                      source={{
                        uri: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80",
                      }}
                      className="absolute w-full h-full"
                      resizeMode="cover"
                    />

                    {/* Live Badge */}
                    <View className="absolute top-3 left-3 bg-black/50 px-3 py-1 rounded-full flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                      <Text className="text-white text-xs font-bold">LIVE</Text>
                    </View>

                    {/* Viewers Count */}
                    <View className="absolute top-3 right-3 bg-black/50 px-3 py-1 rounded-full flex-row items-center">
                      <Ionicons name="people" size={14} color="white" />
                      <Text className="text-white text-xs font-medium ml-1.5">
                        {sessionData.viewers}
                      </Text>
                    </View>

                    {/* Video Controls */}
                    {showControls && (
                      <View className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <View className="w-full h-1.5 bg-gray-500/50 rounded-full mb-3">
                          <View className="h-1.5 bg-white w-3/4 rounded-full" />
                        </View>
                        <View className="flex-row justify-between items-center px-1">
                          <View className="flex-row items-center space-x-4">
                            <TouchableOpacity onPress={togglePlayPause}>
                              <Ionicons
                                name={isPlaying ? "pause" : "play"}
                                size={24}
                                color="white"
                              />
                            </TouchableOpacity>
                            <Text className="text-white text-sm">
                              12:45 / 45:00
                            </Text>
                          </View>
                          <View className="flex-row items-center space-x-4">
                            <Ionicons
                              name="volume-high"
                              size={20}
                              color="white"
                            />
                            <Ionicons name="expand" size={20} color="white" />
                          </View>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Reactions Below Video */}
                <View className="flex-row justify-center items-center mt-4 space-x-6">
                  <TouchableOpacity
                    className="flex-row items-center rounded-full px-6 py-2.5 bg-white/5"
                    onPress={() => handleReaction("heart")}
                  >
                    <Ionicons
                      name="heart"
                      size={26}
                      color={activeReaction === "heart" ? "#EC4899" : "white"}
                    />
                    <Text
                      className={`font-medium text-base ml-2 ${activeReaction === "heart" ? "text-pink-400" : "text-white"}`}
                    >
                      {activeReaction === "heart" ? "25" : "24"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center rounded-full px-6 py-2.5 bg-white/5"
                    onPress={() => handleReaction("wow")}
                  >
                    <Ionicons
                      name="happy-outline"
                      size={26}
                      color={activeReaction === "wow" ? "#F59E0B" : "white"}
                    />
                    <Text
                      className={`font-medium text-base ml-2 ${activeReaction === "wow" ? "text-yellow-400" : "text-white"}`}
                    >
                      {activeReaction === "wow" ? "18" : "17"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center rounded-full px-6 py-2.5 bg-white/5"
                    onPress={() => handleReaction("like")}
                  >
                    <Ionicons
                      name="thumbs-up"
                      size={26}
                      color={activeReaction === "like" ? "#3B82F6" : "white"}
                    />
                    <Text
                      className={`font-medium text-base ml-2 ${activeReaction === "like" ? "text-blue-400" : "text-white"}`}
                    >
                      {activeReaction === "like" ? "33" : "32"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Session Details */}
              <View className="max-w-md w-full self-center">
                {/* Session Title */}
                <Text className="text-white text-2xl font-bold mb-6 leading-tight">
                  {sessionData.title}
                </Text>

                {/* Session Tags */}
                <View className="flex-row flex-wrap gap-2 mb-8">
                  <View className="bg-white/30 px-3 py-1.5 rounded-full">
                    <Text className="text-white text-xs font-medium">
                      Public Speaking
                    </Text>
                  </View>
                  <View className="bg-white/30 px-3 py-1.5 rounded-full">
                    <Text className="text-white text-xs font-medium">
                      Confidence Building
                    </Text>
                  </View>
                  <View className="bg-white/30 px-3 py-1.5 rounded-full">
                    <Text className="text-white text-xs font-medium">
                      45 minutes
                    </Text>
                  </View>
                </View>

                {/* Session Description */}
                <View className="mb-4">
                  <Text className="text-white text-2xl font-semibold left-2 mb-2">
                    ADVISORY
                  </Text>
                  <Text className="text-gray-300 text-base leading-relaxed bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-xl">
                    This is a live public speaking practice session where
                    students can observe and learn presentation techniques.
                    Support speakers with positive reactions to create an
                    encouraging environment.
                  </Text>
                </View>

                {/* CTA Button */}
                <View className="max-w-md w-full self-center">
                  <TouchableOpacity
                    className="bg-violet-600/80 border border-white/20 rounded-xl py-3 px-6 flex-row justify-center items-center mb-4"
                    onPress={() => handleNavigation("/live-sessions")}
                  >
                    <Text className="text-white font-bold text-base mr-2">
                      Explore More Sessions
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View className="absolute bottom-0 left-0 right-0 z-10">
          <BottomNav
            onNavigate={handleTabPress}
            currentPath={pathname}
            setShowLevelModal={setShowLevelModal}
          />
        </View>

        {/* Profile Menu */}
        <ProfileMenuNew
          visible={isProfileOpen}
          onDismiss={() => setIsProfileOpen(false)}
          user={{
            name: "Sarah Johnson",
            email: "sarah@gmail.com",
            image: { uri: "https://randomuser.me/api/portraits/women/44.jpg" },
          }}
        />
        <LivesessionCommunityModal
          visible={showCommunityModal}
          onDismiss={() => setShowCommunityModal(false)}
          onSelectOption={handleCommunitySelect}
        />

        {/* Level Selection Modal */}
        <LevelSelectionModal
          visible={showLevelModal}
          onDismiss={() => setShowLevelModal(false)}
          onSelectLevel={(level) => {
            setShowLevelModal(false);
            if (level === "Basic") {
              router.push("/basic-exercise-reading");
            } else {
              router.push("/advance-exercise-reading");
            }
          }}
        />
      </View>
    </View>
  );
}
