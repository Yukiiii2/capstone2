import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

const studentFeatures = [
  'AI-powered speech analysis',
  'Real-time progress tracking',
  'Live Video Practice and Community Feedback',
  'Neural feedback system',
];

const teacherFeatures = [
  'Advanced analytics dashboard',
  'Smart classroom management',
  'Live Video Practice and Community Feedback',
  'Tracking and monitoring',
];

export default function RoleSelection() {
  const router = useRouter();

  const handleSelectRole = (role: 'student' | 'teacher') => {
    if (role === 'student') {
      router.push('/login-student');
    } else {
      router.push('/login-teacher');
    }
  };

  return (
    <View className="flex-1 bg-gray-900">
      {/* Gradient Background */}
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#0F172A']}
        className="absolute inset-0"
      />

      {/* Decorative Circles */}
      <View className="absolute w-40 h-40 bg-purple-500/10 rounded-full -top-20 -left-20" />
      <View className="absolute w-24 h-24 bg-blue-500/10 rounded-full top-1/4 -right-12" />
      <View className="absolute w-28 h-28 bg-purple-500/5 rounded-full top-15 right-12" />
      <View className="absolute w-32 h-32 bg-pink-500/5 rounded-full bottom-24 left-1/6" />
      <View className="absolute w-36 h-36 bg-purple-400/5 rounded-full -bottom-5 -right-8 z-10" />

      {/* Header */}
      <TouchableOpacity
        className="flex-row items-center pt-10 pb-4 px-4 z-10"
        onPress={() => router.push('/landing-page')}
        activeOpacity={0.8}
      >
        <Image
          source={require('../assets/Speaksy.png')}
          className="w-12 h-12 rounded-2xl"
          resizeMode="contain"
        />
        <Text className="text-white text-3xl font-bold tracking-wider ml-0.5">
          Voclaria
        </Text>
      </TouchableOpacity>

      {/* Scrollable Cards */}
      <ScrollView contentContainerClassName="pb-10">
        <View className="px-4 w-full max-w-[400px] self-center">
          {/* Title */}
          <View className="items-center mb-4">
            <View className="rounded-xl border border-white/30 bg-white/5 px-4 py-2 mb-1">
              <Text className="text-white font-bold text-2xl tracking-wide">
                Choose Your Path
              </Text>
            </View>
            <Text className="text-[#bfc9e0] text-sm text-center mt-2 leading-6">
              Experience the future of communication
              {Platform.OS === 'ios' ? '\n' : ' '}
              learning with AI-powered personalization
            </Text>
          </View>

          {/* Student Card */}
          <BlurView intensity={10} tint="dark" className="rounded-xl p-3 mb-4 bg-[white]/10 border border-white/30">
            <View className="flex-row items-center justify-between mb-3">
              <TouchableOpacity activeOpacity={0.9} onPress={() => handleSelectRole('student')}>
                <LinearGradient
                  colors={['#a78bfa', '#7c3aed']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  className="rounded-xl py-2.5 px-4 flex-row items-center min-w-[160px]"
                >
                  <Text className="text-white font-bold text-[19px] mr-[55px] ml-[42px]">
                    Select Student
                  </Text>
                  <Ionicons name="chevron-forward" size={22} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              <View className="ml-[2px] bg-[#7035d630] rounded-[16px] w-[44px] h-[44px] items-center justify-center shadow-lg shadow-[#a78bfa3d]">
                <Text className="text-[32px] ml-[2]">🎓</Text>
              </View>
            </View>
            {studentFeatures.map((f) => (
              <View
                key={f}
                className="flex-row items-center bg-[white]/10 rounded-xl py-2.5 px-5 mb-2.5 border border-white/20"
              >
                <View className="w-2.5 h-2.5 rounded-full mr-2.5 bg-[#a78bfa]" />
                <Text className="text-[#bfc9e0] text-xs">{f}</Text>
              </View>
            ))}
          </BlurView>

          {/* Teacher Card */}
          <BlurView intensity={10} tint="dark" className="rounded-xl p-3 mb-4 bg-[white]/10 border border-white/30">
            <View className="flex-row items-center justify-between mb-3">
              <TouchableOpacity activeOpacity={0.9} onPress={() => handleSelectRole('teacher')}>
                <LinearGradient
                  colors={['#a78bfa', '#7c3aed']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  className="rounded-xl py-2.5 px-4 flex-row items-center min-w-[160px]"
                >
                  <Text className="text-white font-bold text-[19px] mr-[55px] ml-[42px]">
                    Select Teacher
                  </Text>
                  <Ionicons name="chevron-forward" size={22} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              <View className="ml-[2px] bg-[#7035d630] rounded-[16px] w-[42px] h-[42px] items-center justify-center shadow-lg shadow-[#a78bfa3d]">
                <Text className="text-[30px] ml-[2]">👩‍💼</Text>
              </View>
            </View>
            {teacherFeatures.map((f) => (
              <View
                key={f}
                className="flex-row items-center bg-[white]/10 rounded-xl py-2.5 px-5 mb-2.5 border border-white/20"
              >
                <View className="w-2.5 h-2.5 rounded-full mr-2.5 bg-[#a78bfa]" />
                <Text className="text-[#bfc9e0] text-xs">{f}</Text>
              </View>
            ))}
          </BlurView>
        </View>
      </ScrollView>
    </View>
  );
}
