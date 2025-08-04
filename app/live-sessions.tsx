import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function LiveSessions() {
  const router = useRouter();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleNavigation = (page: string) => {
    router.push(page);
  };

  const handleLogout = () => {
    router.replace('/login-page');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

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
      <View className="absolute top-0 left-0 right-0 bottom-0">
        <LinearGradient
          colors={['#0A0A0F', '#1A1A2E', '#16213E']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        >
          {/* Floating Circles */}
          <View className="absolute top-[-60px] left-[-50px] w-[160px] h-[160px] rounded-full bg-[#7c3aed] opacity-[0.13]" />
          <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] rounded-full bg-[#2563eb] opacity-10" />
          <View className="absolute bottom-[100px] left-[50px] w-9 h-9 rounded-full bg-[#43e6ff] opacity-[0.09]" />
          <View className="absolute bottom-5 right-10 w-[60px] h-[60px] rounded-full bg-[#a259ff] opacity-[0.09]" />
          <View className="absolute top-[200px] left-[90px] w-[22px] h-[22px] rounded-full bg-[#43e6ff] opacity-10" />
        </LinearGradient>
      </View>

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
              style={{
                transform: [{ translateY: slideAnim }],
                opacity: opacityAnim,
              }}
              className="absolute top-[55px] right-4"
            >
              <View className="bg-[#1E1E2E] rounded-lg p-3 w-[180px]">
                <Text className="text-white text-lg font-bold mb-3">Sarah Johnson</Text>
                <TouchableOpacity onPress={handleSettings} className="py-2">
                  <Text className="text-white text-sm">Settings</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        {/* Tab Bar */}
        <View className="flex-row bg-black/40 rounded-xl mb-6 p-1">
          <TouchableOpacity className="flex-1 items-center py-2 rounded-lg" onPress={() => handleNavigation('/home-page')}>
            <Text className="text-white/80">Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 items-center py-2 rounded-lg" onPress={() => handleNavigation('/exercise-speaking')}>
            <Text className="text-white/80">Speaking</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 items-center py-2 rounded-lg" onPress={() => handleNavigation('/exercise-reading')}>
            <Text className="text-white/80">Reading</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 items-center py-2 rounded-lg" onPress={() => handleNavigation('/community-page')}>
            <Text className="text-white/80">Community</Text>
          </TouchableOpacity>
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
                <Text className="bg-[#FF4F4F] text-white text-[11px] font-bold rounded px-2 py-0.5 mr-2">LIVE</Text>
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
              onPress={() => handleNavigation('/live-session')}
            >
              <Text className="text-white text-xs font-bold">Join Session</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
