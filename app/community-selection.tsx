import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  TextInput,
  Animated,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import LivesessionCommunityModal from "../components/LivesessionCommunityModal";
import LevelSelectionModal from "../components/LevelSelectionModal";
import ProfileMenuNew from "../components/ProfileMenuNew";

// Background decoration component with gradient and floating circles
const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#0F172A"]}
        className="flex-1"
      />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-60 h-60 bg-[#a78bfa]/5 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[120px] h-[120px] bg-[#a78bfa]/5 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-12 h-12 bg-[#a78bfa]/5 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-8 h-8 bg-[#a78bfa]/5 rounded-full" />
  </View>
);

type TabType = "Home" | "Speaking" | "Reading" | "Community";

// Student data type definition
type Student = {
  id: string;
  name: string;
  avatar: string;
  lastPractice: string;
  rating: number;
  isSelected?: boolean;
  lesson?: {
    id: number;
    title: string;
    subtitle: string;
    desc: string;
    type: "Review" | "Start" | "Continue" | "New";
    progress: number;
    difficulty: "Basic" | "Advanced";
  };
};

// Mock student data
const STUDENTS: Student[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    lastPractice: "2h ago",
    rating: 4.2,
    lesson: {
      id: 1,
      title: "Persuasive Speech Building",
      subtitle: "Lesson 1",
      desc: "Master persuasive speech delivery",
      type: "Review",
      progress: 1,
      difficulty: "Advanced"
    }
  },
  {
    id: "2",
    name: "Earl Ang",
    avatar: "https://randomuser.me/api/portraits/men/44.jpg",
    lastPractice: "1d ago",
    rating: 4.8,
    lesson: {
      id: 2,
      title: "Effective Non-Verbal Communication",
      subtitle: "Lesson 1",
      desc: "Master gestures and visual cues",
      type: "Review",
      progress: 1,
      difficulty: "Basic"
    }
  },
  {
    id: "3",
    name: "Yang Flores",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    lastPractice: "3h ago",
    rating: 3.9,
    lesson: {
      id: 3,
      title: "Advanced Debate Practice",
      subtitle: "Lesson 2",
      desc: "Develop argumentation and rebuttal skills",
      type: "Start",
      progress: 0.5,
      difficulty: "Advanced"
    }
  },
  {
    id: "4",
    name: "John Park",
    avatar: "https://randomuser.me/api/portraits/men/67.jpg",
    lastPractice: "5h ago",
    rating: 4.1,
    lesson: {
      id: 4,
      title: "Diaphragmatic Breathing Practice",
      subtitle: "Lesson 2",
      desc: "Control and project your voice",
      type: "Start",
      progress: 0.5,
      difficulty: "Basic"
    }
  },
  {
    id: "5",
    name: "Emma Wilson",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    lastPractice: "30m ago",
    rating: 4.5,
    lesson: {
      id: 5,
      title: "Panel Interview Simulation",
      subtitle: "Lesson 3",
      desc: "Prepare effectively for interviews and Q&A",
      type: "Review",
      progress: 1,
      difficulty: "Advanced"
    }
  },
  {
    id: "6",
    name: "David Kim",
    avatar: "https://randomuser.me/api/portraits/men/31.jpg",
    lastPractice: "4h ago",
    rating: 4.0,
    lesson: {
      id: 6,
      title: "Voice Warm-up and Articulation",
      subtitle: "Lesson 3",
      desc: "Clarity and pronunciation",
      type: "Review",
      progress: 1,
      difficulty: "Basic"
    }
  },
];

