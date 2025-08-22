import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Animated, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Enhanced Background Decorator Component
const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient 
        colors={["#0F0F2D", "#1A1A4A", "#0F0F2D"]} 
        className="flex-1" 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
      />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#8A2BE2]/20 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#9370DB]/20 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#6A5ACD]/20 rounded-full" />
    <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#483D8B]/20 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#4B0082]/20 rounded-full" />
    
    {/* Additional decorative elements */}
    <View className="absolute top-1/3 right-1/4 w-16 h-16 bg-[#9370DB]/10 rounded-full" />
    <View className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-[#6A5ACD]/15 rounded-full" />
  </View>
);

const LogoutScreen = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);
  const rotateAnim = new Animated.Value(0);
  const progressAnim = new Animated.Value(0);
  const slideUpAnim = new Animated.Value(50);

  useEffect(() => {
    // Simulate logging out process
    const timer = setTimeout(() => {
      setIsLoggingOut(false);
    }, 2500);

    // Animation sequences
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2400,
        useNativeDriver: false,
      }),
    ]).start();

    return () => clearTimeout(timer);
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const handleExit = () => {
    // Exit application logic
    console.log("Exit application");
  };

  const handleGoBack = () => {
    // Navigate to landing page logic
    console.log("Go back to landing page");
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center px-6 bg-gray-900">
      <BackgroundDecor />
      
      <Animated.View 
        className="bg-white/15 backdrop-blur-2xl rounded-3xl p-8 w-full max-w-md border border-white/30 shadow-2xl shadow-black/60 overflow-hidden"
        style={{ 
          opacity: fadeAnim, 
          transform: [{ scale: scaleAnim }, { translateY: slideUpAnim }] 
        }}
      >
        {/* Header with animated icon */}
        <View className="items-center mb-6">
          <View className="bg-white/25 p-5 rounded-full mb-4 shadow-lg shadow-purple-500/30">
            {isLoggingOut ? (
              <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                <Ionicons name="sync" size={40} color="white" />
              </Animated.View>
            ) : (
              <View className="relative">
                <Ionicons name="checkmark-done" size={40} color="#4ADE80" />
                <View className="absolute -inset-2 bg-green-400/20 rounded-full animate-ping" />
              </View>
            )}
          </View>
          <Text className="text-white text-3xl font-bold text-center mb-2">
            {isLoggingOut ? "Securing Your Session..." : "SEE YOU LATER!"}
          </Text>
          <Text className="text-white/85 text-center text-base leading-6">
            {isLoggingOut 
              ? "Please wait while we secure your account" 
              : "You've been successfully logged out!\nThank you for using our application."}
          </Text>
        </View>

        {/* Progress bar during logout */}
        {isLoggingOut && (
          <View className="w-full h-2 bg-white/15 rounded-full mb-6 overflow-hidden">
            <Animated.View 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-400 rounded-full"
              style={{ width: progressWidth }}
            />
          </View>
        )}

        {/* Stats cards - only show after logout */}
        {!isLoggingOut && (
          <Animated.View 
            className="bg-white/10 rounded-2xl p-5 mb-6 border border-white/15 shadow-inner shadow-white/5"
            style={{ opacity: fadeAnim }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <View className="bg-purple-500/20 p-2 rounded-lg">
                  <Ionicons name="time-outline" size={20} color="#A78BFA" />
                </View>
                <Text className="text-white ml-3 text-sm font-medium">Session Time</Text>
              </View>
              <Text className="text-white font-bold text-lg">2h 34m</Text>
            </View>

            <View className="h-px bg-white/10 my-3" />

            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <View className="bg-blue-500/20 p-2 rounded-lg">
                  <Ionicons name="checkmark-done-outline" size={20} color="#60A5FA" />
                </View>
                <Text className="text-white ml-3 text-sm font-medium">Tasks Completed</Text>
              </View>
              <Text className="text-white font-bold text-lg">8</Text>
            </View>

            <View className="h-px bg-white/10 my-3" />

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="bg-amber-500/20 p-2 rounded-lg">
                  <Ionicons name="trophy-outline" size={20} color="#FBBF24" />
                </View>
                <Text className="text-white ml-3 text-sm font-medium">Points Earned</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="add-circle" size={20} color="#4ADE80" />
                <Text className="text-green-400 font-bold text-lg ml-1">125</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Action buttons - only show after logout */}
        {!isLoggingOut && (
          <Animated.View 
            className="flex-row space-x-4"
            style={{ opacity: fadeAnim }}
          >
            <TouchableOpacity 
              className="flex-1 bg-white/10 rounded-2xl py-4 items-center border border-white/20 active:bg-white/20 transition-all"
              activeOpacity={0.8}
              onPress={handleGoBack}
            >
              <Text className="text-white font-semibold text-base">Go Back</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl py-4 items-center shadow-lg shadow-purple-500/40 active:opacity-90 transition-all"
              activeOpacity={0.8}
              onPress={handleExit}
            >
              <Text className="text-white font-bold text-base">Exit</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Footer */}
        <View className="items-center mt-8">
          <Text className="text-white/40 text-xs">© 2023 AppName • v1.0.0</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default LogoutScreen;