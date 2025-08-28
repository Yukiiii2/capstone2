import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  Modal,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, usePathname } from "expo-router";
import ProfileMenuNew from "../../../components/ProfileModal/ProfileMenuNew";
import NavigationBar from "../../../components/NavigationBar/nav-bar";

// ===== Constants =====

// Define the Lesson type
type Lesson = {
  id: number;
  title: string;
  subtitle: string;
  desc: string;
  type: "Review" | "Start" | "Continue" | "New";
  progress: number;
};

const lessons: Lesson[] = [
  {
    id: 1,
    title: "Persuasive Speech Building",
    subtitle: "Lesson 1",
    desc: "Master persuasive speech delivery",
    type: "Review",
    progress: 1,
  },
  {
    id: 2,
    title: "Advanced Debate Practice",
    subtitle: "Lesson 2",
    desc: "Develop argumentation and rebuttal skills",
    type: "Start",
    progress: 0.5,
  },
  {
    id: 3,
    title: "Panel Interview Simulation",
    subtitle: "Lesson 3",
    desc: "Prepare effectively for interviews and Q&A.",
    type: "Review",
    progress: 1,
  },
  {
    id: 4,
    title: "Panel Interview Simulation",
    subtitle: "Lesson 4",
    desc: "Deliver confident, professional presentations",
    type: "New",
    progress: 0,
  },
  {
    id: 5,
    title: "Crisis Communication Response",
    subtitle: "Lesson 5",
    desc: "Speak calmly and clearly under pressure",
    type: "Review",
    progress: 1,
  },
  {
    id: 6,
    title: "Intercultural Communication",
    subtitle: "Lesson 6",
    desc: "Communicate effectively across cultures",
    type: "Review",
    progress: 1,
  },
];

const recentSessions = [
  {
    title: "Panel Interview Excellence",
    desc: "Successfully navigate 5-person executive panel with 92% confidence rating.",
  },
  {
    title: "Advanced Debate Techniques",
    desc: "Mastered counter argument strategies in political debate simulation.",
  },
  {
    title: "Audience Engagement Basics",
    desc: "Completed all persuasion framework with expert-level delivery.",
  },
];


// Background Decorator Component
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

// Header Component
const Header = ({ onProfilePress }: { onProfilePress: () => void }) => {
  const router = useRouter();

  return (
    <View className="flex-row justify-between items-center bottom-8 mt-4 mb-3 w-full">
      <TouchableOpacity
        className="flex-row items-center"
        onPress={() => router.push("/exercise-speaking")}
        activeOpacity={0.7}
      >
        <Image
          source={require("../../../assets/Speaksy.png")}
          className="w-12 h-12 rounded-full right-2"
          resizeMode="contain"
        />
        <Text className="text-white font-bold text-2xl ml-2 -left-5">
          Voclaria
        </Text>
      </TouchableOpacity>
      <View className="flex-row items-center right space-x-3">
        <TouchableOpacity
          className="p-2 bg-white/5 rounded-full active:bg-white/10"
          onPress={() => router.push("/ButtonIcon/chatbot")}
          activeOpacity={0.7}
        >
          <Image
            source={require("../../../assets/chatbot.png")}
            className="w-5 h-5"
            resizeMode="contain"
            tintColor="white"
          />
        </TouchableOpacity>
        <TouchableOpacity
          className="p-2 bg-white/5 rounded-full active:bg-white/10"
          onPress={() => router.push("/ButtonIcon/notification")}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          className="p-0.5 bg-white/5 rounded-full active:bg-white/10"
          onPress={onProfilePress}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }}
            className="w-9 h-9 rounded-full border-2 border-white/80"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Set the default active tab for the NavigationBar here
const DEFAULT_ACTIVE_TAB = "Speaking";

