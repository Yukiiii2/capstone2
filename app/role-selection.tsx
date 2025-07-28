import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
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

  // Navigate to login with role param
  const handleSelectRole = (role: 'student' | 'teacher') => {
    console.log(`${role} selected`);
    router.push({
      pathname: '/login-page',
      params: { role }, // Passing the role
    });
  };

  return (
    <View className="flex-1 bg-[#0A0A0F] relative">
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0A0A0F', '#1A1A2E', '#16213E']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0 z-[-1]"
      />

      {/* Decorative Blobs */}
      {[
        'top-[-60px] left-[-50px] w-40 h-40 bg-[#7c3aed] opacity-10',
        'top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#2563eb] opacity-10',
        'bottom-[80px] left-[50px] w-9 h-9 bg-[#43e6ff] opacity-10',
        'bottom-5 right-10 w-15 h-15 bg-[#a259ff] opacity-10',
        'top-[200px] left-[90px] w-5 h-5 bg-[#43e6ff] opacity-10',
      ].map((style, i) => (
        <View key={i} className={`absolute rounded-full ${style}`} />
      ))}

      {/* Header */}
      <View className="flex-row items-center pt-10 pb-4 px-4 z-10">
        <Image
          source={require('../assets/Speaksy.png')}
          className="w-12 h-12 rounded-2xl"
          resizeMode="contain"
        />
        <Text className="text-white text-2xl font-bold tracking-wider ml-0.1">
          Voclaria
        </Text>
      </View>

      {/* Scrollable Cards */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-4 w-full max-w-[400px] self-center">
          {/* Title */}
          <View className="items-center mb-4">
            <View className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 mb-1">
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
          <BlurView intensity={40} tint="dark" className="rounded-xl p-3 mb-4 bg-[#2c2c46]/50">
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
                className="flex-row items-center bg-[#1e1e3cb3] rounded-xl py-2.5 px-5 mb-2.5 border border-white/5"
              >
                <View className="w-2.5 h-2.5 rounded-full mr-2.5 bg-[#a78bfa]" />
                <Text className="text-[#bfc9e0] text-xs">{f}</Text>
              </View>
            ))}
          </BlurView>

          {/* Teacher Card */}
          <BlurView intensity={40} tint="dark" className="rounded-xl p-3 mb-4 bg-[#2c2c46]/50">
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
                className="flex-row items-center bg-[#1e1e3cb3] rounded-xl py-2.5 px-5 mb-2.5 border border-white/5"
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
