import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function FullResultReading() {
  const router = useRouter();

  /**
   * Background decoration component
   */
  const BackgroundDecor = () => (
    <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
      {/* Gradient Background */}
      <View className="absolute inset-0">
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A"]}
          style={{ flex: 1 }}
        />
      </View>

      {/* Decorative Circles */}
      <View className="absolute w-40 h-40 bg-[#a78bfa]/10 rounded-full -top-20 -left-20" />
      <View className="absolute w-24 h-24 bg-[#a78bfa]/10 rounded-full top-1/4 -right-12" />
      <View className="absolute w-32 h-32 bg-[#a78bfa]/5 rounded-full top-1/3 -left-16" />
      <View className="absolute w-48 h-48 bg-[#a78bfa]/5 rounded-full bottom-1/4 -right-24" />
      <View className="absolute w-28 h-28 bg-[#a78bfa]/5 rounded-full bottom-2 right-8" />
      <View className="absolute w-28 h-28 bg-[#a78bfa]/5 rounded-full top-15 right-12" />
      <View className="absolute w-32 h-32 bg-[#a78bfa]/5 rounded-full bottom-24 left-1/6" />
    </View>
  );

  return (
    <View className="flex-1 bg-gray-900">
      {/* Full screen background with status bar cover */}
      <View className="absolute top-0 left-0 right-0 bottom-0 bg-gray-900">
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View className="flex-1 bg-gray-900 pt-12">
          <BackgroundDecor />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="w-full max-w-[1000px] self-center px-4">
          {/* Header with back button only */}
          <View className="flex-row items-start w-full left-0.1 top-1 mt-4">
            <TouchableOpacity
              className="p-3 -ml-1"
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Detailed Analysis Heading */}
        <View className="mx-4 mb-5 -mt-3">
          <Text className="text-white font-bold text-xl text-center">
            AI DETAILED ANALYSIS
          </Text>
        </View>

        {/* Confidence Card */}
        <View className="mx-4 mb-6 p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl">
          <View className="flex-row items-start">
            {/* Left side - Confidence Circle */}
            <View className="relative w-24 h-24 items-center justify-center top-5">
              <View className="w-20 h-20 items-center justify-center">
                <View className="w-20 h-20 rounded-full border-4 border-[#8A5CFF] items-center justify-center">
                  <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center shadow-lg">
                    <Text className="text-2xl font-bold items-center justify-center text-white">
                      78%
                    </Text>
                  </View>
                </View>
                <View className="bg-[#8A5CFF] px-2 py-1 rounded-lg -bottom-2 -mb-7 items-center justify-center top-3">
                  <Text className="text-xs font-normal items-center justify-center text-white">
                    Confidence
                  </Text>
                </View>
              </View>
            </View>

            {/* Right side - Details */}
            <View className="flex-1 ml-6">
              <Text className="text-white font-semibold text-lg mb-2">
                Speaking Proficiency
              </Text>
              <View className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                <View
                  className="h-full bg-gradient-to-r from-[#8A5CFF] to-[#a78bfa]"
                  style={{ width: "78%" }}
                />
              </View>
              <Text className="text-sm text-gray-300 leading-relaxed">
                Your speaking skills demonstrate strong command of language and
                clear articulation. Focus on varying your tone for greater
                impact.
              </Text>
            </View>
          </View>
        </View>

        {/* Strengths & Improvements */}
        <View className="mx-4 flex-row space-x-4 mb-6">
          {/* Strengths Card */}
          <View className="flex-1 p-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/20">
            <View className="flex-row items-center mb-3">
              <View className="right-2.5 w-8 h-8 rounded-lg bg-[#FFFFFF]/10 items-center justify-center mr-2">
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              </View>
              <Text className="right-3 text-white font-medium text-lg">
                Key Strengths
              </Text>
            </View>
            <View className="bottom-1 space-y-4 top-4">
              {[
                { skill: "Clear Voice", level: 85 },
                { skill: "Pacing", level: 78 },
                { skill: "Projection", level: 82 },
                { skill: "Engagement", level: 80 },
              ].map((item, i) => (
                <View key={i} className="space-y-1">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-gray-300">{item.skill}</Text>
                    <Text className="text-xs text-[#8A5CFF]">
                      {item.level}%
                    </Text>
                  </View>
                  <View className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-gradient-to-r from-[#8A5CFF] to-[#a78bfa]"
                      style={{ width: `${item.level}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Improvements Card */}
          <View className="flex-1 p-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/20">
            <View className="flex-row items-center mb-3">
              <View className="bottom-2.5 right-2.5 w-8 h-8 rounded-lg bg-[#FFFFFF]/10 items-center justify-center mr-2">
                <Ionicons name="trending-up" size={16} color="#FFFFFF" />
              </View>
              <Text className="right-2 text-white font-medium text-base bottom-2">
                Improvement Areas
              </Text>
            </View>
            <View className="bottom-1 space-y-4">
              {[
                { skill: "Articulation", level: 65 },
                { skill: "Clarity", level: 58 },
                { skill: "Projection", level: 62 },
                { skill: "Response Time", level: 70 },
              ].map((item, i) => (
                <View key={i} className="space-y-1">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-gray-300">{item.skill}</Text>
                    <Text className="text-xs text-[#8A5CFF]">
                      {100 - item.level}%
                    </Text>
                  </View>
                  <View className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-gradient-to-r from-[#8A5CFF] to-[#a78bfa]"
                      style={{ width: `${item.level}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Performance Breakdown */}
        <View className="mx-4 p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/20 mb-6">
          <View className="mb-6">
            <Text className="text-white font-semibold text-lg">
              Performance Metrics
            </Text>
            <Text className="text-gray-400 text-sm">
              Detailed analysis of your speaking performance
            </Text>
          </View>

          <View className="space-y-6">
            {[
              {
                label: "Overall Confidence",
                value: 75,
                icon: "bar-chart",
                trend: "up",
                change: 3.2,
              },
              {
                label: "Voice Clarity",
                value: 82,
                icon: "volume-high",
                trend: "up",
                change: 1.8,
              },
              {
                label: "Response Time",
                value: 76,
                icon: "time",
                trend: "down",
                change: 2.4,
              },
              {
                label: "Fluency",
                value: 73,
                icon: "pulse",
                trend: "up",
                change: 1.1,
              },
            ].map((item, i) => {
              const isPositive = item.trend === "up";
              const trendColor = isPositive ? "#10B981" : "#EF4444";

              return (
                <View key={i} className="space-y-2">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 rounded-lg bg-white/10 items-center justify-center mr-3">
                        <Ionicons
                          name={item.icon as any}
                          size={16}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text className="text-gray-300 text-sm font-medium">
                        {item.label}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons
                        name={isPositive ? "trending-up" : "trending-down"}
                        size={16}
                        color={trendColor}
                        style={{ marginRight: 0.1 }}
                      />
                      <Text className="text-white font-semibold text-sm ml-3 w-10 text-right">
                        {item.value}%
                      </Text>
                    </View>
                  </View>
                  <View className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full overflow-hidden"
                      style={{ width: `${item.value}%` }}
                    >
                      <LinearGradient
                        colors={
                          isPositive
                            ? ["#8A5CFF", "#A78BFA"]
                            : ["#8A5CFF", "#A78BFA"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="w-full h-full rounded-full"
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Call to Action */}
        <View className="mx-4 p-6 bg-white/5 rounded-3xl border border-white/20 mb-10 overflow-hidden">
          <View className="relative z-10">
            <View className="flex-row items-center justify-center mb-4">
              <Text className="text-white font-semibold text-2xl">
                Next Steps
              </Text>
            </View>

            <Text className="text-gray-200 text-center text-sm leading-relaxed mb-6">
              Your speaking assessment is complete. Based on your performance,
              we've identified key areas to focus on in your learning journey.
            </Text>

            <View className="space-y-3 mb-6 top-2">
              <View className="flex-row items-start">
                <View className="w-5 h-5 rounded-full bg-[#90EE90]/70 items-center justify-center mt-0.5 mr-3 ">
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="#FFFFFF"
                    style={{ marginTop: 1 }}
                  />
                </View>
                <Text className="text-gray-200 bottom-1.5 text-sm flex-1">
                  <Text className="font-medium text-white">
                    Personalized exercises tailored to your improvement areas
                  </Text>
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-5 h-5 rounded-full bg-[#90EE90]/70 items-center justify-center mt-0.5 mr-3">
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="#FFFFFF"
                    style={{ marginTop: 1 }}
                  />
                </View>
                <Text className="text-gray-200 bottom-1 text-sm flex-1">
                  <Text className="font-medium text-white">
                    Track your progress over time with detailed analytics
                  </Text>
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-5 h-5 rounded-full bg-[#90EE90]/70 items-center justify-center mt-0.5 mr-3">
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="#FFFFFF"
                    style={{ marginTop: 1 }}
                  />
                </View>
                <Text className="text-gray-200 top-1 text-sm flex-1">
                  <Text className="font-medium text-white">
                    Expert feedback on your speaking patterns
                  </Text>
                </Text>
              </View>
            </View>

            <View className="flex-row space-x-4 mt-6">
              <TouchableOpacity
                className="flex-row items-center bg-violet-500/80 border border-white/30 px-6 py-2.5 rounded-xl w-[45%] justify-center"
                activeOpacity={0.9}
                onPress={() => router.replace("/live-vid-selection")}
              >
                <Text className="text-white font-semibold text-base">
                  Retake
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center bg-white/30 border border-white/40 px-6 py-2.5 rounded-xl w-[47%] justify-center"
                activeOpacity={0.9}
                onPress={() => router.replace("/home-page")}
              >
                <Text className="text-white font-semibold text-base">Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}