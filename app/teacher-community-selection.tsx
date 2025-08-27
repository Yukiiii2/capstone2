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
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LevelSelectionModal } from "../components/LevelSelectionModal";
import ProfileMenuNew from "../components/ProfileMenuNew";

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

const TABS: TabType[] = ["Home", "Speaking", "Reading", "Community"];

const PROFILE_PIC = { uri: "https://randomuser.me/api/portraits/women/44.jpg" };

type Student = {
  id: string;
  name: string;
  avatar: string;
  lastPractice: string;
  rating: number;
  isSelected?: boolean;
};

const STUDENTS: Student[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    lastPractice: "2h ago",
    rating: 4.2,
  },
  {
    id: "2",
    name: "Earl Ang",
    avatar: "https://randomuser.me/api/portraits/men/44.jpg",
    lastPractice: "1d ago",
    rating: 4.8,
  },
  {
    id: "3",
    name: "Yang Flores",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    lastPractice: "3h ago",
    rating: 3.9,
  },
  {
    id: "4",
    name: "John Park",
    avatar: "https://randomuser.me/api/portraits/men/67.jpg",
    lastPractice: "5h ago",
    rating: 4.1,
  },
  {
    id: "5",
    name: "Emma Wilson",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
    lastPractice: "30m ago",
    rating: 4.5,
  },
  {
    id: "6",
    name: "David Kim",
    avatar: "https://randomuser.me/api/portraits/men/31.jpg",
    lastPractice: "4h ago",
    rating: 4.0,
  },
  {
    id: "7",
    name: "Xan Kaizer",
    avatar: "https://randomuser.me/api/portraits/men/67.jpg",
    lastPractice: "4h ago",
    rating: 4.0,
  },
];

