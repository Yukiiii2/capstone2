import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
  Platform,
  Linking,
  StatusBar,
  Dimensions,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import LevelSelectionModal from "../components/LevelSelectionModal";
import ProfileMenuNew from "../components/ProfileMenuNew";
import EndSessionModal from "../components/EndSessionModal";
import LivesessionCommunityModal from "../components/LivesessionCommunityModal";

// Constants
const PROFILE_PIC = { uri: "https://randomuser.me/api/portraits/women/44.jpg" };
const TABS = ["Overview", "Speaking", "Reading", "Community"] as const;
type TabType = (typeof TABS)[number];

const tips = [
  "Speak clearly and steadily",
  "Use gestures for emphasis",
  "Stand tall for confidence",
  "Look at the camera",
  "Change tone to engage",
  "Pause after key points",
  "Smile to seem approachable",
];

const feedbackMessages = [
  "Clear pronunciation!",
  "Vary your tone for emphasis",
  "Good pacing, keep it up",
  "Try slowing down slightly",
  "Excellent confidence!",
  "Use more hand gestures",
  "Maintain eye contact with camera",
  "Great energy in your delivery"
];

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

export default function PrivateVideoRecording() {
  // Hooks and state
  const router = useRouter();
  const pathname = usePathname();
  const [isRecording, setIsRecording] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState("");

  // Animation refs
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  // Screen dimensions
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Set status bar style on component mount
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
  }, []);

  // Rotate through tips every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % tips.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // Handle recording state changes
  useEffect(() => {
    if (isRecording) {
      // Start recording and go full screen
      setIsFullScreen(true);
      
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start cycling through feedback messages
      const feedbackInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * feedbackMessages.length);
        setCurrentFeedback(feedbackMessages[randomIndex]);
        
        // Animate feedback in
        Animated.sequence([
          Animated.timing(feedbackAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.delay(3000),
          Animated.timing(feedbackAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      }, 4000);

      return () => clearInterval(feedbackInterval);
    } else {
      // Stop recording and exit full screen
      setIsFullScreen(false);
      pulseAnim.setValue(1);
      setCurrentFeedback("");
      
      // Hide AI feedback
      Animated.timing(feedbackAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isRecording]);

  // Animation effects for profile menu
  useEffect(() => {
    const animations = isProfileMenuVisible
      ? [
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]
      : [
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ];
    Animated.parallel(animations).start();
  }, [isProfileMenuVisible]);

  // Get active tab based on current path
  const getActiveTab = (): string => {
    if (pathname.includes("home-page")) return "Home";
    if (
      pathname.includes("exercise-speaking") ||
      pathname.includes("basic-contents") ||
      pathname.includes("advanced-contents") ||
      pathname.includes("private-video-recording")
    )
      return "Speaking";
    if (
      pathname.includes("exercise-reading") ||
      pathname.includes("basic-exercise-reading") ||
      pathname.includes("advance-execise-reading")
    )
      return "Reading";
    if (pathname.includes("community-selection") || pathname.includes("community"))
      return "Community";
    return "Speaking"; // Default to Speaking tab
  };

  const activeTab = getActiveTab();

  // Navigation handler
  const handleTabPress = (tab: TabType) => {
    if (tab === activeTab) return;
    if (tab === "Community") {
      setShowCommunityModal(true);
      return;
    }
    if (tab === "Reading") {
      setShowLevelModal(true);
      return;
    }
    const routes: Record<TabType, string> = {
      Overview: "/home-page",
      Speaking: "/exercise-speaking",
      Reading: "/exercise-reading",
      Community: "/community-selection",
    };

    if (routes[tab]) {
      router.push(routes[tab]);
    }
  };

  const handleCommunitySelect = (option: 'Live Session' | 'Community Post') => {
    setShowCommunityModal(false);
    if (option === 'Live Session') {
      router.push('/live-sessions-select');
    } else if (option === 'Community Post') {
      router.push('/community-selection');
    }
  };

  // Handle icon press
  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") router.replace("/login-page");
  };

  // Handle AI analysis view
  const handleViewAIAnalysis = () => {
    setShowEndSessionModal(false);
    router.push("/full-results-speaking");
  };

  // Download video function
  const downloadVideo = async () => {
    try {
      setIsDownloading(true);

      if (Platform.OS === "android") {
        const { status, canAskAgain } =
          await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          if (!canAskAgain) {
            Alert.alert(
              "Permission Required",
              "Storage permission is required to save videos. You can enable it in app settings if you change your mind.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    setIsDownloading(false);
                    setShowEndSessionModal(false);
                  },
                },
                {
                  text: "Open Settings",
                  onPress: () => {
                    setIsDownloading(false);
                    setShowEndSessionModal(false);
                    Linking.openSettings();
                  },
                },
              ]
            );
          } else {
            setIsDownloading(false);
            setShowEndSessionModal(false);
          }
          return;
        }
      }

      try {
        const videoUrl = "https://example.com/path/to/recorded-video.mp4";
        const fileName = `recording-${new Date().getTime()}.mp4`;

        const downloadResult = await FileSystem.downloadAsync(
          videoUrl,
          FileSystem.documentDirectory + fileName
        );

        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        await MediaLibrary.createAlbumAsync("Recordings", asset, false);

        Alert.alert("Success", "Video saved to gallery!");
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (
          !errorMessage.includes("permission") &&
          !errorMessage.includes("denied")
        ) {
          console.error("Error saving video:", error);
          Alert.alert("Error", "Failed to save video. Please try again.");
        }
      }
    } finally {
      setIsDownloading(false);
      setShowEndSessionModal(false);
    }
  };

  // Handle level selection
  const handleLevelSelect = (level: "Basic" | "Advanced") => {
    setShowLevelModal(false);
    if (level === "Basic") {
      router.push("/basic-exercise-reading");
    } else {
      router.push("/advance-execise-reading");
    }
  };

  // ===== SUB-COMPONENTS =====


  // Header component
  const Header = () => (
    <View className="mt-2">
      <View className="flex-row justify-between items-center mt-4 mb-3 w-full">
        <TouchableOpacity 
          className="flex-row items-center px-3 py-2 -ml-3"
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Image 
            source={require("../assets/Speaksy.png")} 
            className="w-10 h-10 right-3 rounded-full" 
            resizeMode="contain"
          />
          <Text className="text-white font-bold text-2xl right-5 ml-2">Voclaria</Text>
        </TouchableOpacity>

        <View className="flex-row items-center right-4 space-x-2">
          <TouchableOpacity 
            className="p-2 rounded-full bg-white/10 active:bg-white/20"
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
            className="p-2 rounded-full bg-white/10 active:bg-white/20 ml-1"
            onPress={() => handleIconPress("notifications")}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="notifications-outline" 
              size={20} 
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsProfileMenuVisible(true)}
            activeOpacity={0.7}
          >
            <Image
              source={PROFILE_PIC}
              className="w-9 h-9 rounded-full border-2 left-3 border-white/80"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Bottom Navigation Component
  const BottomNav = () => {
    const navItems = [
      {
        icon: "home-outline",
        label: "Home",
        onPress: () => handleTabPress("Overview"),
      },
      {
        icon: "mic-outline",
        label: "Speaking",
        onPress: () => handleTabPress("Speaking"),
      },
      {
        icon: "book-outline",
        label: "Reading",
        onPress: () => handleTabPress("Reading"),
      },
      {
        icon: "people-outline",
        label: "Community",
        onPress: () => handleTabPress("Community"),
      },
    ];

    return (
      <View className="absolute bottom-0 left-0 right-0 bg-[#0F172A]/95 backdrop-blur-xl rounded-t-3xl">
        <View className="flex-row justify-around items-center py-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.label;
            return (
              <TouchableOpacity
                key={item.label}
                className="items-center py-2 px-2 rounded-xl"
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

  // AI Feedback Component (Centered text only)
  const AIFeedback = () => (
    <Animated.View 
      className="absolute top-[40%] left-5 right-5 z-10 items-center justify-center"
      style={{ 
        opacity: feedbackAnim,
        transform: [
          {
            translateY: feedbackAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })
          }
        ]
      }}
    >
      <Text className="text-white text-lg font-medium text-center bg-black/60 px-4 py-3 rounded-xl">
        {currentFeedback}
      </Text>
    </Animated.View>
  );

  // Status Row Component
  const StatusRow = () => (
    <View className="flex-row justify-between items-center bg-white/10 rounded-xl p-3 mt-3">
      {[
        { title: "Pronunciation", rating: 4.8, trend: "up" },
        { title: "Pace", rating: 3.5, trend: "down" },
        { title: "Confidence", rating: 4.2, trend: "up" },
      ].map((item, idx) => (
        <View key={idx} className="items-center flex-1">
          <Text className="text-white text-xs font-semibold mb-1">{item.title}</Text>
          <View className="flex-row items-center">
            <Text className="text-white font-bold text-sm">{item.rating.toFixed(1)}</Text>
            <Text className="text-gray-400 text-xs ml-0.5">/5.0</Text>
          </View>
          <View className="flex-row items-center mt-1">
            <Ionicons
              name={item.trend === "up" ? "trending-up" : "trending-down"}
              size={12}
              color={item.trend === "up" ? "#0096FF" : "#FF0000"}
              className="mr-1"
            />
            <Text className="text-xs text-gray-400">
              {item.trend === "up" ? "Improving" : "Needs work"}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  // Full Screen Recording View
  const FullScreenRecording = () => (
    <View className="flex-1 bg-black justify-center items-center">
      {/* Camera-like background */}
      <View className="absolute inset-0 bg-black" />
      
      {/* Camera type indicator (Front camera only) */}
      <View className="absolute top-[60px] right-[24px] flex-row items-center bg-black/50 px-3 py-1.5 rounded-full z-10">
        <Ionicons name="camera" size={16} color="white" style={{ marginRight: 6, marginTop: 2 }} />
        <Text className="text-white text-sm">Front Camera</Text>
      </View>
      
      {/* AI Feedback (centered) */}
      <AIFeedback />
      
      {/* Recording timer and status */}
      <View className="absolute top-[60px] left-[24px] bg-black/50 px-3 py-1.5 rounded-full z-10">
        <View className="flex-row items-center">
          <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
          <Text className="text-white text-sm">Recording</Text>
          <Text className="text-white/70 text-sm ml-2">02:45</Text>
        </View>
      </View>
      
      {/* Stop button */}
      <TouchableOpacity
        className="absolute bottom-10 w-[70px] h-[70px] rounded-full bg-white justify-center items-center z-10"
        onPress={() => {
          setIsRecording(false);
          setShowContinueButton(true);
        }}
        activeOpacity={0.7}
      >
        <View className="w-[30px] h-[30px] bg-red-500 rounded" />
      </TouchableOpacity>
      
      {/* Tip indicator */}
      <View className="absolute bottom-[120px] flex-row items-center bg-black/50 px-3 py-2 rounded-full z-10">
        <View className="flex-row items-center">
          <Image 
            source={require('../assets/tips.png')} 
            className="w-4 h-4 bottom-0.5 mr-1"
            resizeMode="contain"
          />
          <Text className="text-white text-xs">{tips[currentTipIndex]}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#0F172A] relative">
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent"
        translucent={true}
      />
      <BackgroundDecor />

      {/* Profile Menu */}
      <ProfileMenuNew
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        user={{
          name: "Sarah Johnson",
          email: "sarah@gmail.com",
          image: PROFILE_PIC,
        }}
      />

      {/* End Session Modal */}
      <EndSessionModal
        visible={showEndSessionModal}
        onDismiss={() => setShowEndSessionModal(false)}
        isDownloading={isDownloading}
        setIsDownloading={setIsDownloading}
        onViewAIAnalysis={handleViewAIAnalysis}
        onDownloadVideo={downloadVideo}
      />
      <LivesessionCommunityModal
        visible={showCommunityModal}
        onDismiss={() => setShowCommunityModal(false)}
        onSelectOption={handleCommunitySelect}
      />
      {/* Level Selection Modal */}
      <LevelSelectionModal
        visible={showLevelModal}
        onDismiss={() => setShowLevelModal(false)}
        onSelectLevel={(level: 'Basic' | 'Advanced') => {
          setShowLevelModal(false);
          const route = level === 'Basic' 
            ? '/basic-exercise-reading' 
            : '/advance-execise-reading';
          router.push(route);
        }}
      />

      {isFullScreen ? (
        <FullScreenRecording />
      ) : (
        <>
            {/* Make the entire screen scrollable */}
                    <ScrollView
                      className="flex-1"
                      contentContainerClassName="pb-20"
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {/* Header - Fixed at the top */}
                      <View className="pt-2 px-5 z-10">
                        <Header />
                      </View>
          
                      {/* Main content */}
                      <View className="flex-1 px-5 w-full max-w-[500px] mx-auto">
                        <View className="w-full mb-4">
                          <View className="mb-4">
                            <Text className="text-white text-2xl font-bold mb-1">
                              Private Video Recording
                            </Text>
                            <Text className="text-gray-300 text-sm text-justify">
                            Record your presentation and receive real-time AI Powered
                            feedback and analysis.
                            </Text>
                          </View>
                        </View>
          
                        <View className="w-full bg-white/5 rounded-2xl shadow-xl mb-1 overflow-hidden border border-gray-700/30">
                          <View className="flex-row items-center justify-between px-4 py-2 bg-gray-800/50">
                            <View className="flex-row items-center space-x-4">
                              <View className="flex-row items-center">
                                <Ionicons name="people" size={14} color="#FFFFFF" />
                                <Text className="text-gray-300 text-xs ml-1">25</Text>
                              </View>
                              <View className="flex-row items-center">
                                <Ionicons name="mic" size={14} color="#FFFFFF" />
                                <Text className="text-gray-300 text-xs ml-1">Active</Text>
                              </View>
                            </View>
                          </View>
                          
                          {/* Video Container */}
                          <View className="w-full aspect-[4/3] bg-gray-900 border border-white/30 relative items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-black/30">
                            {!isRecording && (
                              <View className="absolute">
                                <Animated.View
                                  style={{ transform: [{ scale: pulseAnim }] }}
                                >
                                  <TouchableOpacity
                                    onPress={() => setIsRecording(true)}
                                    className="w-16 h-16 rounded-full items-center justify-center bg-gradient-to-br from-red-600 to-indigo-700 border-2 border-red-500"
                                    activeOpacity={0.8}
                                  >
                                    <Ionicons name="videocam" size={24} color="#FF0000" />
                                  </TouchableOpacity>
                                </Animated.View>
                              </View>
                            )}
          
                            <Text className={`absolute ${isRecording ? 'bottom-4' : 'bottom-8'} self-center text-white text-xs bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-sm`}>
                              {isRecording ? "Recording in progress" : "Tap to start recording"}
                            </Text>
                          </View>
          
                          {showContinueButton && (
                            <View className="w-full px-4 py-3 bg-gray-800/50 flex-row justify-center space-x-4">
                              <TouchableOpacity
                                onPress={() => setShowEndSessionModal(true)}
                                className="bg-violet-600 px-8 py-3 rounded-lg items-center flex-1 max-w-xs"
                              >
                                <Text className="text-white font-semibold">Continue</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => setShowContinueButton(false)}
                                className="bg-transparent border border-white/30 px-8 py-3 rounded-lg items-center flex-1 max-w-xs"
                              >
                                <Text className="text-white">Cancel</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
          
                        {/* Status Row */}
                        <StatusRow />
                      </View>
                    </ScrollView>
          
                    {/* Bottom Navigation */}
                    <BottomNav />
                  </>
                )}
          
                {/* Level Selection Modal */}
                <LevelSelectionModal
                  visible={showLevelModal}
                  onDismiss={() => setShowLevelModal(false)}
                  onSelectLevel={handleLevelSelect}
                />
              </View>
            );
          }