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
        setIsLoggingOut(false);
      }
    });

    return () => {
      rotation.stop();
    };
  }, []);

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
              <Text className="text-white font-semibold">2h 34m</Text>
            </View>

            <View className="flex-row justify-between bg-white/5 rounded-xl px-4 py-3 items-center">
              <View className="flex-row items-center">
                <Ionicons
                  name="checkmark-outline"
                  size={20}
                  color="#FFFFFF"
                />
                <Text className="text-white ml-2">Tasks Completed</Text>
              </View>
              <Text className="text-white font-semibold">8</Text>
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
              onPress={() => router.replace("/StudentScreen/HomePage")}
            >
              <Text className="text-white font-semibold text-base">
                Go to Homepage
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

export default LogoutScreen;