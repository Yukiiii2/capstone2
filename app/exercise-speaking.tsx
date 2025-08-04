import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

// Constants
const PROFILE_PIC = { uri: 'https://randomuser.me/api/portraits/women/44.jpg' };

const MODULES = [
  {
    key: 'Basic',
    label: 'BASIC',
    title: 'Foundation Public Speaking Skills',
    desc: 'Master essential self-introduction techniques and learn to manage speaking anxiety in a supportive virtual classroom environment.',
    progress: 75/100, // 75% progress
    color: '#a78bfa',
    navigateTo: '/basic-contents',
  },
  {
    key: 'Advanced',
    label: 'ADVANCED',
    title: 'Advanced Public Speaking Mastery',
    desc: 'Deliver compelling presentations to large audiences while handling complex Q&A sessions and unexpected challenges.',
    progress: 40/100, // 40% progress
    color: '#a78bfa',
    navigateTo: '/advanced-contents',
  },
];

const TABS = ['Overview', 'Speaking', 'Reading', 'Community'] as const;

type TabType = typeof TABS[number];

type ModuleType = {
  key: string;
  label: string;
  title: string;
  desc: string;
  progress: number;
  color: string;
  navigateTo: string;
  isActive?: boolean;
};

const HomeScreen = () => {
  // Hooks
  const router = useRouter();
  const pathname = usePathname();
  
  // State
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState<boolean>(false);
  
  // Animation refs
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Navigation handlers
  const navigateToModule = (moduleKey: string, navigateTo: string) => {
    setSelectedModule(moduleKey);
    router.push(navigateTo);
  };

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

  // Animation effects
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

  // Tab management
  const getActiveTab = (): TabType => {
    if (pathname.includes('exercise-speaking')) return 'Speaking';
    if (pathname.includes('exercise-reading')) return 'Reading';
    if (pathname.includes('community-page')) return 'Community';
    return 'Overview';
  };

  const activeTab = getActiveTab();

  // Header component
  const Header = () => (
    <View className="flex-row justify-between items-center mt-4 mb-2 w-full">
      <View className="flex-row items-center">
        <Image 
          source={require("../assets/Speaksy.png")} 
          className="w-12 h-12 rounded-full" 
          resizeMode="contain"
        />
        <Text className="text-white font-bold text-2xl ml-2 -left-3">Voclaria</Text>
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

  // Background decorator component
  const BackgroundDecor = () => (
    <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
      <View className="absolute left-0 right-0 top-0 bottom-0">
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#0F172A']}
          className="flex-1"
        />
      </View>
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
    </View>
  );

  // Profile menu modal
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

  // Module card component with glassmorphism design
  const ModuleCard = ({ mod }: { mod: ModuleType }) => (
    <View className="bg-white/10 backdrop-blur-lg border border-white/30 rounded-2xl p-6 mb-4 w-full shadow-lg shadow-violet-900/20">
      {/* Header with label and progress indicator */}
      <View className="mb-4">
        <Text className="text-violet-300 font-bold text-xs tracking-wider uppercase mb-1 -mt-2">
          {mod.label}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-white font-bold text-xl flex-1">
            {mod.title}
          </Text>
          <View className="bg-violet-500/10 px-3 py-1.5 rounded-full ml-3 -mt-10">
            <Text className="text-violet-300 text-xs font-medium">
              {Math.round(mod.progress * 100)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text className="text-white/80 text-sm leading-6 mb-5">
        {mod.desc}
      </Text>

      {/* Progress bar */}
      <View className="mb-5">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white/80 text-xs">
            Module Progress
          </Text>
          <Text className="text-violet-300 text-xs font-medium">
            {mod.progress < 0.3 ? 'Getting Started' : mod.progress < 0.7 ? 'In Progress' : 'Almost There'}
          </Text>
        </View>
        <View className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <View 
            className="h-full rounded-full bg-[#a78bfa]" 
            style={{ 
              width: `${mod.progress * 100}%`
            }} 
          />
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        onPress={() => navigateToModule(mod.key, mod.navigateTo)}
        className={`py-3.5 rounded-xl border border-violet-400/30 ${
          mod.isActive 
            ? 'bg-violet-500/80' // Lighter color when active
            : 'bg-violet-600/70 active:bg-violet-500/80' // Lighter active state
        }`}
        activeOpacity={0.7} // More visible press effect
      >
        <Text className={`font-semibold text-center text-base ${
          mod.isActive ? 'text-white' : 'text-white/90'
        }`}>
          {mod.isActive ? 'Continue Learning' : 'Start Module'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Tab navigation component
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

  // Live practice section component
  const LivePracticeSection = () => (
    <View className="mb-8 w-full">
      <Text className="text-white text-2xl font-bold mb-2">Live Video Practice</Text>
      <Text className="text-gray-300 text-sm mb-4">
        Sharpen your speaking skills through live video practice with real audience feedback.
      </Text>

      <View className="py-2 px-6 bg-white/20 rounded-lg self-start mt-2">
        <Text className="text-base text-white font-semibold">Start Learning</Text>
      </View>

    </View>
  );

  return (
    <View className="flex-1 bg-[#0F172A] relative">
      <BackgroundDecor />
      
      <ScrollView 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        <View className="flex-1 items-center p-5 w-full max-w-md mx-auto">
          <Header />
          <ProfileMenu />
          <TabNavigation />
          
          <LivePracticeSection />
          
          <View className="w-full -top-2">
            <Text className="text-white text-2xl font-bold mb-4">Learning Paths</Text>
            {MODULES.map((mod) => (
              <ModuleCard 
                key={mod.key} 
                mod={{
                  ...mod,
                  isActive: selectedModule === mod.key
                }} 
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Add type safety for the component
export default React.memo(HomeScreen);
