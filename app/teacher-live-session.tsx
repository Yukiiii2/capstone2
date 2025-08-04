import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function TeacherLiveSession() {
  const router = useRouter();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleNavigation = (page: string) => router.push(page);
  const handleLogout = () => router.replace('/login-page');
  const handleSettings = () => router.push('/settings');

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
          <TouchableOpacity className="flex-1 items-center py-2 rounded-lg" onPress={() => handleNavigation('/teacher-dashboard')}>
            <Text className="text-white/80">Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 items-center py-2 rounded-lg" onPress={() => handleNavigation('/teacher-community')}>
            <Text className="text-white/80">Community</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 items-center py-2 rounded-lg bg-white" onPress={() => handleNavigation('/teacher-live-sessions')}>
            <Text className="text-purple-600 font-bold">Live Sessions</Text>
          </TouchableOpacity>
        </View>

        {/* Session Info */}
        <Text className="text-white text-xl font-bold mb-2">Live Session</Text>
        <View className="flex-row items-center mb-4">
          <View className="bg-red-500 px-2 py-0.5 rounded mr-2">
            <Text className="text-white text-[11px] font-bold">LIVE</Text>
          </View>
          <Ionicons name="eye-outline" size={16} color="#aaa" />
          <Text className="text-gray-400 text-sm ml-1">127 viewers</Text>
        </View>

        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1646243425301-d733db6f5821' }}
          className="w-full h-52 rounded-xl mb-4"
          resizeMode="cover"
        />

        <View className="bg-[#1C1C3A] rounded-xl p-4 flex-row items-center mb-6">
          <View className="w-12 h-12 rounded-full bg-green-400 items-center justify-center mr-4">
            <Text className="text-white font-bold">MC</Text>
          </View>
          <View>
            <Text className="text-white font-bold text-base">Dr. Michael Chen</Text>
            <Text className="text-gray-400 text-sm">Professor of Computer Science</Text>
          </View>
        </View>

        {/* Reactions */}
        <View className="flex-row justify-around mb-6">
          <View className="flex-row items-center">
            <Ionicons name="heart" size={20} color="#FF4F4F" />
            <Text className="text-white ml-1">26</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="happy" size={20} color="#FACC15" />
            <Text className="text-white ml-1">19</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="bulb" size={20} color="#8A5CFF" />
            <Text className="text-white ml-1">17</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity className="bg-[#8A5CFF] rounded-lg py-4 mb-8" onPress={() => handleNavigation('/teacher-live-sessions')}>
          <Text className="text-white text-center font-bold text-base">More Live Sessions</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
