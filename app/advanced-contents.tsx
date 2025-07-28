import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, Modal, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';

const lessons = [
  { title: 'Effective Non-Verbal Communication', subtitle: '11 interactions', desc: 'Master gestures and visual cues', type: 'Review', locked: false, interactions: 11 },
  { title: 'Disphragmatic Breathing Practice', subtitle: '8 interactions', desc: 'Unlock breathing power for best performance', type: 'Review', locked: false, interactions: 8 },
  { title: 'Voice Warm-up and Articulation', subtitle: '10 interactions', desc: 'Clarity and pronunciation', type: 'Review', locked: false, interactions: 10 },
  { title: 'Eye Contact and Facial Expression', subtitle: '6 interactions', desc: 'Engage your audience', type: 'Review', locked: false, interactions: 6 },
  { title: 'Basic Self-Introduction', subtitle: '7 interactions', desc: 'Confidently introduce yourself', type: 'Locked', locked: true, interactions: 7 },
  { title: 'Pacing and Speech Clarity', subtitle: '9 interactions', desc: 'Avoid rushing and monotony', type: 'Locked', locked: true, interactions: 9 },
  { title: 'Overcoming Speaking Anxiety', subtitle: '5 interactions', desc: 'Build confidence', type: 'Locked', locked: true, interactions: 5 },
  { title: 'Structured Self-Presentation', subtitle: '7 interactions', desc: 'Track your progress', type: 'Locked', locked: true, interactions: 7 },
  { title: 'Audience Engagement Basics', subtitle: '8 interactions', desc: 'Interact with listeners', type: 'Locked', locked: true, interactions: 8 },
  { title: 'Final Practice: Full Presentation', subtitle: '4 interactions', desc: 'Showcase your skills', type: 'Locked', locked: true, interactions: 4 },
];

const recentSessions = [
  { title: 'Panel Interview Excellence', desc: 'Confident strategies for top panel session and gain 80% confidence rating.' },
  { title: 'Advanced Debate Techniques', desc: 'Win verbal spar, be agile at swapping critical across your field.' },
  { title: 'Audience Engagement Basics – Next', desc: 'Crucial for advanced discussion. Watch recent video delivery.' }
];

