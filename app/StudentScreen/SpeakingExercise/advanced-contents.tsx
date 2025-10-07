import NavigationBar from "../../../components/NavigationBar/nav-bar";
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  StatusBar,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import ProfileMenuNew from "@/components/ProfileModal/ProfileMenuNew";
import { supabase } from "@/lib/supabaseClient";

const TRANSPARENT_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

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
    title: "Mastering Vocal Variety",
    subtitle: "Lesson 1",
    desc: "Dynamic voice control to keep listeners engaged.",
    type: "Start",
    progress: 0,
  },
  {
    id: 2,
    title: "Advanced Persuasion Strategies",
    subtitle: "Lesson 2",
    desc: "Ethical techniques to motivate action.",
    type: "Start",
    progress: 0,
  },
  {
    id: 3,
    title: "Mastering Rhetorical Devices",
    subtitle: "Lesson 3",
    desc: "figures of speech to sharpen impact.",
    type: "Start",
    progress: 0,
  },
  {
    id: 4,
    title: "Handling Q&A Sessions",
    subtitle: "Lesson 4",
    desc: "Confident, concise, credible responses.",
    type: "Start",
    progress: 0,
  },
  {
    id: 5,
    title: "Building Credibility on Stage",
    subtitle: "Lesson 5",
    desc: "Trust through preparation and presence.",
    type: "Start",
    progress: 0,
  },
  {
    id: 6,
    title: "Speaking Without Notes",
    subtitle: "Lesson 6",
    desc: "Fluent delivery from memory or outline.",
    type: "Start",
    progress: 0,
  },
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

