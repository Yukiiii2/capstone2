import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function LiveSession() {
  const router = useRouter();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleNavigation = (page: string) => router.push(page);
  const handleLogout = () => router.replace('/login-page');
  const handleSettings = () => router.push('/settings');

  // Animate profile popup
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

  return (
    <View style={{ flex: 1 }}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#0A0A0F', '#1A1A2E', '#16213E']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      >
        <View style={{ position: 'absolute', top: -60, left: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: '#7c3aed', opacity: 0.13 }} />
        <View style={{ position: 'absolute', top: 100, right: -40, width: 90, height: 90, borderRadius: 45, backgroundColor: '#2563eb', opacity: 0.1 }} />
        <View style={{ position: 'absolute', bottom: 100, left: 50, width: 36, height: 36, borderRadius: 18, backgroundColor: '#43e6ff', opacity: 0.09 }} />
        <View style={{ position: 'absolute', bottom: 20, right: 40, width: 60, height: 60, borderRadius: 30, backgroundColor: '#a259ff', opacity: 0.09 }} />
        <View style={{ position: 'absolute', top: 200, left: 90, width: 22, height: 22, borderRadius: 11, backgroundColor: '#43e6ff', opacity: 0.1 }} />
      </LinearGradient>

      <ScrollView className="flex-1 px-4 pt-8">
        {/* Header */}
        <View className="flex-row items-center mb-3">
          <View className="w-7 h-7 rounded-full bg-purple-500 mr-2 items-center justify-center" />
          <Text className="text-white text-xl font-bold">Fluentech</Text>
          <View className="flex-1" />
          <View className="flex-row items-center space-x-3 relative">
            <TouchableOpacity>
              <Ionicons name="trophy-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsProfileMenuVisible(true)}>
              <View className="w-9 h-9 rounded-full ml-2 overflow-hidden border-2 border-white">
                <Image
                  source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
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
                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Sarah Johnson</Text>
                <TouchableOpacity onPress={handleSettings} style={{ paddingVertical: 8 }}>
                  <Text style={{ color: 'white', fontSize: 14 }}>Settings</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        {/* Tab Bar (Live Session Active) */}
        <View className="flex-row bg-black/40 rounded-xl mb-6 p-1">
          <TouchableOpacity
            className="flex-1 items-center py-2 rounded-lg"
            onPress={() => handleNavigation('/teacher-dashboard')}
          >
            <Text className="text-white/80">Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 items-center py-2 rounded-lg"
            onPress={() => handleNavigation('/teacher-community')}
          >
            <Text className="text-white/80">Community</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 items-center py-2 rounded-lg bg-white"
            onPress={() => handleNavigation('/teacher-live-sessions')}
          >
            <Text className="text-purple-600 font-bold">Live Sessions</Text>
          </TouchableOpacity>
        </View>

        {/* Session Info */}
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 6 }}>
          Live Session
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ backgroundColor: '#FF4F4F', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 10 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>LIVE</Text>
          </View>
          <Ionicons name="eye-outline" size={16} color="#aaa" />
          <Text style={{ color: '#aaa', fontSize: 13, marginLeft: 4 }}>127 viewers</Text>
        </View>

        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1646243425301-d733db6f5821' }}
          style={{ width: '100%', height: 200, borderRadius: 14, marginBottom: 16 }}
          resizeMode="cover"
        />

        <View style={{ backgroundColor: '#1C1C3A', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#34D399', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>MC</Text>
          </View>
          <View>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Dr. Michael Chen</Text>
            <Text style={{ color: '#aaa', fontSize: 13 }}>Professor of Computer Science</Text>
          </View>
        </View>

        {/* Reactions */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="heart" size={20} color="#FF4F4F" />
            <Text style={{ color: '#fff', marginLeft: 6, fontSize: 14 }}>26</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="happy" size={20} color="#FACC15" />
            <Text style={{ color: '#fff', marginLeft: 6, fontSize: 14 }}>19</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="bulb" size={20} color="#8A5CFF" />
            <Text style={{ color: '#fff', marginLeft: 6, fontSize: 14 }}>17</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={{ backgroundColor: '#8A5CFF', borderRadius: 10, paddingVertical: 14, marginBottom: 30 }}
          onPress={() => handleNavigation('/teacher-live-sessions')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 15 }}>
            More Live Sessions
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
