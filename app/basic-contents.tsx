import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';

const lessons = [
  { id: 1, title: 'Effective Non-Verbal Communication', subtitle: 'Lesson 1', desc: 'Master gestures and visual cues', type: 'Review', locked: false, progress: 1 },
  { id: 2, title: 'Diaphragmatic Breathing Practice', subtitle: 'Lesson 2', desc: 'Control and project your voice', type: 'Continue', locked: false, progress: 0.3 },
  { id: 3, title: 'Voice Warm-up and Articulation', subtitle: 'Lesson 3', desc: 'Clarity and pronunciation', type: 'Review', locked: false, progress: 1 },
  { id: 4, title: 'Eye Contact and Facial Expression', subtitle: 'Lesson 4', desc: 'Engage your audience', type: 'Start', locked: false, progress: 0 },
  { id: 5, title: 'Basic Self-Introduction', subtitle: 'Lesson 5', desc: 'Confidently introduce yourself', type: 'Review', locked: false, progress: 1 },
  { id: 6, title: 'Pacing and Speech Clarity', subtitle: 'Lesson 6', desc: 'Avoid rushing and monotony', type: 'Review', locked: false, progress: 1 },
  { id: 7, title: 'Gestures and Body Movement', subtitle: 'Lesson 7', desc: 'Meaningful movement', type: 'Continue', locked: false, progress: 0.4 },
  { id: 8, title: 'Voice Projection Technique', subtitle: 'Lesson 8', desc: 'Be heard in any setting', type: 'Review', locked: false, progress: 1 },
  { id: 9, title: 'Overcoming Speaking Anxiety', subtitle: 'Lesson 9', desc: 'Build confidence', type: 'Start', locked: false, progress: 0 },
  { id: 10, title: 'Structured Self-Presentation', subtitle: 'Lesson 10', desc: 'Track your progress', type: 'Start', locked: false, progress: 0 },
  { id: 11, title: 'Audience Engagement Basics', subtitle: 'Lesson 11', desc: 'Interact with listeners', type: 'Start', locked: false, progress: 0 },
  { id: 12, title: 'Final Practice: Full Presentation', subtitle: 'Lesson 12', desc: 'Showcase your skills', type: 'Start', locked: false, progress: 0 },
];

