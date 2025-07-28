import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VoiceReadingRecording() {
  return (
    <View className="flex-1 bg-[#0A0A1E]">
      {/* Decorative Circles */}
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 rounded-full bg-violet-600 opacity-15" />
      <View className="absolute top-[100px] right-[-40px] w-24 h-24 rounded-full bg-blue-600 opacity-10" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 rounded-full bg-cyan-300 opacity-10" />
      <View className="absolute bottom-5 right-10 w-15 h-15 rounded-full bg-purple-400 opacity-10" />
      <View className="absolute top-[200px] left-[90px] w-6 h-6 rounded-full bg-cyan-300 opacity-10" />

      <ScrollView className="flex-1" contentContainerStyle={{flexGrow: 1}} showsVerticalScrollIndicator={false}>
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
            <Text className="text-purple-400 font-bold">Exercise Speaking</Text>
          </View>
          <View className="px-3 py-1 rounded-lg mr-2 bg-[#18182A]">
            <Text className="text-white/80 font-semibold">Exercise Reading</Text>
          </View>
          <View className="px-3 py-1 rounded-lg bg-[#18182A]">
            <Text className="text-white/80 font-semibold">Community</Text>
          </View>
        </View>

        {/* Main Title & Subtitle */}
        <View className="px-4 mb-2">
          <Text className="text-white text-lg font-bold mb-1">Reading Confidence Assessment</Text>
          <Text className="text-gray-300 text-xs">Read the following passage aloud to help us evaluate your reading confidence level</Text>
        </View>

        {/* Assessment Card */}
        <View className="mx-4 bg-[#232345] rounded-2xl p-5 mb-4">
          <Text className="text-white font-bold text-base mb-1">Reading Assessment</Text>
          <Text className="text-gray-300 text-xs mb-2">Please read the following passage aloud:</Text>
          <View className="bg-[#E5E7EB] rounded-xl border border-[#8A5CFF44] px-4 py-3 mb-3">
            <Text className="text-[#232345] text-base leading-6 font-medium">
              AI is changing many areas, like health care and driving. It helps doctors, guides cars, and suggests things online. As AI becomes more part of our lives, we need to think about its advantages and problems.
            </Text>
          </View>

          <Text className="text-gray-400 text-xs mb-3">Click the microphone button and read the passage clearly. You have up to 60 seconds to complete the reading.</Text>
          {/* Progress Dots */}
          <View className="flex-row justify-center items-center mb-5 space-x-2">
            <View className="w-2 h-2 rounded-full bg-blue-400" />
            <View className="w-2 h-2 rounded-full bg-white/30" />
            <View className="w-2 h-2 rounded-full bg-white/30" />
            <View className="w-2 h-2 rounded-full bg-white/30" />
            <View className="w-2 h-2 rounded-full bg-white/30" />
          </View>
          {/* Mic Button */}
          <View className="items-center mb-2">
            <TouchableOpacity className="w-16 h-16 rounded-full bg-[#8A5CFF] items-center justify-center shadow-lg">
              <Ionicons name="mic" size={38} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Buttons */}
        <View className="flex-row justify-between px-4 mb-8">
          <TouchableOpacity className="flex-1 bg-white/10 rounded-xl py-3 items-center mr-2">
            <Text className="text-white font-bold">Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-[#8A5CFF] rounded-xl py-3 items-center ml-2">
            <Text className="text-white font-bold">See Results</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
     