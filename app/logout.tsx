import React from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LogoutScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-indigo-900 to-purple-800 justify-center items-center px-6">
      <View className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md border border-white/20 shadow-2xl shadow-black/50">
        {/* Header with icon */}
        <View className="items-center mb-6">
          <View className="bg-white/20 p-5 rounded-full mb-4">
            <Ionicons name="exit-outline" size={40} color="white" />
          </View>
          <Text className="text-white text-3xl font-bold text-center">See You Later!</Text>
          <Text className="text-white/80 text-center mt-2 text-base">
            You've been successfully logged out.
          </Text>
          <Text className="text-white/80 text-center mt-1 text-base">
            Thanks for using our platform!
          </Text>
        </View>

        {/* Stats cards */}
        <View className="bg-white/5 rounded-2xl p-5 mb-6 border border-white/10">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={20} color="#A78BFA" />
              <Text className="text-white ml-2 text-sm">Session Time</Text>
            </View>
            <Text className="text-white font-bold text-lg">2h 34m</Text>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-done-outline" size={20} color="#A78BFA" />
              <Text className="text-white ml-2 text-sm">Tasks Completed</Text>
            </View>
            <Text className="text-white font-bold text-lg">8</Text>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Ionicons name="trophy-outline" size={20} color="#A78BFA" />
              <Text className="text-white ml-2 text-sm">Points Earned</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="add-circle" size={20} color="#4ADE80" />
              <Text className="text-green-400 font-bold text-lg ml-1">125</Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View className="space-y-4">
          <TouchableOpacity 
            className="bg-indigo-600 rounded-2xl py-4 items-center shadow-lg shadow-indigo-900/50 active:bg-indigo-700"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-lg">Login Again</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-white/10 rounded-2xl py-4 items-center border border-white/20 active:bg-white/20"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Go to Homepage</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="items-center mt-8">
          <Text className="text-white/40 text-xs">© 2023 AppName • v2.4.1</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LogoutScreen;