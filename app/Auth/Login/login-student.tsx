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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabaseClient"; // ⬅️ added

const BackgroundDecor = () => (
  <View className="absolute inset-0 w-full h-full z-0">
    <View className="absolute inset-0">
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#0F172A"]}
        className="flex-1"
      />
    </View>
    {/* Decorative Circles */}
    <View className="absolute w-40 h-40 bg-[#a78bfa]/5 rounded-full -top-30 -left-12 z-10" />
    <View className="absolute w-24 h-24 bg-[#a78bfa]/5 rounded-full top-230 -right-10 z-10" />
    <View className="absolute w-20 h-20 bg-[#a78bfa]/5 rounded-full bottom-10 left-12 z-10" />
    <View className="absolute w-36 h-36 bg-[#a78bfa]/5 rounded-full -bottom-5 -right-8 z-10" />
    <View className="absolute w-20 h-20 bg-[#a78bfa]/5 rounded-full top-28 left-60 z-10" />
  </View>
);

// ✅ correct paths for your tree
const PRE_ASSESSMENT_ROUTE = "/StudentScreen/PreAssessment/pre-assessment";
const HOME_ROUTE = "/StudentScreen/HomePage/home-page";
const ROLE_SELECTION_ROUTE = "/Auth/Login/role-selection";
const SIGNUP_ROUTE = "/CreateAccount/create-account-student";

type LoginField = "email" | "password";

export default function StudentLoginScreen() {
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

  // route student after successful login
  const routeStudentAfterLogin = useCallback(
    async (userId: string, metaRole?: string | null) => {
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("role, has_completed_preassessment, name, phone")
        .eq("id", userId)
        .maybeSingle();

      if (profErr && profErr.code !== "PGRST116") throw profErr;

      const role = profile?.role || metaRole || null;
      if (role !== "student") {
        await supabase.auth.signOut();
        Alert.alert(
          "Wrong account",
          "This login is for students only. Please use the teacher login."
        );
        return;
      }

      // create minimal profile if missing
      if (!profile) {
        const { data: userRes } = await supabase.auth.getUser();
        const md = userRes?.user?.user_metadata || {};
        await supabase.from("profiles").upsert({
          id: userId,
          name: md.full_name ?? null,
          phone: md.phone_number ?? null,
          role: "student",
        });
      }

      const completed = profile?.has_completed_preassessment === true;
      router.push(completed ? HOME_ROUTE : PRE_ASSESSMENT_ROUTE);
    },
    [router]
  );

  // sign in with Supabase; UI unchanged
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

      await routeStudentAfterLogin(user.id, (user.user_metadata as any)?.role);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    } finally {
      if (isMounted) setIsLoading(false);
    }
  }, [formData, isMounted, routeStudentAfterLogin]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsGoogleLoading(true);
      // keep as a stub; real Google flow needs deep linking setup
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert("Google Login", "Google Sign-In successful (dummy).");
    } catch (error) {
      console.error("Google Sign-In error:", error);
    } finally {
      if (isMounted) setIsGoogleLoading(false);
    }
  }, [isMounted]);

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

  const handleSignUp = useCallback(() => router.push(SIGNUP_ROUTE), [router]);

  const isFormValid = formData.email.trim() && formData.password.length >= 6;

  return (
    <View className="flex-1 bg-[#0F172A]">
      <StatusBar translucent backgroundColor="transparent" />
      <BackgroundDecor />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, zIndex: 1 }}
          className="px-4 py-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-md mx-auto pt-12 px-4 bottom-10">
            {/* Header */}
            <TouchableOpacity
              className="flex-row items-center mb-6"
              onPress={() => router.push(ROLE_SELECTION_ROUTE)}
              activeOpacity={0.8}
            >
              <View className="w-16 h-16 rounded-2xl items-center justify-center overflow-hidden -mt-3 -ml-4">
                <Image
                  source={require("../../../assets/Speaksy.png")}
                  className="w-[60px] h-[110px]"
                  resizeMode="contain"
                />
              </View>
              <Text className="text-white text-3xl font-bold -ml-2 -mt-3">
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
              {/* Student Badge */}
              <View className="bg-white/10 rounded-lg px-3 py-1 self-start mb-6 -mt-2">
                <Text className="text-white/80 text-base font-semibold">
                  STUDENT LOGIN
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
                <Ionicons name="mail-outline" size={20} color="#bbb" />
              </View>

              {/* Password */}
              <Text className="text-white text-sm mb-1">Passwod</Text>
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
                className={`w-full py-3.5 rounded-xl items-center justify-center mt-2 mb-4 ${isFormValid ? "bg-violet-600" : "bg-gray-600"}`}
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
