// app/StudentScreen/SpeakingExercise/basic-contents.tsx
import NavigationBar from "../../../components/NavigationBar/nav-bar";
import React, { useState, useEffect, useMemo } from "react";
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
import { useRouter, useFocusEffect } from "expo-router"; // keep useRouter/useFocusEffect
import ProfileMenuNew from "@/components/ProfileModal/ProfileMenuNew";

// ⬇️ your Supabase client
import { supabase } from "@/lib/supabaseClient";

const TRANSPARENT_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

// ---- types ----
type Lesson = {
  id: number;
  title: string;
  subtitle: string;
  desc: string;
  type: "Review" | "Start" | "Continue" | "New";
  progress: number; // 0..1 for UI bar
};

// 🆕 Recent type
type Recent = {
  moduleId: string;
  title: string;
  desc: string;
  started_at: string; // ISO
};

// ---- six basic lessons (all 0% at start) ----
const lessons: Lesson[] = [
  {
    id: 1,
    title: "Effective Non-Verbal Communication",
    subtitle: "Lesson 1",
    desc: "Use body language, gestures, and eye contact to reinforce your message.",
    type: "Start",
    progress: 0,
  },
  {
    id: 2,
    title: "Vocal Projection & Clarity",
    subtitle: "Lesson 2",
    desc: "Breathing, resonance, and articulation for a clear, confident voice.",
    type: "Start",
    progress: 0,
  },
  {
    id: 3,
    title: "Structuring a Speech",
    subtitle: "Lesson 3",
    desc: "Organize ideas with an engaging intro, clear body, and strong close.",
    type: "Start",
    progress: 0,
  },
  {
    id: 4,
    title: "Managing Stage Fright",
    subtitle: "Lesson 4",
    desc: "Practical strategies to reduce anxiety and boost confidence.",
    type: "Start",
    progress: 0,
  },
  {
    id: 5,
    title: "Active Listening Skills",
    subtitle: "Lesson 5",
    desc: "Listen with intent to respond well to questions and feedback.",
    type: "Start",
    progress: 0,
  },
  {
    id: 6,
    title: "Basic Self-Introduction",
    subtitle: "Lesson 6",
    desc: "Present yourself clearly with purpose, background, and goals.",
    type: "Start",
    progress: 0,
  },
];

// ---- background decor ----
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

// ---- header (uses dynamic avatar) ----
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

