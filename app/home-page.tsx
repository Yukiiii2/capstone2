import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function HomePage() {
  const router = useRouter();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current; // for slide down animation
  const opacityAnim = useRef(new Animated.Value(0)).current; // for fade in animation

  const handleNavigation = (page: string) => {
    router.push(page);
  };

  const handleLogout = () => {
    console.log("Logging out...");
    router.replace('/login-page'); // Back to login page
  };

  const handleSettings = () => {
    console.log("Settings clicked");
    router.push('/settings'); // Add your settings page route here
  };

  // Animate popup open/close
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
        style={{ ...StyleSheet.absoluteFillObject }}
        pointerEvents="none"
      >
        <View style={{ position: 'absolute', top: -60, left: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: '#7c3aed', opacity: 0.13 }} />
        <View style={{ position: 'absolute', top: 100, right: -40, width: 90, height: 90, borderRadius: 45, backgroundColor: '#2563eb', opacity: 0.10 }} />
        <View style={{ position: 'absolute', bottom: 100, left: 50, width: 36, height: 36, borderRadius: 18, backgroundColor: '#43e6ff', opacity: 0.09 }} />
        <View style={{ position: 'absolute', bottom: 20, right: 40, width: 60, height: 60, borderRadius: 30, backgroundColor: '#a259ff', opacity: 0.09 }} />
        <View style={{ position: 'absolute', top: 200, left: 90, width: 22, height: 22, borderRadius: 11, backgroundColor: '#43e6ff', opacity: 0.10 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: 400, alignSelf: 'center' }}>
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
                    source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }}
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

          {/* Navigation Tabs */}
          <View className="flex-row bg-black/40 rounded-xl mb-6 p-1">
            <TouchableOpacity className="flex-1 items-center py-2 rounded-lg bg-white/10">
              <Text className="text-purple-500 font-semibold">Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 items-center py-2 rounded-lg" onPress={() => handleNavigation('/exercise-speaking')}>
              <Text className="text-white/80">Speaking</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 items-center py-2 rounded-lg" onPress={() => handleNavigation('/exercise-reading')}>
              <Text className="text-white/80">Reading</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 items-center py-2 rounded-lg" onPress={() => handleNavigation('/community-page')}>
              <Text className="text-white/80">Community</Text>
            </TouchableOpacity>
          </View>

          {/* Welcome Section */}
          <View style={{ flexDirection: 'row', marginBottom: 20 }}>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 18,
              padding: 18,
              flex: 2,
              marginRight: 12
            }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Welcome back, Sarah!</Text>
              <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 16 }}>
                Track your progress and continue improving your communication skills.
              </Text>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  borderRadius: 8,
                  padding: 12,
                  flex: 1,
                  alignItems: 'center'
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="calendar-outline" size={16} color="#7c3aed" />
                    <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginLeft: 4 }}>2</Text>
                  </View>
                  <Text style={{ color: '#9ca3af', fontSize: 11, textAlign: 'center' }}>Upcoming Sessions</Text>
                  <Text style={{ color: '#6b7280', fontSize: 10, textAlign: 'center' }}>Scheduled today</Text>
                </View>

                <View style={{
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  borderRadius: 8,
                  padding: 12,
                  flex: 1,
                  alignItems: 'center'
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#7c3aed" />
                    <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginLeft: 4 }}>8</Text>
                  </View>
                  <Text style={{ color: '#9ca3af', fontSize: 11, textAlign: 'center' }}>Completed Modules</Text>
                </View>
              </View>
            </View>

            <View style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 18,
              padding: 18,
              flex: 1
            }}>
              <Text style={{ color: '#ccc', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Pre-Assessment Results</Text>
              <View style={{ alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#9ca3af', fontSize: 11, marginBottom: 4 }}>Overall Score</Text>
                <Text style={{ color: '#60a5fa', fontSize: 24, fontWeight: 'bold' }}>78%</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 20, height: 20, backgroundColor: '#7c3aed', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                  <Ionicons name="checkmark" size={12} color="white" />
                </View>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>Confident</Text>
              </View>
            </View>
          </View>

            {/* Quick Actions */}
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 18, flex: 1 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#7c3aed', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Ionicons name="mic-outline" size={24} color="white" />
              </View>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>SPEAKING EXERCISE</Text>
              <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Practice Speaking (Live Video)</Text>
              <TouchableOpacity style={{ backgroundColor: '#7c3aed', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }} onPress={() => handleNavigation('/exercise-speaking')}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>START</Text>
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 18, flex: 1 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#7c3aed', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Ionicons name="book-outline" size={24} color="white" />
              </View>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>READING EXERCISES</Text>
              <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Exercise your reading with AI analysis</Text>
              <TouchableOpacity style={{ backgroundColor: '#7c3aed', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }} onPress={() => handleNavigation('/exercise-reading')}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>START</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Restored missing Peer Review and Live Session */}
<View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
  <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 18, flex: 1 }}>
    <View style={{ width: 48, height: 48, backgroundColor: '#7c3aed', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
      <Ionicons name="people-outline" size={24} color="white" />
    </View>
    <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>PEER REVIEW</Text>
    <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Community recommendation and suggestion</Text>
    <TouchableOpacity style={{ backgroundColor: '#7c3aed', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>Proceed</Text>
    </TouchableOpacity>
  </View>

  {/* Live Session Updated with Navigation */}
  <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 18, flex: 1 }}>
    <View style={{ width: 48, height: 48, backgroundColor: '#7c3aed', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
      <Ionicons name="radio-outline" size={24} color="white" />
    </View>
    <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>LIVE SESSION</Text>
    <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>Join live sessions to watch others giving speeches</Text>
    <TouchableOpacity
      style={{ backgroundColor: '#7c3aed', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}
      onPress={() => handleNavigation('/live-sessions')}
    >
      <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>Proceed</Text>
    </TouchableOpacity>
  </View>
</View>
          
          {/* Progress Modules */}
          <View style={{ marginBottom: 24 }}>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 18,
              padding: 18,
              marginBottom: 18
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>?</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Public Speaking Fundamentals</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>Master the basics of effective public speaking</Text>
                </View>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>75%</Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.10)',
                borderRadius: 8,
                height: 8,
                overflow: 'hidden'
              }}>
                <View style={{
                  backgroundColor: '#7c3aed',
                  borderRadius: 8,
                  height: 8,
                  width: '75%'
                }} />
              </View>
            </View>

            <View style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 18,
              padding: 18,
              marginBottom: 18
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="volume-medium-outline" size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Voice Modulation</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>Control tone, pitch, and volume variety</Text>
                </View>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>60%</Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.10)',
                borderRadius: 8,
                height: 8,
                overflow: 'hidden'
              }}>
                <View style={{
                  backgroundColor: '#7c3aed',
                  borderRadius: 8,
                  height: 8,
                  width: '60%'
                }} />
              </View>
            </View>

            <View style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 18,
              padding: 18,
              marginBottom: 18
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="people-outline" size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Voice Modulation</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>Control tone, pitch, and volume variety</Text>
                </View>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>90%</Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.10)',
                borderRadius: 8,
                height: 8,
                overflow: 'hidden'
              }}>
                <View style={{
                  backgroundColor: '#7c3aed',
                  borderRadius: 8,
                  height: 8,
                  width: '90%'
                }} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
