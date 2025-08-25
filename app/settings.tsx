// app/settings.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

export default function SettingsPage() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState(
    "https://randomuser.me/api/portraits/women/44.jpg"
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleGoBack = () => {
    router.back();
  };

  const handleSave = () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords don't match");
      return;
    }

    Alert.alert("Settings Saved", "Your changes have been saved successfully!");
    router.back();
  };

  // Pick an image from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "You need to allow access to your gallery to change your profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // Background decorator component
  const BackgroundDecor = () => (
    <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
      <View className="absolute left-0 right-0 top-0 bottom-0">
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A"]}
          className="flex-1"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1">
          <BackgroundDecor />

          <View
            className="flex-1 p-4"
            style={{ width: '100%', maxWidth: 450, alignSelf: 'center' }}
          >
            {/* Header */}
            <View className="flex-row items-center mb-8 mt-4">
              <TouchableOpacity
                onPress={handleGoBack}
                className="mr-4 p-2 bg-white/10 rounded-full"
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <Text className="text-white text-2xl font-bold">Profile Settings</Text>
            </View>

            {/* Profile Section */}
            <View className="items-center bottom-4 mb-10">
              <TouchableOpacity onPress={pickImage} className="relative">
                <View className="w-28 h-28 rounded-full overflow-hidden border-4 border-purple-500/80">
                  <Image
                    source={{ uri: profileImage }}
                    style={{ width: "100%", height: "100%" }}
                  />
                </View>
                <View className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full">
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text className="text-purple-300 mt-3 text-sm font-medium">
                Tap to change photo
              </Text>
              <Text className="text-white text-xl font-bold mt-4">
                Sarah Johnson
              </Text>
              <Text className="text-gray-300 text-sm mt-1">student@example.com</Text>
            </View>

            {/* Change Password */}
            <View className="mb-8 bottom-4">
              <View className="flex-row items-center mb-4">
                <Ionicons name="lock-closed" size={20} color="#a78bfa" />
                <Text className="text-white text-lg font-semibold ml-2">
                  Change Password
                </Text>
              </View>

              <View className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Current Password</Text>
                  <TextInput
                    placeholder="Enter current password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    className="bg-black/30 rounded-xl p-4 text-white border border-white/10"
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">New Password</Text>
                  <TextInput
                    placeholder="Enter new password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    className="bg-black/30 rounded-xl p-4 text-white border border-white/10"
                  />
                </View>

                <View>
                  <Text className="text-gray-400 text-sm mb-2">Confirm New Password</Text>
                  <TextInput
                    placeholder="Confirm new password"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    className="bg-black/30 rounded-xl p-4 text-white border border-white/10"
                  />
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              className="bg-purple-600 rounded-2xl py-3 items-center bottom-8 shadow-lg shadow-purple-500/30 mb-10"
            >
              <Text className="text-white text-lg font-bold">Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}