import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

const profilePic = { uri: "https://randomuser.me/api/portraits/women/44.jpg" };

const modules = [
  {
    key: "Basic",
    label: "BASIC",
    title: "Foundation Speaking Skills",
    desc: "Master essential self-introduction techniques and learn to manage speaking anxiety in a supportive virtual classroom environment.",
    progress: 0.75,
    color: "#7c3aed",
    navigateTo: "/basic-contents",
  },
  {
    key: "Advanced",
    label: "ADVANCE",
    title: "Advanced Public Speaking Mastery",
    desc: "Deliver compelling presentations to large audiences while handling complex Q&A sessions and unexpected challenges.",
    progress: 0.4,
    color: "#7c3aed",
    navigateTo: "/advanced-contents",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedModule, setSelectedModule] = useState("Basic");
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleModuleSelect = (moduleKey: string, navigateTo: string) => {
    setSelectedModule(moduleKey);
    router.push(navigateTo);
  };

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") router.replace("/login-page");
  };
  const handleSettings = () => router.push("/settings");

  const handleTabNavigation = (tab: string) => {
    if (tab === "Overview") router.push("/home-page");
    if (tab === "Speaking") router.push("/exercise-speaking");
    if (tab === "Reading") router.push("/exercise-reading");
    if (tab === "Community") router.push("/community-page");
  };

  useEffect(() => {
    if (isProfileMenuVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -50, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isProfileMenuVisible]);

  const getActiveTab = () => {
    if (pathname.includes("exercise-speaking")) return "Speaking";
    if (pathname.includes("exercise-reading")) return "Reading";
    if (pathname.includes("community-page")) return "Community";
    return "Overview";
  };

  const activeTab = getActiveTab();

  return (
    <View className="flex-1 bg-[#0A0A0F] relative">
      <LinearGradient
        colors={["#0A0A0F", "#1A1A2E", "#16213E"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        className="absolute inset-0 z-[-1]"
      />

      {[{ style: "top-[-60px] left-[-50px] w-40 h-40 bg-violet-500 opacity-10" },
        { style: "top-[100px] right-[-40px] w-[90px] h-[90px] bg-blue-600 opacity-10" },
        { style: "bottom-[100px] left-[50px] w-9 h-9 bg-cyan-300 opacity-10" },
        { style: "bottom-5 right-10 w-15 h-15 bg-purple-400 opacity-10" },
        { style: "top-[200px] left-[90px] w-5 h-5 bg-cyan-300 opacity-10" }].map((orb, index) => (
        <View key={index} className={`absolute rounded-full ${orb.style}`} />
      ))}

      <ScrollView keyboardShouldPersistTaps="handled">
        <View className="flex-grow items-center p-4 w-full max-w-[400px] mx-auto">
          <View className="flex-row justify-between items-center mt-4 mb-2 w-full">
            <View className="flex-row items-center">
              <Image source={require("../assets/Speaksy.png")} className="w-12 h-12 rounded-full mr-0.1" />
              <Text className="text-white font-bold text-2xl mr-12">Vocaria</Text>
            </View>

            <View className="flex-row items-center">
              {[{ icon: "robot-excited-outline", lib: MaterialCommunityIcons },
                { icon: "notifications-outline", lib: Ionicons },
                { icon: "log-out-outline", lib: Ionicons }].map((item, index) => {
                const IconLib = item.lib;
                return (
                  <TouchableOpacity key={index} className="mx-1 p-1" onPress={() => handleIconPress(item.icon)}>
                    <IconLib name={item.icon as any} size={22} color="#fff" />
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity onPress={() => setIsProfileMenuVisible(true)}>
                <Image source={profilePic} className="w-9 h-9 rounded-full border-2 border-white ml-2" />
              </TouchableOpacity>
            </View>
          </View>

          <Modal
            visible={isProfileMenuVisible}
            transparent
            animationType="none"
            onRequestClose={() => setIsProfileMenuVisible(false)}
          >
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}
              activeOpacity={1}
              onPressOut={() => setIsProfileMenuVisible(false)}
            >
              <Animated.View
                style={{
                  position: "absolute",
                  top: 55,
                  right: 16,
                  transform: [{ translateY: slideAnim }],
                  opacity: opacityAnim,
                }}
              >
                <View style={{ backgroundColor: "#1E1E2E", borderRadius: 10, padding: 10, width: 180 }}>
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>Sarah Johnson</Text>
                  <TouchableOpacity onPress={handleSettings} style={{ paddingVertical: 8 }}>
                    <Text style={{ color: "white", fontSize: 14 }}>Settings</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </Modal>

          <View className="flex-row bg-white/5 rounded-xl p-1 mb-5 w-full">
            {["Overview", "Speaking", "Reading", "Community"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => handleTabNavigation(tab)}
                className={`flex-1 px-3 py-2 rounded-lg ${activeTab === tab ? "bg-white/80" : ""}`}
              >
                <Text className={`text-xs font-bold text-center ${activeTab === tab ? "text-violet-600" : "text-white/80"}`}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="mb-6 w-full">
            <Text className="text-white text-xl font-bold mb-1">Live Video Practice</Text>
            <Text className="text-white/80 text-base">
              Sharpen your speaking skills through live video practice with real audience feedback.
            </Text>
            <View className="mt-4 bg-violet-500 rounded-lg py-2 px-4 w-40 self-start">
              <Text className="text-white text-center font-bold">Start Learning</Text>
            </View>
          </View>

          {modules.map((mod) => (
            <View key={mod.key} className="bg-white/10 rounded-2xl p-4 mb-4 w-full">
              <Text className="text-violet-500 font-bold text-xs mb-1">{mod.label}</Text>
              <Text className="text-white font-semibold text-lg mb-1">{mod.title}</Text>
              <Text className="text-white/70 text-sm mb-3">{mod.desc}</Text>

              <View className="flex-row items-center mb-2">
                <Text className="text-white/80 text-xs mr-2">{Math.round(mod.progress * 100)}% Complete</Text>
                <View className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                  <View className="h-2 rounded-full" style={{ width: `${mod.progress * 100}%`, backgroundColor: mod.color }} />
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleModuleSelect(mod.key, mod.navigateTo)}
                className={`mt-2 py-2 px-4 rounded-lg ${selectedModule === mod.key ? "bg-violet-500" : "bg-violet-400/80"}`}
              >
                <Text className="text-white font-bold text-center">Select Module</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
