import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  StatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { Modal } from "react-native";
import { ResizeMode, AVPlaybackStatus } from "expo-av";
import { Video } from 'expo-av';

// Type Definitions
type FeatureCardProps = {
  icon: string;
  emoji: string;
  title: string;
  description: string;
};

type TestimonialCardProps = {
  name: string;
  role: string;
  content: string;
  rating: number;
};

type PricingCardProps = {
  title: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
};

// Reusable Components
const FeatureCard = ({ icon, emoji, title, description }: FeatureCardProps) => (
  <View className="bg-white/5 rounded-lg p-3 h-40 border border-white/20">
    <View className="w-10 h-10 bg-purple-500/20 rounded-lg items-center justify-center mb-2 mx-auto">
      <Text className="text-xl">{emoji}</Text>
    </View>
    <Text className="text-white text-sm text-center font-bold mb-1">
      {title}
    </Text>
    <Text className="text-gray-300 text-[10px] text-center justify-center leading-tight">
      {description}
    </Text>
  </View>
);

const TestimonialCard = ({
  name,
  role,
  content,
  rating,
}: TestimonialCardProps) => (
  <View className="bg-white/5 rounded-2xl p-3 mb-6 border border-white/20">
    <View className="flex-row items-center mb-6">
      <View className="w-10 h-10 bg-white/50 rounded-full items-center justify-center mr-4">
        <Text className="text-white font-bold text-lg">{name.charAt(0)}</Text>
      </View>
      <View>
        <Text className="text-white font-semibold text-base">{name}</Text>
        <Text className="text-gray-300 text-sm mt-1">{role}</Text>
      </View>
    </View>
    <Text className="text-gray-200 italic text-base leading-6 mb-2.5 -mt-3">
      "{content}"
    </Text>
    <View className="flex-row">
      {[...Array(5)].map((_, i) => (
        <View key={i} className="mr-0.5 mb-1">
          <Ionicons
            name={i < rating ? "star" : "star-outline"}
            size={16}
            color="#c29a35ff"
          />
        </View>
      ))}
    </View>
  </View>
);