function StudentPresentation() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const sheetY = useRef(new Animated.Value(300)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  // Profile image URI
  const PROFILE_PIC = { uri: "https://randomuser.me/api/portraits/women/44.jpg" };

  // Handle icon press actions
  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") {
      router.replace("/login-page");
    } else if (iconName === "chatbot") {
      router.push("/chatbot");
    } else if (iconName === "notifications" || iconName === "notifications-outline") {
      router.push("/notification");
    }
  };

  // Handle option selection from modal
  const handleOptionSelect = (option: "Live Session" | "Community Post") => {
    setShowCommunityModal(false);
    if (option === "Live Session") {
      router.push("/live-sessions-select");
    } else {
      router.push("/community-selection");
    }
  };

  // Determine active tab based on current path
  const getActiveTab = (): TabType => {
    if (pathname?.includes("exercise-speaking")) return "Speaking";
    if (pathname?.includes("basic-exercise-reading") || pathname?.includes("advance-execise-reading")) return "Reading";
    if (pathname?.includes("community-selection") || pathname?.includes("community"))
      return "Community";
    if (pathname?.includes("home-page")) return "Home";
    return "Community";
  };

  const activeTab = getActiveTab();

  // Animate profile menu
  useEffect(() => {
    if (isProfileMenuVisible) {
      sheetY.setValue(300);
      sheetOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(sheetY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetY, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isProfileMenuVisible]);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STUDENTS.filter(
      (student) => q.length === 0 || student.name.toLowerCase().includes(q)
    );
  }, [query]);

  // Toggle student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Navigate to student watch page
  const goToWatch = (student: Student) => {
    router.push({
      pathname: "/community-page",
      params: { studentId: student.id },
    });
  };

  // Clear all selected students
  const clearSelection = () => {
    setSelectedStudents([]);
  };

  // Header Component
  const Header = () => (
    <View className="flex-row top-2 justify-between items-center mt-4 mb-3 w-full px-5">
      <TouchableOpacity 
        className="flex-row items-center"
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Image
          source={require("../assets/Speaksy.png")}
          className="w-12 h-12 -ml-2 right-1"
          resizeMode="contain"
        />
        <Text className="text-white right-4 font-bold text-2xl ml-2">
          Voclaria
        </Text>
      </TouchableOpacity>

      <View className="flex-row items-center space-x-2">
        <TouchableOpacity
          className="p-2 bg-white/10 rounded-full"
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
          className="p-2 bg-white/10 rounded-full"
          onPress={() => handleIconPress("notifications")}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsProfileMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Image
            source={PROFILE_PIC}
            className="w-8 h-8 rounded-full border border-white/20"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Profile menu component
  const ProfileMenu = () => (
    <ProfileMenuNew
      visible={isProfileMenuVisible}
      onDismiss={() => setIsProfileMenuVisible(false)}
      user={{
        name: "Sarah Johnson",
        email: "sarah@gmail.com",
        image: PROFILE_PIC,
      }}
    />
  );

  // Bottom Navigation Component
  const BottomNav = () => {
    const tabs: TabType[] = ["Home", "Speaking", "Reading", "Community"];

    const handleTabPress = (tab: TabType) => {
      if (tab === "Community") {
        setShowCommunityModal(true);
      } else if (tab === "Home") {
        router.push("/home-page");
      } else if (tab === "Speaking") {
        router.push("/exercise-speaking");
      } else if (tab === "Reading") {
        setShowSelectionModal(true);
      }
    };

    const getIconName = (tab: TabType) => {
      switch (tab) {
        case "Home": return "home-outline";
        case "Speaking": return "mic-outline";
        case "Reading": return "book-outline";
        case "Community": return "people-outline";
        default: return "home-outline";
      }
    };

    return (
      <View className="absolute bottom-0 left-0 right-0 bg-[#0F172A]/95 backdrop-blur-xl rounded-t-3xl z-10">
        <View className="flex-row justify-around items-center py-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                className="items-center py-2 px-1 rounded-xl"
                style={{
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.14)' : 'transparent',
                }}
                onPress={() => handleTabPress(tab)}
              >
                <Ionicons
                  name={getIconName(tab) as any}
                  size={24}
                  color={isActive ? '#A78BFA' : 'white'}
                />
                <Text
                  className="text-xs mt-1"
                  style={{ color: isActive ? '#A78BFA' : 'white' }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#0F172A]">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <BackgroundDecor />

      {/* Selection Modals */}
      <LivesessionCommunityModal
        visible={showCommunityModal}
        onDismiss={() => setShowCommunityModal(false)}
        onSelectOption={handleOptionSelect}
      />
      
      <LevelSelectionModal
        visible={showSelectionModal}
        onDismiss={() => setShowSelectionModal(false)}
        onSelectLevel={(level: 'Basic' | 'Advanced') => {
          setShowSelectionModal(false);
          const route = level === 'Basic' 
            ? '/basic-exercise-reading' 
            : '/advance-execise-reading';
          router.push(route);
        }}
      />

      <SafeAreaView className="flex-1 z-10">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 80, maxWidth: 600, width: '100%', alignSelf: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-1">
            {/* Header */}
            <Header />

            {/* Page Title */}
            <View className="px-4 mb-3">
              <Text className="text-white text-2xl font-bold">
                Student Speech Practice
              </Text>
              <Text className="text-indigo-300 text-sm">
                Watch and learn from peers
              </Text>
            </View>

            {/* Search Bar */}
            <View className="mb-4 px-4">
              <View className="rounded-xl p-1 bg-white/5 border border-white/10 flex-row items-center">
                <View className="ml-3">
                  <Ionicons name="search" size={20} color="#FFFFFF" />
                </View>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search students..."
                  placeholderTextColor="#9ca3af"
                  className="text-white flex-1 ml-3 text-base"
                  style={{ fontFamily: "Inter_400Regular" }}
                />
              </View>
            </View>

            {/* Selection Info */}
            {selectedStudents.length > 0 && (
              <View className="mx-4 mb-3 bg-indigo-500/30 rounded-xl p-2 flex-row justify-between items-center border border-indigo-500/30">
                <Text className="text-white font-medium">
                  {selectedStudents.length} selected
                </Text>
                <TouchableOpacity onPress={clearSelection}>
                  <Text className="text-indigo-300">Clear</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Students List */}
            <View className="px-4">
              {filteredStudents.length === 0 ? (
                <View className="items-center justify-center py-10">
                  <Ionicons name="people-outline" size={48} color="#4B5563" />
                  <Text className="text-gray-400 mt-4">No students found</Text>
                </View>
              ) : (
                filteredStudents.map((student) => (
                  <TouchableOpacity
                    key={student.id}
                    onPress={() => goToWatch(student)}
                    onLongPress={() => toggleStudentSelection(student.id)}
                    activeOpacity={0.8}
                    className={`rounded-2xl overflow-hidden border mb-4 ${
                      selectedStudents.includes(student.id)
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <View className="p-3">
                      <View className="flex-row items-start">
                        <Image
                          source={{ uri: student.avatar }}
                          className="w-14 h-14 rounded-full border-2 border-white/20"
                        />
                        <View className="flex-1 ml-3">
                          <View className="flex-row justify-between items-start">
                            <Text className="text-white font-semibold text-lg">
                              {student.name}
                            </Text>
                            <View>
                              <Ionicons name="chevron-forward" size={30} color="#9ca3af" />
                            </View>
                          </View>
                          <View className="flex-row items-center mt-1 space-x-4">
                            <View className="flex-row items-center">
                              <Ionicons name="star" size={14} color="#FBBF24" />
                              <Text className="text-gray-300 text-sm ml-1">
                                {student.rating}
                              </Text>
                            </View>
                            <View className="flex-row items-center">
                              <Ionicons name="time-outline" size={14} color="#9ca3af" />
                              <Text className="text-gray-400 text-sm ml-1">
                                {student.lastPractice}
                              </Text>
                            </View>
                          </View>
                          
                          {student.lesson && (
                            <View className="mt-2">
                              <View className="flex-row right-16 items-center justify-between">
                                <Text className="text-violet-600 text-xs font-medium">
                                  {student.lesson.title}
                                </Text>
                              </View>
                              <Text className="text-gray-400 right-16 text-xs mt-1">
                                {student.lesson.desc}
                              </Text>
                              <View className="mt-1 right-16">
                                <View className="h-1 bg-white/10 rounded-full overflow-hidden">
                                  <View 
                                    className="h-full bg-violet-600 rounded-full" 
                                    style={{ width: `${student.lesson.progress * 100}%` }}
                                  />
                                </View>
                                <View className="flex-row justify-between mt-1">
                                  <Text className="text-gray-400 text-xs">
                                    {Math.round(student.lesson.progress * 100)}%
                                  </Text>
                                </View>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Profile Menu */}
            <ProfileMenu />
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomNav />
    </View>
  );
}

export default StudentPresentation;