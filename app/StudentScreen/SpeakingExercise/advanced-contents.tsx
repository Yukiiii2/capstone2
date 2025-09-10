// app/StudentScreen/SpeakingExercise/advanced-contents.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, usePathname } from "expo-router";
import ProfileMenuNew from "../../../components/ProfileModal/ProfileMenuNew";
import NavigationBar from "../../../components/NavigationBar/nav-bar";
import { supabase } from "@/lib/supabaseClient";

type Lesson = {
  id: number;          // keep numeric for lock logic (1 unlocked)
  title: string;
  subtitle: string;    // "Lesson N"
  desc: string;
  type: "Review" | "Start" | "Continue" | "New";
  progress: number;    // 0..1
};

// ---- static fallback (unchanged UI) ----
const STATIC_ADVANCED: Lesson[] = [
  {
    id: 1,
    title: "Persuasive Speech Building",
    subtitle: "Lesson 1",
    desc: "Structure and deliver persuasive arguments with impact.",
    type: "Start",
    progress: 0,
  },
  {
    id: 2,
    title: "Advanced Debate Practice",
    subtitle: "Lesson 2",
    desc: "Sharpen rebuttals and refutation with time pressure.",
    type: "Start",
    progress: 0,
  },
  {
    id: 3,
    title: "Panel Interview Simulation",
    subtitle: "Lesson 3",
    desc: "Handle tough questions from multiple interviewers.",
    type: "Start",
    progress: 0,
  },
  {
    id: 4,
    title: "Executive Presentation Mastery",
    subtitle: "Lesson 4",
    desc: "Present to leadership with clarity and confidence.",
    type: "Start",
    progress: 0,
  },
  {
    id: 5,
    title: "Crisis Communication Response",
    subtitle: "Lesson 5",
    desc: "Communicate calmly under pressure and uncertainty.",
    type: "Start",
    progress: 0,
  },
  {
    id: 6,
    title: "Intercultural Communication",
    subtitle: "Lesson 6",
    desc: "Adapt tone, style, and examples for global audiences.",
    type: "Start",
    progress: 0,
  },
];

const recentSessions = [
  { title: "Panel Interview Excellence", desc: "Navigate an executive panel with structured answers." },
  { title: "Advanced Debate Techniques", desc: "Practice counters and turn-arounds in timed debates." },
  { title: "Audience Engagement Basics", desc: "Hook, hold, and close with presence and clarity." },
];

const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient colors={["#0F172A", "#1E293B", "#0F172A"]} className="flex-1" start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
  </View>
);

