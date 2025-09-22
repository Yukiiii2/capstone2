import * as React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import ProfileMenuNew from "../../../components/ProfileModal/ProfileMenuNew";
import LivesessionCommunityModal from "../../../components/StudentModal/LivesessionCommunityModal";
import LevelSelectionModal from "../../../components/StudentModal/LevelSelectionModal";
import NavigationBar from "../../../components/NavigationBar/nav-bar";

/* ───────────── Supabase + avatar helpers (data only, no UI changes) ───────────── */
import { supabase } from "@/lib/supabaseClient";

const TRANSPARENT_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

async function resolveSignedAvatar(userId: string, storedPath?: string | null) {
  const stored = (storedPath ?? userId).toString();
  const normalized = stored.replace(/^avatars\//, "");
  let objectPath: string | null = null;

  if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
    objectPath = normalized;
  } else {
    const { data: listed, error } = await supabase.storage
      .from("avatars")
      .list(normalized, { sortBy: { column: "created_at", order: "desc" }, limit: 1 });
    if (error) return null;
    if (listed && listed.length > 0) objectPath = `${normalized}/${listed[0].name}`;
  }
  if (!objectPath) return null;

  const signedRes = await supabase.storage.from("avatars").createSignedUrl(objectPath, 3600);
  if (signedRes.error) return null;
  return signedRes.data?.signedUrl ?? null;
}
/* ──────────────────────────────────────────────────────────────────────────────── */

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

type Session = {
  id: string;
  name: string;
  title: string;
  level: string;
  viewers: string;
  time: string;
  duration: string;
  isMyTeacher?: boolean; // reused as "Classmate" flag for your dropdown
};

/* Minimal DB rows */
type LiveSessionRow = {
  id: string;
  host_id: string;
  title: string | null;
  viewers: number | null;
  status: string | null;          // 'live'
  level?: string | null;
  started_at?: string | null;
};

type ProfileRow = {
  id: string;
  name: string | null;
};

const LIVE_TABLE = "live_sessions";
const TEACHER_STUDENTS = "teacher_students";

/* One static card kept exactly like your design */
const STATIC_SESSION: Session = {
  id: "static-1",
  name: "Michael Chen",
  title: "Voice Warm-Up & Articulation Techniques",
  level: "Basic",
  viewers: "1.2k",
  time: "LIVE NOW",
  duration: "45 min session",
  isMyTeacher: true, // appears under "Classmate" filter in your UI
};

