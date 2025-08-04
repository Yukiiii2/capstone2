import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';

export default function TeacherLiveSessions() {
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleNavigation = (page: string) => router.push(page);
  const handleLogout = () => router.replace('/login-page');
  const handleSettings = () => router.push('/settings');

  const getActiveTab = () => {
    if (pathname.includes('/teacher-dashboard')) return 'Overview';
    if (pathname.includes('/teacher-community')) return 'Community';
    if (pathname.includes('/teacher-live-sessions')) return 'Live Sessions';
    return '';
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
    <View className="flex-1">
      {/* Gradient Background */}
      <LinearGradient
        colors={['#0A0A0F', '#1A1A2E', '#16213E']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        className="absolute top-0 left-0 right-0 bottom-0"
        pointerEvents="none"
      >
        <View className="absolute top-[-60px] left-[-50px] w-40 h-40 rounded-full bg-purple-600 opacity-15" />
        <View className="absolute top-[100px] right-[-40px] w-24 h-24 rounded-full bg-blue-600 opacity-10" />
        <View className="absolute bottom-[100px] left-[50px] w-9 h-9 rounded-full bg-cyan-300 opacity-10" />
        <View className="absolute bottom-5 right-10 w-15 h-15 rounded-full bg-purple-400 opacity-10" />
        <View className="absolute top-[200px] left-[90px] w-6 h-6 rounded-full bg-cyan-300 opacity-10" />
      </LinearGradient>

      <ScrollView className="flex-1 px-4 pt-8">
        {/* Header */}
        <View className="flex-row items-center mb-3">
          <View className="w-7 h-7 rounded-full bg-purple-500 mr-2 items-center justify-center" />
          <Text className="text-white text-xl font-bold">Fluentech</Text>
          <View className="flex-1" />
          <View className="flex-row items-center space-x-3 relative">
            <TouchableOpacity>
              <Ionicons name="trophy-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsProfileMenuVisible(true)}>
              <View className="w-9 h-9 rounded-full ml-2 overflow-hidden border-2 border-white">
                <Image
                  source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
                  className="w-full h-full"
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Menu Modal */}
        <Modal
          visible={isProfileMenuVisible}
          transparent
          animationType="none"
          onRequestClose={() => setIsProfileMenuVisible(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/30"
            activeOpacity={1}
            onPressOut={() => setIsProfileMenuVisible(false)}
          >
            <Animated.View
              className="absolute top-14 right-4"
              style={{
                transform: [{ translateY: slideAnim }],
                opacity: opacityAnim,
              }}
            >
              <View className="bg-[#1E1E2E] rounded-lg p-3 w-44">
                <Text className="text-white text-base font-bold mb-3">Sarah Johnson</Text>
                <TouchableOpacity onPress={handleSettings} className="py-2">
                  <Text className="text-white text-sm">Settings</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        {/* Tab Bar */}
        <View className="flex-row bg-black/40 rounded-xl mb-6 p-1">
          {[
            { label: 'Overview', path: '/teacher-dashboard' },
            { label: 'Community', path: '/teacher-community' },
            { label: 'Live Sessions', path: '/teacher-live-sessions' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.label}
              className={`flex-1 items-center py-2 rounded-lg ${activeTab === tab.label ? 'bg-white' : ''}`}
              onPress={() => handleNavigation(tab.path)}
            >
              <Text className={`font-semibold ${activeTab === tab.label ? 'text-purple-500' : 'text-white/80'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title & Subtitle */}
        <View className="mt-2 mb-2">
          <Text className="text-white text-2xl font-bold mb-1">Join Live Sessions</Text>
          <Text className="text-gray-400 text-xs">Connect with experts and learn in real-time</Text>
        </View>

        {/* Info Banner */}
        <View className="mb-4 flex-row items-center bg-[#231942] rounded-xl px-4 py-3">
          <Ionicons name="information-circle-outline" size={18} color="#a855f7" />
          <Text className="text-white text-xs ml-2">Live sessions update in real-time</Text>
        </View>

        {/* Session Cards */}
        {[
          { name: 'Sarah Chen', title: 'Voice Warm-Up and Articulation', level: 'Basic' },
          { name: 'David Kim', title: 'Advanced Debate Practice', level: 'Advanced' },
          { name: 'Lisa Park', title: 'Eye Contact and Facial Expression', level: 'Basic' },
        ].map((session, i) => (
          <View key={i} className="mb-4 bg-[#232345] rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Text className="bg-red-500 text-white text-[11px] font-bold rounded px-2 py-0.5 mr-2">LIVE</Text>
                <Ionicons name="person-circle-outline" size={20} color="#8A5CFF" />
                <Text className="text-white font-bold ml-2">{session.name}</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="eye-outline" size={14} color="#aaa" />
                <Text className="text-gray-400 text-xs ml-1">127</Text>
              </View>
            </View>
            <Text className="text-white/90 font-semibold mb-1">{session.title}</Text>
            <View className="flex-row items-center mb-2">
              <Text className="bg-[#4F4FFF33] text-[#4F4FFF] text-xs font-bold rounded px-2 py-0.5 mr-2">{session.level}</Text>
            </View>
            <TouchableOpacity
              className="bg-[#6C47FF] rounded-xl px-4 py-2 self-start mt-1"
              onPress={() => handleNavigation('/teacher-live-session')}
            >
              <Text className="text-white text-xs font-bold">Join Session</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
