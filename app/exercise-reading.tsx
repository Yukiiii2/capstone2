import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Animated, Modal, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


export default function ExerciseReading() {
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleSettings = () => router.push('/settings');
  const handleLogout = () => router.replace('/login-page');

  const handleTabNavigation = (tab: string) => {
    if (tab === 'Overview') router.push('/home-page');
    if (tab === 'Speaking') router.push('/exercise-speaking');
    if (tab === 'Reading') router.push('/exercise-reading');
    if (tab === 'Community') router.push('/community-page');
  };

  // Animate profile menu
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

  // Determine active tab based on route
  const getActiveTab = () => {
    if (pathname.includes('exercise-speaking')) return 'Speaking';
    if (pathname.includes('exercise-reading')) return 'Reading';
    if (pathname.includes('community-page')) return 'Community';
    return 'Overview';
  };
  const activeTab = getActiveTab();

  return (
    <View style={{ flex: 1 }}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#0A0A0F', '#1A1A2E', '#16213E']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        {/* Decorative Circles */}
        <View style={{ position: 'absolute', top: -60, left: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: '#7c3aed', opacity: 0.13 }} />
        <View style={{ position: 'absolute', top: 100, right: -40, width: 90, height: 90, borderRadius: 45, backgroundColor: '#2563eb', opacity: 0.10 }} />
        <View style={{ position: 'absolute', bottom: 100, left: 50, width: 36, height: 36, borderRadius: 18, backgroundColor: '#43e6ff', opacity: 0.09 }} />
        <View style={{ position: 'absolute', bottom: 20, right: 40, width: 60, height: 60, borderRadius: 30, backgroundColor: '#a259ff', opacity: 0.09 }} />
        <View style={{ position: 'absolute', top: 200, left: 90, width: 22, height: 22, borderRadius: 11, backgroundColor: '#43e6ff', opacity: 0.10 }} />
      </LinearGradient>

      <ScrollView className="flex-1 bg-transparent px-5 pt-10">
        {/* Header with Profile Menu */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-2">
            <View className="w-7 h-7 rounded-lg bg-[#8A5CFF] items-center justify-center">
              <View className="w-3 h-3 bg-white rounded" />
            </View>
            <Text className="text-white text-xl font-bold">Vocaria</Text>
          </View>
          <View className="flex-row items-center gap-4">
            <Ionicons name="cloud-outline" size={22} color="#fff" />
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsProfileMenuVisible(true)}>
              <Image source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} className="w-8 h-8 rounded-full border-2 border-[#8A5CFF]" />
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
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>John Doe</Text>
                <TouchableOpacity onPress={handleSettings} style={{ paddingVertical: 8 }}>
                  <Text style={{ color: 'white', fontSize: 14 }}>Settings</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        {/* Navigation Tabs */}
        <View className="flex-row bg-[#23233b] rounded-xl mb-6">
          {['Overview', 'Speaking', 'Reading', 'Community'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabNavigation(tab)}
              className={`flex-1 py-2 rounded-xl ${activeTab === tab ? 'bg-white/10' : ''}`}
            >
              <Text className={`font-semibold text-center ${activeTab === tab ? 'text-[#8A5CFF]' : 'text-white'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section Title */}
        <View className="mb-4">
          <Text className="text-white text-lg font-bold">Basic Reading Practice Modules</Text>
          <Text className="text-[#b3b3c6] text-base mb-2">
            Start your reading journey with foundational skills and essential techniques
          </Text>
          <TouchableOpacity className="bg-[#8A5CFF] px-6 py-3 rounded-lg self-start">
            <Text className="text-white font-semibold">Start Learning</Text>
          </TouchableOpacity>
        </View>

      {/* Modules */}
      <View className="gap-4 mb-8">
        {/* Module 1 */}
        <View className="bg-[#23233b] rounded-xl p-4 mb-2">
          <View className="flex-row items-center mb-1">
            <View className="w-6 h-6 rounded-lg bg-[#8A5CFF] items-center justify-center mr-2">
              <View className="w-3 h-3 bg-white rounded" />
            </View>
            <Text className="text-[#B3A6FF] text-xs font-semibold">BASIC</Text>
          </View>
          <Text className="text-white text-base font-bold mb-1">Reading Fundamentals</Text>
          <Text className="text-[#b3b3c6] text-xs mb-1">Master the basics of effective reading with foundational techniques and comprehension strategies.</Text>
          <Text className="text-[#b3b3c6] text-xs mb-1">75% Complete</Text>
          <View className="h-2 bg-[#39395a] rounded-full mb-2">
            <View className="h-2 bg-[#8A5CFF] rounded-full" style={{ width: '75%' }} />
          </View>
          <TouchableOpacity className="bg-[#8A5CFF] rounded-lg py-2 mt-1">
            <Text className="text-white text-center font-semibold">Select Module</Text>
          </TouchableOpacity>
        </View>

        {/* Module 2 */}
        <View className="bg-[#23233b] rounded-xl p-4 mb-2">
          <View className="flex-row items-center mb-1">
            <View className="w-6 h-6 rounded-lg bg-[#8A5CFF] items-center justify-center mr-2">
              <View className="w-3 h-3 bg-white rounded" />
            </View>
            <Text className="text-[#B3A6FF] text-xs font-semibold">ADVANCE</Text>
          </View>
          <Text className="text-white text-base font-bold mb-1">Vocabulary Building Basics</Text>
          <Text className="text-[#b3b3c6] text-xs mb-1">Build your vocabulary foundation with essential words and context clues for better comprehension.</Text>
          <Text className="text-[#b3b3c6] text-xs mb-1">40% Complete</Text>
          <View className="h-2 bg-[#39395a] rounded-full mb-2">
            <View className="h-2 bg-[#8A5CFF] rounded-full" style={{ width: '40%' }} />
          </View>
          <TouchableOpacity className="bg-[#8A5CFF] rounded-lg py-2 mt-1">
            <Text className="text-white text-center font-semibold">Select Module</Text>
          </TouchableOpacity>
        </View>

        {/* Module 3 */}
        <View className="bg-[#23233b] rounded-xl p-4 mb-2">
          <View className="flex-row items-center mb-1">
            <View className="w-6 h-6 rounded-lg bg-[#8A5CFF] items-center justify-center mr-2">
              <View className="w-3 h-3 bg-white rounded" />
            </View>
            <Text className="text-[#B3A6FF] text-xs font-semibold">ADVANCE</Text>
          </View>
          <Text className="text-white text-base font-bold mb-1">Sentence Structure & Grammar</Text>
          <Text className="text-[#b3b3c6] text-xs mb-1">Understand basic sentence patterns and grammar rules to improve reading comprehension.</Text>
          <Text className="text-[#b3b3c6] text-xs mb-1">40% Complete</Text>
          <View className="h-2 bg-[#39395a] rounded-full mb-2">
            <View className="h-2 bg-[#8A5CFF] rounded-full" style={{ width: '40%' }} />
          </View>
          <TouchableOpacity className="bg-[#8A5CFF] rounded-lg py-2 mt-1">
            <Text className="text-white text-center font-semibold">Select Module</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Sessions */}
      <View className="mb-8">
        <Text className="text-white text-lg font-bold mb-2">Recent Training Sessions</Text>
        <View className="bg-[#23233b] rounded-xl p-4 mb-2 flex-row items-center">
          <View className="w-6 h-6 rounded-lg bg-[#8A5CFF] items-center justify-center mr-2">
            <Ionicons name="book-outline" size={18} color="#fff" />
          </View>
          <View>
            <Text className="text-white text-base font-bold">Reading Fundamentals - Chapter 2</Text>
            <Text className="text-[#b3b3c6] text-xs">Completed with 96% comprehension rate</Text>
          </View>
        </View>
        <View className="bg-[#23233b] rounded-xl p-4 mb-2 flex-row items-center">
          <View className="w-6 h-6 rounded-lg bg-[#8A5CFF] items-center justify-center mr-2">
            <Ionicons name="list-outline" size={18} color="#fff" />
          </View>
          <View>
            <Text className="text-white text-base font-bold">Vocabulary Quiz - Basic Level</Text>
            <Text className="text-[#b3b3c6] text-xs">Perfect score on 20 vocabulary terms</Text>
          </View>
        </View>
        <View className="bg-[#23233b] rounded-xl p-4 mb-2 flex-row items-center">
          <View className="w-6 h-6 rounded-lg bg-[#8A5CFF] items-center justify-center mr-2">
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
          </View>
          <View>
            <Text className="text-white text-base font-bold">Audience Engagement Basics - Next</Text>
            <Text className="text-[#b3b3c6] text-xs">Completed sentence structure exercises</Text>
          </View>
        </View>
      </View>
    </ScrollView>
    </View>
  );
}