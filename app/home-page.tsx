import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Modal 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, usePathname } from 'expo-router';

// ===== Constants =====
const PROFILE_PIC = { uri: 'https://randomuser.me/api/portraits/women/44.jpg' };
const TABS = ['Overview', 'Speaking', 'Reading', 'Community'] as const;
const TAB_ICONS: Record<TabType, keyof typeof Ionicons.glyphMap> = {
  'Overview': 'home-outline',
  'Speaking': 'mic-outline',
  'Reading': 'book-outline',
  'Community': 'people-outline'
};

type TabType = typeof TABS[number];

function HomePage() {
  // ===== Hooks =====
  const router = useRouter();
  const pathname = usePathname();
  
  // ===== State =====
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // ===== Navigation Handlers =====
  const handleIconPress = (iconName: string) => {
    if (iconName === 'log-out-outline') {
      router.replace('/login-page');
    }
  };

  const navigateToSettings = () => router.push('/settings');

  const navigateToTab = (tab: TabType) => {
    const routes: Record<TabType, string> = {
      'Overview': '/home-page',
      'Speaking': '/exercise-speaking',
      'Reading': '/exercise-reading',
      'Community': '/community-page'
    };
    router.push(routes[tab]);
  };

  // ===== Effects =====
  useEffect(() => {
    const animations = isProfileMenuVisible
      ? [
          Animated.timing(slideAnim, { 
            toValue: 0, 
            duration: 200, 
            useNativeDriver: true 
          }),
          Animated.timing(opacityAnim, { 
            toValue: 1, 
            duration: 200, 
            useNativeDriver: true 
          })
        ]
      : [
          Animated.timing(slideAnim, { 
            toValue: -50, 
            duration: 200, 
            useNativeDriver: true 
          }),
          Animated.timing(opacityAnim, { 
            toValue: 0, 
            duration: 200, 
            useNativeDriver: true 
          })
        ];

    Animated.parallel(animations).start();
  }, [isProfileMenuVisible]);

  // ===== Helper Functions =====
  const getActiveTab = (): TabType => {
    if (pathname.includes('exercise-speaking')) return 'Speaking';
    if (pathname.includes('exercise-reading')) return 'Reading';
    if (pathname.includes('community-page')) return 'Community';
    return 'Overview';
  };

  const activeTab = getActiveTab();

  // ===== UI Components =====
  
  /**
   * Header component with logo and navigation icons
   */
  const Header = () => (
    <View className="flex-row justify-between items-center mt-4 mb-2 w-full">
      <View className="flex-row items-center">
        <Image 
          source={require("../assets/Speaksy.png")} 
          className="w-12 h-12 rounded-full" 
          resizeMode="contain"
        />
        <Text className="text-white font-bold text-2xl ml-2 -left-3">Vocaria</Text>
      </View>

      <View className="flex-row items-center space-x-2">
        {[
          { icon: "robot-excited-outline", lib: MaterialCommunityIcons },
          { icon: "notifications-outline", lib: Ionicons },
          { icon: "log-out-outline", lib: Ionicons }
        ].map((item, index) => (
          <TouchableOpacity 
            key={index} 
            className="p-2" 
            onPress={() => handleIconPress(item.icon)}
            activeOpacity={0.7}
          >
            <item.lib name={item.icon as any} size={22} color="#fff" />
          </TouchableOpacity>
        ))}
        <TouchableOpacity 
          onPress={() => setIsProfileMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Image 
            source={PROFILE_PIC} 
            className="w-9 h-9 rounded-full border-2 border-white/80"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Profile menu dropdown modal
   */
  const ProfileMenu = () => (
    <Modal
      visible={isProfileMenuVisible}
      transparent
      animationType="none"
      onRequestClose={() => setIsProfileMenuVisible(false)}
    >
      <TouchableOpacity
        className="flex-1 bg-black/30"
        activeOpacity={1}
        onPressOut={() => setIsProfileMenuVisible(false)}
      >
        <Animated.View
          className="absolute top-14 right-4 bg-[#1E1E2E] rounded-xl p-4 w-48"
          style={{
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
          }}
        >
          <Text className="text-white text-base font-semibold mb-3">Sarah Johnson</Text>
          <TouchableOpacity 
            onPress={navigateToSettings} 
            className="py-2 flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={18} color="white" />
            <Text className="text-white text-sm ml-2">Settings</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );

  /**
   * Tab navigation component
   */
  const TabNavigation = () => (
    <View className="bg-white/10 rounded-xl p-1 mb-6 w-full">
      <View className="flex-row">
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => navigateToTab(tab)}
            className={`flex-1 py-2 rounded-lg ${activeTab === tab ? 'bg-white/90' : ''}`}
            activeOpacity={0.7}
          >
            <Text 
              className={`text-xs font-semibold text-center ${
                activeTab === tab ? 'text-violet-700' : 'text-white/80'
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  /**
   * Background decoration with gradient and floating elements
   */
  const BackgroundDecor = () => (
    <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
      <View className="absolute left-0 right-0 top-0 bottom-0">
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#0F172A']}
          className="flex-1"
        />
      </View>
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-violet-500/10 rounded-full" />
      <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-blue-600/10 rounded-full" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-cyan-300/10 rounded-full" />
      <View className="absolute bottom-5 right-10 w-12 h-12 bg-purple-400/10 rounded-full" />
      <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-cyan-300/10 rounded-full" />
    </View>
  );

  // ===== Render =====
  return (
    <View className="flex-1 bg-[#0F172A] relative">
      <BackgroundDecor />
      
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, padding: 16 }}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        <View className="w-full max-w-md mx-auto">
          {/* Header Section */}
          <Header />
          <ProfileMenu />
          <TabNavigation />

          {/* Welcome Section */}
          <View className="mb-6">
            <View className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 pb-1 border border-white/20 shadow-lg shadow-violet-900/20">
              <Text className="text-white text-2xl font-bold mb-1">Welcome back, Sarah!</Text>
              <Text className="text-gray-300 text-sm mb-5">
                Track your progress and continue improving your communication skills.
              </Text>

              {/* Pre-Assessment Results Section */}
              <View className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-5 border border-white/20 shadow-lg shadow-violet-900/20">
                <Text className="text-white/90 text-sm font-semibold mb-4 text-center">
                  Pre-Assessment Results
                </Text>
                
                <View className="flex-row items-center justify-between">
                  {/* Progress Circle */}
                  <View className="relative w-24 h-24 items-center justify-center">
                    <View className="absolute w-24 h-24 rounded-full border-4 border-white/" />
                    <View 
                      className="absolute w-24 h-24 rounded-full"
                      style={{
                        borderWidth: 4,
                        borderColor: '#a78bfa',
                        borderLeftColor: 'transparent',
                        borderBottomColor: 'transparent',
                        transform: [{ rotate: '45deg' }],
                      }}
                    >
                      <View 
                        className="absolute w-full h-full rounded-full"
                        style={{
                          borderWidth: 4,
                          borderColor: '#a78bfa',
                          borderRightColor: 'transparent',
                          borderTopColor: 'transparent',
                          transform: [{ rotate: '90deg' }],
                        }}
                      />
                    </View>
                    <View className="absolute w-20 h-20 bg-gradient-to-br from-violet-900/80 to-violet-800/60 rounded-full items-center justify-center shadow-lg">
                      <Text className="text-white text-2xl font-bold">78%</Text>
                      <Text className="text-violet-200 text-[10px] mt-[-2px]">Score</Text>
                    </View>
                  </View>
                  
                  {/* Performance Stats */}
                  <View className="flex-1 ml-4">
                    <View className="mb-4">
                      <Text className="text-violet-300 text-xs font-medium mb-1">
                        Overall Performance
                      </Text>
                      <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <View 
                          className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full" 
                          style={{ width: '78%' }} 
                        />
                      </View>
                    </View>
                    <View className="flex-row items-center bg-white/5 rounded-full px-3 py-1.5 self-start">
                      <View className="w-5 h-5 bg-violet-500 rounded-full items-center justify-center mr-2">
                        <Ionicons name="checkmark" size={12} color="white" />
                      </View>
                      <Text className="text-white/90 text-xs font-medium">
                        Confident Level
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Stats Cards Section */}
              <View className="flex-row gap-3 mb-6">
                {/* Upcoming Sessions Card */}
                <View className="bg-white/10 backdrop-blur-lg rounded-xl p-3 flex-1 items-center border border-white/20 shadow-lg shadow-violet-900/20">
                  <View className="w-12 h-12 rounded-full bg-violet-500/10 items-center justify-center mb-2">
                    <Ionicons name="calendar-outline" size={20} color="#a78bfa" />
                  </View>
                  <Text className="text-white text-2xl font-bold">2</Text>
                  <Text className="text-violet-300 text-xs text-center mt-1">
                    Upcoming
                  </Text>
                  <Text className="text-violet-400/60 text-[10px] text-center">
                    Sessions
                  </Text>
                </View>

                {/* Completed Modules Card */}
                <View className="bg-white/10 backdrop-blur-lg rounded-xl p-4 flex-1 items-center border border-white/20 shadow-lg shadow-violet-900/20">
                  <View className="w-12 h-12 rounded-full bg-violet-500/10 items-center justify-center mb-2">
                    <Ionicons name="checkmark-circle-outline" size={20} color="#a78bfa" />
                  </View>
                  <Text className="text-white text-2xl font-bold">8</Text>
                  <Text className="text-violet-300 text-xs text-center mt-1">
                    Completed
                  </Text>
                  <Text className="text-violet-400/60 text-[10px] text-center">
                    Modules
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions Section */}
          <View className="mb-6">
            <Text className="text-white text-2xl font-bold mb-4">
              Quick Actions
            </Text>
            
            <View className="flex-row gap-3">
              {/* Speaking Exercise Card */}
              <View className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 flex-1 border border-white/20 shadow-lg shadow-violet-900/20">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mb-3">
                  <Ionicons name="mic-outline" size={24} color="white" />
                </View>
                <Text className="text-white text-sm font-bold mb-1">
                  SPEAKING EXERCISE
                </Text>
                <Text className="text-gray-400 text-xs mb-4">
                  Practice Speaking (Live Video)
                </Text>
                <TouchableOpacity 
                  className="bg-violet-500 rounded-lg py-2.5 items-center w-full border border-white/20"
                  onPress={() => navigateToTab('Speaking')}
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-sm font-bold">Proceed</Text>
                </TouchableOpacity>
              </View>

              {/* Reading Exercise Card */}
              <View className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 flex-1 border border-white/20 shadow-lg shadow-violet-900/20">
                <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mb-3">
                  <Ionicons name="book-outline" size={24} color="white" />
                </View>
                <Text className="text-white text-sm font-bold mb-1">
                  READING EXERCISES
                </Text>
                <Text className="text-gray-400 text-xs mb-4">
                  Exercise your reading with AI analysis
                </Text>
                <TouchableOpacity 
                  className="bg-violet-500 rounded-lg py-2.5 items-center w-full border border-white/20"
                  onPress={() => navigateToTab('Reading')}
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-sm font-bold">Proceed</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Community Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-2xl font-bold">Community</Text>
            </View>
            
            <View className="flex-row gap-3">
              {/* Peer Review Card */}
              <View className="bg-white/10 backdrop-blur-lg rounded-xl p-4 flex-1 border border-white/20 shadow-lg shadow-violet-900/20">
                <View className="w-11 h-11 bg-white/20 rounded-full items-center justify-center mb-2.5">
                  <Ionicons name="people-outline" size={20} color="white" />
                </View>
                <Text className="text-white text-sm font-semibold mb-0.5">
                  PEER REVIEW
                </Text>
                <Text className="text-gray-400/90 text-xs mb-3.5 leading-tight">
                  Get feedback from the community
                </Text>
                <TouchableOpacity 
                  className="bg-violet-500 rounded-lg py-2 items-center w-full border border-white/20"
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-sm font-semibold">Proceed</Text>
                </TouchableOpacity>
              </View>

              {/* Live Session Card */}
              <View className="bg-white/10 backdrop-blur-lg rounded-xl p-4 flex-1 border border-white/20 shadow-lg shadow-violet-900/20">
                <View className="w-11 h-11 bg-white/20 rounded-full items-center justify-center mb-2.5">
                  <Ionicons name="videocam-outline" size={20} color="white" />
                </View>
                <Text className="text-white text-sm font-semibold mb-0.5">
                  LIVE SESSION
                </Text>
                <Text className="text-gray-400/90 text-xs mb-3.5 leading-tight">
                  Join live sessions with experts
                </Text>
                <TouchableOpacity 
                  className="bg-violet-500 rounded-lg py-2 items-center w-full border border-white/20"
                  onPress={() => router.push('/live-sessions')}
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-sm font-semibold">Join Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Progress Modules Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-bold">Your Progress</Text>
              <TouchableOpacity>
                <Text className="text-violet-400 text-sm">View All</Text>
              </TouchableOpacity>
            </View>

            {/* Module Progress Cards */}
            <View className="space-y-3">
              {/* Public Speaking Fundamentals Card */}
              <View className="bg-white/20 rounded-xl p-4">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="mic-outline" size={18} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-base font-semibold">
                      Public Speaking Fundamentals
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      Master the basics of effective public speaking
                    </Text>
                  </View>
                  <Text className="text-white text-xl font-bold">75%</Text>
                </View>
                <View className="bg-white/10 rounded-full h-2 overflow-hidden">
                  <View 
                    className="bg-gradient-to-r from-violet-500 to-violet-400 rounded-full h-2" 
                    style={{ width: '75%' }} 
                  />
                </View>
              </View>

              {/* Voice Modulation Card */}
              <View className="bg-white/20 rounded-xl p-4">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="volume-medium-outline" size={18} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-base font-semibold">
                      Voice Modulation
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      Control tone, pitch, and volume variety
                    </Text>
                  </View>
                  <Text className="text-white text-xl font-bold">60%</Text>
                </View>
                <View className="bg-white/10 rounded-full h-2 overflow-hidden">
                  <View 
                    className="bg-gradient-to-r from-violet-500 to-violet-400 rounded-full h-2" 
                    style={{ width: '60%' }} 
                  />
                </View>
              </View>

              {/* Body Language Card */}
              <View className="bg-white/20 rounded-xl p-4">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="body-outline" size={18} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-base font-semibold">
                      Body Language Mastery
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      Learn to use body language effectively
                    </Text>
                  </View>
                  <Text className="text-white text-xl font-bold">90%</Text>
                </View>
                <View className="bg-white/10 rounded-full h-2 overflow-hidden">
                  <View 
                    className="bg-gradient-to-r from-violet-500 to-violet-400 rounded-full h-2" 
                    style={{ width: '90%' }} 
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(HomePage) as React.ComponentType;
