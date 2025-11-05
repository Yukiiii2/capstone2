// app/Auth/Login/forgot-password.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabaseClient";

type Stage = "send" | "verify" | "set";

export default function ForgotPassword() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("send");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    const e = email.trim();
    if (!e) return Alert.alert("Missing email", "Please enter your email.");
    setLoading(true);
    try {
      // Sends a 6-digit code to the email (no link needed if Email OTP is enabled)
      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: {
          emailRedirectTo:
            Platform.OS === "web" && typeof window !== "undefined"
              ? `${window.location.origin}/Auth/ResetPassword`
              : undefined, // not required for pure code flow
        },
      });
      if (error) throw error;
      Alert.alert("Check your inbox", "We sent a 6-digit code to your email.");
      setStage("verify");
    } catch (err: any) {
      Alert.alert("Failed to send code", err?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.trim();
    if (!code) return Alert.alert("Missing code", "Enter the 6-digit code from your email.");
    setLoading(true);
    try {
      // Verifies the email OTP and creates a session for this user
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "email", // email-based OTP
      });
      if (error) throw error;
      setStage("set");
    } catch (err: any) {
      // If your project is configured to send magic links instead of codes,
      // this may fail—ask user to click the link in email instead.
      Alert.alert("Invalid code", err?.message ?? "Double-check the code or request a new one.");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (pw.length < 8) return Alert.alert("Weak password", "Use at least 8 characters.");
    if (pw !== cpw) return Alert.alert("Mismatch", "Passwords do not match.");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      Alert.alert("Success", "Your password has been updated. Please log in.");
      await supabase.auth.signOut();
      router.replace("/Auth/Login/role-selection");
    } catch (err: any) {
      Alert.alert("Update failed", err?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-900 px-5 justify-center">
      {stage === "send" && (
        <>
          <Text className="text-white text-2xl font-bold mb-2">Forgot Password</Text>
          <Text className="text-gray-400 mb-6">Enter your email and we’ll send a 6-digit code.</Text>

          <View className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 mb-4">
            <TextInput
              className="text-white text-base"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <TouchableOpacity
            className={`py-3 rounded-lg items-center justify-center ${email ? "bg-violet-600/80" : "bg-gray-600/50"}`}
            disabled={!email || loading}
            onPress={sendOtp}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Send code</Text>}
          </TouchableOpacity>
        </>
      )}

      {stage === "verify" && (
        <>
          <Text className="text-white text-2xl font-bold mb-2">Enter Code</Text>
          <Text className="text-gray-400 mb-6">We sent a 6-digit code to {email}.</Text>

          <View className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 mb-4">
            <TextInput
              className="text-white text-base"
              value={otp}
              onChangeText={setOtp}
              placeholder="6-digit code"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            className={`py-3 rounded-lg items-center justify-center ${otp ? "bg-violet-600/80" : "bg-gray-600/50"}`}
            disabled={!otp || loading}
            onPress={verifyOtp}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Verify</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-3 py-3 rounded-lg items-center justify-center bg-white/10 border border-white/20"
            onPress={() => setStage("send")}
            disabled={loading}
          >
            <Text className="text-white">Back</Text>
          </TouchableOpacity>
        </>
      )}

      {stage === "set" && (
        <>
          <Text className="text-white text-2xl font-bold mb-2">Set New Password</Text>
          <Text className="text-gray-400 mb-6">No old password needed.</Text>

          <View className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 mb-3">
            <TextInput
              className="text-white text-base"
              value={pw}
              onChangeText={setPw}
              placeholder="New password (min 8 chars)"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
            />
          </View>

          <View className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 mb-6">
            <TextInput
              className="text-white text-base"
              value={cpw}
              onChangeText={setCpw}
              placeholder="Confirm new password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
            />
          </View>

          <TouchableOpacity
            className={`py-3 rounded-lg items-center justify-center ${(pw && cpw) ? "bg-violet-600/80" : "bg-gray-600/50"}`}
            disabled={!pw || !cpw || loading}
            onPress={updatePassword}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Update password</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
