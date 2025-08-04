import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FullResultReading() {
  return (
    <View className="flex-1 bg-[#0A0A1E]">
      {/* Decorative Circles */}
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 rounded-full bg-violet-600 opacity-15" />
      <View className="absolute top-[100px] right-[-40px] w-24 h-24 rounded-full bg-blue-600 opacity-10" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 rounded-full bg-cyan-300 opacity-10" />
      <View className="absolute bottom-5 right-10 w-[60px] h-[60px] rounded-full bg-purple-400 opacity-10" />
      <View className="absolute top-[200px] left-[90px] w-6 h-6 rounded-full bg-cyan-300 opacity-10" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-8 pb-3">
          <View className="flex-row items-center">
            <View className="w-7 h-7 rounded-full bg-purple-500 mr-2" />
            <Text className="text-white text-xl font-bold">Fluentech</Text>
          </View>
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity className="bg-[#231942] px-2 py-1 rounded-xl">
              <Ionicons name="search" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#231942] px-2 py-1 rounded-xl">
              <Ionicons name="notifications-outline" size={18} color="#fff" />
            </TouchableOpacity>
            <View className="w-8 h-8 rounded-full ml-1 bg-white/20 border border-white/10 items-center justify-center">
              <Image source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} className="w-7 h-7 rounded-full" />
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row px-4 mb-5">
          <View className="px-3 py-1 rounded-lg mr-2 bg-[#231942]">
            <Text className="text-purple-400 font-bold">Overview</Text>
          </View>
          <View className="px-3 py-1 rounded-lg mr-2 bg-[#18182A]">
            <Text className="text-white/80 font-semibold">Exercise Speaking</Text>
          </View>
          <View className="px-3 py-1 rounded-lg mr-2 bg-[#18182A]">
            <Text className="text-white/80 font-semibold">Exercise Reading</Text>
          </View>
          <View className="px-3 py-1 rounded-lg bg-[#18182A]">
            <Text className="text-white/80 font-semibold">Community</Text>
          </View>
        </View>

        {/* Confidence Card */}
        <View className="mx-4 bg-[#232345] rounded-2xl p-5 mb-4 flex-row items-center">
          {/* Circular Progress (static) */}
          <View className="w-20 h-20 rounded-full border-8 border-[#8A5CFF]/60 items-center justify-center mr-4 bg-[#18182A]">
            <Text className="text-purple-400 font-bold text-lg">78%</Text>
            <Text className="text-xs text-gray-400">Confidence</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-base mb-1">You're a Confident Speaker!</Text>
            <Text className="text-gray-300 text-xs">Your voice is strong, clear, confident, and friendly.</Text>
          </View>
        </View>

        {/* Strengths & Improvements */}
        <View className="mx-4 flex-row space-x-3 mb-4">
          <View className="flex-1 bg-[#232345] rounded-2xl p-4">
            <Text className="text-white font-bold text-sm mb-2">Your Strengths</Text>
            {['Clear Articulation', 'Good Pacing', 'Voice Projection', 'Engagement'].map((item, i) => (
              <View key={i} className="flex-row items-center mb-1">
                <Ionicons name="star" size={16} color="#8A5CFF" />
                <Text className="ml-2 text-gray-200 text-xs">{item}</Text>
              </View>
            ))}
          </View>
          <View className="flex-1 bg-[#232345] rounded-2xl p-4">
            <Text className="text-white font-bold text-sm mb-2">Areas for Improvement</Text>
            {['Clear Articulation', 'Voice Clarity', 'Voice Projection', 'Response Speed'].map((item, i) => (
              <View key={i} className="flex-row items-center mb-1">
                <Ionicons name="alert-circle" size={16} color="#FACC15" />
                <Text className="ml-2 text-gray-200 text-xs">{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Breakdown */}
        <View className="mx-4 bg-[#232345] rounded-2xl p-5 mb-4">
          <Text className="text-white font-bold text-base mb-3">Performance Breakdown</Text>
          {[
            { label: 'Overall Confidence', value: '75%' },
            { label: 'Voice Clarity', value: '82%' },
            { label: 'Response Time', value: '76%' },
            { label: 'Fluency', value: '73%' },
          ].map((item, i) => (
            <View key={i} className="mb-2">
              <Text className="text-gray-200 text-xs mb-1">{item.label}</Text>
              <View className="w-full h-2 rounded-full bg-[#3B3B5C] mb-1">
                <View className={`h-2 rounded-full bg-[#8A5CFF] w-[${item.value}]`} />
              </View>
              <Text className="text-purple-400 text-xs font-bold">{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Callout Card */}
        <View className="mx-4 bg-[#18182A] rounded-2xl p-5 mb-10 items-center">
          <Text className="text-white font-bold text-base mb-2 text-center">Ready to Improve Your Confidence?</Text>
          <Text className="text-gray-300 text-xs mb-5 text-center">Based on your assessment, we've created a personalized learning path to help you reach the next level.</Text>
          <View className="flex-row space-x-3">
            <TouchableOpacity className="flex-1 bg-white rounded-lg px-4 py-3 items-center mr-2">
              <Text className="text-[#8A5CFF] font-bold">Retake Assessment</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-[#8A5CFF] rounded-lg px-4 py-3 items-center">
              <Text className="text-white font-bold">Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