const LiveSessions = () => {
  const router = useRouter();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"Everyone" | "Classmate">("Everyone");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  /* header avatar like Home */
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("Student");
  const [email, setEmail] = useState<string>("");

  /* dynamic sessions coming from Supabase + the static one */
  const [sessions, setSessions] = useState<Session[]>([STATIC_SESSION]);

  /* In your previous logic, this Set held teacher IDs.
     Here we reuse the boolean to drive the "Classmate" filter UI without changing structure. */
  const [classmateIds, setClassmateIds] = useState<Set<string>>(new Set());

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") {
      router.replace("/login-page");
    } else if (iconName === "chatbot") {
      router.push("/ButtonIcon/chatbot");
    } else if (iconName === "notifications") {
      router.push("/ButtonIcon/notification");
    }
  };

  const handleCommunitySelect = (option: "Live Session" | "Community Post") => {
    setShowCommunityModal(false);
    if (option === "Live Session") {
      // We are already on the live list; just close. (Avoid self-navigation loop)
      return;
    } else if (option === "Community Post") {
      router.push("/community-selection");
    }
  };

  /* load user + avatar */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!mounted || !uid) return;

      setEmail(auth?.user?.email ?? "");

      const { data: prof } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", uid)
        .single();

      const name =
        (prof?.name ??
          auth?.user?.user_metadata?.full_name ??
          auth?.user?.email ??
          "Student") + "";

      if (!mounted) return;
      setFullName(name.trim());

      const signed = await resolveSignedAvatar(uid, (prof as any)?.avatar_url ?? null);
      if (!mounted) return;
      setAvatarUri(signed);
    })();
    return () => { mounted = false; };
  }, []);

  /* load "classmates" (reusing your teacher_students membership)
     If you have a real classmates table later, plug it in here without touching UI. */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid || !mounted) return;

      const { data, error } = await supabase
        .from(TEACHER_STUDENTS)
        .select("teacher_id, student_id, status")
        .eq("student_id", uid);

      if (error || !mounted) return;

      const setIds = new Set<string>();
      (data ?? []).forEach((r: any) => {
        if (!r) return;
        setIds.add(r.teacher_id);
      });
      setClassmateIds(setIds);
    })();
    return () => { mounted = false; };
  }, []);

  /* fetch + subscribe to live sessions */
  useEffect(() => {
    let mounted = true;

    const fetchLive = async () => {
      try {
        const { data, error } = await supabase
          .from(LIVE_TABLE)
          .select("id, host_id, title, viewers, status, level, started_at")
          .eq("status", "live")
          .order("started_at", { ascending: false });

        if (error || !mounted) {
          setSessions([STATIC_SESSION]); // keep static on error
          return;
        }

        const rows = (data as LiveSessionRow[]) ?? [];
        if (rows.length === 0) {
          setSessions([STATIC_SESSION]);
          return;
        }

        const hostIds = Array.from(new Set(rows.map(r => r.host_id)));
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", hostIds);

        const byId = new Map<string, ProfileRow>(
          ((profs as ProfileRow[]) ?? []).map((p) => [p.id, p])
        );

        const mapped: Session[] = rows.map((r) => {
          const host = byId.get(r.host_id);
          return {
            id: r.id,
            name: (host?.name || "Unknown").toString(),
            title: (r.title || "Live Session").toString(),
            level: (r.level || "Basic").toString(),
            viewers: String(r.viewers ?? 0),
            time: "LIVE NOW",
            duration: "45 min session",
            // Reusing the boolean for your "Classmate" filter without changing UI
            isMyTeacher: classmateIds.has(r.host_id),
          };
        });

        // keep ONE static at the top + dynamic lives
        setSessions([STATIC_SESSION, ...mapped]);
      } catch {
        setSessions([STATIC_SESSION]);
      }
    };

    fetchLive();

    const ch = supabase
      .channel(`live_sessions:all`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: LIVE_TABLE },
        () => fetchLive()
      )
      .subscribe();

    return () => {
      try { supabase.removeChannel(ch); } catch {}
      mounted = false;
    };
  }, [classmateIds]);

  return (
    <View className="flex-1 bg-[#0F172A]">
      <BackgroundDecor />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 5 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row top-5 justify-between items-center px-4 py-3">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => router.back()}
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

          <View className="flex-row items-center -right-1 space-x-3">
            <TouchableOpacity
              className="p-2 bg-white/10 rounded-full"
              onPress={() => handleIconPress("chatbot")}
              activeOpacity={0.7}
            >
              <View className="w-6 h-6 items-center justify-center">
                <Image
                  source={require("../../../assets/chatbot.png")}
                  className="w-5 h-5"
                  resizeMode="contain"
                  tintColor="white"
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className="p-2 bg-white/10 rounded-full"
              onPress={() => handleIconPress("notifications")}
              activeOpacity={0.7}
            >
              <View className="w-6 h-6 items-center justify-center">
                <Ionicons name="notifications-outline" size={20} color="white" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className="p-1"
              onPress={() => setIsProfileMenuVisible(true)}
              activeOpacity={0.7}
            >
              <View className="p-0.5 bg-white/10 rounded-full">
                <Image
                  source={{
                    uri: avatarUri || TRANSPARENT_PNG,
                  }}
                  className="w-8 h-8 rounded-full"
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View className="px-4">
          {/* Page Title */}
          <View className="mt-6 mb-6">
            <Text className="text-white text-3xl font-bold mb-1">
              Live Sessions
            </Text>
            <Text className="text-white/80 text-base">
              Learn from experts in real-time
            </Text>
          </View>

          {/* Live Sessions Info */}
          <View className="mb-8">
            <View className="flex-row items-center opacity-80">
              <View className="bg-white/20 flex-row items-center rounded-lg px-3 py-1 self-start mb-6 -mt-2">
                <Ionicons name="time-outline" size={18} color="white" />
                <Text className="text-white ml-2 text-sm">
                  Live sessions update in real-time
                </Text>
              </View>
            </View>
          </View>

          {/* Live Sessions Section */}
          <View className="mb-5 bottom-8">
            <View className="mb-4">
              <Text className="text-white text-xl font-bold mb-4">
                People live now
              </Text>
              <View className="flex-row items-center space-x-3">
                {/* Search Bar */}
                <View className="relative flex-1">
                  <TextInput
                    className="bg-white/10 text-white rounded-xl pl-10 pr-8 py-2.5 text-sm"
                    placeholder="Search by name or title..."
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  <Ionicons
                    name="search"
                    size={16}
                    color="#94a3b8"
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 12,
                    }}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery("")}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: 12,
                      }}
                    >
                      <Ionicons name="close-circle" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>
                {/* Filter Dropdown */}
                <View className="relative">
                  <TouchableOpacity
                    className="flex-row items-center bg-white/15 px-4 py-2.5 rounded-xl"
                    onPress={() => setShowFilterDropdown(!showFilterDropdown)}
                  >
                    <Text className="text-white mr-2 text-sm">{selectedFilter}</Text>
                    <Ionicons name="chevron-down" size={14} color="white" />
                  </TouchableOpacity>

                  {showFilterDropdown && (
                    <View className="absolute top-12 right-0 bg-[#1E293B] rounded-lg border border-white/20 z-10 w-40">
                      <TouchableOpacity
                        className="px-4 py-2.5 border-b border-white/10"
                        onPress={() => {
                          setSelectedFilter("Everyone");
                          setShowFilterDropdown(false);
                        }}
                      >
                        <Text className="text-white text-sm">Everyone</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="px-4 py-2.5"
                        onPress={() => {
                          setSelectedFilter("Classmate");
                          setShowFilterDropdown(false);
                        }}
                      >
                        <Text className="text-white text-sm">Classmate</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {sessions
              .filter(session => {
                const matchesFilter =
                  selectedFilter === "Everyone" ||
                  (selectedFilter === "Classmate" && session.isMyTeacher);
                const q = searchQuery.trim().toLowerCase();
                const matchesSearch =
                  q === "" ||
                  session.name.toLowerCase().includes(q) ||
                  session.title.toLowerCase().includes(q);
                return matchesFilter && matchesSearch;
              })
              .slice(0, selectedFilter === "Classmate" ? 3 : sessions.length)
              .map((session) => (
                <View
                  key={session.id}
                  className="mb-5 bg-white/5 rounded-2xl p-5 border border-white/20"
                >
                  {/* Session Status Bar */}
                  <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center">
                      <View className="bg-white/10 rounded-full px-3 py-1 flex-row items-center">
                        <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                        <Text className="text-white text-xs font-bold">
                          {session.time}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="people-outline" size={16} color="white" />
                      <Text className="text-white text-xs ml-1">
                        {session.viewers} watching
                      </Text>
                    </View>
                  </View>

                  {/* Host Profile */}
                  <View className="flex-row items-center mb-4">
                    <View className="w-12 h-12 bg-white/10 rounded-full items-center justify-center mr-3">
                      <Ionicons name="person" size={20} color="white" />
                    </View>
                    <View>
                      <Text className="text-white font-medium">
                        {session.name}
                      </Text>
                      <Text className="text-violet-300 text-xs">
                        {session.isMyTeacher ? "Classmate" : "Host"}
                      </Text>
                    </View>
                  </View>

                  {/* Session Details */}
                  <Text className="text-white text-lg font-semibold mb-3 leading-tight">
                    {session.title}
                  </Text>

                  {/* Join Button */}
                  <TouchableOpacity
                    className="bg-violet-600/80 border border-white/20 rounded-xl py-4 items-center"
                    onPress={() =>
                      router.push({
                        pathname: "/StudentScreen/StudentLiveSession/live-session",
                        params: {
                          id: session.id,
                          title: session.title,
                          name: session.name,
                          viewers: session.viewers,
                        },
                      })
                    }
                  >
                    <Text className="text-white text-base font-bold">
                      Join Session
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            {selectedFilter === "Classmate" &&
              sessions.filter((session) => session.isMyTeacher).length === 0 && (
                <View className="items-center justify-center py-8">
                  <Ionicons name="people-outline" size={48} color="#94a3b8" />
                  <Text className="text-slate-400 mt-2 text-center">
                    No live sessions from your classmate at the moment
                  </Text>
                </View>
              )}
          </View>

          {/* Community Recordings Section */}
          <View className="mb-8 bottom-14">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-white text-xl top-2 font-bold">
                Community Recordings
              </Text>
            </View>

            <View className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
              {/* Recording Card 1 */}
              <TouchableOpacity
                className="bg-white/5 rounded-xl p-3 border border-white/20"
                onPress={() =>
                  router.push("/StudentScreen/StudentCommunity/community-page")
                }
              >
                <View className="flex-row items-start">
                  <View className="relative mr-3">
                    <View className="w-24 h-16 bg-violet-500/10 rounded-lg items-center justify-center">
                      <Ionicons name="play-circle" size={32} color="white" />
                    </View>
                    <View className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded">
                      <Text className="text-white text-2xs">45:22</Text>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-white font-medium text-sm mb-1"
                      numberOfLines={2}
                    >
                      Mastering Public Speaking: Tips & Tricks
                    </Text>
                    <Text className="text-violet-300 text-xs mb-1">
                      @jameswilson
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons name="eye-outline" size={14} color="#94a3b8" />
                      <Text className="text-slate-400 text-xs ml-1">
                        1.2k views
                      </Text>
                      <View className="w-1 h-1 bg-slate-500 rounded-full mx-2" />
                      <Text className="text-slate-400 text-xs">
                        2 days ago
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Recording Card 2 */}
              <TouchableOpacity
                className="bg-white/5 rounded-xl p-3 border border-white/20"
                onPress={() =>
                  router.push("/StudentScreen/StudentCommunity/community-page")
                }
              >
                <View className="flex-row items-start">
                  <View className="relative mr-3">
                    <View className="w-24 h-16 bg-violet-500/10 rounded-lg items-center justify-center">
                      <Ionicons name="play-circle" size={32} color="white" />
                    </View>
                    <View className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded">
                      <Text className="text-white text-2xs">32:15</Text>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-white font-medium text-sm mb-1"
                      numberOfLines={2}
                    >
                      Daily English Conversation Practice
                    </Text>
                    <Text className="text-violet-300 text-xs mb-1">
                      @sarah_teaches
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons name="eye-outline" size={14} color="#94a3b8" />
                      <Text className="text-slate-400 text-xs ml-1">
                        856 views
                      </Text>
                      <View className="w-1 h-1 bg-slate-500 rounded-full mx-2" />
                      <Text className="text-slate-400 text-xs">
                        1 week ago
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Find More Button */}
              <TouchableOpacity
                className="bg-white/20 rounded-xl border border-white/20 py-3 flex-row items-center justify-center mt-4"
                onPress={() =>
                  router.push("/StudentScreen/StudentCommunity/community-selection")
                }
              >
                <Ionicons
                  name="search"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-bold text-base">
                  Find More Community Recordings
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Menu */}
          <ProfileMenuNew
            visible={isProfileMenuVisible}
            onDismiss={() => setIsProfileMenuVisible(false)}
            user={{
              name: fullName,
              email: email,
              image: {
                uri: avatarUri || TRANSPARENT_PNG,
              },
            }}
          />
        </View>
      </ScrollView>

      {/* Selection Modal */}
      <LivesessionCommunityModal
        visible={showCommunityModal}
        onDismiss={() => setShowCommunityModal(false)}
        onSelectOption={handleCommunitySelect}
      />

      <LevelSelectionModal
        visible={showLevelModal}
        onDismiss={() => setShowLevelModal(false)}
        onSelectLevel={(level: "Basic" | "Advanced") => {
          setShowLevelModal(false);
          const route =
            level === "Basic"
              ? "/basic-exercise-reading"
              : "/advance-exercise-reading"; // fixed spelling
          router.push(route);
        }}
      />

      <NavigationBar defaultActiveTab="Community" />
    </View>
  );
};

export default LiveSessions;
