import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

export default function TeacherDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleIconPress = (iconName: string) => {
    if (iconName === 'log-out-outline') router.replace('/login-page');
  };
  const handleTabNavigation = (tab: string) => {
    if (tab === 'Overview') router.push('/teacher-dashboard');
    if (tab === 'Community') router.push('/teacher-community');
    if (tab === 'Live Sessions') router.push('/live-sessions');
  };

  const getActiveTab = () => {
    if (pathname.includes('teacher-community')) return 'Community';
    if (pathname.includes('live-sessions')) return 'Live Sessions';
    return 'Overview';
  };
  const activeTab = getActiveTab();

  // Animate profile popup
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

  return (
    <View className="flex-1 bg-[#0A0A1E]">
      {/* Decorative Circles */}
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 rounded-full bg-violet-600 opacity-15" />
      <View className="absolute top-[100px] right-[-40px] w-24 h-24 rounded-full bg-blue-600 opacity-10" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 rounded-full bg-cyan-300 opacity-10" />
      <View className="absolute bottom-5 right-10 w-15 h-15 rounded-full bg-purple-400 opacity-10" />
      <View className="absolute top-[200px] left-[90px] w-6 h-6 rounded-full bg-cyan-300 opacity-10" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-8 pb-2">
          <View className="flex-row items-center justify-between">
            {/* Logo */}
            <View className="flex-row items-center">
              <View className="w-6 h-6 rounded-full bg-purple-500 mr-2" />
              <Text className="text-white text-xl font-bold">Fluentech</Text>
            </View>
            {/* Icons & Profile */}
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity><Ionicons name="grid-outline" size={20} color="#fff" /></TouchableOpacity>
              <TouchableOpacity><Ionicons name="notifications-outline" size={20} color="#fff" /></TouchableOpacity>
              <TouchableOpacity><Ionicons name="alert-outline" size={20} color="#fff" /></TouchableOpacity>
              <TouchableOpacity onPress={() => handleIconPress('log-out-outline')}>
                <Ionicons name="log-out-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsProfileMenuVisible(true)}>
                <Image source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} className="w-9 h-9 rounded-full border-2 border-white/20" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Menu */}
          <Modal visible={isProfileMenuVisible} transparent animationType="none" onRequestClose={() => setIsProfileMenuVisible(false)}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}
              activeOpacity={1}
              onPressOut={() => setIsProfileMenuVisible(false)}
            >
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 55,
                  right: 16,
                  transform: [{ translateY: slideAnim }],
                  opacity: opacityAnim,
                }}
              >
                <View style={{ backgroundColor: '#1E1E2E', borderRadius: 10, padding: 10, width: 180 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Teacher Name</Text>
                  <TouchableOpacity onPress={() => router.push('/settings')} style={{ paddingVertical: 8 }}>
                    <Text style={{ color: 'white', fontSize: 14 }}>Settings</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </Modal>

          {/* Tab Bar */}
          <View className="flex-row bg-white/5 rounded-xl p-1 mt-4 mb-2">
            {['Overview', 'Community', 'Live Sessions'].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => handleTabNavigation(tab)}
                className={`flex-1 px-3 py-2 rounded-lg ${activeTab === tab ? 'bg-white/80' : ''}`}
              >
                <Text className={`text-xs font-bold text-center ${activeTab === tab ? 'text-violet-600' : 'text-white/80'}`}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dashboard Title */}
        <Text className="text-white text-2xl font-bold px-4 mb-3">DASHBOARD</Text>

        {/* Student Management Card */}
        <View className="mx-4 bg-[#18182A] rounded-2xl p-4 mb-4">
          <Text className="text-white font-bold text-base mb-2">Student Management</Text>
          <View className="flex-row mb-2 space-x-2">
            <TextInput className="flex-1 bg-[#232345] rounded-lg px-3 py-2 text-white text-sm" placeholder="Search students..." placeholderTextColor="#aaa" />
            <TouchableOpacity className="bg-[#8A5CFF] rounded-lg px-4 py-2 items-center justify-center">
              <Text className="text-white text-xs font-bold">Clear Filters</Text>
            </TouchableOpacity>
          </View>
          {/* Student List */}
          <View className="space-y-2">
            <View className="flex-row items-center bg-[#231942] rounded-lg p-2">
              <View className="w-8 h-8 rounded-full bg-purple-400 items-center justify-center mr-2"><Text className="text-white font-bold">SC</Text></View>
              <View className="flex-1"><Text className="text-white font-bold text-sm">Sarah Chen</Text><Text className="text-xs text-gray-400">Grade 8</Text></View>
              <Text className="text-xs text-purple-300 font-bold">Active</Text>
            </View>
            <View className="flex-row items-center bg-[#232345] rounded-lg p-2">
              <View className="w-8 h-8 rounded-full bg-green-300 items-center justify-center mr-2"><Text className="text-white font-bold">AR</Text></View>
              <View className="flex-1"><Text className="text-white font-bold text-sm">Alex Rodriguez</Text><Text className="text-xs text-gray-400">Grade 7</Text></View>
              <Text className="text-xs text-gray-300">Inactive</Text>
            </View>
            <View className="flex-row items-center bg-[#232345] rounded-lg p-2">
              <View className="w-8 h-8 rounded-full bg-red-300 items-center justify-center mr-2"><Text className="text-white font-bold">JW</Text></View>
              <View className="flex-1"><Text className="text-white font-bold text-sm">James Wilson</Text><Text className="text-xs text-gray-400">Grade 10</Text></View>
              <Text className="text-xs text-gray-300">Inactive</Text>
            </View>
            <View className="flex-row items-center bg-[#232345] rounded-lg p-2">
              <View className="w-8 h-8 rounded-full bg-yellow-300 items-center justify-center mr-2"><Text className="text-white font-bold">ET</Text></View>
              <View className="flex-1"><Text className="text-white font-bold text-sm">Emma Thompson</Text><Text className="text-xs text-gray-400">Grade 9</Text></View>
              <Text className="text-xs text-gray-300">Inactive</Text>
            </View>
            <View className="flex-row items-center bg-[#232345] rounded-lg p-2">
              <View className="w-8 h-8 rounded-full bg-pink-400 items-center justify-center mr-2"><Text className="text-white font-bold">MP</Text></View>
              <View className="flex-1"><Text className="text-white font-bold text-sm">Michael Park</Text><Text className="text-xs text-gray-400">Grade 11</Text></View>
              <Text className="text-xs text-gray-300">Inactive</Text>
            </View>
            <View className="flex-row items-center bg-[#232345] rounded-lg p-2">
              <View className="w-8 h-8 rounded-full bg-blue-400 items-center justify-center mr-2"><Text className="text-white font-bold">SM</Text></View>
              <View className="flex-1"><Text className="text-white font-bold text-sm">Sofia Martinez</Text><Text className="text-xs text-gray-400">Grade 12</Text></View>
              <Text className="text-xs text-gray-300">Inactive</Text>
            </View>
          </View>
        </View>

        {/* Main Student Info Card */}
        <View className="mx-4 bg-[#232345] rounded-2xl p-5 mb-4">
          <View className="flex-row items-center mb-3">
            <View className="w-12 h-12 rounded-full bg-purple-400 items-center justify-center mr-3"><Text className="text-white text-lg font-bold">SC</Text></View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">Sarah Chen</Text>
              <Text className="text-xs text-gray-400">Student ID: #001 <Text className="bg-[#8A5CFF] text-white px-2 py-0.5 rounded-lg ml-1">Enrolling</Text></Text>
            </View>
          </View>
          <View className="flex-row justify-between mb-3">
            <View className="flex-1 bg-[#18182A] rounded-xl p-3 mr-2 items-center">
              <Text className="text-purple-400 text-xs font-bold mb-1">Module Progress</Text>
              <Text className="text-white text-lg font-bold">8/12</Text>
              <Text className="text-xs text-gray-400">Modules Completed</Text>
            </View>
            <View className="flex-1 bg-[#18182A] rounded-xl p-3 mx-1 items-center">
              <Text className="text-purple-400 text-xs font-bold mb-1">Confidence Level</Text>
              <Text className="text-white text-lg font-bold">85%</Text>
              <Text className="text-xs text-gray-400">Overall Confidence</Text>
            </View>
            <View className="flex-1 bg-[#18182A] rounded-xl p-3 ml-2 items-center">
              <Text className="text-purple-400 text-xs font-bold mb-1">Anxiety Level</Text>
              <Text className="text-blue-300 text-lg font-bold">Low</Text>
              <Text className="text-xs text-gray-400">Current Rating</Text>
              <View className="flex-row mt-1 space-x-1">
                <Text className="text-xs text-blue-300 underline">Low</Text>
                <Text className="text-xs text-gray-500">Medium</Text>
                <Text className="text-xs text-gray-500">High</Text>
              </View>
            </View>
          </View>
          {/* Skill Mastery Ratings & Recent Completed Tasks */}
          <View className="flex-row">
            {/* Skill Mastery Ratings */}
            <View className="flex-1 bg-[#18182A] rounded-xl p-3 mr-2">
              <Text className="text-white font-bold text-xs mb-2">Skill Mastery Ratings</Text>
              <View className="mb-1"><Text className="text-gray-300 text-xs mb-0.5">Posture & Body Language</Text><View className="w-full h-2 rounded-full bg-[#3B3B5C] mb-0.5"><View className="h-2 rounded-full bg-[#8A5CFF]" style={{width:'92%'}} /></View><Text className="text-purple-400 text-xs font-bold">92%</Text></View>
              <View className="mb-1"><Text className="text-gray-300 text-xs mb-0.5">Voice Control</Text><View className="w-full h-2 rounded-full bg-[#3B3B5C] mb-0.5"><View className="h-2 rounded-full bg-[#8A5CFF]" style={{width:'89%'}} /></View><Text className="text-purple-400 text-xs font-bold">89%</Text></View>
              <View className="mb-1"><Text className="text-gray-300 text-xs mb-0.5">Presentation Structure</Text><View className="w-full h-2 rounded-full bg-[#3B3B5C] mb-0.5"><View className="h-2 rounded-full bg-[#8A5CFF]" style={{width:'88%'}} /></View><Text className="text-purple-400 text-xs font-bold">88%</Text></View>
              <View className="mb-1"><Text className="text-gray-300 text-xs mb-0.5">Audience Engagement</Text><View className="w-full h-2 rounded-full bg-[#3B3B5C] mb-0.5"><View className="h-2 rounded-full bg-[#8A5CFF]" style={{width:'77%'}} /></View><Text className="text-purple-400 text-xs font-bold">77%</Text></View>
              <View className="mb-1"><Text className="text-gray-300 text-xs mb-0.5">Q&A Response Skill</Text><View className="w-full h-2 rounded-full bg-[#3B3B5C] mb-0.5"><View className="h-2 rounded-full bg-[#8A5CFF]" style={{width:'72%'}} /></View><Text className="text-purple-400 text-xs font-bold">72%</Text></View>
            </View>
            {/* Recent Completed Tasks */}
            <View className="flex-1 bg-[#18182A] rounded-xl p-3 ml-2">
              <Text className="text-white font-bold text-xs mb-2">Recent Completed Tasks</Text>
              <View className="mb-1 flex-row justify-between items-center"><Text className="text-gray-300 text-xs">Public Speaking Fundamentals</Text><Text className="text-purple-400 text-xs font-bold">88%</Text></View>
              <View className="mb-1 flex-row justify-between items-center"><Text className="text-gray-300 text-xs">Body Language Assessment</Text><Text className="text-purple-400 text-xs font-bold">92%</Text></View>
              <View className="mb-1 flex-row justify-between items-center"><Text className="text-gray-300 text-xs">Voice Modulation Exercise</Text><Text className="text-purple-400 text-xs font-bold">78%</Text></View>
              <View className="mb-1 flex-row justify-between items-center"><Text className="text-gray-300 text-xs">Q&A Simulation</Text><Text className="text-purple-400 text-xs font-bold">72%</Text></View>
            </View>
          </View>
        </View>

        {/* Performance Insights */}
        <View className="mx-4 flex-row mb-10">
          <View className="flex-1 bg-[#232345] rounded-2xl p-4 mr-2 items-center">
            <Text className="text-purple-400 font-bold text-xs mb-1">Strengths</Text>
            <Text className="text-white text-xs text-center">Excellent presentation skills and high confidence level</Text>
          </View>
          <View className="flex-1 bg-[#232345] rounded-2xl p-4 mx-1 items-center">
            <Text className="text-purple-400 font-bold text-xs mb-1">Areas to Improve</Text>
            <Text className="text-white text-xs text-center">Q&A response techniques could be enhanced</Text>
          </View>
          <View className="flex-1 bg-[#232345] rounded-2xl p-4 ml-2 items-center">
            <Text className="text-purple-400 font-bold text-xs mb-1">Recommendations</Text>
            <Text className="text-white text-xs text-center">Advanced Q&A simulation exercises are recommended</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

