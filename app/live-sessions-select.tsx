import * as React from "react";
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, usePathname } from "expo-router";
import ProfileMenuNew from "../components/ProfileMenuNew";
import LivesessionCommunityModal from "../components/LivesessionCommunityModal";
import LevelSelectionModal from "../components/LevelSelectionModal";

// Background Decorator Component
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

const LiveSessions = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);

  // Set the active tab based on the current route
  const getActiveTab = () => {
    if (pathname.includes("live-sessions") || pathname.includes("live-sessions-select")) {
      return "live-sessions-select";
    }
    if (pathname.includes("community")) {
      return "community-selection";
    }
    return pathname.split("/").pop() || "home-page";
  };

  const activeTab = getActiveTab();

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") {
      router.replace("/login-page");
    } else if (iconName === "chatbot") {
      router.push("/chatbot");
    } else if (iconName === "notifications") {
      router.push("/notification");
    } else if (iconName === "menu-outline") {
      // Handle menu press if needed
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

  const handleTabPress = (tab: string) => {
    if (tab === activeTab) return;
    
    if (tab === "community" || tab === "community-selection") {
      setShowCommunityModal(true);
      return;
    }
    
    const route = tab === 'live-sessions' ? '/live-sessions' : `/${tab}`;
    router.push(route);
  };

  const sessions = [
    {
      id: "1",
      name: "Michael Chen",
      title: "Voice Warm-Up & Articulation Techniques",
      level: "Basic",
      viewers: "1.2k",
      time: "LIVE NOW",
      duration: "45 min session",
    },
    {
      id: "2",
      name: "David Kim",
      title: "Advanced Debate Strategies & Practice",
      level: "Advanced",
      viewers: "856",
      time: "LIVE NOW",
      duration: "60 min session",
    },
    {
      id: "3",
      name: "Lisa Park",
      title: "Mastering Eye Contact & Facial Expressions",
      level: "Basic",
      viewers: "723",
      time: "LIVE NOW",
      duration: "30 min session",
    },
  ];

  return (
    <View className="flex-1 bg-[#0F172A]">
      <BackgroundDecor />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 5 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row top-5 justify-between items-center px-4 py-3">
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
        <View className="px-4">
          {/* Page Title */}
          <View className="mt-6 mb-6">
            <Text className="text-white text-3xl font-bold mb-1">
              Live Sessions
            </Text>
            <Text className="text-white/80 text-base">
              Learn from experts in real-time
            </Text>
          </View>

          {/* Live Sessions Info */}
          <View className="mb-8">
            <View className="flex-row items-center opacity-80">
              <View className="bg-white/20 flex-row items-center rounded-lg px-3 py-1 self-start mb-6 -mt-2">
                <Ionicons name="time-outline" size={18} color="white" />
                <Text className="text-white ml-2 text-sm">
                  Live sessions update in real-time
                </Text>
              </View>
            </View>
          </View>

          {/* Live Sessions Section */}
          <View className="mb-5 bottom-8">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-white text-xl font-bold">
                People live now
              </Text>
              <TouchableOpacity>
                <Text className="text-white text-sm">View all</Text>
              </TouchableOpacity>
            </View>

            {sessions.map((session) => (
              <View
                key={session.id}
                className="mb-5 bg-white/10 rounded-2xl p-5 border border-white/20"
              >
                {/* Session Status Bar */}
                <View className="flex-row justify-between items-center mb-4">
                  <View className="flex-row items-center">
                    <View className="bg-white/10 rounded-full px-3 py-1 flex-row items-center">
                      <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                      <Text className="text-white text-xs font-bold">
                        {session.time}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="people-outline" size={16} color="white" />
                    <Text className="text-white text-xs ml-1">
                      {session.viewers} watching
                    </Text>
                  </View>
                </View>

                {/* Host Profile */}
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 bg-white/10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="person" size={20} color="white" />
                  </View>
                  <View>
                    <Text className="text-white font-medium">
                      {session.name}
                    </Text>
                    <Text className="text-violet-300 text-xs">Student</Text>
                  </View>
                </View>

                {/* Session Details */}
                <Text className="text-white text-lg font-semibold mb-3 leading-tight">
                  {session.title}
                </Text>

                {/* Join Button */}
                <TouchableOpacity
                  className="bg-violet-600/80 border border-white/20 rounded-xl py-4 items-center"
                  onPress={() =>
                    router.push({
                      pathname: "/live-session",
                      params: {
                        id: session.id,
                        title: session.title,
                        name: session.name,
                        viewers: session.viewers,
                      },
                    })
                  }
                >
                  <Text className="text-white text-based font-bold">
                    Join Session
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Community Recordings Section */}
          <View className="mb-8 bottom-14">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-white text-xl top-2 font-bold">
                Community Recordings
              </Text>
            </View>

            <View className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
              {/* Recording Card 1 */}
              <TouchableOpacity
                className="bg-white/5 rounded-xl p-3 border border-white/20"
                onPress={() => router.push("/community-page")}
              >
                <View className="flex-row items-start">
                  <View className="relative mr-3">
                    <View className="w-24 h-16 bg-violet-500/10 rounded-lg items-center justify-center">
                      <Ionicons name="play-circle" size={32} color="white" />
                    </View>
                    <View className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded">
                      <Text className="text-white text-2xs">45:22</Text>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-white font-medium text-sm mb-1"
                      numberOfLines={2}
                    >
                      Mastering Public Speaking: Tips & Tricks
                    </Text>
                    <Text className="text-violet-300 text-xs mb-1">
                      @jameswilson
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons name="eye-outline" size={14} color="#94a3b8" />
                      <Text className="text-slate-400 text-xs ml-1">
                        1.2k views
                      </Text>
                      <View className="w-1 h-1 bg-slate-500 rounded-full mx-2" />
                      <Text className="text-slate-400 text-xs">2 days ago</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Recording Card 2 */}
              <TouchableOpacity
                className="bg-white/5 rounded-xl p-3 border border-white/20"
                onPress={() => router.push("/community-page")}
              >
                <View className="flex-row items-start">
                  <View className="relative mr-3">
                    <View className="w-24 h-16 bg-violet-500/10 rounded-lg items-center justify-center">
                      <Ionicons name="play-circle" size={32} color="white" />
                    </View>
                    <View className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded">
                      <Text className="text-white text-2xs">32:15</Text>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-white font-medium text-sm mb-1"
                      numberOfLines={2}
                    >
                      Daily English Conversation Practice
                    </Text>
                    <Text className="text-violet-300 text-xs mb-1">
                      @sarah_teaches
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons name="eye-outline" size={14} color="#94a3b8" />
                      <Text className="text-slate-400 text-xs ml-1">
                        856 views
                      </Text>
                      <View className="w-1 h-1 bg-slate-500 rounded-full mx-2" />
                      <Text className="text-slate-400 text-xs">1 week ago</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Find More Button */}
              <TouchableOpacity
                className="bg-white/20 rounded-xl border border-white/20 py-3 flex-row items-center justify-center mt-4"
                onPress={() => router.push("/community-selection")}
              >
                <Ionicons
                  name="search"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-bold text-base">
                  Find More Community Recordings
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Menu */}
          <ProfileMenuNew
            visible={isProfileMenuVisible}
            onDismiss={() => setIsProfileMenuVisible(false)}
            user={{
              name: "Sarah Johnson",
              email: "sarah@gmail.com",
              image: {
                uri: "https://randomuser.me/api/portraits/women/44.jpg",
              },
            }}
          />
        </View>
      </ScrollView>

      {/* Selection Modal */}
      <LivesessionCommunityModal
        visible={showCommunityModal}
        onDismiss={() => setShowCommunityModal(false)}
        onSelectOption={handleCommunitySelect}
      />

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

      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#0F172A]/95 backdrop-blur-lg rounded-t-3xl">
        <View className="flex-row justify-around items-center py-2">
          {[
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
              route: "basic-exercise-reading",
              onPress: () => setShowLevelModal(true),
            },
            {
              icon: "people-outline",
              label: "Community",
              route: "live-sessions-select",
              onPress: () => setShowCommunityModal(true),
            },
          ].map((item) => {
            const isActive = activeTab === item.route;
            return (
              <TouchableOpacity
                key={item.route}
                className="items-center py-2 px-0.5 rounded-xl"
                style={{
                  backgroundColor: isActive
                    ? "rgba(255, 255, 255, 0.14)"
                    : "transparent",
                  transform: [{ scale: 1 }]
                }}
                activeOpacity={1}
                onPressIn={(e) => {
                  e.currentTarget.setNativeProps({
                    style: {
                      transform: [{ scale: 0.95 }]
                    }
                  });
                }}
                onPressOut={(e) => {
                  e.currentTarget.setNativeProps({
                    style: {
                      transform: [{ scale: 1 }]
                    }
                  });
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
    </View>
  );
};

export default LiveSessions;