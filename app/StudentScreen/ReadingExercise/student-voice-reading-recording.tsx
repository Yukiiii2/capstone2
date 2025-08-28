import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter, useLocalSearchParams } from "expo-router";
import CompletionModal from "@/components/StudentModal/CompletionModal";

const { width, height } = Dimensions.get("window");

export default function StudentVoiceReadingRecording() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // State management
  const [recording, setRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState("");
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultsPrompt, setShowResultsPrompt] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  
  // Profile icon from Ionicons instead of image
  const ProfileIcon = () => (
    <View className="w-8 h-8 rounded-full bg-indigo-600 items-center justify-center">
      <Ionicons name="person" size={20} color="white" />
    </View>
  );
  
  // Handle icon press
  const handleIconPress = (icon: string) => {
    // Add your icon press handlers here
    console.log(`${icon} icon pressed`);
  };
  
  // Refs for animations and intervals
  const feedbackInterval = useRef<NodeJS.Timeout | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const waveformAnim = useRef(new Animated.Value(0)).current;

  // AI FEEDBACK ANALYSIS: Predefined messages for real-time user feedback
  const feedbackMessages = [
    "Great job! Keep going!",
    "Try to speak a bit louder",
    "Excellent pronunciation!",
    "You're doing great, keep it up!",
    "Try to slow down a bit",
    "Your pacing is perfect",
    "Project your voice more",
    "Excellent enunciation!",
  ];

  // Animation rotation interpolation
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Handle recording state changes
  useEffect(() => {
    if (recording) {
      startPulse();
      startRotate();
      startWaveform();
    } else {
      stopPulse();
      stopRotate();
      stopWaveform();
    }
    
    // Cleanup on unmount
    return () => {
      if (feedbackInterval.current) {
        clearInterval(feedbackInterval.current);
      }
    };
  }, [recording]);

  // Start pulse animation and feedback simulation
  const startPulse = () => {
    setShowFeedback(true);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.2,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Simulate AI feedback during recording
    feedbackInterval.current = setInterval(() => {
      const randomFeedback = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
      setAiFeedback(randomFeedback);
    }, 5000);
  };

  // Stop pulse animation and feedback
  const stopPulse = () => {
    pulse.stopAnimation();
    pulse.setValue(1);

    if (feedbackInterval.current) {
      clearInterval(feedbackInterval.current);
      feedbackInterval.current = null;
    }
    setShowFeedback(false);
    setAiFeedback("");
  };

  // Start rotation animation for mic icon
  const startRotate = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  // Stop rotation animation
  const stopRotate = () => {
    rotateAnim.stopAnimation();
    rotateAnim.setValue(0);
  };

  // Start waveform animation
  const startWaveform = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveformAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(waveformAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  // Stop waveform animation
  const stopWaveform = () => {
    waveformAnim.stopAnimation();
    waveformAnim.setValue(0);
  };

  // Start recording function
  const startRecording = () => {
    setRecording(true);
  };

  // Stop recording and initiate processing
  const stopRecording = async () => {
    try {
      setRecording(false);
      setShowCompletionPopup(true);
      setIsProcessing(true);
      setShowResultsPrompt(false);

      // Simulate AI processing
      setTimeout(() => {
        setIsProcessing(false);
        setShowResultsPrompt(true);
        setAiFeedback(
          "Your pronunciation is good, but try to speak a bit slower for better clarity."
        );
      }, 3000);
    } catch (err) {
      console.error("Failed to stop recording", err);
      setShowCompletionPopup(false);
      setIsProcessing(false);
    }
  };

  // Handle later button press in modal
  const handleLater = () => {
    setShowCompletionPopup(false);
    setShowFeedback(true);
  };

  // Handle see results button press in modal
  const handleSeeResults = () => {
    setShowCompletionPopup(false);
    // Always forward the current module param, fallback to 'basic'
    const moduleType = typeof params.module === 'string' ? params.module : 'basic';
    router.replace(`/StudentScreen/ReadingExercise/full-result-reading?module=${moduleType}`);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowCompletionPopup(false);
  };

  // Background decorator component with gradient and decorative elements
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
      <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
    </View>
  );

  // Status metrics data for recording display
  const statusMetrics = [
    {
      title: "Pronunciation",
      rating: 4.8,
      icon: "mic-outline" as const,
      trend: "up" as const,
    },
    {
      title: "Pace",
      rating: 3.5,
      icon: "speedometer-outline" as const,
      trend: "down" as const,
    },
    {
      title: "Confidence",
      rating: 4.2,
      icon: "happy-outline" as const,
      trend: "up" as const,
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={{ minHeight: '100%' }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <BackgroundDecor />

      {/* Removed header section */}
      <View>
        <View>
          <Text className="text-white text-xl p-5 top-1 left font-bold mb-2">
            Reading Confidence Assessment
          </Text>
          <Text className="text-gray-200 text-justify p-5 bottom-10 text-sm opacity-80 leading-5">
            Read the following passage aloud to help us 
          </Text>
          <Text className="text-gray-200 text-justify p-5 bottom-16 -top-20 text-sm opacity-80 leading-5">
          evaluate your reading confidence level
          </Text>
        </View>
      </View>

      {/* Passage Card with Glassmorphism Effect */}
      <View className="mx-5 -top-10 -mt-8 rounded-2xl overflow-hidden border-2 border-white/40 shadow-lg shadow-black/10">
        <BlurView intensity={20} tint="light" className="p-5 bg-white/45">
          <Text className="text-white text-base leading-[39px] text-shadow">
            Liam reads every morning before school. Today, he picked a story
            about a boy and his dog. He focused on each sentence and used
            pictures to imagine the events. After reading, he thought about the
            main idea to remember the details.
          </Text>
        </BlurView>
      </View>

      {/* Status Section - Only shown when recording */}
      {recording && (
        <View className="absolute bottom-6 left-5 right-5">
          <View className="mb-4">
            <View className="items-center mb-1">
              <Text className="text-white text-base font-bold">
                Current Status
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between px-1">
            {statusMetrics.map((item, idx) => (
              <View key={idx} className="flex-1 items-center px-2">
                <View className="w-10 h-10 rounded-full bg-white/10 justify-center items-center mb-2">
                  <Ionicons name={item.icon} size={20} color="white" />
                </View>
                <Text className="text-white/90 text-xs font-semibold mb-1 text-center">
                  {item.title}
                </Text>
                <View className="flex-row items-center bg-white/10 px-2 py-1 rounded-xl min-w-[60px] justify-center">
                  <Text className="text-white text-sm font-bold mr-1">
                    {item.rating.toFixed(1)}
                  </Text>
                  <Ionicons
                    name={item.trend === "up" ? "trending-up" : "trending-down"}
                    size={14}
                    color="white"
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Mic Button and Waveform Container */}
      <View className="absolute left-0 right-0 items-center" style={{ top: height * 0.45 }}>
        {/* Waveform Animation */}
        <View className="flex-row justify-center top-20 items-end h-[60px] mb-5 w-full">
          {[...Array(15)].map((_, i) => {
            const baseHeight = 8;
            const heightMultiplier = 0.6 + Math.sin(i * 0.5) * 0.4;

            const animatedHeight = waveformAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [
                baseHeight,
                baseHeight * 2.5 * heightMultiplier,
                baseHeight * 3 * heightMultiplier,
              ],
            });

            const verticalOffset = waveformAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, -3, 0],
            });

            return (
              <Animated.View
                key={i}
                style={{
                  width: 3,
                  marginHorizontal: 4,
                  height: animatedHeight,
                  backgroundColor: "#fff",
                  borderRadius: 3,
                  transform: [{ translateY: verticalOffset }],
                }}
              />
            );
          })}
        </View>
        
        {/* Recording Button */}
        <TouchableOpacity
          onPress={recording ? stopRecording : startRecording}
          className="w-16 h-16 top-20 rounded-full bg-[#FF3131] justify-center items-center shadow-lg shadow-black/25"
          style={{
            shadowColor: "#fff",
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <Ionicons
                name={recording ? "stop" : "mic"}
                size={28}
                color="#fff"
              />
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
        
        <Text className="text-gray-400 top-20 text-xs mt-3">
          {recording ? "Recording" : "Tap to start"}
        </Text>
      </View>

      {/* Action Buttons - Fixed at Bottom */}
      {!recording && (
        <View className={`absolute bottom-5 left-0 right-0 flex-row px-5 ${analysisComplete ? "justify-center" : "justify-between"}`}>
          {!analysisComplete && (
            <TouchableOpacity
              onPress={() => {
                if (params.module === 'advance' || params.module === 'advanced') {
                  router.replace('/StudentScreen/ReadingExercise/advance-execise-reading');
                } else {
                  router.replace('/StudentScreen/ReadingExercise/basic-exercise-reading');
                }
              }}
              className="flex-1 bg-white/10 rounded-xl py-3.5 px-4 items-center justify-center mr-2 border border-white/20"
            >
              <Text className="text-white font-semibold text-base">Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              // Always forward the current module param, fallback to 'basic'
              const moduleType = typeof params.module === 'string' ? params.module : 'basic';
              router.replace(`/StudentScreen/ReadingExercise/full-result-reading?module=${moduleType}`);
            }}
            disabled={!analysisComplete}
            className={`${analysisComplete ? "flex-[0.8] min-w-[200px] ml-0" : "flex-1 ml-2"} ${
              analysisComplete ? "bg-violet-500/80" : "bg-gray-500"
            } rounded-xl py-3.5 px-4 items-center justify-center`}
          >
            <Text className="text-white font-bold">
              {analysisComplete ? "View Full Results Now" : "Start First"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Completion Modal */}
      <CompletionModal
        visible={showCompletionPopup}
        showResultsPrompt={showResultsPrompt}
        isProcessing={isProcessing}
        onClose={handleModalClose}
        onLater={handleLater}
        onSeeResults={handleSeeResults}
      />
    </ScrollView>
  );
}