function StudentPresentation() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const sheetY = useRef(new Animated.Value(300)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") {
      router.replace("/login-page");
    } else if (iconName === "add-student") {
      router.push("/add-student");
    }
  };

  const navigateToTab = (tab: TabType) => {
    const routes: Record<TabType, string> = {
      Home: "/home-page",
      Speaking: "/exercise-speaking",
      Reading: "/basic-exercise-reading",
      Community: "/community-selection",
    };

    if (tab === "Reading") {
      setShowLevelModal(true);
    } else if (pathname !== routes[tab]) {
      router.push(routes[tab]);
    }
  };

  const handleLevelSelect = (level: "Basic" | "Advanced") => {
    if (level === "Basic") {
      router.push("/basic-exercise-reading");
    } else {
      router.push("/advance-execise-reading");
    }
  };

  const getActiveTab = (): TabType => {
    if (pathname?.includes("exercise-speaking")) return "Speaking";
    if (pathname?.includes("basic-exercise-reading") || pathname?.includes("advance-execise-reading")) return "Reading";
    if (
      pathname?.includes("community-selection") ||
      pathname?.includes("community")
    )
      return "Community";
    if (pathname?.includes("home-page")) return "Home";
    return "Community"; // Default to Community if no match
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

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STUDENTS.filter(
      (student) => q.length === 0 || student.name.toLowerCase().includes(q)
    );
  }, [query]);

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const goToWatch = (student: Student) => {
    router.push({
      pathname: "/teacher-community",
      params: {
        studentId: student.id,
        studentName: student.name,
        studentAvatar: student.avatar,
      },
    });
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  // Header Component
  const Header = () => (
    <View className="flex-row justify-between items-center mt-12 mb-2 w-full px-5">
      <View className="flex-row items-center">
        <Image
          source={require("../assets/Speaksy.png")}
          className="w-12 h-12 rounded-full right-2"
          resizeMode="contain"
        />
        <Text className="text-white font-bold text-2xl ml-2 -left-5">
          Voclaria
        </Text>
      </View>

      <View className="flex-row items-center right-2">
                  <TouchableOpacity
                    onPress={() => handleIconPress("add-student")}
                    activeOpacity={0.7}
                    className="p-2 bg-white/10 rounded-full mr-4"
                  >
                    <Image
                      source={require("../assets/add-student.png")}
                      className="w-5 h-5"
                      resizeMode="contain"
                      tintColor="white"
                    />
                  </TouchableOpacity>
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

  // Profile menu dropdown modal - Using ProfileMenuNew component
  const ProfileMenu = () => (
    <ProfileMenuNew
      visible={isProfileMenuVisible}
      onDismiss={() => setIsProfileMenuVisible(false)}
      user={{
        name: "Sarah Johnson",
        email: "sarah@gmail.com",
        image: { uri: "https://randomuser.me/api/portraits/women/44.jpg" },
      }}
    />
  );

  // Bottom Navigation Component
  const BottomNav = () => {
    const navItems = [
      {
        icon: "stats-chart-outline",
        label: "Dashboard",
        route: "teacher-dashboard",
        onPress: () => router.replace("/teacher-dashboard"),
      },
      {
        icon: "people-outline",
        label: "Community",
        route: "teacher-community",
        onPress: () => router.replace("/teacher-community"),
      },
      {
        icon: "mic-circle-outline",
        label: "Live Session",
        route: "teacher-live-session",
        onPress: () => router.replace("/teacher-live-sessions"),
      },
    ];

    return (
      <View
        className="absolute bottom-0 left-0 right-0 bg-[#0F172A]/90 backdrop-blur-lg rounded-t-3xl z-50"
        style={{ elevation: 50 }}
      >
        <View className="flex-row justify-around items-center py-2">
          {navItems.map((item) => {
            const isActive =
              pathname === `/${item.route}` ||
              pathname === `/${item.route}/` ||
              (item.route === "teacher-community" &&
                pathname?.includes("community"));
            return (
              <TouchableOpacity
                key={item.route}
                className="items-center py-2 px-1 rounded-xl"
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

  return (
    <View className="flex-1">
      <BackgroundDecor />

      {/* Level Selection Modal */}
      <LevelSelectionModal
        visible={showLevelModal}
        onDismiss={() => setShowLevelModal(false)}
        onSelectLevel={handleLevelSelect}
      />

      <SafeAreaView className="flex-1 bottom-5 z-10">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 15 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
        >
          <View className="flex-1">
            {/* Header */}
            <Header />

            {/* Page Title */}
            <View className="px-5 mb-4">
              <Text className="text-white text-2xl font-bold">
                Student Speech Practice
              </Text>
              <Text className="text-indigo-300 text-sm">
                Watch and learn from peers
              </Text>
            </View>

            {/* Search Bar */}
            <View className="mb-6 px-5">
              <View className="rounded-xl p-1 bg-white/5 border border-white/10 flex-row items-center shadow-lg">
                <View className="pl-2">
                  <Ionicons name="search" size={20} color="#a78bfa" />
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

            {/* Selection Info (when students are selected) */}
            {selectedStudents.length > 0 && (
              <View className="mx-5 mb-4 bg-indigo-500/20 rounded-xl p-3 flex-row justify-between items-center border border-indigo-500/30">
                <Text className="text-white font-medium">
                  {selectedStudents.length} selected
                </Text>
                <TouchableOpacity onPress={clearSelection}>
                  <Text className="text-indigo-300">Clear</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Students List */}
            <View className="px-5">
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
                    <View className="p-4 flex-row items-center">
                      {/* Avatar */}
                      <Image
                        source={{ uri: student.avatar }}
                        className="w-14 h-14 rounded-full border-2 border-white/20"
                      />

                      {/* Student Info */}
                      <View className="flex-1 ml-4">
                        <Text className="text-white font-semibold text-lg">
                          {student.name}
                        </Text>
                        <View className="flex-row items-center mt-1 space-x-4">
                          <View className="flex-row items-center">
                            <Ionicons name="star" size={14} color="#FBBF24" />
                            <Text className="text-gray-300 text-sm ml-1">
                              {student.rating}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color="#9ca3af"
                            />
                            <Text className="text-gray-400 text-sm ml-1">
                              {student.lastPractice}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Chevron */}
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#9ca3af"
                      />
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
