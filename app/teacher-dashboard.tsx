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
    if (tab === 'Live Sessions') router.push('/teacher-live-sessions');
  };

  const getActiveTab = () => {
    if (pathname.includes('teacher-community')) return 'Community';
    if (pathname.includes('teacher-live-sessions')) return 'Live Sessions';
    return 'Overview';
  };
  const activeTab = getActiveTab();

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

      <ScrollView className="flex-1" contentContainerClassName="pb-10" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-8 pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-6 h-6 rounded-full bg-purple-500 mr-2" />
              <Text className="text-white text-xl font-bold">Fluentech</Text>
            </View>
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
            <TouchableOpacity className="flex-1 bg-black/30" activeOpacity={1} onPressOut={() => setIsProfileMenuVisible(false)}>
              <Animated.View
                className="absolute top-14 right-4 w-44 bg-[#1E1E2E] p-3 rounded-xl"
                style={{ transform: [{ translateY: slideAnim }], opacity: opacityAnim }}
              >
                <Text className="text-white text-base font-bold mb-3">Teacher Name</Text>
                <TouchableOpacity onPress={() => router.push('/settings')} className="py-2">
                  <Text className="text-white text-sm">Settings</Text>
                </TouchableOpacity>
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
          {[
            { name: 'Sarah Chen', grade: 'Grade 8', status: 'Active', color: 'bg-purple-400', initials: 'SC', statusColor: 'text-purple-300' },
            { name: 'Alex Rodriguez', grade: 'Grade 7', status: 'Inactive', color: 'bg-green-300', initials: 'AR', statusColor: 'text-gray-300' },
            { name: 'James Wilson', grade: 'Grade 10', status: 'Inactive', color: 'bg-red-300', initials: 'JW', statusColor: 'text-gray-300' },
            { name: 'Emma Thompson', grade: 'Grade 9', status: 'Inactive', color: 'bg-yellow-300', initials: 'ET', statusColor: 'text-gray-300' },
            { name: 'Michael Park', grade: 'Grade 11', status: 'Inactive', color: 'bg-pink-400', initials: 'MP', statusColor: 'text-gray-300' },
            { name: 'Sofia Martinez', grade: 'Grade 12', status: 'Inactive', color: 'bg-blue-400', initials: 'SM', statusColor: 'text-gray-300' },
          ].map((student, i) => (
            <View key={i} className="flex-row items-center bg-[#232345] rounded-lg p-2 mb-2">
              <View className={`w-8 h-8 rounded-full ${student.color} items-center justify-center mr-2`}>
                <Text className="text-white font-bold">{student.initials}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-sm">{student.name}</Text>
                <Text className="text-xs text-gray-400">{student.grade}</Text>
              </View>
              <Text className={`text-xs font-bold ${student.statusColor}`}>{student.status}</Text>
            </View>
          ))}
        </View>

        {/* Main Student Info Card */}
        <View className="mx-4 bg-[#232345] rounded-2xl p-5 mb-4">
          <View className="flex-row items-center mb-3">
            <View className="w-12 h-12 rounded-full bg-purple-400 items-center justify-center mr-3">
              <Text className="text-white text-lg font-bold">SC</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">Sarah Chen</Text>
              <Text className="text-xs text-gray-400">
                Student ID: #001 <Text className="bg-[#8A5CFF] text-white px-2 py-0.5 rounded-lg ml-1">Enrolling</Text>
              </Text>
            </View>
          </View>

          {/* Progress Overview */}
          <View className="flex-row justify-between mb-3">
            {[
              { title: 'Module Progress', value: '8/12', desc: 'Modules Completed' },
              { title: 'Confidence Level', value: '85%', desc: 'Overall Confidence' },
              { title: 'Anxiety Level', value: 'Low', desc: 'Current Rating' },
            ].map((item, i) => (
              <View key={i} className="flex-1 bg-[#18182A] rounded-xl p-3 mx-1 items-center">
                <Text className="text-purple-400 text-xs font-bold mb-1">{item.title}</Text>
                <Text className={`text-lg font-bold ${item.title === 'Anxiety Level' ? 'text-blue-300' : 'text-white'}`}>{item.value}</Text>
                <Text className="text-xs text-gray-400">{item.desc}</Text>
              </View>
            ))}
          </View>

          {/* Skill Mastery & Tasks */}
          <View className="flex-row">
            {/* Skill Mastery Ratings */}
            <View className="flex-1 bg-[#18182A] rounded-xl p-3 mr-2">
              <Text className="text-white font-bold text-xs mb-2">Skill Mastery Ratings</Text>
              {[
                { label: 'Posture & Body Language', percent: 92 },
                { label: 'Voice Control', percent: 89 },
                { label: 'Presentation Structure', percent: 88 },
                { label: 'Audience Engagement', percent: 77 },
                { label: 'Q&A Response Skill', percent: 72 },
              ].map((skill, i) => (
                <View key={i} className="mb-1">
                  <Text className="text-gray-300 text-xs mb-0.5">{skill.label}</Text>
                  <View className="w-full h-2 rounded-full bg-[#3B3B5C] mb-0.5">
                    <View className="h-2 rounded-full bg-[#8A5CFF]" style={{ width: `${skill.percent}%` }} />
                  </View>
                  <Text className="text-purple-400 text-xs font-bold">{skill.percent}%</Text>
                </View>
              ))}
            </View>

            {/* Recent Completed Tasks */}
            <View className="flex-1 bg-[#18182A] rounded-xl p-3 ml-2">
              <Text className="text-white font-bold text-xs mb-2">Recent Completed Tasks</Text>
              {[
                { label: 'Public Speaking Fundamentals', value: '88%' },
                { label: 'Body Language Assessment', value: '92%' },
                { label: 'Voice Modulation Exercise', value: '78%' },
                { label: 'Q&A Simulation', value: '72%' },
              ].map((task, i) => (
                <View key={i} className="mb-1 flex-row justify-between items-center">
                  <Text className="text-gray-300 text-xs">{task.label}</Text>
                  <Text className="text-purple-400 text-xs font-bold">{task.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Performance Insights */}
        <View className="mx-4 flex-row mb-10">
          {[
            { title: 'Strengths', desc: 'Excellent presentation skills and high confidence level' },
            { title: 'Areas to Improve', desc: 'Q&A response techniques could be enhanced' },
            { title: 'Recommendations', desc: 'Advanced Q&A simulation exercises are recommended' },
          ].map((item, i) => (
            <View key={i} className="flex-1 bg-[#232345] rounded-2xl p-4 mx-1 items-center">
              <Text className="text-purple-400 font-bold text-xs mb-1">{item.title}</Text>
              <Text className="text-white text-xs text-center">{item.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
