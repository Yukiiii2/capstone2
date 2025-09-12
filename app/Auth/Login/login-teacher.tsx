import React, { useState, useEffect, useCallback } from "react";
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
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabaseClient"; // ⬅️ added

const BackgroundDecor = () => (
  <View style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}>
    <View style={{ position: 'absolute', inset: 0 }}>
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#0F172A"]}
        style={{ flex: 1 }}
      />
    </View>
    {/* Decorative Circles */}
    <View style={{ position: 'absolute', width: 160, height: 160, backgroundColor: '#a78bfa0d', borderRadius: 80, top: -120, left: -48, zIndex: 10 }} />
    <View style={{ position: 'absolute', width: 96, height: 96, backgroundColor: '#a78bfa0d', borderRadius: 48, top: 920, right: -40, zIndex: 10 }} />
    <View style={{ position: 'absolute', width: 80, height: 80, backgroundColor: '#a78bfa0d', borderRadius: 40, bottom: 40, left: 48, zIndex: 10 }} />
    <View style={{ position: 'absolute', width: 144, height: 144, backgroundColor: '#a78bfa0d', borderRadius: 72, bottom: -20, right: -32, zIndex: 10 }} />
    <View style={{ position: 'absolute', width: 80, height: 80, backgroundColor: '#a78bfa0d', borderRadius: 40, top: 112, left: 240, zIndex: 10 }} />
  </View>
);

// ✅ routes based on your tree
const TEACHER_DASHBOARD_ROUTE = "/TeacherScreen/TeacherDashboard/teacher-dashboard";
const ROLE_SELECTION_ROUTE = "/Auth/Login/role-selection";
const TEACHER_SIGNUP_ROUTE = "/CreateAccount/create-account-teacher";

type LoginField = "email" | "password";