export default function BasicContents() {
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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: isProfileMenuVisible ? 0 : -50, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: isProfileMenuVisible ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [isProfileMenuVisible]);

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
    if (mode === 'Most Interactions') sorted.sort((a, b) => b.progress - a.progress);
    if (mode === 'Fewest Interactions') sorted.sort((a, b) => a.progress - b.progress);
    setFilteredLessons(sorted);
    setSortModalVisible(false);
  };

  const handleTabNavigation = (tab: string) => {
    const routes: Record<string, string> = {
      Overview: '/home-page',
      Speaking: '/exercise-speaking',
      Reading: '/exercise-reading',
      Community: '/community-page'
    };
    router.push(routes[tab]);
  };

  const handleLogout = () => router.replace('/login-page');
  const handleSettings = () => router.push('/settings');

  const activeTab = pathname.includes('exercise-speaking') ? 'Speaking' :
    pathname.includes('exercise-reading') ? 'Reading' :
      pathname.includes('community-page') ? 'Community' : 'Speaking';

  return (
    <View className="flex-1 bg-[#0A0A1E]">
      {/* Gradient Background */}
      <LinearGradient
        colors={['#0A0A0F', '#1A1A2E', '#16213E']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        className="absolute inset-0"
      />
      <View className="absolute -top-16 -left-12 w-40 h-40 bg-purple-700/15 rounded-full" />
      <View className="absolute top-24 -right-10 w-24 h-24 bg-blue-600/10 rounded-full" />
      <View className="absolute bottom-24 left-12 w-9 h-9 bg-cyan-300/10 rounded-full" />
      <View className="absolute bottom-5 right-10 w-16 h-16 bg-purple-400/10 rounded-full" />

      <ScrollView className="flex-1 px-4 pt-12" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <View className="w-7 h-7 rounded-full bg-purple-500 mr-2" />
            <Text className="text-white text-xl font-bold">Voclaria</Text>
          </View>
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity><Ionicons name="trophy-outline" size={22} color="#fff" /></TouchableOpacity>
            <TouchableOpacity><Ionicons name="notifications-outline" size={22} color="#fff" /></TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}><Ionicons name="log-out-outline" size={22} color="#fff" /></TouchableOpacity>
            <TouchableOpacity onPress={() => setIsProfileMenuVisible(true)}>
              <Image source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} className="w-9 h-9 rounded-full border-2 border-white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-white/5 rounded-xl p-1 mb-5">
          {["Overview", "Speaking", "Reading", "Community"].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => handleTabNavigation(tab)} className={`flex-1 px-3 py-2 rounded-lg ${activeTab === tab ? "bg-white/80" : ""}`}>
              <Text className={`text-xs font-bold text-center ${activeTab === tab ? "text-violet-600" : "text-white/80"}`}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Module Summary */}
        <View className="mb-4">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 pr-3">
              <Text className="text-white/90 font-semibold text-base">Foundation Public Speaking Skills</Text>
              <Text className="text-gray-400 text-xs">Build confidence in speaking through progressive skill mastery and feedback.</Text>
            </View>
            <View className="items-end">
              <Text className="text-white/80 text-xs mb-1">Module Progress</Text>
              <Text className="text-purple-400 font-bold text-lg">75%</Text>
            </View>
          </View>
          <View className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <View className="h-full bg-purple-500 rounded-full w-[75%]" />
          </View>
        </View>

        {/* Search & Filter */}
        <View className="mb-3 flex-row items-center relative">
          <Ionicons name="search" size={18} color="#aaa" className="absolute left-3 top-3" />
          <TextInput
            placeholder="Search by title, desc..."
            placeholderTextColor="#aaa"
            className="flex-1 bg-white/10 rounded-lg py-2 pl-9 pr-3 text-white text-sm"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity className="ml-2 bg-purple-500 px-3 py-2 rounded-lg" onPress={() => setCategoryModalVisible(true)}>
            <Text className="text-white text-xs font-bold">{filterType}</Text>
          </TouchableOpacity>
          <TouchableOpacity className="ml-2 bg-white/10 px-3 py-2 rounded-lg" onPress={() => setSortModalVisible(true)}>
            <Ionicons name="filter" size={18} color="#a855f7" />
          </TouchableOpacity>
        </View>

        {/* Lessons Grid */}
        <View className="flex-row flex-wrap justify-between">
          {filteredLessons.map((lesson) => (
            <View key={lesson.id} className="w-[48%] bg-[#1E1E2E] rounded-2xl mb-4 p-3">
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center">
                  <View className={`w-5 h-5 rounded-full items-center justify-center ${lesson.progress === 1 ? 'bg-purple-500' : lesson.locked ? 'bg-gray-400' : 'bg-purple-300'}`}>
                    <Ionicons name={lesson.locked ? "lock-closed-outline" : lesson.progress === 1 ? "checkmark" : "book-outline"} size={14} color="#fff" />
                  </View>
                  <Text className="text-gray-400 text-xs font-semibold ml-2">{lesson.subtitle}</Text>
                </View>
              </View>
              {/* Progress Bar */}
              <View className="h-1 bg-gray-700 rounded-full my-2 overflow-hidden">
                <View className={`h-1 rounded-full ${lesson.locked ? "bg-gray-400" : "bg-purple-500"}`} style={{ width: `${lesson.progress * 100}%` }} />
              </View>
              <Text className="text-white font-bold text-[13px] mb-1">{lesson.title}</Text>
              <Text className="text-gray-400 text-[11px] mb-3">{lesson.desc}</Text>
              <TouchableOpacity className={`py-2 rounded-lg ${lesson.locked ? "bg-gray-400" : "bg-purple-500"}`}>
                <Text className="text-white text-xs font-semibold text-center">{lesson.type}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