export default function BasicContents() {
  const router = useRouter();

  // ---- profile (dynamic) ----
  const [fullName, setFullName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

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

      const nameValue =
        (profile?.name ?? user.user_metadata?.full_name ?? user.email ?? "").trim();
      if (!mounted) return;
      setFullName(nameValue);

      // resolve private avatar signed URL
      const resolveAndSign = async (): Promise<string | null> => {
        const stored = profile?.avatar_url?.toString() || user.id;
        const normalized = stored.replace(/^avatars\//, "");
        let objectPath: string | null = null;

        if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
          objectPath = normalized;
        } else {
          const { data: files, error: listErr } = await supabase.storage
            .from("avatars")
            .list(normalized, {
              limit: 1,
              sortBy: { column: "created_at", order: "desc" },
            });
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
    return () => {
      mounted = false;
    };
  }, []);

  // ---- page state ----
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // 🆕 derived lessons from Supabase + per-user progress
  const [uiLessons, setUiLessons] = useState<(Lesson & { supabaseId: string; unlocked: boolean })[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>(lessons); // keep default initial UI
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);

  // 🆕 maps for locking + navigation
  const [unlockedById, setUnlockedById] = useState<Record<number, boolean>>({ 1: true });
  const [moduleIdByDisplayId, setModuleIdByDisplayId] = useState<Record<number, string>>({});
  const [overallPct, setOverallPct] = useState<number>(0);

  // 🆕 Recent (starts empty; fills from progress if any, and on taps)
  const [recent, setRecent] = useState<Recent[]>([]);

  // only Lesson 1 unlocked for fresh accounts (will be replaced once we load from Supabase)
  const isLessonLocked = (lessonId: number) => !Boolean(unlockedById[lessonId]);

  // 🆕 add or bump a recent item to top (in-memory)
  const pushRecent = (moduleId: string, title: string) => {
    setRecent((prev) => {
      const existing = prev.filter((r) => r.moduleId !== moduleId);
      return [
        { moduleId, title, desc: "You started this basic module.", started_at: new Date().toISOString() },
        ...existing,
      ].slice(0, 5);
    });
  };

  // 🆕 load modules + per-user progress and derive unlocks/progress + seed recents
  const refreshLessons = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    // 1) fetch modules for speaking/basic
    const { data: modsRaw } = await supabase
      .from("modules")
      .select("id, title, description, order_index, active, created_at")
      .eq("category", "speaking")
      .eq("level", "basic")
      .eq("active", true)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });

    const mods = (modsRaw ?? []).slice(); // ensure array

    // map for title lookup for recents
    const titleById = new Map<string, string>();
    mods.forEach((m: any) => titleById.set(m.id, m.title ?? ""));

    // 2) fetch this user's progress rows
    const { data: progRows } = await supabase
      .from("student_progress")
      .select("module_id, progress, updated_at")
      .eq("student_id", user.id);

    const doneSet = new Set(
      (progRows ?? [])
        .filter((r) => (r.progress ?? 0) >= 100)
        .map((r) => r.module_id as string)
    );

    // 3) derive unlock-by-order (cap to 6)
    const sorted = mods
      .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .slice(0, 6);

    const nextUiLessons: (Lesson & { supabaseId: string; unlocked: boolean })[] = sorted.map(
      (m: any, idx: number) => {
        const displayId = idx + 1; // keep your 1..6 display index
        const earlier = sorted.slice(0, idx).map((x: any) => x.id as string);
        const earlierDone = earlier.every((id) => doneSet.has(id));
        const unlocked = idx === 0 || earlierDone;

        const rawProgress = (progRows ?? []).find((r) => r.module_id === m.id)?.progress ?? 0;
        const progressUI = Math.max(0, Math.min(1, (rawProgress as number) / 100));

        // keep your static labels as primary UI; fallback to DB fields if needed
        const meta = lessons.find((x) => x.id === displayId);
        const title = (m.title as string) ?? meta?.title ?? `Lesson ${displayId}`;
        const subtitle = meta?.subtitle ?? `Lesson ${displayId}`;
        const desc = (m.description as string) ?? meta?.desc ?? "";

        const type: Lesson["type"] =
          rawProgress >= 100 ? "Review" : rawProgress > 0 ? "Continue" : "Start";

        return {
          id: displayId,
          supabaseId: m.id as string,
          title,
          subtitle,
          desc,
          type,
          progress: progressUI,
          unlocked,
        };
      }
    );

    // maps for quick use in render
    const unlockedMap: Record<number, boolean> = {};
    const idMap: Record<number, string> = {};
    nextUiLessons.forEach((l) => {
      unlockedMap[l.id] = l.unlocked;
      idMap[l.id] = l.supabaseId;
    });

    setUiLessons(nextUiLessons);
    setUnlockedById(unlockedMap);
    setModuleIdByDisplayId(idMap);

    // header overall progress (% completed)
    const total = sorted.length;
    const completedCount = (progRows ?? []).filter((r) => (r.progress ?? 0) >= 100).length;
    setOverallPct(total > 0 ? Math.round((completedCount / total) * 100) : 0);

    // seed filteredLessons with derived list
    setFilteredLessons(nextUiLessons as unknown as Lesson[]);

    // 🆕 seed recent from progress rows (only if there’s actual progress)
    if ((progRows ?? []).some((r) => (r.progress ?? 0) > 0)) {
      const recents: Recent[] = (progRows ?? [])
        .filter((r) => (r.progress ?? 0) > 0)
        .sort(
          (a, b) =>
            new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()
        )
        .slice(0, 5)
        .map((r) => ({
          moduleId: r.module_id as string,
          title: titleById.get(r.module_id as string) || "Recent Module",
          desc: "Resumed your basic module.",
          started_at: r.updated_at || new Date().toISOString(),
        }));
      setRecent(recents);
    } else {
      setRecent([]); // empty until they tap something
    }
  };

  // initial load
  useEffect(() => {
    refreshLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refresh when screen regains focus (returning from lessons/results)
  useFocusEffect(
    React.useCallback(() => {
      refreshLessons();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const handleIconPress = (iconName: string) => {
    if (iconName === "chatbot") {
      router.push("/ButtonIcon/chatbot");
    } else if (iconName === "notifications") {
      router.push("/ButtonIcon/notification");
    }
  };

  // keep your existing filter/search behavior, but apply to the derived list
  useEffect(() => {
    let result = [...(uiLessons.length ? (uiLessons as unknown as Lesson[]) : lessons)];

    if (filterType === "Continue") {
      result = result.filter((l) => l.progress > 0 && l.progress < 1);
    } else if (filterType === "Review") {
      result = result.filter((l) => l.progress === 1);
    } else if (filterType === "Start") {
      result = result.filter((l) => l.progress === 0);
    }

    if (searchQuery) {
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.desc.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLessons(result);
  }, [filterType, searchQuery, uiLessons]);

  return (
    <View className="flex-1 bg-[#0F172A] pt-1">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <BackgroundDecor />

      {/* dynamic menu profile */}
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

            <View className="mb-4 bottom-6">
              <View className="flex-row justify-betweenitems-start mb-2">
                <View className="flex-1 pr-2.5">
                  <Text className="text-white/90 font-semibold text-2xl">
                    Foundation Public Speaking Skills
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    Build confidence in speaking through progressive skill mastery and feedback.
                  </Text>
                </View>
                <View className="items-end mt-16">
                  {/* 🆕 dynamic overall progress */}
                  <Text className="text-white/80 text-xs mb-1">Module Progress</Text>
                  <Text className="text-purple-400 font-bold text-lg">{overallPct}%</Text>
                </View>
              </View>
              <View className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                {/* 🆕 dynamic progress bar width */}
                <View className="h-2 bg-[#a78bfa] rounded-full" style={{ width: `${overallPct}%` }} />
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
                <Text className="text-white text-xs font-semibold ml-2">{filterType}</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row bottom-8 flex-wrap justify-between">
              {filteredLessons.map((lesson) => {
                const locked = isLessonLocked(lesson.id);

                return (
                  <View
                    key={lesson.id}
                    className={`w-[48%] mb-4 overflow-hidden ${locked ? "opacity-60" : ""}`}
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
                    {/* lock badge */}
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
                          <View
                            className="bg-white/10 border border-white/20 rounded-lg py-2"
                            style={{
                              shadowColor: "transparent",
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0,
                              shadowRadius: 0,
                            }}
                          >
                            <Text className="text-white text-xs font-semibold text-center">
                              Locked
                            </Text>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => {
                              const moduleId = moduleIdByDisplayId[lesson.id];
                              if (!moduleId) {
                                Alert.alert("Module not found", "Please try again in a moment.");
                                return;
                              }
                              // 🆕 Optimistically add to Recent
                              pushRecent(moduleId, lesson.title);

                              // 🆕 pass full module context forward (ABSOLUTE PATH)
                              router.push({
                                pathname: "/StudentScreen/SpeakingExercise/lessons-basic",
                                params: {
                                  module_id: moduleId,
                                  module_title: encodeURIComponent(lesson.title),
                                  level: "basic",                // ⬅️ lowercase
                                  display: String(lesson.id),    // visual index
                                },
                              });
                            }}
                            style={({ pressed }) => ({
                              opacity: pressed ? 0.8 : 1,
                              transform: [{ scale: pressed ? 0.98 : 1 }],
                            })}
                          >
                            <View
                              className="relative bg-violet-500/90 border border-white/30 rounded-lg py-2"
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
                              <View className="absolute inset-0 rounded-lg bg-white/0" />
                            </View>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* 🆕 Recent sessions — hidden when empty */}
            {recent.length > 0 && (
              <View className="mb-6 bottom-3">
                <View className="flex-row justify-between items-center mb-4 bottom-5">
                  <Text className="text-white text-lg font-bold">Recent Training Sessions</Text>
                  <TouchableOpacity onPress={() => setRecent([])}>
                    <Text className="text-violet-400 text-sm">Clear</Text>
                  </TouchableOpacity>
                </View>

                <View className="space-y-3">
                  {recent.map((session, i) => (
                    <View
                      key={session.moduleId + i}
                      className="bg-white/10 border border-white/20 rounded-xl p-4 bottom-5"
                    >
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mr-3">
                          <Ionicons name="videocam-outline" size={18} color="white" />
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
            )}
          </View>
        </ScrollView>

        {/* category modal */}
        <Modal visible={categoryModalVisible} transparent animationType="slide">
          <TouchableOpacity
            className="flex-1 justify-end"
            activeOpacity={1}
            onPress={() => setCategoryModalVisible(false)}
          >
            <View className="bg-[#1A1F2E]/95 backdrop-blur-xl rounded-t-2xl p-5" onStartShouldSetResponder={() => true}>
              {["All", "Start", "Continue", "Review"].map((cat) => {
                // Skip navigation for 'All' as it's just a filter
                const handlePress = () => {
                  setFilterType(cat);
                  setCategoryModalVisible(false);
                  if (cat !== "All") {
                    router.push({
                      pathname: "/StudentScreen/SpeakingExercise/lessons-basic",
                      params: { category: cat },
                    });
                  }
                };

                return (
                  <TouchableOpacity key={cat} className="py-3" onPress={handlePress}>
                    <Text className="text-white text-lg">{cat}</Text>
                  </TouchableOpacity>
                );
              })}
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
                    const sorted = [...filteredLessons].sort((a, b) =>
                      a.title.localeCompare(b.title)
                    );
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

      <NavigationBar defaultActiveTab="Speaking" />
    </View>
  );
}