function Header({
  onProfilePress,
  onIconPress,
  avatarUri,
  initials,
}: {
  onProfilePress: () => void;
  onIconPress: (k: "chatbot" | "notifications") => void;
  avatarUri: string | null;
  initials: string;
}) {
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
        <Text className="text-white font-bold text-2xl ml-2 -left-5">Voclaria</Text>
      </TouchableOpacity>
      <View className="flex-row items-center right space-x-3">
        <TouchableOpacity
          className="p-2 bg-white/5 rounded-full active:bg-white/10"
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
          className="p-2 bg-white/5 rounded-full active:bg-white/10"
          onPress={() => onIconPress("notifications")}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          className="p-0.5 bg-white/5 rounded-full active:bg-white/10"
          onPress={onProfilePress}
          activeOpacity={0.7}
          style={{ overflow: "hidden" }}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} className="w-9 h-9 rounded-full border-2 border-white/80" />
          ) : (
            <View className="w-9 h-9 rounded-full border-2 border-white/80 bg-white/10 items-center justify-center">
              <Text className="text-white font-bold text-xs">{initials}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const DEFAULT_ACTIVE_TAB = "Speaking" as const;

export default function AdvancedContents() {
  const router = useRouter();
  const pathname = usePathname();

  // --- UI state (unchanged) ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Start" | "Continue" | "Review">("All");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>(STATIC_ADVANCED);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);

  // --- profile (unchanged UI; dynamic data) ---
  const [fullName, setFullName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [initials, setInitials] = useState<string>("U");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // --- lessons state (source: DB with static fallback) ---
  const [lessons, setLessons] = useState<Lesson[]>(STATIC_ADVANCED);

  // ===== profile wiring (unchanged presentation) =====
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user || !mounted) return;

      setUserEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      const full = (profile?.name ?? user.user_metadata?.full_name ?? user.email ?? "User").trim();
      const parts = full.split(/\s+/).filter(Boolean);
      const inits = (parts[0]?.[0] ?? "U").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();

      if (!mounted) return;
      setFullName(full);
      setInitials(inits || "U");

      const resolveAndSign = async (): Promise<string | null> => {
        const stored = profile?.avatar_url?.toString() || user.id;
        const normalized = stored.replace(/^avatars\//, "");
        let objectPath: string | null = null;

        if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
          objectPath = normalized;
        } else {
          const { data: files } = await supabase.storage
            .from("avatars")
            .list(normalized, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
          if (files && files.length > 0) objectPath = `${normalized}/${files[0].name}`;
        }

        if (!objectPath) return null;
        const { data: signed } = await supabase.storage
          .from("avatars")
          .createSignedUrl(objectPath, 60 * 60);
        return signed?.signedUrl ?? null;
      };

      try {
        const url = await resolveAndSign();
        if (!mounted) return;
        setAvatarUri(url);
      } catch {
        if (!mounted) return;
        setAvatarUri(null);
      }
    };

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  // ===== load lessons from Supabase (category=speaking, level=Advanced) =====
  const loadLessons = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;

      // fetch modules
      const { data: mods, error: modErr } = await supabase
        .from("modules")
        .select("id, title, description, category, level, order_index, active, created_at")
        .eq("category", "speaking")
        .eq("level", "Advanced")
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: true });

      if (modErr || !mods || mods.length === 0) {
        // fallback to static
        setLessons(STATIC_ADVANCED);
        setFilteredLessons(applyFilters(STATIC_ADVANCED, filterType, searchQuery));
        return;
      }

      // user progress (optional)
      let progressMap = new Map<string, number>();
      if (uid) {
        const { data: prog } = await supabase
          .from("student_progress")
          .select("module_id, progress")
          .eq("student_id", uid);
        (prog || []).forEach((p: any) => progressMap.set(p.module_id, p.progress ?? 0));
      }

      const active = mods.filter((m: any) => (m.active ?? true));
      const ui: Lesson[] = active.map((m: any, idx: number) => {
        const order = typeof m.order_index === "number" ? m.order_index + 1 : idx + 1;
        const pct = Math.max(0, Math.min(100, progressMap.get(m.id) ?? 0));
        return {
          id: order, // keep numeric for lock logic
          title: m.title || `Untitled Module ${order}`,
          subtitle: `Lesson ${order}`,
          desc: m.description || STATIC_ADVANCED[idx]?.desc || "",
          type: pct >= 100 ? "Review" : pct > 0 ? "Continue" : "Start",
          progress: (pct || 0) / 100,
        };
      });

      // Ensure at least 1..N numeric ids and identical UI behavior
      setLessons(ui.length ? ui : STATIC_ADVANCED);
      setFilteredLessons(applyFilters(ui.length ? ui : STATIC_ADVANCED, filterType, searchQuery));
    } catch {
      setLessons(STATIC_ADVANCED);
      setFilteredLessons(applyFilters(STATIC_ADVANCED, filterType, searchQuery));
    }
  }, [filterType, searchQuery]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  // react to server-side progress changes live (optional, safe no-op if RT off)
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;

      channel = supabase
        .channel("rt-adv-speaking-progress")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "student_progress", filter: `student_id=eq.${uid}` },
          () => loadLessons()
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadLessons]);

  // ===== filtering/search (unchanged behavior) =====
  const applyFilters = (source: Lesson[], filter: "All" | "Start" | "Continue" | "Review", q: string) => {
    let result = [...source];

    if (filter === "Continue") result = result.filter((l) => l.progress > 0 && l.progress < 1);
    else if (filter === "Review") result = result.filter((l) => l.progress === 1);
    else if (filter === "Start") result = result.filter((l) => l.progress === 0);

    if (q.trim()) {
      const s = q.toLowerCase();
      result = result.filter((l) => l.title.toLowerCase().includes(s) || l.desc.toLowerCase().includes(s));
    }
    return result;
  };

  useEffect(() => {
    setFilteredLessons(applyFilters(lessons, filterType, searchQuery));
  }, [lessons, filterType, searchQuery]);

  const handleIconPress = (iconName: "chatbot" | "notifications") => {
    if (iconName === "chatbot") router.push("/ButtonIcon/chatbot");
    if (iconName === "notifications") router.push("/ButtonIcon/notification");
  };

  const overallPct = useMemo(
    () => Math.round((lessons.reduce((acc, l) => acc + l.progress, 0) / (lessons.length || 1)) * 100),
    [lessons]
  );

  return (
    <View className="flex-1 bg-[#0F172A] pt-1">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <BackgroundDecor />

      <ProfileMenuNew
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        user={{
          name: fullName || "User",
          email: userEmail,
          image: {
            uri:
              avatarUri ||
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==",
          },
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
            <Header
              onProfilePress={() => setIsProfileMenuVisible(true)}
              onIconPress={handleIconPress}
              avatarUri={avatarUri}
              initials={initials}
            />

            {/* Module header (UNCHANGED UI) */}
            <View className="mb-4 bottom-6">
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
                  <Text className="text-purple-400 font-bold text-lg">{overallPct}%</Text>
                </View>
              </View>
              <View className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <View className="h-2 bg-[#a78bfa] rounded-full" style={{ width: `${overallPct}%` }} />
              </View>
            </View>

            {/* Search + filter (UNCHANGED UI) */}
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
                <Text className="text-white text-xs font-semibold ml-2">{filterType}</Text>
              </TouchableOpacity>
            </View>

            {/* Lessons grid — keep same lock/press behavior */}
            <View className="flex-row bottom-8 flex-wrap justify-between">
              {filteredLessons.map((lesson) => {
                const isLocked = lesson.id !== 1;

                return (
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
                      opacity: isLocked ? 0.6 : 0.95,
                    }}
                  >
                    {/* slight dim when locked */}
                    {isLocked && <View className="absolute inset-0 bg-black/10" />}

                    {/* top-right lock chip */}
                    {isLocked && (
                      <View className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-full border border-white/10 flex-row items-center z-10">
                        <Ionicons name="lock-closed" size={12} color="#fff" />
                        <Text className="text-white text-[10px] ml-1">Locked</Text>
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
                        <Pressable
                          onPress={() => {
                            if (isLocked) {
                              Alert.alert("Locked", "Complete the previous module to unlock this lesson.");
                              return;
                            }
                            router.push("StudentScreen/SpeakingExercise/live-vid-selection");
                          }}
                          disabled={isLocked}
                          style={({ pressed }) => ({
                            opacity: isLocked ? 0.6 : pressed ? 0.8 : 1,
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                          })}
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
                              {isLocked
                                ? "Locked"
                                : lesson.progress === 1
                                ? "Review"
                                : lesson.progress > 0
                                ? "Continue"
                                : "Start"}
                            </Text>
                          </View>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Recent sessions (UNCHANGED UI) */}
            <View className="mb-6 bottom-3">
              <View className="flex-row justify-between items-center mb-4 bottom-5">
                <Text className="text-white text-lg font-bold">Recent Training Sessions</Text>
                <TouchableOpacity>
                  <Text className="text-violet-400 text-sm">View All</Text>
                </TouchableOpacity>
              </View>

              <View className="space-y-3">
                {recentSessions.map((session, i) => (
                  <View key={i} className="bg-white/10 border border-white/20 rounded-xl p-4 bottom-5">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mr-3">
                        <Ionicons name="videocam-outline" size={18} color="white" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-base font-semibold mb-1">{session.title}</Text>
                        <Text className="text-gray-300 text-xs">{session.desc}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Category modal (UNCHANGED UI) */}
        <Modal visible={categoryModalVisible} transparent animationType="slide">
          <TouchableOpacity
            className="flex-1 bg-black/50 justify-end"
            activeOpacity={1}
            onPress={() => setCategoryModalVisible(false)}
          >
            <View className="bg-[#1E1E2E] rounded-t-2xl p-5" onStartShouldSetResponder={() => true}>
              {(["All", "Start", "Continue", "Review"] as const).map((cat) => (
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

        {/* Sort modal (UNCHANGED UI) */}
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
      </View>

      <NavigationBar defaultActiveTab={DEFAULT_ACTIVE_TAB} />
    </View>
  );
}