const PricingCard = ({
  title,
  price,
  period,
  features,
  isPopular = false,
  buttonText,
  onPress
}: PricingCardProps & { onPress: () => void }) => (
  <View
    className={`bg-white/5 rounded-xl p-3 relative border border-white/20 h-[250px] flex flex-col ${isPopular ? "border-2 border-purple-500" : ""}`}
  >
    {isPopular && (
      <View className="absolute -top-2 left-1/2 -translate-x-1/2 bg-purple-500 px-2 py-0.5 rounded-full">
        <Text className="text-white text-[9px] font-medium">MOST POPULAR</Text>
      </View>
    )
    }
    <View className="mb-2">
      <Text
        className="text-white text-sm font-bold mb-0.5"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>
      <Text className="text-lg font-bold text-white ">
        {price}
        <Text className="text-[11px] mb-1 font-normal text-gray-400">
          /{period}
        </Text>
      </Text>
    </View>
    <View className="space-y-1.5 mb-2 flex-1">
      {features.map((feature, index) => (
        <View key={index} className="flex-row items-start">
          <View className="w-3.5 flex-shrink-0 pt-0.5">
            <Ionicons name="checkmark-circle" size={10} color="#a855f7" />
          </View>
          <Text
            className="text-gray-300 text-[11px] leading-tight ml-1.5 text-left"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {feature}
          </Text>
        </View>
      ))}
    </View>
    <View className="mt-auto">
      <TouchableOpacity
        className={`py-1.5 rounded-md ${isPopular ? "bg-purple-500" : "bg-white/10"} items-center justify-center`}
        onPress={onPress}
      >
        <Text className="font-medium text-white text-xs">{buttonText}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const RoleSelectionModal = ({ visible, onClose, onSelectRole }: { visible: boolean; onClose: () => void; onSelectRole: (role: 'Student' | 'Teacher') => void }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View className="flex-1 justify-center items-center bg-black/60">
      <View className="w-4/5 bg-[#1A1F2E]/95 backdrop-blur-xl rounded-2xl p-6">
        <Text className="text-white text-2xl font-bold text-center mb-2">Create account</Text>
        <Text className="text-gray-300 text-center mb-6">Choose your role</Text>
        
        <TouchableOpacity 
          className="flex-row items-center bg-white/5 p-4 rounded-xl mb-4"
          onPress={() => onSelectRole('Student')}
        >
          <View className="w-12 h-12 items-center justify-center mr-4 overflow-hidden">
            <Image 
              source={require('../assets/student.png')} 
              className="w-10 h-10" 
              resizeMode="contain"
            />
          </View>
          <View>
            <Text className="text-white font-semibold">Student</Text>
            <Text className="text-gray-400 text-xs">Join classes and learn</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="flex-row items-center bg-white/5 p-4 rounded-xl"
          onPress={() => onSelectRole('Teacher')}
        >
          <View className="w-12 h-12 items-center justify-center mr-4 overflow-hidden">
            <Image 
              source={require('../assets/teacher.png')} 
              className="w-10 h-10" 
              resizeMode="contain"
            />
          </View>
          <View>
            <Text className="text-white font-semibold">Teacher</Text>
            <Text className="text-gray-400 text-xs">Create and manage classes</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="mt-6 py-3 bg-violet-500/80 border border-white/30 rounded-xl"
          onPress={onClose}
        >
          <Text className="text-white text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default function Landing() {
  const router = useRouter();
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  const handleRoleSelect = (role: 'Student' | 'Teacher') => {
    setShowRoleModal(false);
    if (role === 'Student') {
      router.push('/create-account-student');
    } else {
      router.push('/create-account-teacher');
    }
  };

  // Video player state
  const videoRef = useRef<typeof Video>(null);
  const videoContainerRef = useRef<View>(null);
  const videoSource = require("../assets/speech-video.mp4");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [isVideoInView, setIsVideoInView] = useState(true);
  const [videoLayout, setVideoLayout] = useState({ y: 0, height: 0 });
  const { height: screenHeight } = useWindowDimensions();

  // Handle play button press
  const handlePlayPress = useCallback(() => {
    setIsVideoPlaying(true);
    setShowPlayButton(false);
  }, []);

  // Handle video pause
  const handlePause = useCallback(() => {
    setIsVideoPlaying(false);
    setShowPlayButton(true);
  }, []);

  // Measure video position
  const measureVideoPosition = useCallback(() => {
    if (videoContainerRef.current) {
      videoContainerRef.current.measureInWindow((x, y, width, height) => {
        setVideoLayout({ y, height });
      });
    }
  }, []);

  // Handle scroll to detect when video is out of view
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    
    if (videoLayout.y === 0) {
      measureVideoPosition();
      return;
    }
    
    const isVisible = (
      scrollPosition + screenHeight > videoLayout.y && 
      scrollPosition < videoLayout.y + videoLayout.height
    );
    
    setIsVideoInView(isVisible);
  }, [videoLayout, screenHeight, measureVideoPosition]);

  // Effect to control video playback based on visibility
  useEffect(() => {
    if (isVideoInView && !isVideoPlaying && !showPlayButton) {
      // Video came back into view and was playing before
      handlePlayPress();
    } else if (!isVideoInView && isVideoPlaying) {
      // Video scrolled out of view while playing
      handlePause();
    }
  }, [isVideoInView, isVideoPlaying, showPlayButton, handlePlayPress, handlePause]);

  const handlePlaybackStatusUpdate = useCallback((status: any) => {
    if (!status.isLoaded) return;

    setIsVideoLoaded(status.isLoaded);
    setIsVideoPlaying(status.isPlaying);
    setShowPlayButton(!status.isPlaying);
  }, []);

  // Pause video when component is not focused
  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsVideoPlaying(false);
        setShowPlayButton(true);
      };
    }, [])
  );

  // Data
  const features: FeatureCardProps[] = [
    {
      icon: "book-outline",
      emoji: "📚",
      title: "Reading Comprehension",
      description: "Real-time AI reading analysis with comprehension tracking",
    },
    {
      icon: "globe-outline",
      emoji: "💬",
      title: "Conversation Practice",
      description: "AI chat partners for practicing real-world conversations",
    },
    {
      icon: "headset-outline",
      emoji: "🎤",
      title: "Speech Training",
      description: "Voice analysis and pronunciation feedback",
    },
    {
      icon: "chatbubbles-outline",
      emoji: "⚡",
      title: "Boost Confidence",
      description:
        "Confidence building: tone control and reducing speaking anxiety",
    },
    {
      icon: "create-outline",
      emoji: "🧠",
      title: "Critical Thinking",
      description:
        "Logical and analytical reasoning to boost critical thinking",
    },
    {
      icon: "stats-chart-outline",
      emoji: "📖",
      title: "Speed Reading",
      description:
        "Techniques to increase reading speed while preserving comprehension",
    },
  ];

  const testimonials: TestimonialCardProps[] = [
    {
      name: "Alex Johnson",
      role: "Student",
      content:
        "Voclaria has completely transformed my English learning journey. The interactive exercises and personalized feedback helped me become more confident in my speaking and writing.",
      rating: 5,
    },
    {
      name: "Maria Garcia",
      role: "Student",
      content:
        "As a non-native speaker, I struggled with business English. Voclaria's targeted lessons and real-world scenarios were exactly what I needed to advance my career.",
      rating: 5,
    },
  ];

  const pricingPlans: PricingCardProps[] = [
    {
      title: "Free",
      price: "₱0",
      period: "mo",
      features: [
        "Basic vocabulary",
        "Limited grammar",
        "Community support",
        "Progress tracking",
        "Basic analytics",
        "Basic support",
      ],
      buttonText: "Get Started",
      isPopular: false,
    },
    {
      title: "Premium",
      price: "₱250",
      period: "mo",
      features: [
        "Unlimited vocabulary",
        "All grammar lessons",
        "AI speaking practice",
        "Expert feedback",
        "Advanced analytics",
        "Priority support",
      ],
      buttonText: "Start Trial",
      isPopular: true,
    },
  ];

  return (
    <View
      className="flex-1 bg-gray-900"
      style={{ paddingTop: StatusBar.currentHeight }}
    >
      {/* Make Status Bar transparent */}
      <StatusBar translucent backgroundColor="transparent" />

      {/* Gradient Background */}
      <View
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A"]}
          style={{ flex: 1 }}
        />
      </View>

      {/* Decorative Circles */}
      <View className="absolute w-40 h-40 bg-[#a78bfa]/10 rounded-full -top-20 -left-20" />
      <View className="absolute w-24 h-24 bg-[#a78bfa]/10 rounded-full top-1/4 -right-12" />
      <View className="absolute w-32 h-32 bg-[#a78bfa]/5 rounded-full top-1/3 -left-16" />
      <View className="absolute w-48 h-48 bg-[#a78bfa]/5 rounded-full bottom-1/4 -right-24" />
      <View className="absolute w-28 h-28 bg-[#a78bfa]/5 rounded-full bottom-0.5 right-8" />
      <View className="absolute w-28 h-28 bg-[#a78bfa]/5 rounded-full top-15 right-12" />
      <View className="absolute w-32 h-32 bg-[#a78bfa]/5 rounded-full bottom-24 left-1/6" />

      <ScrollView
        className="flex-1"
        onScroll={handleScroll}
        scrollEventThrottle={200}
        contentContainerStyle={{ paddingBottom: 5 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-8 bottom-8 max-w-md mx-auto w-full">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <View className="w-12 h-12 items-center justify-center mb-3 -ml-4">
                <Image
                  source={require("../assets/Speaksy.png")}
                  className="w-full -mb-3 h-full"
                  resizeMode="contain"
                />
              </View>
              <Text className="text-white ml-0.1 text-3xl font-bold">
                Voclaria
              </Text>
            </View>
          </View>

          {/* Hero Section */}
          <View className="mb-8">
            <View className="space-y-2 mb-4">
              <Text className="text-4xl font-bold text-white">Master</Text>
              <Text className="text-4xl font-bold text-white">
                Communication &
              </Text>
              <Text className="text-4xl font-bold text-purple-400">
                Reading Skills
              </Text>
            </View>
            <Text className="text-gray-200 text-sm mb-6 mt-0.1">
              Join thousands of learners worldwide and achieve fluency with our
              AI-powered language platform.
            </Text>

            <View className="flex-row space-x-4 mb-6">
              <Link href="/role-selection" asChild>
                <TouchableOpacity className=" bg-purple-500/70 border border-white/40 px-4 mb-2 py-3 rounded-lg flex-1 items-center">
                  <Text className="text-white text-sm font-bold">LOG IN</Text>
                </TouchableOpacity>
              </Link>
              <TouchableOpacity 
                className="bg-white/30 border border-white/40 px-4 mb-2 py-3 rounded-lg flex-1 items-center"
                onPress={() => setShowRoleModal(true)}
              >
                <Text className="text-white text-sm font-bold">
                  GET STARTED
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-center w-full">
              <View className="flex-row space-x-0.1">
                {["X", "E", "Y", "F"].map((initial, i) => (
                  <View
                    key={i}
                    className="w-8 h-8 rounded-full bg-white/10 items-center justify-center mx-1"
                  >
                    <Text className="text-white/80 font-bold text-sm">
                      {initial}
                    </Text>
                  </View>
                ))}
              </View>
              <Text className="text-gray-400 text-sm ml-1">
                <Text className="text-white font-medium">10,000 +</Text> Active
                Learners
              </Text>
            </View>
          </View>

          {/* Video Preview */}
          <View className="mb-8 px-4">
            <Text className="text-2xl font-bold text-white mb-2 text-center">
              Public Speaking
            </Text>
            <Text className="text-gray-300 mb-4 text-center">
              Here is an example of how to speak confidently
            </Text>

            <View 
              ref={videoContainerRef}
              onLayout={measureVideoPosition}
              className="w-full h-60 rounded-xl overflow-hidden bg-black"
            >
              <Video
                source={videoSource}
                style={{ width: "100%", height: "100%" }}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls={true}
                shouldPlay={isVideoPlaying && isVideoInView}
                isLooping={true}
                onPlaybackStatusUpdate={(status) => {
                  handlePlaybackStatusUpdate(status);
                  if (status.isLoaded) {
                    setIsVideoLoaded(true);
                  }
                }}
              />
              {!isVideoLoaded && (
                <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/50 items-center justify-center">
                  <ActivityIndicator color="#ffffff" />
                </View>
              )}
              {showPlayButton && !isVideoPlaying && (
                <TouchableOpacity
                  className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-black/20"
                  onPress={handlePlayPress}
                  activeOpacity={0.8}
                >
                  <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
                    <Ionicons
                      name="play"
                      size={32}
                      color="white"
                      style={{ marginLeft: 4 }}
                    />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Features Section */}
          <View className="mb-16">
            <Text className="text-2xl font-bold text-white mb-2 text-center">
              Everything You Need to Excel
            </Text>
            <Text className="text-gray-300 mb-8 text-center px-4">
              Comprehensive tools and features designed to accelerate your
              communication and literacy journey
            </Text>
            <View className="flex-row flex-wrap -mx-2">
              {features.map((feature, index) => (
                <View key={index} className="w-1/2 px-2 mb-4">
                  <FeatureCard {...feature} />
                </View>
              ))}
            </View>
          </View>

          {/* Testimonials */}
          <View className="mb-16 bottom-6">
            <Text className="text-3xl font-bold text-white text-center mb-1 -mt-5">
              What Our Learners Say
            </Text>
            <Text className="text-gray-300 text-center mb-8">
              Join thousands of satisfied users who have improved their English
              with Fluentech.
            </Text>
            <View className="space-y-1">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            </View>
          </View>

          {/* Pricing */}
          <View className="mb-16 bottom-10">
            <Text className="text-2xl font-bold text-white mb-2 -mt-8 text-center">
              Simple, Transparent Pricing
            </Text>
            <Text className="text-gray-300 mb-5 text-center text-sm">
              Select the plan that aligns best with your learning objectives and
              budget
            </Text>
            <View className="flex-row justify-center gap-4 px-4">
              {pricingPlans.map((plan, index) => (
                <View key={index} className="w-[45%] max-w-[220px]">
                  <PricingCard 
                    {...plan} 
                    onPress={() => setShowRoleModal(true)}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* CTA Section */}
          <View className="bg-white/5 border border-white/20 rounded-2xl p-6 bottom-16 -mb-10">
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="rocket-outline" size={50} color="#a855f7" />
              </View>
              <Text className="text-white text-2xl font-bold mb-4 mt-1">
                Ready to get started?
              </Text>
              <Text className="text-gray-300 text-center mb-6">
                Join Voclaria today and start your journey to English fluency.
              </Text>
              <TouchableOpacity 
                className="bg-purple-500 px-8 py-3 rounded-lg"
                onPress={() => setShowRoleModal(true)}
              >
                <Text className="text-white font-medium">
                  Start Learning Now
                  </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View className="pt-5 border-t border-white/30">
            <View className="flex-row justify-between items-center mb-8">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-lg items-center justify-center -mr-1 overflow-hidden">
                  <Image
                    source={require("@/assets/Speaksy.png")}
                    className="w-full h-full -ml-4"
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-white text-xl font-bold -ml-2">
                  Voclaria
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap justify-between mb-8">
              <View className="w-1/2 mb-6">
                <Text className="text-white font-medium mb-3">Product</Text>
                <View className="space-y-2">
                  <Text className="text-gray-400">Features</Text>
                  <Text className="text-gray-400">Pricing</Text>
                  <Text className="text-gray-400">Testimonials</Text>
                </View>
              </View>
              <View className="w-1/2 mb-6">
                <Text className="text-white font-medium mb-3">Company</Text>
                <View className="space-y-2">
                  <Text className="text-gray-400">About Us</Text>
                  <Text className="text-gray-400">Careers</Text>
                  <Text className="text-gray-400">Contact</Text>
                </View>
              </View>
              <View className="w-1/2">
                <Text className="text-white font-medium mb-3">Resources</Text>
                <View className="space-y-2">
                  <Text className="text-gray-400">Blog</Text>
                  <Text className="text-gray-400">Help Center</Text>
                  <Text className="text-gray-400">Tutorials</Text>
                </View>
              </View>
              <View className="w-1/2">
                <Text className="text-white font-medium mb-3">Legal</Text>
                <View className="space-y-2">
                  <Text className="text-gray-400">Privacy Policy</Text>
                  <Text className="text-gray-400">Terms of Service</Text>
                  <Text className="text-gray-400">Cookie Policy</Text>
                </View>
              </View>
            </View>
            <View className="flex-row space-x-4 mr-24">
              <TouchableOpacity>
                <Ionicons name="logo-twitter" size={20} color="#f4f8ff" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="logo-facebook" size={20} color="#f4f8ff" />
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="logo-instagram" size={20} color="#f4f8ff" />
              </TouchableOpacity>
            </View>

            <View className="pt-4 border-t border-white/30 mt-4">
              <Text className="text-gray-500 text-sm text-center">
                {new Date().getFullYear()} Voclaria. All rights reserved.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <RoleSelectionModal 
        visible={showRoleModal} 
        onClose={() => setShowRoleModal(false)}
        onSelectRole={handleRoleSelect}
      />
    </View>
  );
}