export default function BasicContents() {
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>(lessons);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);



  useEffect(() => {
    let result = [...lessons];

    if (filterType === "Continue") {
      result = result.filter(
        (lesson) => lesson.progress > 0 && lesson.progress < 1
      );
    } else if (filterType === "Review") {
      result = result.filter((lesson) => lesson.progress === 1);
    } else if (filterType === "Start") {
      result = result.filter((lesson) => lesson.progress === 0);
    }

    if (searchQuery) {
      result = result.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lesson.desc.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLessons(result);
  }, [filterType, searchQuery]);

  return (
    <View className="flex-1 bg-[#0F172A] pt-1">
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <BackgroundDecor />

      <ProfileMenuNew
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        user={{
          name: "Sarah Johnson",
          email: "sarah@gmail.com",
          image: { uri: "https://randomuser.me/api/portraits/women/44.jpg" },
        }}
      />

      <View className="flex-1">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 16,
            paddingTop: StatusBar.currentHeight,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="flex-1"
        >
          <View className="w-full max-w-[400px] self-center pt-4">
            <Header onProfilePress={() => setIsProfileMenuVisible(true)} />

            <View className="mb-4 bottom-6">
              <View className="flex-row justify-betweenitems-start mb-2">
                <View className="flex-1 pr-2.5">
                  <Text className="text-white/90 font-semibold text-2xl">
                  Advanced Public Speaking Mastery
                  </Text>
                  <Text className="text-gray-400 text-xs">
                  Master communication through immersive VR and real-world
                  simulations.  
                  </Text>
                </View>
                <View className="items-end mt-16">
                  <Text className="text-white/80 text-xs mb-1">
                    Module Progress
                  </Text>
                  <Text className="text-purple-400 font-bold text-lg">25%</Text>
                </View>
              </View>
              <View className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <View className="h-2 bg-[#a78bfa] rounded-full w-[25%]" />
              </View>
            </View>

            <View className="mb-6 flex-row bottom-6 items-center">
              <View className="flex-1 relative">
                <TextInput
                  placeholder="Search by title..."
                  placeholderTextColor="#9CA3AF"
                  className="w-full h-10 bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 text-white text-sm"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <View className="absolute left-3 top-0 h-10 justify-center">
                  <Ionicons name="search" size={18} color="#9CA3AF" />
                </View>
              </View>
              <TouchableOpacity
                className="ml-2 bg-violet-500/90 pl-3 pr-4 h-10 flex-row items-center rounded-lg"
                style={{
                  shadowColor: "#7c3aed",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }}
                onPress={() => setCategoryModalVisible(true)}
              >
                <Ionicons name="filter" size={16} color="white" />
                <Text className="text-white text-xs font-semibold ml-2">
                  {filterType}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row bottom-8 flex-wrap justify-between">
              {filteredLessons.map((lesson) => (
                <View
                  key={lesson.id}
                  className="w-[48%] mb-4 overflow-hidden"
                  style={{
                    borderRadius: 16,
                    minHeight: 180,
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.45)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    overflow: "hidden",
                    opacity: 0.95,
                  }}
                >
                  <View className="p-3 flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <View className="flex-row items-center">
                        <View
                          className={`w-5 h-5 rounded-full items-center justify-center ${
                            lesson.progress === 1
                              ? "bg-[#a78bfa]"
                              : lesson.progress > 0
                                ? "bg-[#a78bfa]"
                                : "bg-gray-300"
                          }`}
                        >
                          {lesson.progress === 1 ? (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          ) : (
                            <Ionicons
                              name="book-outline"
                              size={14}
                              color="#fff"
                            />
                          )}
                        </View>
                        <Text className="text-gray-400 text-xs font-semibold ml-2">
                          {lesson.subtitle}
                        </Text>
                      </View>
                      {lesson.progress > 0 && (
                        <View
                          className={`px-1.5 py-0.5 rounded-md ${lesson.progress === 1 ? "bg-[#a78bfa]/20" : "bg-gray-100/20"}`}
                        >
                          <Text
                            className={`text-[10px] font-medium ${lesson.progress === 1 ? "text-[#a78bfa]" : "text-white/80"}`}
                          >
                            {lesson.progress === 1
                              ? "Completed"
                              : "In Progress"}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="h-1.5 bg-gray-100 rounded-full mt-2 mb-3 overflow-hidden">
                      <View
                        className={`h-full rounded-full ${
                          lesson.progress === 1
                            ? "bg-[#a78bfa]"
                            : lesson.progress > 0
                              ? "bg-[#a78bfa]"
                              : "bg-gray-200"
                        }`}
                        style={{ width: `${lesson.progress * 100}%` }}
                      />
                    </View>
                    <Text className="text-white font-bold text-[13px] mb-1 flex-grow">
                      {lesson.title}
                    </Text>
                    <Text className="text-gray-200 text-[11px] mb-3">
                      {lesson.desc}
                    </Text>
                    <View className="mt-auto">
                      <Pressable 
                        onPress={() => router.push("StudentScreen/SpeakingExercise/live-vid-selection")}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.8 : 1,
                          transform: [{ scale: pressed ? 0.98 : 1 }]
                        })}
                      >
                        <View className="relative">
                          <View 
                            className="bg-violet-500/90 border border-white/30 rounded-lg py-2"
                            style={{
                              shadowColor: "#7c3aed",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.3,
                              shadowRadius: 4,
                            }}
                          >
                            <Text className="text-white text-xs font-semibold text-center">
                              {lesson.progress === 1
                                ? "Review"
                                : lesson.progress > 0
                                ? "Continue"
                                : "Start"}
                            </Text>
                          </View>
                          <Pressable 
                            className="absolute inset-0 bg-white/0 rounded-lg"
                            style={({ pressed }) => ({
                              backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                              shadowColor: pressed ? "#fff" : 'transparent',
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.5,
                              shadowRadius: 4,
                            })}
                          />
                        </View>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View className="mb-6 bottom-3">
              <View className="flex-row justify-between items-center mb-4 bottom-5">
                <Text className="text-white text-lg font-bold">
                  Recent Training Sessions
                </Text>
                <TouchableOpacity>
                  <Text className="text-violet-400 text-sm">View All</Text>
                </TouchableOpacity>
              </View>

              <View className="space-y-3">
                {recentSessions.map((session, i) => (
                  <View
                    key={i}
                    className="bg-white/10 border border-white/20 rounded-xl p-4 bottom-5"
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mr-3">
                        <Ionicons
                          name="videocam-outline"
                          size={18}
                          color="white"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-base font-semibold mb-1">
                          {session.title}
                        </Text>
                        <Text className="text-gray-300 text-xs">
                          {session.desc}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>



        <Modal visible={categoryModalVisible} transparent animationType="slide">
          <TouchableOpacity
            className="flex-1 bg-black/50 justify-end"
            activeOpacity={1}
            onPress={() => setCategoryModalVisible(false)}
          >
            <View
              className="bg-[#1E1E2E] rounded-t-2xl p-5"
              onStartShouldSetResponder={() => true}
            >
              {["All", "Start", "Continue", "Review"].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  className="py-3"
                  onPress={() => {
                    setFilterType(cat);
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text className="text-white text-lg">{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={sortModalVisible} transparent animationType="slide">
          <TouchableOpacity
            className="flex-1 bg-black/50 justify-end"
            activeOpacity={1}
            onPress={() => setSortModalVisible(false)}
          >
            <View
              className="bg-[#1E1E2E] rounded-t-2xl p-4"
              onStartShouldSetResponder={() => true}
            >
              {["Alphabetical", "Most Interactions", "Fewest Interactions"].map(
                (mode) => (
                  <TouchableOpacity
                    key={mode}
                    className="py-3"
                    onPress={() => {
                      const sorted = [...filteredLessons].sort((a, b) =>
                        a.title.localeCompare(b.title)
                      );
                      setFilteredLessons(sorted);
                      setSortModalVisible(false);
                    }}
                  >
                    <Text className="text-white text-lg">{mode}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>

  {/* NavigationBar with configurable defaultActiveTab */}
  <NavigationBar defaultActiveTab={DEFAULT_ACTIVE_TAB} />
    </View>
  );
}
