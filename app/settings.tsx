// app/settings.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function SettingsPage() {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState('https://randomuser.me/api/portraits/women/44.jpg');

  const handleGoBack = () => {
    router.back();
  };

  const handleSave = () => {
    Alert.alert("Settings Saved", "Your changes have been saved successfully!");
    router.back();
  };

  // Pick an image from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'You need to allow access to your gallery to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#0A0A0F', '#1A1A2E', '#16213E']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ ...StyleSheet.absoluteFillObject }}
        pointerEvents="none"
      >
        <View style={{ position: 'absolute', top: -60, left: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: '#7c3aed', opacity: 0.13 }} />
        <View style={{ position: 'absolute', top: 100, right: -40, width: 90, height: 90, borderRadius: 45, backgroundColor: '#2563eb', opacity: 0.1 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }}>
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={handleGoBack} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Settings</Text>
          </View>

          {/* Profile Section */}
          <View className="items-center mb-8">
            <TouchableOpacity onPress={pickImage}>
              <View className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-500">
                <Image
                  source={{ uri: profileImage }}
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
            </TouchableOpacity>
            <Text className="text-purple-400 mt-2 text-sm">Tap to change photo</Text>
            <Text className="text-white text-lg font-bold mt-3">Sarah Johnson</Text>
            <Text className="text-gray-400 text-sm">student@example.com</Text>
          </View>

          {/* Change Password */}
          <Text className="text-white text-lg font-semibold mb-3">Change Password</Text>
          <View className="bg-white/10 rounded-xl p-4 mb-6">
            <TextInput
              placeholder="Current Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              className="bg-black/20 rounded-lg p-3 text-white mb-3"
            />
            <TextInput
              placeholder="New Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              className="bg-black/20 rounded-lg p-3 text-white mb-3"
            />
            <TextInput
              placeholder="Confirm New Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              className="bg-black/20 rounded-lg p-3 text-white"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            className="bg-purple-600 rounded-xl py-4 items-center"
          >
            <Text className="text-white text-lg font-bold">Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
