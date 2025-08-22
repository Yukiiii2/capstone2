import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  Modal,
  Dimensions,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  PanResponder,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LevelSelectionModal } from "../components/LevelSelectionModal";
import ProfileMenu, { UserProfile } from "../components/ProfileMenuNew";
import LivesessionCommunityModal from "../components/LivesessionCommunityModal";
import { useTransform } from "../hooks/useTransform";

// ===== Constants =====
const PROFILE_PIC = { uri: "https://randomuser.me/api/portraits/women/44.jpg" };
const TABS = ["Overview", "Speaking", "Reading", "Community"] as const;
const TAB_ICONS: Record<TabType, keyof typeof Ionicons.glyphMap> = {
  Overview: "home-outline",
  Speaking: "mic-outline",
  Reading: "book-outline",
  Community: "people-outline",
};

type TabType = (typeof TABS)[number];

function HomePage() {
  // ===== Hooks =====
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const windowWidth = Dimensions.get('window').width;
  const { translateX: layoutTranslateX, resetTransform, setTransform } = useTransform();

  // ===== State =====
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  
  // Use layout transform instead of local transform
  const sidebarAnim = layoutTranslateX;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Handle sidebar width changes on layout
  const onSidebarLayout = useCallback((event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== sidebarWidth) {
      setSidebarWidth(width);
    }
  }, [sidebarWidth]);

  // Optimized sidebar toggle to prevent scheduling conflicts
  // Sidebar toggle using layout transform
  const toggleSidebar = useCallback(() => {
    if (showSidebar) {
      // Hide sidebar using layout transform
      setTransform(256);
      
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setShowSidebar(false));
    } else {
      // Show sidebar using layout transform
      setShowSidebar(true);
      setTransform(0);
      
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [showSidebar, setTransform, overlayAnim]);

  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showReadingLevelModal, setShowReadingLevelModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [stats, setStats] = useState({
    averageConfidence: 75, // Default confidence level
  });
  
  // Simplified animation refs without scheduling conflicts
  const sheetY = useRef(new Animated.Value(0)).current;
  const sheetOpacity = useRef(new Animated.Value(1)).current;

  // ===== Navigation Handlers =====
  const handleIconPress = useCallback((iconName: string) => {
    if (iconName === "log-out-outline") {
      router.replace("/login-page");
    } else if (iconName === "chatbot") {
      router.push("/chatbot");
    } else if (iconName === "notifications") {
      router.push("/notification");
    }
  }, [router]);

  const navigateToTab = useCallback((tab: TabType) => {
    const routes: Record<TabType, () => void> = {
      Overview: () => router.push("/home-page"),
      Speaking: () => router.push("/exercise-speaking"),
      Reading: () => setShowReadingLevelModal(true),
      Community: () => setShowCommunityModal(true)
    };
    routes[tab]();
  }, [router]);

  const handleLevelSelect = useCallback((level: "Basic" | "Advanced") => {
    setShowLevelModal(false);
    if (level === "Basic") {
      router.push("/basic-exercise-reading");
    } else {
      router.push("/advance-execise-reading");
    }
  }, [router]);

  const handleReadingLevelSelect = useCallback((level: "Basic" | "Advanced") => {
    setShowReadingLevelModal(false);
    if (level === "Basic") {
      router.push("/basic-exercise-reading");
    } else {
      router.push("/advance-execise-reading");
    }
  }, [router]);

  // ===== Derived Values =====
  const getActiveTab = useCallback((): TabType => {
    if (pathname?.includes("home-page")) return "Overview";
    if (pathname?.includes("exercise-speaking")) return "Speaking";
    if (pathname?.includes("exercise-reading")) return "Reading";
    return "Overview"; // Don't set active tab to Community when on community pages
  }, [pathname]);

  const activeTab = getActiveTab();

  // Add pan responder for swipe to close gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => showSidebar,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes when sidebar is open
        return showSidebar && Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 2);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (showSidebar && gestureState.dx > 0) {
          // Only allow swiping to the right to close
          const newPosition = Math.min(gestureState.dx, sidebarWidth);
          sidebarAnim.setValue(newPosition);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (showSidebar) {
          if (gestureState.dx > 50 || gestureState.vx > 0.5) {
            // Swipe to right (close sidebar) using layout transform
            setTransform(sidebarWidth);
            setShowSidebar(false);
            resetTransform();
          } else {
            // Reset position if not swiped enough using layout transform
            resetTransform();
          }
        }
      },
    })
  ).current;

  // ===== UI Components =====
  
  // Sidebar Component
  const Sidebar = ({
    showSidebar,
    toggleSidebar,
    sidebarAnim,
    panResponder,
    router,
    setShowReadingLevelModal,
    setShowCommunityModal
  }: {
    showSidebar: boolean;
    toggleSidebar: () => void;
    sidebarAnim: Animated.Value;
    panResponder: any;
    router: any;
    setShowReadingLevelModal: (show: boolean) => void;
    setShowCommunityModal: (show: boolean) => void;
  }) => (
    <Animated.View 
      className="absolute right-0 top-0 bottom-0 w-64 bg-[#0F172A]/95 drop-shadow-xl rounded-3xl z-50"
      onLayout={onSidebarLayout}
      style={[{
        right: 0,
        top: 0,
        bottom: 0,
        width: sidebarWidth,
        position: 'absolute',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 12,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        transform: [{ translateX: sidebarAnim }],
      }]}
      {...panResponder.panHandlers}
    >
      <View className="p-5 pt-14">
        {/* Quick Actions Header */}
        <View className="flex-row items-center justify-between mb-8">
          <Text className="text-white font-bold text-2xl">Quick Actions</Text>
          <TouchableOpacity onPress={toggleSidebar}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Quick Action Items */}
        <TouchableOpacity 
          className="py-3 px-2 border border-white/10  rounded-lg bg-white/5 mb-2"
          activeOpacity={0.7}
          onPress={() => {
            toggleSidebar();
            router.push("/exercise-speaking");
          }}
        >
          <View className="flex-row items-center">
            <Ionicons name="mic-outline" size={20} color="#FFFFFF" />
            <Text className="text-violet-500 ml-3 font-medium">SPEAKING EXERCISE</Text>
          </View>
          <Text className="text-gray-400 text-xs mt-1 ml-8">Practice Speaking with AI</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="py-3 px-2 border border-white/10  rounded-lg bg-white/5 mb-2"
          activeOpacity={0.7}
          onPress={() => {
            toggleSidebar();
            setShowReadingLevelModal(true);
          }}
        >
          <View className="flex-row items-center">
            <Ionicons name="book-outline" size={20} color="#FFFFFF" />
            <Text className="text-violet-500 ml-3 font-medium">READING EXERCISES</Text>
          </View>
          <Text className="text-gray-400 text-xs mt-1 ml-8">Practice Reading with AI</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="py-3 px-2 border border-white/10  rounded-lg bg-white/5 mb-2"
          activeOpacity={0.7}
          onPress={() => {
            toggleSidebar();
            setShowCommunityModal(true);
          }}
        >
          <View className="flex-row items-center">
            <Ionicons name="people-outline" size={20} color="#FFFFFF" />
            <Text className="text-violet-500 ml-3 font-medium">PEER REVIEW</Text>
          </View>
          <Text className="text-gray-400 text-xs mt-1 ml-8">Community Feedback</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="py-3 px-2 border border-white/10 rounded-lg bg-white/5"
          activeOpacity={0.7}
          onPress={() => {
            toggleSidebar();
            router.push("/live-sessions-select");
          }}
        >
          <View className="flex-row items-center">
            <Ionicons name="videocam-outline" size={20} color="#FFFFFF" />
            <Text className="text-violet-500 ml-3 font-medium">LIVE SESSION</Text>
          </View>
          <Text className="text-gray-400 text-xs mt-1 ml-8">Join sessions with peers</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Overlay Component - Optimized to prevent scheduling conflicts
  const Overlay = useCallback(() => (
    <Animated.View
      className="absolute inset-0 bg-black/50 z-40"
      style={{
        opacity: overlayAnim,
      }}
    >
      <Pressable 
        className="flex-1" 
        onPress={toggleSidebar}
      />
    </Animated.View>
  ), [overlayAnim, toggleSidebar]);

  // Welcome Text component - Memoized
  const WelcomeText = useCallback(() => (
    <View className="mt-2 top-1 mb-1">
      <Text className="text-white text-[28px] font-bold">
        Welcome back, Sarah!
      </Text>
    </View>
  ), []);

  // Header component with logo and navigation icons - Memoized
  const Header = useCallback(() => (
    <View className="w-full">
      <View className="flex-row justify-between bottom-4 items-center">
        <View className="flex-row items-center">
          <Image
            source={require("../assets/Speaksy.png")}
            className="w-14 h-14 right-2 top-2 rounded-full"
            resizeMode="contain"
          />
          <Text className="text-white font-bold top-2 right-6 text-3xl ml-3">
            Voclaria
          </Text>
        </View>
        <View className="flex-row items-center top-2 space-x-2">
          <TouchableOpacity
            className="p-1.5 rounded-full bg-white/5 active:bg-white/10"
            onPress={() => handleIconPress("chatbot")}
            activeOpacity={0.7}
          >
            <Image
              source={require("../assets/chatbot.png")}
              className="w-5 h-5"
              resizeMode="contain"
              tintColor="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-1.5 rounded-full bg-white/5 active:bg-white/10"
            onPress={() => handleIconPress("notifications")}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            className="rounded-full active:opacity-80 bg-white/5 active:bg-white/10"
            onPress={() => setIsProfileMenuVisible(true)}
            activeOpacity={0.7}
          >
            <Image
              source={PROFILE_PIC}
              className="w-8 h-8 rounded-full border border-white/60"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [handleIconPress, setIsProfileMenuVisible]);

  // Background decoration with gradient and floating elements - Memoized
  const BackgroundDecor = useCallback(() => (
    <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
      <View className="absolute left-0 right-0 top-0 bottom-0">
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A"]}
          className="flex-1"
        />
      </View>
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
    </View>
  ), []);

  // Bottom Navigation Icons
  const BottomNav = () => {
    const navItems = [
      {
        icon: "home-outline",
        label: "Home",
        route: "home-page",
        onPress: () => router.push("/home-page"),
      },
      {
        icon: "mic-outline",
        label: "Speaking",
        route: "exercise-speaking",
        onPress: () => router.push("/exercise-speaking"),
      },
      {
        icon: "book-outline",
        label: "Reading",
        route: "exercise-reading",
        onPress: () => setShowLevelModal(true),
      },
      {
        icon: "people-outline",
        label: "Community",
        route: "community-selection",
        onPress: () => navigateToTab("Community"),
      },
    ];

    return (
      <View className="absolute bottom-0 left-0 right-0 bg-[#0F172A]/95 backdrop-blur-xl rounded-t-3xl">
        <View className="flex-row justify-around items-center py-2">
          {navItems.map((item) => {
            const isActive = pathname.includes(item.route);
            return (
              <TouchableOpacity
                key={item.route}
                className="items-center py-2 px-4 rounded-xl"
                style={{
                  backgroundColor: isActive
                    ? "rgba(255, 255, 255, 0.14)"
                    : "transparent",
                }}
                onPress={item.onPress}
              >
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={isActive ? "#A78BFA" : "rgb(255, 255, 255)"}
                />
                <Text
                  className="text-xs mt-1"
                  style={{ color: isActive ? "#A78BFA" : "rgb(255, 255, 255)" }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Handle community option selection
  const handleCommunityOptionSelect = (option: 'Live Session' | 'Community Post') => {
    setShowCommunityModal(false);
    if (option === 'Live Session') {
      router.push('/live-sessions-select');
    } else if (option === 'Community Post') {
      router.push('/community-selection');
    }
  };

  // ===== Effects =====
  useEffect(() => {
    const animations = isProfileMenuVisible
      ? [
          Animated.spring(sheetY, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 0,
          }),
          Animated.timing(sheetOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
          }),
        ]
      : [
          Animated.timing(sheetY, {
            toValue: 300,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(sheetOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ];

    if (isProfileMenuVisible) {
      sheetY.setValue(300);
      sheetOpacity.setValue(0);
    }

    Animated.parallel(animations).start();
  }, [isProfileMenuVisible, sheetY, sheetOpacity]);

  // User data for ProfileMenu
  const userProfile: UserProfile = {
    name: "Sarah Johnson",
    email: "sarah@gmail.com",
    image: PROFILE_PIC,
  };

  /**
   * Tab navigation component
   */
  const TabNavigation = () => (
    <View className="bg-white/10 rounded-xl p-0.5 mb-4 w-full">
      <View className="flex-row">
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => navigateToTab(tab)}
            className={`flex-1 py-1.5 rounded-lg ${activeTab === tab ? "bg-white/90" : ""}`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-[11px] font-medium text-center ${
                activeTab === tab ? "text-violet-700" : "text-white/70"
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#0F172A]">
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar 
          showSidebar={showSidebar}
          toggleSidebar={toggleSidebar}
          sidebarAnim={sidebarAnim}
          panResponder={panResponder}
          router={router}
          setShowReadingLevelModal={setShowReadingLevelModal}
          setShowCommunityModal={setShowCommunityModal}
        />
      )}
      {showSidebar && <Overlay />}
      
      {/* Selection Modal */}
      <LivesessionCommunityModal
        visible={showCommunityModal}
        onDismiss={() => setShowCommunityModal(false)}
        onSelectOption={handleCommunityOptionSelect}
      />
      
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <BackgroundDecor />

      {/* Profile Menu */}
      <ProfileMenu
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        user={userProfile}
      />

      {/* Main Scrollable Content with Status Bar Area */}
      <ScrollView
        contentContainerStyle={{ 
          paddingBottom: 60, 
          paddingTop: insets.top + 10 // Add status bar height + padding
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Section */}
        <View className="w-full px-4 pt-2">
          <Header />
          <WelcomeText />
        </View>

        {/* Page Content */}
        <View className="px-4">
          {/* Dashboard Section */}
          <View className="mb-6">
            <View className="bg-white/5 backdrop-blur-xl top-3 rounded-2xl p-4 border border-white/25 shadow-lg">
              {/* Track your progress header with menu icon */}
              <View className="flex-row justify-between items-center">
                <Text className="text-white text-xl font-semibold pl-2">
                  Track your progress
                </Text>
                <TouchableOpacity 
                  onPress={toggleSidebar}
                  className="p-2"
                  activeOpacity={0.7}
                >
                  <Ionicons name="menu" size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              {/* Stats Cards Section - Compact Design */}
              <View className="flex-row gap-2.5 mb-3 h-20">
                {/* Upcoming Sessions Card */}
                <TouchableOpacity 
                  className="top-1.5 bg-gradient-to-br from-violet-600/20 to-violet-900/20 backdrop-blur-sm rounded-lg p-2.5 flex-1 border border-white/10 shadow-md active:scale-[0.98] transition-all"
                  activeOpacity={0.85}
                  onPress={() => console.log('View Upcoming Sessions')}
                >
                  <View className="flex-row items-center justify-between h-full">
                    <View className="p-1.5 bg-white/10 bottom-2 rounded-md">
                      <Ionicons name="calendar" size={16} color="#FFFFFF" />
                    </View>
                    <View className="items-end">
                      <Text className="text-white text-2xl  font-bold">2</Text>
                      <Text className="text-white text-[10px] top-2 font-medium mt-[-5px]">SESSIONS</Text>
                    </View>
                  </View>
                  <View className="absolute bottom-1.5 left-2.5 right-2.5 flex-row items-center justify-between">
                    <Text className="text-white/70 text-[10px] font-medium">Upcoming</Text>
                  </View>
                </TouchableOpacity>

                {/* Completed Modules Card */}
                <TouchableOpacity 
                  className="top-1.5 bg-gradient-to-br from-violet-600/20 to-violet-900/20 backdrop-blur-sm rounded-lg p-2.5 flex-1 border border-white/10 shadow-md active:scale-[0.98] transition-all"
                  activeOpacity={0.85}
                  onPress={() => console.log('View Completed Modules')}
                >
                  <View className="flex-row items-center justify-between h-full">
                    <View className="p-1.5 bg-white/10 bottom-2 rounded-md">
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                    <View className="items-end">
                      <Text className="text-white text-2xl font-bold">8</Text>
                      <Text className="text-white text-[10px] top-2 font-medium mt-[-5px]">MODULES</Text>
                    </View>
                  </View>
                  <View className="absolute bottom-1.5 left-2.5 right-2.5 flex-row items-center justify-between">
                    <Text className="text-white/70 text-[10px] font-medium">Completed</Text>
                  </View>
                </TouchableOpacity>
              </View>


              <Text className="text-white text-xl font-semibold text-start top-1">
                Speaking Skills
              </Text>
              {/* Reading Results Section */}
              <View className="bg-white/5 top-3 backdrop-blur-xl rounded-xl p-4 mb-5 border border-white/20 shadow-lg shadow-violet-900/20">

                <View className="flex-row items-center justify-between">
                  {/* Progress Circle */}
                  <View className="relative w-24 h-24 bottom items-center justify-center">
                    <View className="absolute w-24 h-24 rounded-full border-4 border-white/10" />
                    <View
                      className="absolute w-24 h-24 rounded-full"
                      style={{
                        borderWidth: 4,
                        borderColor: "#a78bfa",
                        borderLeftColor: "transparent",
                        borderBottomColor: "transparent",
                        transform: [{ rotate: "45deg" }],
                      }}
                    >
                      <View
                        className="absolute w-full h-full rounded-full"
                        style={{
                          borderWidth: 4,
                          borderColor: "#a78bfa",
                          borderRightColor: "transparent",
                          borderTopColor: "transparent",
                          transform: [{ rotate: "90deg" }],
                        }}
                      />
                    </View>
                    <View className="absolute w-20 h-20 bg-gradient-to-br from-violet-900/80 to-violet-800/60 rounded-full items-center justify-center shadow-lg">
                      <Text className="text-white text-2xl font-bold">78%</Text>
                      <Text className="text-violet-200 text-[10px] mt-[-2px]">
                        Score
                      </Text>
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
                          className="bg-gradient-to-r from-violet-500 to-violet-400 rounded-full h-2"
                          style={{ width: "78%" }}
                        />
                      </View>
                    </View>
                    <View className="flex-row items-center px-3 py-1.5 self-start">
                      <View className="w-7 h-7 bg-violet-500 right-3 rounded-full items-center justify-center mr-2">
                        <Ionicons name="checkmark" size={20} color="white" />
                      </View>
                      <Text className="text-white/90 text-lg right-3 font-medium">
                        Confident Level
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Speaking Results Section */}
              <Text className="text-white text-xl font-semibold text-start mt-1">
               Reading Skills
              </Text>
              <View className="bg-white/5 top-3 backdrop-blur-xl rounded-xl p-4 mb-5 border border-white/20 shadow-lg shadow-violet-900/20">
                <View className="flex-row items-center justify-between">
                  {/* Progress Circle */}
                  <View className="relative w-24 h-24 bottom items-center justify-center">
                    <View className="absolute w-24 h-24 rounded-full border-4 border-white/10" />
                    <View
                      className="absolute w-24 h-24 rounded-full"
                      style={{
                        borderWidth: 4,
                        borderColor: "#a78bfa",
                        borderLeftColor: "transparent",
                        borderBottomColor: "transparent",
                        transform: [{ rotate: "30deg" }],
                      }}
                    >
                      <View
                        className="absolute w-full h-full rounded-full"
                        style={{
                          borderWidth: 4,
                          borderColor: "#a78bfa",
                          borderRightColor: "transparent",
                          borderTopColor: "transparent",
                          transform: [{ rotate: "60deg" }],
                        }}
                      />
                    </View>
                    <View className="absolute w-20 h-20 bg-gradient-to-br from-violet-900/80 to-violet-800/60 rounded-full items-center justify-center shadow-lg">
                      <Text className="text-white text-2xl font-bold">85%</Text>
                      <Text className="text-violet-200 text-[10px] mt-[-2px]">
                        Score
                      </Text>
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
                          className="bg-gradient-to-r from-violet-500 to-violet-400 rounded-full h-2"
                          style={{ width: "85%" }}
                        />
                      </View>
                    </View>
                    <View className="flex-row items-center px-3 py-1.5 self-start">
                      <View className="w-7 h-7 bg-violet-500 right-3 rounded-full items-center justify-center mr-2">
                        <Ionicons name="checkmark" size={20} color="white" />
                      </View>
                      <Text className="text-white/90 text-lg right-3 font-medium">
                        Confident Level
                      </Text>
                    </View>
                  </View>
                </View>
                </View>
            </View>
          </View>
        </View>

        

        {/* Anxiety & Confidence Tracking Section */}
        <View className="mb-6 p-4">
          <Text className="text-xl font-bold text-white mb-3">
            Anxiety & Confidence Tracking
          </Text>
          <View className="bg-white/10 border border-white/20 rounded-2xl p-5">
            <View className="flex-row justify-between items-center mb-4">
              <View className="items-center flex-1">
                <Text className="text-white font-bold text-2xl">
                  {stats.averageConfidence}%
                </Text>
                <Text className="text-white/80 text-xs">Confidence Level</Text>
              </View>
              <View className="h-10 w-px bg-white/20" />
              <View className="items-center flex-1">
                <Text className="text-white font-bold text-2xl">
                  {100 - stats.averageConfidence}%
                </Text>
                <Text className="text-white/80 text-xs">Anxiety Level</Text>
              </View>
            </View>

            <View className="mt-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-white font-medium text-sm">
                  Speaking and Reading Exercises
                </Text>
                <Text className="text-white/80 text-sm">
                  {stats.averageConfidence}%
                </Text>
              </View>
              <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                <View
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${stats.averageConfidence}%` }}
                />
              </View>

              <View className="flex-row justify-between mt-4 mb-2">
                <Text className="text-white font-medium text-sm">
                  Anxiety During Practice
                </Text>
                <Text className="text-white/80 text-sm">
                  {100 - stats.averageConfidence}%
                </Text>
              </View>
              <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                <View
                  className="h-full bg-violet-500 rounded-full"
                  style={{ width: `${100 - stats.averageConfidence}%` }}
                />
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNav />
      </View>
      {/* Level Selection Modal */}
      <LevelSelectionModal
        visible={showLevelModal}
        onDismiss={() => setShowLevelModal(false)}
        onSelectLevel={handleLevelSelect}
      />
    </View>
  );
}

export default HomePage;