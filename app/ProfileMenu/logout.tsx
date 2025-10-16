'use client';

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { supabase } from "@/lib/supabaseClient"; // ⬅️ import supabase

// ⬇️ 1) Helper to count today's completed tasks from student_progress
async function fetchTasksCompletedToday() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return 0;

  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);

  const { count, error } = await supabase
    .from("student_progress")
    .select("id", { count: "exact", head: true })
    .eq("student_id", uid)
    .eq("progress", 100)
    .gte("updated_at", start.toISOString())
    .lt("updated_at", end.toISOString());

  if (error) {
    console.warn("tasks today query error:", error.message);
    return 0;
  }
  return count ?? 0;
}

// Background Decorator Component
const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-screen h-screen z-0 overflow-hidden">
    <LinearGradient
      colors={["#0F172A", "#1E293B", "#0F172A"]}
      className="absolute top-0 left-0 right-0 bottom-0"
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
  </View>
);

const LogoutScreen = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [tasksToday, setTasksToday] = useState(0); // ⬅️ 2) state for tasks today

  // If you’re already tracking session time elsewhere, pass it in or compute here.
  // For now we leave the label static; it won’t “keep ticking” on this screen.
  const [sessionTimeLabel, setSessionTimeLabel] = useState("2h 34m");

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Initial fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      })
    ]).start();

    // Rotation animation
    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );
    rotation.start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
      easing: Easing.linear,
    }).start(({ finished }) => {
      if (finished) {
        rotation.stop();
        setIsLoggingOut(false); // ⬅️ this triggers the stats load below
      }
    });

    return () => {
      rotation.stop();
    };
  }, [fadeAnim, scaleAnim, rotateAnim, progressAnim]);

  // ⬇️ 3) load today's completed tasks once loading finishes
  useEffect(() => {
    if (!isLoggingOut) {
      (async () => {
        const n = await fetchTasksCompletedToday();
        setTasksToday(n);
        // If you saved a session timer elsewhere, fetch and freeze it here:
        // const label = await getFrozenSessionDurationLabel();
        // setSessionTimeLabel(label);
      })();
    }
  }, [isLoggingOut]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView className="flex-1 justify-center items-center px-6">
      <BackgroundDecor />
      {/* Card */}
      <Animated.View
        className="bg-[#1A1F2E]/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md border border-white/20 shadow-lg"
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          marginVertical: 30,
        }}
      >
        <View className="items-center">
          {isLoggingOut ? (
            <Animated.View
              className="w-24 h-24 items-center justify-center mb-4"
              style={{ transform: [{ rotate: rotateInterpolate }] }}
            >
              <Ionicons name="sync" size={40} color="#8B5CF6" />
            </Animated.View>
          ) : (
            <Image
              source={require("@/assets/Speaksy.png")}
              className="w-24 h-24 mb-4"
              resizeMode="contain"
            />
          )}

          <Text className="text-white text-2xl font-bold text-center mb-2">
            {isLoggingOut ? "Logging you out..." : "See You Later!"}
          </Text>
          <Text className="text-white/70 text-center text-sm mb-4">
            {isLoggingOut
              ? "Securing your session, please wait"
              : "You've been successfully logged out. Thanks for using our platform."}
          </Text>
        </View>

        {/* Progress bar */}
        {isLoggingOut && (
          <View className="w-full h-2 bg-white/10 rounded-full mb-6 overflow-hidden">
            <Animated.View
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              style={{ width: progressWidth }}
            />
          </View>
        )}

        {/* Stats */}
        {!isLoggingOut && (
          <View className="space-y-4 mb-6">
            <View className="flex-row justify-between bg-white/5 rounded-xl px-4 py-3 items-center">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                <Text className="text-white ml-2">Session Time</Text>
              </View>
              <Text className="text-white font-semibold">{sessionTimeLabel}</Text>
            </View>

            <View className="flex-row justify-between bg-white/5 rounded-xl px-4 py-3 items-center">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
                <Text className="text-white ml-2">Tasks Completed</Text>
              </View>
              {/* ⬇️ 4) show real count from Supabase */}
              <Text className="text-white font-semibold">{tasksToday}</Text>
            </View>
          </View>
        )}

        {/* Buttons */}
        {!isLoggingOut && (
          <View className="space-y-3">
            <TouchableOpacity
              activeOpacity={0.8}
              className="rounded-xl overflow-hidden"
              onPress={() => router.replace("/Auth/Login/role-selection")}
            >
              <LinearGradient
                colors={["#6366F1", "#8B5CF6"]}
                className="py-4 items-center"
              >
                <Text className="text-white font-semibold text-base">
                  Login Again
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-white/10 py-4 rounded-xl items-center border border-white/20"
              onPress={() => {
                // “Exit App” – there’s no universal RN API; use BackHandler on Android
                // or just go to the landing page as a fallback:
                router.replace("/landing-page");
              }}
            >
              <Text className="text-white font-semibold text-base">
                Exit App
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

export default LogoutScreen;
