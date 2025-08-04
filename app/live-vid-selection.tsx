import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";

export default function LiveVidSelection() {
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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

  const handleTabNavigation = (tab: string) => {
    if (tab === "Overview") router.push("/home-page");
    if (tab === "Speaking") router.push("/exercise-speaking");
    if (tab === "Reading") router.push("/exercise-reading");
    if (tab === "Community") router.push("/community-page");
  };

  const handleLogout = () => router.replace("/login-page");
  const handleSettings = () => router.push("/settings");

  const activeTab = pathname.includes("exercise-speaking") ? "Speaking" :
                    pathname.includes("exercise-reading") ? "Reading" :
                    pathname.includes("community-page") ? "Community" : "Overview";

  return (
    <View className="flex-1 bg-[#0A0A1E]">
      {/* Decorative Circles */}
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 rounded-full bg-violet-600 opacity-15" />
      <View className="absolute top-[100px] right-[-40px] w-24 h-24 rounded-full bg-blue-600 opacity-10" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 rounded-full bg-cyan-300 opacity-10" />
      <View className="absolute bottom-5 right-10 w-15 h-15 rounded-full bg-purple-400 opacity-10" />
      <View className="absolute top-[200px] left-[90px] w-6 h-6 rounded-full bg-cyan-300 opacity-10" />

      <ScrollView className="flex-1" contentContainerClassName="pb-10" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 pt-8 pb-4">
          <View className="flex-row items-center">
            <View className="w-7 h-7 rounded-full bg-purple-500 mr-2" />
            <Text className="text-white text-xl font-bold">Fluentech</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity className="mx-1 p-1">
              <Ionicons name="trophy-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity className="mx-1 p-1">
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity className="mx-1 p-1" onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsProfileMenuVisible(true)}>
              <Image source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }} className="w-9 h-9 rounded-full border-2 border-white ml-2" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Menu Modal */}
        <Modal visible={isProfileMenuVisible} transparent animationType="none" onRequestClose={() => setIsProfileMenuVisible(false)}>
          <TouchableOpacity className="flex-1 bg-black/30" activeOpacity={1} onPressOut={() => setIsProfileMenuVisible(false)}>
            <Animated.View
              style={{ transform: [{ translateY: slideAnim }], opacity: opacityAnim }}
              className="absolute top-[55px] right-4"
            >
              <View className="bg-[#1E1E2E] rounded-lg p-3 w-[180px]">
                <Text className="text-white text-lg font-bold mb-3">Sarah Johnson</Text>
                <TouchableOpacity onPress={handleSettings} className="py-2">
                  <Text className="text-white text-sm">Settings</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        {/* Tabs */}
        <View className="flex-row bg-white/5 rounded-xl p-1 mx-4 mb-6">
          {["Overview", "Speaking", "Reading", "Community"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabNavigation(tab)}
              className="flex-1 px-3 py-2 rounded-lg"
            >
              <Text className="text-xs font-bold text-center text-white/80">{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <Text className="text-white text-2xl font-bold px-4 mb-1">Ready to Go Live?</Text>
        <Text className="text-gray-300 px-4 mb-4">Stream live and get real-time feedback from your audience</Text>

        {/* Interactive Session Card */}
        <View className="mx-4 bg-white rounded-2xl p-5 mb-6 shadow-lg">
          <View className="items-center mb-4">
            <View className="bg-[#8A5CFF] rounded-full p-3 mb-2">
              <Ionicons name="videocam" size={32} color="#fff" />
            </View>
            <Text className="font-bold text-lg text-gray-900 mb-1">Interactive Live Session</Text>
            <Text className="text-center text-gray-500 text-xs mb-4">Engage live with feedback to improve your speaking.</Text>
          </View>
          
          <View className="space-y-3 mb-2">
            {[
              { title: "Real-time Audience Interaction", desc: "Engage with participants through live comments and instant reactions" },
              { title: "Emoji Reactions & Feedback", desc: "Receive instant visual feedback with hearts, applause, and more" },
              { title: "Perfect for Students & Teachers", desc: "Ideal for classroom presentations and collaborative learning" },
            ].map((feature, idx) => (
              <View key={idx} className="flex-row items-start mb-3">
                <Ionicons name="checkmark-circle" size={20} color="#48D597" className="mt-0.5 mr-2" />
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-[15px]">{feature.title}</Text>
                  <Text className="text-gray-500 text-xs">{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-center items-center space-x-4 px-4 mb-6">
          <TouchableOpacity className="flex-row items-center bg-[#6C47FF] rounded-xl px-6 py-3 mr-2">
            <Text className="text-white font-bold text-base mr-2">Go Live</Text>
            <View className="w-2 h-2 rounded-full bg-red-500 mr-1" />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center bg-[#231942] rounded-xl px-6 py-3">
            <Text className="text-purple-400 font-bold text-base">Go Live w/o Audience</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Tips */}
        <View className="mx-4 bg-white rounded-2xl p-5 mb-10">
          <View className="flex-row items-center mb-2">
            <Ionicons name="bulb-outline" size={20} color="#FACC15" className="mr-2" />
            <Text className="text-gray-900 font-bold text-base">Quick Tips</Text>
          </View>
          <View className="space-y-2 mt-2">
            {[
              "Maintain eye contact with the camera",
              "Speak clearly and at a steady pace",
              "Use hand gestures naturally",
              "Check your internet connection stability",
              "Keep your energy up and stay confident",
              "Choose a quiet, well-lit environment",
            ].map((tip, idx) => (
              <View key={idx} className="flex-row items-center">
                <Ionicons name="checkmark" size={18} color="#48D597" className="mr-2" />
                <Text className="text-gray-700 text-sm">{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
