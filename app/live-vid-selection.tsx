import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import LevelSelectionModal from "../components/LevelSelectionModal";
import ProfileMenu from "../components/ProfileMenuNew";
import LivesessionCommunityModal from "../components/LivesessionCommunityModal";

// ===== Constants & Types =====
type TabType = "Home" | "Speaking" | "Reading" | "Community";

const TAB_CONFIG = {
  Home: { route: "/home-page", icon: "home-outline" },
  Speaking: { route: "/exercise-speaking", icon: "mic-outline" },
  Reading: { route: "/reading-redirect", icon: "book-outline" },
  Community: { route: "/community-selection", icon: "people-outline" },
} as const;

type FeatureType = {
  title: string;
  desc: string;
  icon: string;
  iconLib?: typeof Ionicons | typeof MaterialCommunityIcons;
};

export default function LiveVidSelection() {
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const { width, height } = useWindowDimensions();
  const statusBarHeight = StatusBar.currentHeight || 0;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const userProfile = {
    name: "Sarah Johnson",
    email: "sarah@gmail.com",
    image: { uri: "https://randomuser.me/api/portraits/women/44.jpg" },
  };

  const getActiveTab = (path: string): TabType => {
    if (path.includes("home")) return "Home";
    if (path.includes("speaking") || path.includes("contents")) return "Speaking";
    if (path.includes("reading") || path.includes("exercise")) return "Reading";
    if (path.includes("community")) return "Community";
    return "Speaking";
  };

  const activeTab = getActiveTab(pathname);

  const handleTabPress = (tab: TabType) => {
    if (tab === "Reading") {
      setShowLevelModal(true);
      return;
    }
    const route = TAB_CONFIG[tab].route;
    if (route === "/community-selection") {
      setShowCommunityModal(true);
    } else {
      router.push(route);
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


  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") {
      router.replace("/login-page");
    } else if (iconName === "chatbot") {
      router.push("/chatbot");
    } else if (iconName === "notifications") {
      router.push("/notification");
    }
  };

  useEffect(() => {
    const toValue = isProfileMenuVisible ? 0 : -50;
    const opacityValue = isProfileMenuVisible ? 1 : 0;
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: opacityValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isProfileMenuVisible]);

  const BottomNav = () => {

    const navItems = Object.entries(TAB_CONFIG).map(([label, config]) => ({
      ...config,
      label,
      onPress: () => handleTabPress(label as TabType),
    }));

    return (
      <View className="absolute bottom-0 left-0 right-0 bg-[#0F172A]/95 backdrop-blur-xl rounded-t-3xl">
        <View className="flex-row justify-around items-center py-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.label;
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

  // Removed duplicate functions and consolidated logic

  return (
    <View className="flex-1 bg-gray-900" style={{ width, height }}>
      <StatusBar 
        translucent 
        backgroundColor="transparent" 
        barStyle="light-content"
      />
      <View className="flex-1">
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A"]}
          style={{
            flex: 1,
            paddingTop: Platform.OS === 'android' ? statusBarHeight : 0,
          }}
        >
          {/* Decorative Circles */}
          <View className="absolute w-40 h-40 bg-[#a78bfa]/10 rounded-full -top-20 -left-20" />
          <View className="absolute w-24 h-24 bg-[#a78bfa]/10 rounded-full top-1/4 -right-12" />
          <View className="absolute w-32 h-32 bg-[#a78bfa]/5 rounded-full top-1/3 -left-16" />
          <View className="absolute w-48 h-48 bg-[#a78bfa]/5 rounded-full bottom-1/4 -right-24" />
          <View className="absolute w-28 h-28 bg-[#a78bfa]/5 rounded-full bottom-2 right-8" />
          <View className="absolute w-28 h-28 bg-[#a78bfa]/5 rounded-full top-15 right-12" />
          <View className="absolute w-32 h-32 bg-[#a78bfa]/5 rounded-full bottom-24 left-1/6" />

          <View className="flex-1 -top- px-4" style={{ 
            paddingTop: Platform.OS === 'ios' ? 50 : statusBarHeight + 10 
          }}>
            <View className="w-full max-w-[400px] self-center">
              {/* Header */}
              <View className="flex-row justify-between bottom-10 items-center mt-4 mb-3 w-full">
                <View className="flex-row items-center">
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
                </View>

            <View className="flex-row items-center right-4 space-x-3">
              <TouchableOpacity
                className="p-2 rounded-full bg-white/10 active:bg-white/20"
                onPress={() => handleIconPress("chatbot")}
                activeOpacity={0.7}
              >
                <Image
                  source={require("../assets/chatbot.png")}
                  className="w-5 h-5"
                  resizeMode="contain"
                  tintColor="white"
                />
              </TouchableOpacity> 
              <TouchableOpacity
                className="p-2 rounded-full bg-white/10 active:bg-white/20"
                onPress={() => handleIconPress("notifications")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color="white"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsProfileMenuVisible(true)}
                activeOpacity={0.7}
              >
                <Image
                  source={{
                    uri: "https://randomuser.me/api/portraits/women/44.jpg",
                  }}
                  className="w-9 h-9 rounded-full border-2 border-white/80"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Main Content Container */}
        <View className=" top-1 mx-1  mb-5 bg-white/5 backdrop-blur-xl -top-10 rounded-3xl p-3 -px-2 border border-white/20">
          {/* Title Section */}
          <View className="items-center mb-6">
            <View className="relative">
              {/* Animated gradient background */}
              <View className="absolute -inset-2 bg-purple-500/20 rounded-2xl" />

              {/* Main icon container */}
              <Image
                source={require("../assets/Live.png")}
                style={{ width: 60, height: 60 }}
                resizeMode="contain"
              />
            </View>

            <Text className="text-white text-2xl font-bold mt-6 -top-3 mb-2 text-center">
              Interactive Live Session
            </Text>
            <Text className="text-gray-200 px-2 text-center text-sm -top-4">
              Stream live and get real-time feedback from your audience
            </Text>
          </View>

          {/* Features List */}
          <View className="space-y-3 mb-6 items-center">
            {[
              {
                title: "Real-time Interaction",
                desc: "Engage with live comments and reactions",
                icon: "chatbubbles-outline",
                iconLib: Ionicons,
              },
              {
                title: "Instant Feedback",
                desc: "AI-powered feedback, Advice and Guide",
                icon: "brain",
                iconLib: MaterialCommunityIcons,
              },
            ].map((feature, idx) => (
              <View
                key={idx}
                className="flex-row items-center p-3 -top-7 rounded-lg"
              >
                <View className="bg-white/10 p-2 rounded-lg mr-3 flex items-center justify-center ">
                  {feature.iconLib ? (
                    <feature.iconLib
                      name={feature.icon as any}
                      size={20}
                      color="#FFFFFF"
                    />
                  ) : (
                    <Ionicons
                      name={feature.icon as any}
                      size={20}
                      color="#FF0000"
                    />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base mb-0.5">
                    {feature.title}
                  </Text>
                  <Text className="text-white/70 text-xs">{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View className="px-3 -mt-8 mb-5">
            <View className="flex-row justify-center items-center space-x-6 w-full">
              <TouchableOpacity
                className="flex-row items-center bg-violet-500/90 border border-white/30 px-6 py-2.5 rounded-lg w-[45%] justify-center"
                activeOpacity={0.8}
                onPress={() => router.push("/live-video-recording")}
              >
                <Text className="text-white font-bold text-sm">Go Live</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center bg-white/30 border border-white/20 px-6 py-2.5 rounded-lg w-[47%] justify-center"
                activeOpacity={0.8}
                onPress={() => router.push("/private-video-recording")}
              >
                <Text className="text-white font-bold text-sm">
                  Practice Solo
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Tips */}
          <View className="bg-white/10 backdrop-blur-md rounded-xl p-5 mb-2 border border-white/20 shadow-sm">
            <View className="flex-row items-center mb-3">
              <Ionicons name="bulb-outline" size={16} color="#FFFFFF" />
              <Text className="text-white font-medium ml-2.5 text-sm">
                Quick Tips
              </Text>
            </View>
            <View className="space-y-2">
              {[
                "Maintain eye contact with the camera",
                "Speak clearly and at a steady pace",
                "Use hand gestures naturally",
                "Check your internet connection stability",
                "Keep your energy up and stay confident",
                "Choose a quiet, well-lit environment",
              ].map((tip, idx) => (
                <View key={idx} className="flex-row items-start">
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="white"
                    style={{ marginTop: 2, marginRight: 8 }}
                  />
                  <Text className="text-white text-xs flex-1">{tip}</Text>
                </View>
              ))}
            </View>
          </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Profile Menu */}
      <ProfileMenu
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        user={userProfile}
      />

      {/* Bottom Navigation */}
      <BottomNav />

      <LevelSelectionModal
        visible={showLevelModal}
        onDismiss={() => setShowLevelModal(false)}
        onSelectLevel={(level: 'Basic' | 'Advanced') => {
          setShowLevelModal(false);
          const route = level === 'Basic' 
            ? '/basic-exercise-reading' 
            : '/advance-execise-reading';
          router.push(route);
        }}
      />
      <LivesessionCommunityModal
        visible={showCommunityModal}
        onDismiss={() => setShowCommunityModal(false)}
        onSelectOption={handleCommunitySelect}
      />
    </View>
  );
}
