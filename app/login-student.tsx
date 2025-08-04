import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

function BackgroundDecor() {
  return (
    <View className="absolute inset-0">
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#0F172A']}
        className="flex-1"
      />
      {/* Decorative Circles */}
      <View className="absolute w-40 h-40 bg-purple-500/5 rounded-full -top-28 -left-12" />
      <View className="absolute w-24 h-24 bg-blue-500/5 rounded-full top-56 -right-10" />
      <View className="absolute w-20 h-20 bg-cyan-400/5 rounded-full bottom-10 left-12" />
      <View className="absolute w-36 h-36 bg-purple-400/5 rounded-full -bottom-5 -right-8" />
      <View className="absolute w-20 h-20 bg-cyan-400/5 rounded-full top-28 left-60" />
    </View>
  );
}

export default function StudentLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  const studentAccount = {
    email: 'student@test.com',
    password: 'password123',
    redirect: '/pre-assessment',
  } as const;

  useEffect(() => {
    return () => setIsMounted(false);
  }, []);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      if (!isMounted) return;
      if (email === studentAccount.email && password === studentAccount.password) {
        router.replace(studentAccount.redirect);
      } else {
        Alert.alert('Login Failed', 'Invalid email or password.');
      }
      if (isMounted) setIsLoading(false);
    }, 1200);
  };

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    setTimeout(() => {
      Alert.alert('Google Login', 'Google Sign-In successful (dummy).');
      setIsGoogleLoading(false);
    }, 1500);
  };

  const handleForgotPassword = () =>
    Alert.alert('Forgot Password', 'Redirect to reset password flow');

  const handleSignUp = () => router.push('/create-account');

  const isFormValid = email.trim() && password.length >= 6;

  return (
    <View className="flex-1 bg-[#0F172A]">
      <BackgroundDecor />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow z-10 px-4 py-8"
        >
          <View className="w-full max-w-md mx-auto mt-4">
            {/* Header */}
            <TouchableOpacity
              className="flex-row items-center mb-6"
              onPress={() => router.push('/role-selection')}
              activeOpacity={0.8}
            >
              <Image
                source={require('../assets/Speaksy.png')}
                className="w-16 h-16 rounded-2xl -ml-4"
                resizeMode="contain"
              />
              <Text className="text-white text-3xl font-bold -ml-2">Voclaria</Text>
            </TouchableOpacity>

            {/* Welcome */}
            <View className="mb-5 -mt-3">
              <Text className="text-white text-4xl font-bold">Welcome Back!</Text>
              <Text className="text-white text-sm mt-1">
                Time to sharpen your skills, let's get started
              </Text>
            </View>

            {/* Login Card */}
            <View className="bg-white/10 rounded-2xl p-6 border border-white/20">
              <View className="bg-violet-400/20 rounded px-2 py-1 self-start mb-6">
                <Text className="text-violet-400 text-sm font-bold">STUDENT LOGIN</Text>
              </View>

              {/* Email */}
              <Text className="text-white text-sm mb-1">School Email</Text>
              <View className="flex-row items-center bg-white/20 rounded-lg mb-4 pr-3 border border-white/20">
                <TextInput
                  placeholder="Enter your school email"
                  placeholderTextColor="#bbb"
                  className="flex-1 text-white px-3 py-3 text-base"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Ionicons name="mail-outline" size={20} color="#bbb" />
              </View>

              {/* Password */}
              <Text className="text-white text-sm mb-1">Password</Text>
              <View className="flex-row items-center bg-white/20 rounded-lg mb-6 pr-3 border border-white/20">
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#bbb"
                  className="flex-1 text-white px-3 py-3 text-base"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#bbb" />
                </TouchableOpacity>
              </View>

              {/* Remember & Forgot */}
              <View className="flex-row justify-between items-center mb-6">
                <Pressable
                  onPress={() => setRememberMe(!rememberMe)}
                  className="flex-row items-center"
                >
                  <View
                    className={`w-5 h-5 rounded border mr-2 items-center justify-center ${
                      rememberMe
                        ? 'bg-violet-600 border-violet-600'
                        : 'border-gray-400'
                    }`}
                  >
                    {rememberMe && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                  <Text className="text-white/80 text-sm">Remember me</Text>
                </Pressable>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text className="text-violet-400 text-sm">Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Sign In */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={!isFormValid || isLoading}
                className={`py-3 rounded-lg flex-row justify-center items-center mb-4 ${
                  isFormValid ? 'bg-[#A259FF] opacity-90' : 'bg-[#A259FF]/50'
                }`}
              >
                <Text className="text-white font-bold text-lg">
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
                {!isLoading && (
                  <Ionicons name="arrow-forward" size={20} color="white" className="ml-2" />
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-4">
                <View className="flex-1 h-px bg-white/20" />
                <Text className="text-white/60 px-3 text-sm">or continue with</Text>
                <View className="flex-1 h-px bg-white/20" />
              </View>

              {/* Google */}
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="flex-row items-center justify-center py-3 rounded-lg border border-white/20 mb-4"
              >
                <Image
                  source={require('../assets/Google.png')}
                  className="w-5 h-5 mr-2"
                />
                <Text className="text-white font-medium">
                  {isGoogleLoading ? 'Signing in...' : 'Sign in with Google'}
                </Text>
              </TouchableOpacity>

              {/* Sign Up */}
              <View className="flex-row justify-center mt-2">
                <Text className="text-white/80">Don't have an account? </Text>
                <TouchableOpacity onPress={handleSignUp}>
                  <Text className="text-violet-400 font-medium">Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
