import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";

const studentFeatures = [
  "AI-powered speech analysis",
  "Real-time progress tracking",
  "Community Feedback and live Video Session",
  "Recording Practice for Speaking and Reading",
];

const teacherFeatures = [
  "Advanced analytics dashboard",
  "Smart classroom management",
  "Community Feedback and live Video Session",
  "Tracking and monitoring for students Progress",
];

export default function RoleSelection() {
  const router = useRouter();

  // Navigate to login with role param
  const handleSelectRole = (role: "student" | "teacher") => {
    if (role === "student") {
      router.push("Auth/Login/login-student");
    } else {
      router.push("Auth/Login/login-teacher");
    } 
  };

  return (
    <View className="flex-1 bg-gray-900">
      {/* Gradient Background */}
      <View
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A"]}
          style={{ flex: 1 }}
        />
      </View>

      {/* Decorative Circles */}
      <View style={{ position: 'absolute', width: 160, height: 160, backgroundColor: '#a78bfa0d', borderRadius: 80, top: -120, left: -48, zIndex: 10 }} />
          <View style={{ position: 'absolute', width: 96, height: 96, backgroundColor: '#a78bfa0d', borderRadius: 48, top: 920, right: -40, zIndex: 10 }} />
          <View style={{ position: 'absolute', width: 80, height: 80, backgroundColor: '#a78bfa0d', borderRadius: 40, bottom: 40, left: 48, zIndex: 10 }} />
          <View style={{ position: 'absolute', width: 144, height: 144, backgroundColor: '#a78bfa0d', borderRadius: 72, bottom: -20, right: -32, zIndex: 10 }} />
          <View style={{ position: 'absolute', width: 80, height: 80, backgroundColor: '#a78bfa0d', borderRadius: 40, top: 112, left: 240, zIndex: 10 }} />

      <View className="flex-1 px-4 w-full max-w-[400px] self-center py-4">
        {/* Header */}
        <TouchableOpacity
          className="flex-row items-center pt-2 pb-4 z-10"
          onPress={() => router.push("/landing-page")}
          activeOpacity={0.8}
        >
          <Image
            source={require("../../../assets/Speaksy.png")}
            className="w-12 h-12 rounded-2xl"
            resizeMode="contain"
          />
          <Text className="text-white text-3xl font-bold tracking-wider ml-0.1">
            Voclaria
          </Text>
        </TouchableOpacity>
        {/* Title */}
        <View className="items-center mb-4">
          <View className="px-4 py-2 mb-1">
            <Text className="text-white font-bold text-3xl tracking-wide">
              Choose Your Path
            </Text>
          </View>
          <Text className="text-[#bfc9e0] text-sm text-center mt-2 leading-6">
            Experience the future of communication
            {Platform.OS === "ios" ? "\n" : " "}
            learning with AI-powered personalization
          </Text>
        </View>

        {/* Student Card */}
        <BlurView
          intensity={10}
          tint="dark"
          className="rounded-xl p-3 mb-4 bg-[white]/10 border border-white/30"
        >
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleSelectRole("student")}
            >
              <LinearGradient
                colors={["#a78bfa", "#7c3aed"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                className="rounded-xl py-2.5 px-4 flex-row items-center min-w-[160px]"
              >
                <Text className="text-white font-bold text-[19px] mr-[55px] ml-[42px]">
                  Select Student
                </Text>
                <Ionicons name="chevron-forward" size={22} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <View className="ml-[2px] w-[42px] h-[42px] overflow-hidden">
              <Image 
                source={require('../../../assets/student.png')} 
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </View>
          {studentFeatures.map((f) => (
            <View
              key={f}
              className="flex-row items-center bg-[white]/10 rounded-xl py-2.5 px-5 mb-2.5 border border-white/20"
            >
              <View className="w-2.5 h-2.5 rounded-full mr-2.5 bg-[#a78bfa]" />
              <Text className="text-[#bfc9e0] text-xs">{f}</Text>
            </View>
          ))}
        </BlurView>

        {/* Teacher Card */}
        <BlurView
          intensity={10}
          tint="dark"
          className="rounded-xl p-3 mb-4 bg-[white]/10 border border-white/30"
        >
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleSelectRole("teacher")}
            >
              <LinearGradient
                colors={["#a78bfa", "#7c3aed"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                className="rounded-xl py-2.5 px-4 flex-row items-center min-w-[160px]"
              >
                <Text className="text-white font-bold text-[19px] mr-[55px] ml-[42px]">
                  Select Teacher
                </Text>
                <Ionicons name="chevron-forward" size={22} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <View className="ml-[2px] w-[42px] h-[42px] items-center justify-center shadow-lg shadow-[#a78bfa3d] overflow-hidden">
              <Image 
                source={require('../../../assets/teacher.png')} 
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </View>
          {teacherFeatures.map((f) => (
            <View
              key={f}
              className="flex-row items-center bg-[white]/10 rounded-xl py-2.5 px-5 mb-2.5 border border-white/20"
            >
              <View className="w-2.5 h-2.5 rounded-full mr-2.5 bg-[#a78bfa]" />
              <Text className="text-[#bfc9e0] text-xs">{f}</Text>
            </View>
          ))}
        </BlurView>
      </View>
    </View>
  );
}
