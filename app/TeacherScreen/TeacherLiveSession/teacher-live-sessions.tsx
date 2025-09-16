import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import ProfileMenuTeacher from "@/components/ProfileModal/ProfileMenuTeacher";
import NavigationBar from "@/components/NavigationBar/nav-bar-teacher";

/* ─────────────── Supabase + avatar + sessions (data-only) ─────────────── */
import { supabase } from "@/lib/supabaseClient";

const LIVE_TABLE = "live_sessions";
const TEACHER_STUDENTS = "teacher_students";

type DBLiveRow = {
  id: string;
  host_id: string | null;
  title: string | null;
  viewers: number | null;
  status?: string | null;
  started_at?: string | null;
  level?: string | null;
};

type ProfileRow = {
  id: string;
  name: string | null;
  avatar_url?: string | null;
};

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
      .list(normalized, {
        sortBy: { column: "created_at", order: "desc" },
        limit: 1,
      });
    if (error) return null;
    if (listed && listed.length > 0) objectPath = `${normalized}/${listed[0].name}`;
  }
  if (!objectPath) return null;

  const signedRes = await supabase.storage.from("avatars").createSignedUrl(objectPath, 3600);
  if (signedRes.error) return null;
  return signedRes.data?.signedUrl ?? null;
}

const numToCompact = (n: number | null | undefined) => {
  const v = Math.max(0, Number(n ?? 0));
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}m`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return `${v}`;
};
/* ─────────────────────────────────────────────────────────────────────── */

type DifficultyLevel = 'Basic' | 'Advanced';

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
  level: 'Basic' | 'Intermediate' | 'Advanced';
  viewers: string;
  time: string;
  duration: string;
  isMyStudent: boolean;
};

/* Your original static sessions (UNCHANGED). We’ll keep ONE of these as a
   permanent static card to match your request; the rest will be driven
   by realtime Supabase data. */
const sessions: Session[] = [
  {
    id: "1",
    name: "Lisa Park",
    title: "Mastering Eye Contact & Facial Expressions",
    level: "Basic",
    viewers: "723",
    time: "LIVE NOW",
    duration: "30 min session",
    isMyStudent: true,
  },
  {
    id: "2",
    name: "Alex Johnson",
    title: "Public Speaking for Beginners",
    level: "Basic",
    viewers: "512",
    time: "LIVE NOW",
    duration: "40 min session",
    isMyStudent: true,
  },
  {
    id: "3",
    name: "Emma Wilson",
    title: "Advanced Presentation Skills",
    level: "Advanced",
    viewers: "1.1k",
    time: "LIVE NOW",
    duration: "55 min session",
    isMyStudent: true,
  },
  {
    id: "4",
    name: "Michael Chen",
    title: "Voice Warm-Up & Articulation Techniques",
    level: "Basic",
    viewers: "1.2k",
    time: "LIVE NOW",
    duration: "45 min session",
    isMyStudent: false,
  },
  {
    id: "5",
    name: "David Kim",
    title: "Advanced Debate Strategies & Practice",
    level: "Advanced",
    viewers: "856",
    time: "LIVE NOW",
    duration: "60 min session",
    isMyStudent: false,
  },
  {
    id: "6",
    name: "Sarah Williams",
    title: "Mastering Public Speaking for Beginners",
    level: "Intermediate",
    viewers: "945",
    time: "LIVE NOW",
    duration: "50 min session",
    isMyStudent: false,
  }
];

const LiveSessions = () => {
  const router = useRouter();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'Everyone' | 'My Students'>('Everyone');

  /* avatar like home-page */
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [fullName, setFullName]   = useState<string>("Teacher");
  const [email, setEmail]         = useState<string>("");
  const teacherIdRef = useRef<string | null>(null);

  /* dynamic live sessions + my-student set */
  const [liveSessions, setLiveSessions] = useState<Session[]>([]);
  const myStudentsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;
      if (!mounted || !uid) return;
      teacherIdRef.current = uid;
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
          "Teacher") + "";

      if (!mounted) return;
      setFullName(name.trim());

      const signed = await resolveSignedAvatar(uid, (prof as ProfileRow)?.avatar_url ?? null);
      if (!mounted) return;
      setAvatarUri(signed);
    })();

    return () => { mounted = false; };
  }, []);

  /* load "my students" set for filtering */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const teacherId = teacherIdRef.current;
      if (!teacherId) return;
      const { data: rows } = await supabase
        .from(TEACHER_STUDENTS)
        .select("student_id, status")
        .eq("teacher_id", teacherId)
        .in("status", ["active", "graduated", "inactive"]);
      if (!mounted) return;
      const ids = new Set<string>((rows ?? []).map((r: any) => r.student_id));
      myStudentsRef.current = ids;
    })();
    return () => { mounted = false; };
  }, [teacherIdRef.current]);

  /* pull live sessions + subscribe realtime */
  useEffect(() => {
    let mounted = true;

    const mapRows = async (rows: DBLiveRow[]): Promise<Session[]> => {
      if (!rows.length) return [];
      const hostIds = Array.from(new Set(rows.map(r => r.host_id).filter(Boolean))) as string[];
      let byHost = new Map<string, ProfileRow>();
      if (hostIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", hostIds);
        byHost = new Map(((profs as ProfileRow[]) ?? []).map(p => [p.id, p]));
      }
      return rows.map((r) => {
        const host = r.host_id ? byHost.get(r.host_id) : undefined;
        return {
          id: r.id,
          name: (host?.name || "Unknown").toString(),
          title: (r.title || "Live Session").toString(),
          level: ((r.level as any) || "Basic") as Session["level"],
          viewers: numToCompact(r.viewers),
          time: "LIVE NOW",
          duration: r.started_at ? "Live" : "Live session",
          isMyStudent: r.host_id ? myStudentsRef.current.has(r.host_id) : false,
        };
      });
    };

    const fetchAll = async () => {
      const { data } = await supabase
        .from(LIVE_TABLE)
        .select("id, host_id, title, viewers, status, started_at, level")
        .in("status", ["live", "LIVE", "active"]);
      if (!mounted) return;
      const mapped = await mapRows((data as DBLiveRow[]) ?? []);
      setLiveSessions(mapped);
    };

    (async () => { await fetchAll(); })();

    const ch = supabase
      .channel(`live-sessions:all`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: LIVE_TABLE },
        async () => { if (mounted) await fetchAll(); }
      )
      .subscribe();

    return () => { mounted = false; try { supabase.removeChannel(ch); } catch {} };
  }, []);

  const toggleFilter = (filter: 'Everyone' | 'My Students') => {
    if (selectedFilter !== filter) {
      setSelectedFilter(filter);
      setSearchQuery('');
    }
    setShowFilterDropdown(false);
  };

  const handleIconPress = (type: string) => {
    if (type === "/ButtonIcon/add-student") {
      router.push("/ButtonIcon/add-student");
    }
  };

  /* combine: realtime live sessions + ONE static card (first of your list) */
  const allSessions: Session[] = useMemo(() => {
    const staticOne = sessions.slice(0, 1); // keep a single static card
    // de-dup by id in case conflicts
    const byId = new Map<string, Session>();
    [...liveSessions, ...staticOne].forEach(s => byId.set(s.id, s));
    return Array.from(byId.values());
  }, [liveSessions]);

  // Filter sessions based on search query and selected filter
  const filteredSessions = useMemo(() => {
    let result = [...allSessions];

    if (selectedFilter === 'My Students') {
      result = result.filter(session => session.isMyStudent === true);
    }

    if (searchQuery.trim() !== '') {
      const searchTerm = searchQuery.trim().toLowerCase();
      result = result.filter(session =>
        session.name.toLowerCase().includes(searchTerm) ||
        session.title.toLowerCase().includes(searchTerm)
      );
    }

    // sort: show "My Students" first when Everyone is selected, then by viewers desc
    result.sort((a, b) => {
      if (selectedFilter === 'Everyone' && a.isMyStudent !== b.isMyStudent) {
        return a.isMyStudent ? -1 : 1;
      }
      const av = Number((a.viewers || "0").replace(/[^\d.]/g, "")) || 0;
      const bv = Number((b.viewers || "0").replace(/[^\d.]/g, "")) || 0;
      return bv - av;
    });

    return result;
  }, [allSessions, searchQuery, selectedFilter]);

  return (
    <View className="flex-1 bg-[#0F172A]">
      <BackgroundDecor />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1">
          {/* Header */}
          <View className="z-10">
            <SafeAreaView>
              <View className="flex-row justify-between items-center top-6 px-4 py-3">
                <View className="flex-row items-center">
                  <Image
                    source={require("../../../assets/Speaksy.png")}
                    className="w-12 h-12 right-3 -mr-4"
                    resizeMode="contain"
                  />
                  <Text className="text-white font-bold text-2xl">Voclaria</Text>
                </View>

                <View className="flex-row items-center right-2">
                  <TouchableOpacity
                    onPress={() => handleIconPress("/ButtonIcon/add-student")}
                    activeOpacity={0.7}
                    className="p-2 bg-white/10 rounded-full mr-4"
                  >
                    <Image
                      source={require("../../../assets/add-student.png")}
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
                      source={{ uri: avatarUri || TRANSPARENT_PNG }}
                      className="w-9 h-9 rounded-full border-2 border-white/80"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
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
            <View className="mb-4">
              <View className="flex-row items-center opacity-80">
                <View className="bg-white/20 flex-row items-center rounded-lg px-3 py-1 self-start mb-4 -mt-2">
                  <Ionicons name="time-outline" size={18} color="white" />
                  <Text className="text-white ml-2 text-sm">
                    Live sessions update in real-time
                  </Text>
                </View>
              </View>

              {/* Live Sessions Section */}
              <View className="mb-5">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white text-xl font-bold">
                    People live now
                  </Text>
                </View>
                
                {/* Search and Filter Row */}
                <View className="flex-row items-center space-x-3 mb-4">
                  {/* Search Bar */}
                  <View className="relative flex-1">
                    <TextInput
                      className="bg-white/10 text-white rounded-xl pl-10 pr-6 py-2.5 text-sm"
                      placeholder="Search by name or ..."
                      placeholderTextColor="#94a3b8"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    <Ionicons 
                      name="search" 
                      size={16} 
                      color="#94a3b8" 
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: 12,
                      }} 
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        style={{
                          position: 'absolute',
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
                            setSelectedFilter("My Students");
                            setShowFilterDropdown(false);
                          }}
                        >
                          <Text className="text-white text-sm">My Students</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>

                {filteredSessions.length === 0 ? (
                  <View key="no-sessions" className="items-center justify-center py-10">
                    <Ionicons name="people-outline" size={48} color="#4B5563" />
                    <Text className="text-gray-400 mt-4 text-center">
                      {selectedFilter === 'My Students' 
                        ? 'No live sessions from your students at the moment'
                        : 'No live sessions found'}
                    </Text>
                  </View>
                ) : (
                  filteredSessions.map((session) => (
                    <View
                      key={session.id}
                      className="mb-5 bg-white/10 rounded-2xl p-5 border border-white/20"
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
                          <Text className="text-violet-300 text-xs">Student</Text>
                        </View>
                      </View>

                      {/* Session Details */}
                      <Text className="text-white text-lg font-semibold mb-3 leading-tight">
                        {session.title}
                      </Text>

                      {/* Join Button */}
                      <TouchableOpacity
                        className="bg-violet-600/80 active:bg-white border border-white/20 rounded-xl py-4 items-center"
                        onPress={() =>
                          router.push({
                            pathname: "/TeacherScreen/TeacherLiveSession/teacher-live-session",
                            params: {
                              id: session.id,
                              title: session.title,
                              name: session.name,
                              viewers: session.viewers,
                            },
                          })
                        }
                      >
                        <Text className="text-white text-based font-bold">
                          Join Session
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
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
                    onPress={() => router.push("/recording/1")}
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
                          <Text className="text-slate-400 text-xs">2 days ago</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Recording Card 2 */}
                  <TouchableOpacity
                    className="bg-white/5 rounded-xl p-3 border border-white/20"
                    onPress={() => router.push("/recording/2")}
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
                          <Text className="text-slate-400 text-xs">1 week ago</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Find More Button */}
                  <TouchableOpacity
                    className="bg-white/20 rounded-xl border border-white/20 py-3 flex-row items-center justify-center mt-4"
                    onPress={() => router.push("/community-selection")}
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
            </View>
          </View>
          
          {/* Profile Menu */}
          <ProfileMenuTeacher
            visible={isProfileMenuVisible}
            onDismiss={() => setIsProfileMenuVisible(false)}
          />
        </View>
      </ScrollView>

      {/* Level Selection Modal */}
      {/* Level selection functionality removed as per requirements */}

      {/* Navigation Bar */}
      <NavigationBar defaultActiveTab="Live Session" />
    </View>
  );
};

export default LiveSessions;