const Header = ({
  onProfilePress,
  onIconPress,
  avatarUri,
  initials,
}: {
  onProfilePress: () => void;
  onIconPress: (iconName: string) => void;
  avatarUri: string | null;
  initials: string;
}) => {
  const router = useRouter();

  return (
    <View className="flex-row justify-between items-center -mb-16 bottom-20 w-full">
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
        <Text className="text-white font-bold text-2xl ml-2 -left-5">Voclaria</Text>
      </TouchableOpacity>

      <View className="flex-row items-center right space-x-3">
        <TouchableOpacity
          className="p-2 bg-white/5 rounded-full"
          onPress={() => onIconPress("chatbot")}
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
          className="p-2 bg-white/5 rounded-full"
          onPress={() => onIconPress("notifications")}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          className="p-0.5 bg-white/5 rounded-full"
          onPress={onProfilePress}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: "rgba(255,255,255,0.7)",
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={{ width: 36, height: 36 }} />
          ) : (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(167,139,250,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
                {initials || "U"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const LessonCard = ({ lesson, onPress }: { lesson: Lesson; onPress: () => void }) => {
  const locked = false; // All lessons unlocked

  return (
    <View
      className={`w-[48%] mb-3 bottom-4 overflow-hidden ${locked ? "opacity-60" : ""}`}
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
      }}
    >
      {locked && (
        <View className="absolute right-2 top-2 z-10 bg-black/50 rounded-full px-2 py-1 border border-white/20">
          <View className="flex-row items-center">
            <Ionicons name="lock-closed" size={12} color="#fff" />
            <Text className="text-white text-[10px] ml-1">Locked</Text>
          </View>
        </View>
      )}

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
                <Ionicons name="book-outline" size={14} color="#fff" />
              )}
            </View>
            <Text className="text-gray-400 text-xs font-semibold ml-2">
              {lesson.subtitle}
            </Text>
          </View>

          {lesson.progress > 0 && (
            <View
              className={`px-1.5 py-0.5 rounded-md ${
                lesson.progress === 1 ? "bg-[#a78bfa]/20" : "bg-gray-100/20"
              }`}
            >
              <Text
                className={`text-[10px] font-medium ${
                  lesson.progress === 1 ? "text-[#a78bfa]" : "text-white/80"
                }`}
              >
                {lesson.progress === 1 ? "Completed" : "In Progress"}
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
        <Text className="text-gray-200 text-[11px] mb-3">{lesson.desc}</Text>

        <View className="mt-auto">
          {locked ? (
            <View className="bg-white/10 border border-white/20 rounded-lg py-2">
              <Text className="text-white text-xs font-semibold text-center">
                Locked
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onPress}
              activeOpacity={0.7}
              style={{ transform: [{ scale: 1 }] }}
            >
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
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default function BasicContents() {
  const router = useRouter();
  const [fullName, setFullName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>(lessons);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);

  const initials = useMemo(() => {
    const parts = (fullName || "").trim().split(/\s+/);
    const a = (parts[0]?.[0] || "").toUpperCase();
    const b = (parts[1]?.[0] || "").toUpperCase();
    return (a + b) || a || "U";
  }, [fullName]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user || !mounted) return;
      setUserEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      const nameValue = (profile?.name ?? user.user_metadata?.full_name ?? user.email ?? "").trim();
      if (!mounted) return;
      setFullName(nameValue);

      const resolveAndSign = async (): Promise<string | null> => {
        const stored = profile?.avatar_url?.toString() || user.id;
        const normalized = stored.replace(/^avatars\//, "");
        let objectPath: string | null = null;

        if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
          objectPath = normalized;
        } else {
          const { data: files, error: listErr } = await supabase.storage
            .from("avatars")
            .list(normalized, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
          if (listErr) return null;
          if (files && files.length > 0) objectPath = `${normalized}/${files[0].name}`;
        }

        if (!objectPath) return null;
        const { data: signed, error: signErr } = await supabase.storage
          .from("avatars")
          .createSignedUrl(objectPath, 60 * 60);
        if (signErr) return null;
        return signed?.signedUrl ?? null;
      };

      const url = await resolveAndSign();
      if (!mounted) return;
      setAvatarUri(url);
    };

    load();
    return () => { mounted = false; };
  }, []);

  const handleIconPress = (iconName: string) => {
    if (iconName === "chatbot") router.push("/ButtonIcon/chatbot");
    else if (iconName === "notifications") router.push("/ButtonIcon/notification");
  };

  useEffect(() => {
    let result = [...lessons];
    if (filterType === "Continue") result = result.filter((l) => l.progress > 0 && l.progress < 1);
    else if (filterType === "Review") result = result.filter((l) => l.progress === 1);
    else if (filterType === "Start") result = result.filter((l) => l.progress === 0);

    if (searchQuery) {
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.desc.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredLessons(result);
  }, [filterType, searchQuery]);

  const handleLessonPress = (lessonId: number) => {
    router.push({
      pathname: `/StudentScreen/SpeakingExercise/LessonAdvance/advancelesson-${lessonId}`,
      params: { id: lessonId }
    });
  };

  return (
    <View className="flex-1 bg-[#0F172A]">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <BackgroundDecor />

      <ProfileMenuNew
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        user={{
          name: fullName || "Student",
          email: userEmail || "",
          image: { uri: avatarUri || TRANSPARENT_PNG },
        }}
      />

      <View className="flex-1">
        {/* FIXED: Proper FlatList structure with safe StatusBar.currentHeight handling */}
        <FlatList
          data={filteredLessons}
          renderItem={({ item }) => (
            <LessonCard 
              lesson={item} 
              onPress={() => handleLessonPress(item.id)} 
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ 
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            marginBottom: 8
          }}
          contentContainerStyle={{ 
            paddingTop: (StatusBar.currentHeight || 0) + 80, // Status bar + header space
            paddingBottom: 70, // Increased from 40 to 70 for more scroll space
          }}
          ListHeaderComponent={
            <View className="px-4 pb-4">
              <Header
                onProfilePress={() => setIsProfileMenuVisible(true)}
                onIconPress={handleIconPress}
                avatarUri={avatarUri}
                initials={initials}
              />

              <View className="mb-4">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 pr-2.5">
                    <Text className="text-white/90 font-semibold text-2xl">
                    Advanced Public Speaking Mastery
                    </Text>
                    <Text className="text-gray-400 text-xs">
                    Master communication through simulations and high-stakes practice.  
                    </Text>
                  </View>
                  <View className="items-end mt-16">
                    <Text className="text-white/80 text-xs mb-1">Module Progress</Text>
                    <Text className="text-purple-400 font-bold text-lg">0%</Text>
                  </View>
                </View>
                <View className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <View className="h-2 bg-[#a78bfa] rounded-full w-[0%]" />
                </View>
              </View>

              <View className="mb-6 flex-row items-center">
                <View className="flex-1 relative">
                  <TextInput
                    placeholder="Search by title..."
                    placeholderTextColor="#9CA3AF"
                    className="w-full h-10 bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 text-white text-sm"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    showSoftInputOnFocus={false}
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
                  activeOpacity={0.7}
                >
                  <Ionicons name="filter" size={16} color="white" />
                  <Text className="text-white text-xs font-semibold ml-2">{filterType}</Text>
                </TouchableOpacity>
              </View>
            </View>
          }
          showsVerticalScrollIndicator={false}
          // FIXED: Allow scrolling but prevent layout shifts
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        />
      </View>

      {/* Modals */}
      <Modal visible={categoryModalVisible} transparent animationType="slide">
        <TouchableOpacity
          className="flex-1 justify-end"
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View className="bg-[#1A1F2E]/95 backdrop-blur-xl rounded-t-2xl p-5" onStartShouldSetResponder={() => true}>
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
          <View className="bg-[#1E1E2E] rounded-t-2xl p-4" onStartShouldSetResponder={() => true}>
            {["Alphabetical", "Most Interactions", "Fewest Interactions"].map((mode) => (
              <TouchableOpacity
                key={mode}
                className="py-3"
                onPress={() => {
                  const sorted = [...filteredLessons].sort((a, b) => a.title.localeCompare(b.title));
                  setFilteredLessons(sorted);
                  setSortModalVisible(false);
                }}
              >
                <Text className="text-white text-lg">{mode}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <NavigationBar defaultActiveTab="Speaking" />
    </View>
  );
}