export default function AdvancedContents() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLessons, setFilteredLessons] = useState(lessons);
  const [filterType, setFilterType] = useState('All');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Animate profile menu
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

  // Filter lessons
  useEffect(() => {
    let filtered = lessons.filter(
      (l) =>
        (filterType === 'All' || l.type === filterType) &&
        (l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredLessons(filtered);
  }, [searchQuery, filterType]);

  const sortLessons = (mode: string) => {
    let sorted = [...filteredLessons];
    if (mode === 'Alphabetical') sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (mode === 'Most Interactions') sorted.sort((a, b) => b.interactions - a.interactions);
    if (mode === 'Fewest Interactions') sorted.sort((a, b) => a.interactions - b.interactions);
    setFilteredLessons(sorted);
    setSortModalVisible(false);
  };

  // Handle tab navigation
  const handleTabNavigation = (tab: string) => {
    if (tab === 'Overview') router.push('/home-page');
    if (tab === 'Speaking') router.push('/exercise-speaking');
    if (tab === 'Reading') router.push('/exercise-reading');
    if (tab === 'Community') router.push('/community-page');
  };

  const handleLogout = () => router.replace('/login-page');
  const handleSettings = () => router.push('/settings');

  const activeTab = pathname.includes('exercise-speaking') ? 'Speaking' : 
                    pathname.includes('exercise-reading') ? 'Reading' :
                    pathname.includes('community-page') ? 'Community' : 'Overview';

  return (
    <View className="flex-1 bg-[#0A0A1E]">
      {/* Gradient Background */}
      <LinearGradient
        colors={['#0A0A0F', '#1A1A2E', '#16213E']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <View style={{ position: 'absolute', top: -60, left: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: '#7c3aed', opacity: 0.13 }} />
        <View style={{ position: 'absolute', top: 100, right: -40, width: 90, height: 90, borderRadius: 45, backgroundColor: '#2563eb', opacity: 0.10 }} />
        <View style={{ position: 'absolute', bottom: 100, left: 50, width: 36, height: 36, borderRadius: 18, backgroundColor: '#43e6ff', opacity: 0.09 }} />
        <View style={{ position: 'absolute', bottom: 20, right: 40, width: 60, height: 60, borderRadius: 30, backgroundColor: '#a259ff', opacity: 0.09 }} />
        <View style={{ position: 'absolute', top: 200, left: 90, width: 22, height: 22, borderRadius: 11, backgroundColor: '#43e6ff', opacity: 0.10 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ width: '100%', maxWidth: 400 }}>
          {/* Header with Profile Popup */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="w-7 h-7 rounded-full bg-purple-500 mr-2" />
              <Text className="text-white text-xl font-bold">Fluentech</Text>
            </View>
            <View className="flex-row items-center space-x-4">
              <TouchableOpacity><Ionicons name="trophy-outline" size={22} color="#fff" /></TouchableOpacity>
              <TouchableOpacity><Ionicons name="notifications-outline" size={22} color="#fff" /></TouchableOpacity>
              <TouchableOpacity onPress={handleLogout}><Ionicons name="log-out-outline" size={22} color="#fff" /></TouchableOpacity>
              <TouchableOpacity onPress={() => setIsProfileMenuVisible(true)}>
                <Image source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} className="w-9 h-9 rounded-full ml-2 border-2 border-white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Menu Modal */}
          <Modal visible={isProfileMenuVisible} transparent animationType="none" onRequestClose={() => setIsProfileMenuVisible(false)}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} activeOpacity={1} onPressOut={() => setIsProfileMenuVisible(false)}>
              <Animated.View style={{ position: 'absolute', top: 55, right: 16, transform: [{ translateY: slideAnim }], opacity: opacityAnim }}>
                <View style={{ backgroundColor: '#1E1E2E', borderRadius: 10, padding: 10, width: 180 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Sarah Johnson</Text>
                  <TouchableOpacity onPress={handleSettings} style={{ paddingVertical: 8 }}>
                    <Text style={{ color: 'white', fontSize: 14 }}>Settings</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </Modal>

          {/* Tabs */}
          <View className="flex-row bg-white/5 rounded-xl p-1 mb-5">
            {["Overview", "Speaking", "Reading", "Community"].map((tab) => (
              <TouchableOpacity key={tab} onPress={() => handleTabNavigation(tab)} className={`flex-1 px-3 py-2 rounded-lg ${activeTab === tab ? "bg-white/80" : ""}`}>
                <Text className={`text-xs font-bold text-center ${activeTab === tab ? "text-violet-600" : "text-white/80"}`}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Module Summary */}
          <View className="mx-4 mb-4">
            <View className="flex-row justify-between items-start mb-2">
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text className="text-white/90 font-semibold text-base">Advanced Public Speaking Mastery</Text>
                <Text className="text-gray-400 text-xs">Take your public speaking to the next level with complex strategies and expert feedback.</Text>
              </View>
              <View className="items-end">
                <Text className="text-white/80 text-xs mb-1">Module Progress</Text>
                <Text className="text-purple-400 font-bold text-lg">40%</Text>
              </View>
            </View>
            <View className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <View className="h-2 bg-purple-500 rounded-full" style={{ width: '40%' }} />
            </View>
          </View>

          {/* Search & Filter */}
          <View className="mb-3 flex-row items-center relative">
            <TextInput placeholder="Search by title, desc..." placeholderTextColor="#aaa" className="flex-1 bg-white/10 rounded-lg py-2 pl-9 pr-3 text-white text-sm" value={searchQuery} onChangeText={setSearchQuery} />
            <Ionicons name="search" size={18} color="#aaa" style={{ position: 'absolute', left: 14, top: 13 }} />
            <TouchableOpacity className="ml-2 bg-purple-500 px-3 py-2 rounded-lg" onPress={() => setCategoryModalVisible(true)}>
              <Text className="text-white text-xs font-bold">{filterType}</Text>
            </TouchableOpacity>
            <TouchableOpacity className="ml-2 bg-white/10 px-3 py-2 rounded-lg" onPress={() => setSortModalVisible(true)}>
              <Ionicons name="filter" size={18} color="#a855f7" />
            </TouchableOpacity>
          </View>

          {/* Lessons Grid */}
          <View className="flex-row flex-wrap justify-between">
            {filteredLessons.map((lesson, idx) => (
              <View key={idx} className="w-[48%] bg-white rounded-2xl mb-4 p-3">
                <View className="flex-row items-center justify-between mb-1">
                  <View className="flex-row items-center">
                    <View className="w-5 h-5 rounded-full bg-purple-500 items-center justify-center">
                      <Ionicons name="book-outline" size={14} color="#fff" />
                    </View>
                    <Text className="text-gray-400 text-xs font-semibold ml-2">{lesson.subtitle}</Text>
                  </View>
                  <Ionicons name="ellipsis-horizontal" size={16} color="#b0b0b0" />
                </View>
                <Text className="text-black font-bold text-[13px] mb-1">{lesson.title}</Text>
                <Text className="text-gray-400 text-[11px] mb-3">{lesson.desc}</Text>
                <TouchableOpacity className={`py-2 rounded-lg ${lesson.locked ? "bg-gray-400" : "bg-purple-500"}`}>
                  <Text className="text-white text-xs font-semibold text-center">{lesson.type}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Recent Sessions */}
          <Text className="text-white font-bold text-base mt-4 mb-2">Recent Training Sessions</Text>
          <View className="bg-gray-100 rounded-2xl p-3">
            {recentSessions.map((session, i) => (
              <View key={i} className="flex-row items-center mb-3 last:mb-0">
                <View className="w-8 h-8 bg-purple-500/20 rounded-full items-center justify-center mr-3">
                  <Ionicons name="videocam-outline" size={18} color="#a855f7" />
                </View>
                <View className="flex-1">
                  <Text className="text-black font-semibold text-xs mb-1">{session.title}</Text>
                  <Text className="text-gray-500 text-xs">{session.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Category Modal */}
      <Modal visible={categoryModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-[#1E1E2E] rounded-t-2xl p-4">
            {['All', 'Review', 'Locked'].map((cat) => (
              <TouchableOpacity key={cat} className="py-3" onPress={() => { setFilterType(cat); setCategoryModalVisible(false); }}>
                <Text className="text-white text-lg">{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal visible={sortModalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-[#1E1E2E] rounded-t-2xl p-4">
            {['Alphabetical', 'Most Interactions', 'Fewest Interactions'].map((mode) => (
              <TouchableOpacity key={mode} className="py-3" onPress={() => sortLessons(mode)}>
                <Text className="text-white text-lg">{mode}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}