export default function TeacherLoginScreen() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  const updateFormData = (field: LoginField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    return () => setIsMounted(false);
  }, []);

  // route ONLY teachers; block others
  const routeTeacherAfterLogin = useCallback(
    async (userId: string, metaRole?: string | null) => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, name, phone")
        .eq("id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        Alert.alert("Error", error.message);
        return;
      }

      const role = profile?.role || metaRole || null;
      if (role !== "teacher") {
        await supabase.auth.signOut();
        Alert.alert(
          "Wrong account",
          "This login is for teachers only. Please use the student login."
        );
        return;
      }

      // create minimal profile if missing
      if (!profile) {
        const { data: ures } = await supabase.auth.getUser();
        const md = ures?.user?.user_metadata || {};
        await supabase.from("profiles").upsert({
          id: userId,
          name: md.full_name ?? null,
          phone: md.phone_number ?? null,
          role: "teacher",
        });
      }

      router.replace(TEACHER_DASHBOARD_ROUTE);
    },
    [router]
  );

  // Supabase email+password sign-in (UI unchanged)
  const handleLogin = useCallback(async () => {
    const { email, password } = formData;
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message?.toLowerCase().includes("email not confirmed")) {
          Alert.alert(
            "Email not confirmed",
            "Please check your inbox for the verification link."
          );
        } else {
          Alert.alert("Login Failed", error.message || "Invalid credentials.");
        }
        return;
      }

      const user = data.user;
      if (!user) {
        Alert.alert("Login Failed", "Could not get user information.");
        return;
      }

      await routeTeacherAfterLogin(user.id, (user.user_metadata as any)?.role);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    } finally {
      if (isMounted) setIsLoading(false);
    }
  }, [formData, isMounted, routeTeacherAfterLogin]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsGoogleLoading(true);
    // real Google auth requires deep-linking config; keeping as stub
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert("Google Login", "Google Sign-In successful (dummy).");
    } catch (error) {
      console.error("Google Sign-In error:", error);
    } finally {
      if (isMounted) setIsGoogleLoading(false);
    }
  }, [isMounted]);

  // reset password via Supabase
  const handleForgotPassword = useCallback(async () => {
    const email = formData.email.trim();
    if (!email) {
      Alert.alert("Forgot Password", "Enter your email first.");
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      Alert.alert(
        "Reset Email Sent",
        "Check your inbox for instructions to reset your password."
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not send reset email.");
    }
  }, [formData.email]);

  const handleSignUp = useCallback(
    () => router.push(TEACHER_SIGNUP_ROUTE),
    [router]
  );

  const isFormValid = formData.email.trim() && formData.password.length >= 6;

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <StatusBar translucent backgroundColor="transparent" />
      <BackgroundDecor />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, zIndex: 1, paddingHorizontal: 16, paddingVertical: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%', maxWidth: 448, alignSelf: 'center', paddingTop: 48, paddingHorizontal: 16, position: 'relative', bottom: 40 }}>
            {/* Header */}
            <TouchableOpacity
              className="flex-row items-center mb-6"
              onPress={() => router.push(ROLE_SELECTION_ROUTE)}
              activeOpacity={0.8}
            >
              <View className="w-16 h-16 rounded-2xl items-center justify-center overflow-hidden -ml-4">
                <Image
                  source={require("../../../assets/Speaksy.png")}
                  className="w-[60px] h-[110px]"
                  resizeMode="contain"
                />
              </View>
              <Text className="text-white text-3xl font-bold -ml-2">
                Voclaria
              </Text>
            </TouchableOpacity>

            {/* Welcome Message */}
            <View className="mb-5 -mt-3">
              <Text className="text-white text-4xl font-bold">
                Welcome Back!
              </Text>
              <Text className="text-white text-sm mt-1">
                Time to sharpen your skills, let's get started
              </Text>
            </View>

            {/* Login Card */}
            <View className="bg-white/10 rounded-3xl px-5 py-8 backdrop-blur-3xl border border-white/30 shadow-xs">
              {/* Teacher Badge */}
              <View className="bg-white/10 rounded-lg px-3 py-1 self-start mb-6 -mt-2">
                <Text className="text-white/80 text-base font-semibold">
                  TEACHER LOGIN
                </Text>
              </View>

              {/* Email */}
              <Text className="text-white text-sm mb-1">School Email</Text>
              <View className="flex-row items-center bg-white/20 rounded-lg mb-4 pr-3 border border-white/20">
                <TextInput
                  placeholder="Enter your school email"
                  placeholderTextColor="#bbb"
                  className="flex-1 text-white px-3 py-3 text-base"
                  value={formData.email}
                  onChangeText={(text) => updateFormData("email", text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                />
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#bbb"
                  style={{ marginLeft: 8 }}
                />
              </View>

              {/* Password */}
              <Text className="text-white text-sm mb-1">Password</Text>
              <View className="flex-row items-center bg-white/20 rounded-lg mb-6 pr-3 border border-white/20">
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#bbb"
                  className="flex-1 text-white px-3 py-3 text-base"
                  value={formData.password}
                  onChangeText={(text) => updateFormData("password", text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#bbb"
                  />
                </TouchableOpacity>
              </View>

              {/* Remember & Forgot */}
              <View className="flex-row justify-between items-center mb-6 mt-2">
                <Pressable
                  onPress={() => setRememberMe(!rememberMe)}
                  className="flex-row items-center"
                >
                  <View
                    className={`w-5 h-5 rounded border mr-2 items-center justify-center ${
                      rememberMe
                        ? "bg-violet-600 border-violet-600"
                        : "border-gray-400"
                    }`}
                  >
                    {rememberMe && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <Text className="text-white/80 text-sm">Remember me</Text>
                </Pressable>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text className="text-violet-400 text-sm -left-9">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={!isFormValid || isLoading}
                className={`w-full py-3.5 rounded-xl items-center justify-center mt-2 mb-4 ${isFormValid ? "bg-purple-500" : "bg-gray-600"}`}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-4">
                <View className="flex-1 h-px bg-white/20" />
                <Text className="text-white/60 px-3 text-sm">
                  or continue with
                </Text>
                <View className="flex-1 h-px bg-white/20" />
              </View>

              {/* Google Sign In */}
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="flex-row items-center justify-center py-3.5 rounded-xl border border-white/20 mb-6"
                activeOpacity={0.8}
              >
                <Image
                  source={require("../../../assets/Google.png")}
                  className="w-5 h-5 mr-2"
                  resizeMode="contain"
                />
                <Text className="text-white text-base">
                  {isGoogleLoading ? "Signing in..." : "Sign in with Google"}
                </Text>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View className="flex-row justify-center space-x-1">
                <Text className="text-white/80 text-sm">
                  Don't have an account?
                </Text>
                <TouchableOpacity onPress={handleSignUp} activeOpacity={0.7}>
                  <Text className="text-violet-400 text-sm font-medium">
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
