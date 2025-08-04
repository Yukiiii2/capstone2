import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

export default function CommunityPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleSettings = () => router.push('/settings');
  const handleLogout = () => router.replace('/login-page');

  const handleTabNavigation = (tab: string) => {
    if (tab === 'Overview') router.push('/teacher-dashboard');
    if (tab === 'Community') router.push('/community-page');
    if (tab === 'Live Session') router.push('/teacher-live-sessions');
  };

  const getActiveTab = () => {
    if (pathname.includes('teacher-community')) return 'Community';
    if (pathname.includes('teacher-live-sessions')) return 'Live Session';
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
    <ScrollView
      className="flex-1 bg-[#0A0A1E]"
      contentContainerClassName="pb-10"
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Profile Menu */}
      <View className="bg-[#18182a] px-4 pt-8 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-6 h-6 rounded-full bg-purple-500 mr-2" />
            <Text className="text-white text-xl font-bold">Fluentech</Text>
          </View>
          <View className="flex-row items-center space-x-4">
            <Ionicons name="trophy-outline" size={22} color="#fff" />
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsProfileMenuVisible(true)}>
              <Image
                source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
                className="w-9 h-9 rounded-full ml-2 border-2 border-white"
              />
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
              className="absolute top-14 right-4 bg-[#1E1E2E] rounded-xl p-3 w-44"
              style={{
                transform: [{ translateY: slideAnim }],
                opacity: opacityAnim,
              }}
            >
              <Text className="text-white text-base font-bold mb-3">Sarah Johnson</Text>
              <TouchableOpacity onPress={handleSettings} className="py-2">
                <Text className="text-white text-sm">Settings</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        {/* Tab Bar */}
        <View className="flex-row mt-5 bg-[#23233b] rounded-xl p-1">
          {['Overview', 'Community', 'Live Session'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabNavigation(tab)}
              className={`flex-1 py-2 rounded-xl ${activeTab === tab ? 'bg-white/10' : ''}`}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === tab ? 'text-purple-400' : 'text-white/80'
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Title & Subtitle */}
      <View className="mx-4 mt-4 mb-2">
        <Text className="text-white text-lg font-bold">Video Peer Review</Text>
        <Text className="text-gray-400 text-xs mt-1">
          Review and provide feedback on community video recordings
        </Text>
      </View>

      {/* Overall Rating Card */}
      <View className="mx-4 bg-[#232346] rounded-2xl p-4 mb-4">
        <Text className="text-gray-300 text-xs mb-1">Overall Rating</Text>
        <View className="flex-row items-center">
          <Text className="text-white font-bold text-2xl">4.2</Text>
          <Ionicons name="star" size={18} color="#FFD700" className="ml-2" />
          <Text className="text-gray-400 ml-2 text-xs">Based on 18 reviews</Text>
        </View>
      </View>

      {/* Video Recording Card */}
      <View className="mx-4 bg-[#232346] rounded-2xl overflow-hidden mb-4">
        <View className="bg-purple-500 px-3 py-1 rounded-br-lg absolute top-0 left-0 z-10">
          <Text className="text-white text-xs font-bold">VIDEO RECORDING</Text>
        </View>
        <View className="w-full h-40 bg-[#b0aef7] items-center justify-center relative">
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80',
            }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 items-center justify-center flex-row">
            <View className="bg-white/80 w-12 h-12 rounded-full items-center justify-center">
              <Ionicons name="play" size={30} color="#a855f7" />
            </View>
          </View>
          <View className="absolute bottom-2 left-2 flex-row items-center">
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/women/32.jpg' }}
              className="w-8 h-8 rounded-full border-2 border-white"
            />
            <View className="ml-2">
              <Text className="text-white font-semibold text-xs">Sarah Johnson</Text>
              <Text className="text-white/70 text-xs">Quarterly Presentation Practice</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Session Card */}
      <View className="mx-4 bg-white rounded-2xl p-4 mb-4">
        <Text className="text-black font-bold text-base mb-1">
          Quarterly Sales Presentation - Practice Session
        </Text>
        <View className="flex-row items-center mb-2">
          <Ionicons name="eye-outline" size={14} color="#a3a3a3" />
          <Text className="text-gray-500 text-xs ml-1">127 views</Text>
          <Ionicons name="time-outline" size={14} color="#a3a3a3" className="ml-4" />
          <Text className="text-gray-500 text-xs ml-1">2 hours ago</Text>
          <Ionicons name="thumbs-up-outline" size={14} color="#34d399" className="ml-4" />
          <Text className="text-emerald-500 text-xs ml-1">24</Text>
        </View>
        <Text className="text-black font-semibold text-xs mb-2">More from Community</Text>
        <View className="flex-row mb-2">
          <View className="flex-1 bg-gray-100 rounded-xl flex-row items-center p-2 mr-2">
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/men/44.jpg' }}
              className="w-7 h-7 rounded-full mr-2"
            />
            <View className="flex-1">
              <Text className="text-black text-xs font-bold">Interview Practice Session</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="eye-outline" size={12} color="#a3a3a3" />
                <Text className="text-gray-500 text-[10px] ml-1">130</Text>
                <Ionicons name="time-outline" size={12} color="#a3a3a3" className="ml-2" />
                <Text className="text-gray-500 text-[10px] ml-1">3d</Text>
              </View>
            </View>
          </View>
          <View className="flex-1 bg-gray-100 rounded-xl flex-row items-center p-2">
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/men/47.jpg' }}
              className="w-7 h-7 rounded-full mr-2"
            />
            <View className="flex-1">
              <Text className="text-black text-xs font-bold">Spanish Conversation Practice</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="eye-outline" size={12} color="#a3a3a3" />
                <Text className="text-gray-500 text-[10px] ml-1">64</Text>
                <Ionicons name="time-outline" size={12} color="#a3a3a3" className="ml-2" />
                <Text className="text-gray-500 text-[10px] ml-1">6d</Text>
              </View>
            </View>
          </View>
        </View>
        <View className="flex-row justify-center items-center mt-1">
          <View className="w-2 h-2 rounded-full bg-purple-500 mx-1" />
          <View className="w-2 h-2 rounded-full bg-gray-300 mx-1" />
          <View className="w-2 h-2 rounded-full bg-gray-300 mx-1" />
        </View>
      </View>

      {/* Comments & Reviews Section */}
      <View className="mx-4 mb-6">
        <Text className="text-black font-bold text-base mb-2">Comments & Reviews</Text>
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 mb-3">
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#a855f7" />
          <TextInput
            className="flex-1 ml-2 text-xs text-black"
            placeholder="Share your feedback and review..."
            placeholderTextColor="#888"
          />
          <TouchableOpacity className="ml-2">
            <Ionicons name="send" size={18} color="#a855f7" />
          </TouchableOpacity>
        </View>
        <View className="bg-gray-100 rounded-xl p-3 mb-3">
          <Text className="text-black font-semibold text-xs mb-1">Rate This Recording</Text>
          <View className="flex-row items-center mb-1">
            <Text className="text-gray-500 text-xs">Delivery</Text>
            <View className="flex-row ml-2">
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < 4 ? 'star' : 'star-outline'}
                  size={16}
                  color="#FFD700"
                />
              ))}
            </View>
          </View>
          <View className="flex-row items-center mb-2">
            <Text className="text-gray-500 text-xs">Confidence</Text>
            <View className="flex-row ml-2">
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < 4 ? 'star' : 'star-outline'}
                  size={16}
                  color="#FFD700"
                />
              ))}
            </View>
          </View>
          <Text className="text-gray-500 text-xs mb-1">Overall Rating</Text>
          <View className="flex-row items-center mb-2">
            {[...Array(4)].map((_, i) => (
              <Ionicons key={i} name="star" size={16} color="#FFD700" />
            ))}
            <Ionicons name="star-outline" size={16} color="#FFD700" />
            <Text className="text-gray-500 text-xs ml-2">4 out of 5</Text>
          </View>
          <TouchableOpacity className="bg-purple-500 rounded-lg py-2 mt-1">
            <Text className="text-white font-bold text-xs text-center">Post Review</Text>
          </TouchableOpacity>
        </View>
        <View className="bg-gray-100 rounded-xl p-3 flex-row items-start">
          <View className="w-8 h-8 bg-purple-500/20 rounded-full items-center justify-center mr-3 mt-1">
            <Ionicons name="person" size={18} color="#a855f7" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-black font-bold text-xs mr-2">Teacher • Michael Chen</Text>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Ionicons name="star" size={14} color="#FFD700" />
              <Ionicons name="star" size={14} color="#FFD700" />
              <Ionicons name="star" size={14} color="#FFD700" />
              <Ionicons name="star-outline" size={14} color="#FFD700" />
              <Text className="text-gray-400 text-xs ml-2">1 hour ago</Text>
            </View>
            <Text className="text-gray-600 text-xs">
              Excellent presentation! Your confidence shows, and the slide visuals were clear. My only suggestion: maintain constant eye contact during your opening.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
