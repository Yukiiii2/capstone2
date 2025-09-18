import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import ProfileMenuNew from "../../../components/ProfileModal/ProfileMenuNew";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams, usePathname } from "expo-router";
import { BlurView } from "expo-blur";
import LevelSelectionModal from "../../../components/StudentModal/LevelSelectionModal";
import LivesessionCommunityModal from "../../../components/StudentModal/LivesessionCommunityModal";
import NavigationBar from "../../../components/NavigationBar/nav-bar";
import { supabase } from "@/lib/supabaseClient";

const LIVE_TABLE = "live_sessions";
const REACT_TABLE = "live_session_reactions";

/* ---------- helpers ---------- */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveSignedAvatar(userId: string, storedPath?: string | null) {
  const stored = (storedPath ?? userId).toString();
  const normalized = stored.replace(/^avatars\//, "");
  let objectPath: string | null = null;

  if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
    objectPath = normalized;
  } else {
    const { data: listed } = await supabase.storage
      .from("avatars")
      .list(normalized, { sortBy: { column: "created_at", order: "desc" }, limit: 1 });
    if (listed && listed.length > 0) objectPath = `${normalized}/${listed[0].name}`;
  }
  if (!objectPath) return null;

  const signedRes = await supabase.storage.from("avatars").createSignedUrl(objectPath, 3600);
  return signedRes.data?.signedUrl ?? null;
}

/** Resolve route id (uuid or slug) to a UUID and return it. */
async function resolveSessionUUID(idOrSlug: string): Promise<string | null> {
  if (UUID_RE.test(idOrSlug)) return idOrSlug;

  // try find existing row by slug
  const { data: found } = await supabase
    .from(LIVE_TABLE)
    .select("id")
    .eq("slug", idOrSlug)
    .maybeSingle();
  if (found?.id) return String(found.id);

  // (optional) create a row for this slug to keep dev UX smooth
  const { data: created } = await supabase
    .from(LIVE_TABLE)
    .insert({ slug: idOrSlug, title: "Live Session", status: "live", viewers: 0 })
    .select("id")
    .single();
  return created?.id ? String(created.id) : null;
}

const { width, height } = Dimensions.get("window");

export default function LiveSession() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const pathname = typeof usePathname === "function" ? usePathname() : "";

  // session id (ALWAYS UUID)
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // header avatar (home-page logic)
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("Student");
  const [email, setEmail] = useState<string>("");

  // live session state (from DB)
  const [sTitle, setSTitle] = useState<string | null>(null);
  const [sName, setSName] = useState<string | null>(null);
  const [sViewers, setSViewers] = useState<number>(0);
  const viewersRef = useRef<number>(0);

  // debounce timer for presence→DB write-through
  const presenceWriteThroughTimer = useRef<any>(null);

  // realtime reaction counts
  const [heartCount, setHeartCount] = useState<number>(0);
  const [wowCount, setWowCount] = useState<number>(0);
  const [likeCount, setLikeCount] = useState<number>(0);

  // auth id
  const userIdRef = useRef<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const getParam = (key: string, def = ""): string => {
    const v = params[key];
    return (Array.isArray(v) ? v[0] : (v as string)) || def;
  };

  /* ---------- 0) Resolve id/slug -> UUID exactly once ---------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const raw = getParam("id", ""); // may be UUID or slug like "static-1"

      if (raw) {
        const uuid = await resolveSessionUUID(raw);
        if (mounted && uuid) {
          setSessionId(uuid); // ALWAYS store UUID
          console.log("sessionId (UUID) ->", uuid);
        }
        return;
      }

      // No route param: reuse latest or create a demo
      const { data: found } = await supabase
        .from(LIVE_TABLE)
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!mounted) return;

      if (found?.[0]?.id) {
        setSessionId(String(found[0].id));
        console.log("sessionId (latest) ->", String(found[0].id));
        return;
      }

      const { data: created } = await supabase
        .from(LIVE_TABLE)
        .insert({
          title: "Voice Warm-Up & Articulation Techniques",
          viewers: 0,
          status: "live",
          slug: "static-1", // friendly entry for demos
        })
        .select("id")
        .single();

      if (mounted && created?.id) {
        setSessionId(String(created.id));
        console.log("sessionId (created) ->", String(created.id));
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  const sessionTitle = sTitle ?? getParam("title", "Public Speaking Practice");
  const coachName   = sName  ?? getParam("name", "Professional Coach");
  const viewersText = Number.isFinite(sViewers) ? String(sViewers) : "0";

  const handleNavigation = (page: string) => router.push(page);

  useEffect(() => {
    if (isProfileMenuVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -50, duration: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isProfileMenuVisible]);

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") router.replace("/login-page");
    else if (iconName === "chatbot") router.push("/ButtonIcon/chatbot");
    else if (iconName === "notifications") router.push("/ButtonIcon/notification");
  };

  const handleCommunitySelect = (option: "Live Session" | "Community Post") => {
    setShowCommunityModal(false);
    if (option === "Live Session") router.push("/live-sessions-select");
    else router.push("/community-selection");
  };

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

  const togglePlayPause = () => setIsPlaying((p) => !p);
  const toggleControls = () => setShowControls((p) => !p);

  // Load current user + avatar
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!mounted || !uid) return;

      userIdRef.current = uid;
      setUserId(uid);
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

  /* ---------- 1) Load chosen session row + watch row changes ---------- */
  useEffect(() => {
    if (!sessionId || !UUID_RE.test(sessionId)) return; // wait for UUID
    let mounted = true;

    const fetchOne = async () => {
      const { data: row } = await supabase
        .from(LIVE_TABLE)
        .select("id, host_id, title, viewers, status")
        .eq("id", sessionId)
        .maybeSingle();
      if (!mounted || !row) return;

      setSTitle((row.title || "Live Session").toString());
      viewersRef.current = Number(row.viewers ?? 0);
      // IMPORTANT: do NOT setSViewers from DB; UI comes from Presence only

      if (row.host_id) {
        const { data: host } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", row.host_id)
          .maybeSingle();
        if (mounted) setSName(((host?.name as string) || "Unknown").toString());
      }
    };

    (async () => {
      await fetchOne();
      // Removed fallback ++/--: Presence is the source of truth for UI
    })();

    const ch = supabase
      .channel(`live:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: LIVE_TABLE, filter: `id=eq.${sessionId}` },
        (payload) => {
          const row: any = payload.new || payload.old;
          if (!row) return;
          // IMPORTANT: do NOT set viewers from DB changes to avoid double counts
          if (row.title) setSTitle(row.title);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      try { supabase.removeChannel(ch); } catch {}
      // Removed fallback decrement
    };
  }, [sessionId]);

  /* ---------- 2) Presence for accurate viewers ---------- */
  useEffect(() => {
    if (!sessionId || !UUID_RE.test(sessionId) || !userId) return;

    const presence = supabase.channel(`presence:live:${sessionId}`, {
      config: { presence: { key: userId } },
    });

    presence
      .on("presence", { event: "sync" }, () => {
        const state = presence.presenceState();
        const count = Object.keys(state).length || 0;

        // drive UI from presence
        setSViewers(count);

        // write-through to DB (debounced) so storage matches Presence
        if (sessionId) {
          if (presenceWriteThroughTimer.current) clearTimeout(presenceWriteThroughTimer.current);
          presenceWriteThroughTimer.current = setTimeout(() => {
            supabase
              .from(LIVE_TABLE)
              .update({ viewers: count })
              .eq("id", sessionId);
          }, 500);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          try { await presence.track({ online_at: new Date().toISOString() }); } catch {}
        }
      });

    return () => {
      try { presence.untrack(); } catch {}
      try { supabase.removeChannel(presence); } catch {}
    };
  }, [sessionId, userId]);

  /* ---------- 2.5) Persist attendance (join/leave) ---------- */
  useEffect(() => {
    if (!sessionId || !UUID_RE.test(sessionId) || !userId) return;

    // JOIN (or re-join)
    supabase
      .from("live_attendances")
      .upsert(
        {
          session_id: sessionId,
          user_id: userId,
          joined_at: new Date().toISOString(),
          left_at: null,
        },
        { onConflict: "session_id,user_id" }
      )
      .then(({ error }) => {
        if (error) console.warn("attendance upsert:", error.message);
      });

    // LEAVE (cleanup)
    return () => {
      supabase
        .from("live_attendances")
        .update({ left_at: new Date().toISOString() })
        .eq("session_id", sessionId)
        .eq("user_id", userId)
        .then(({ error }) => {
          if (error) console.warn("attendance leave:", error.message);
        });
    };
  }, [sessionId, userId]);

  /* ---------- 3) Realtime reactions ---------- */
  useEffect(() => {
    if (!sessionId || !UUID_RE.test(sessionId)) return;
    let mounted = true;

    const setByType = (type: string, n: number) => {
      if (type === "heart") setHeartCount(Math.max(0, n));
      if (type === "wow")   setWowCount(Math.max(0, n));
      if (type === "like")  setLikeCount(Math.max(0, n));
    };

    const fetchCounts = async () => {
      const types: Array<"heart" | "wow" | "like"> = ["heart", "wow", "like"];
      await Promise.all(
        types.map(async (t) => {
          const { count, error } = await supabase
            .from(REACT_TABLE)
            .select("*", { count: "exact", head: true })
            .eq("session_id", sessionId)
            .eq("type", t);
          if (error) console.warn("[reactions] count error:", error.message);
          if (mounted) setByType(t, count || 0);
        })
      );
    };

    const fetchMine = async () => {
      const uid = userIdRef.current;
      if (!uid) return;
      const { data: mine } = await supabase
        .from(REACT_TABLE)
        .select("type")
        .eq("session_id", sessionId)
        .eq("user_id", uid)
        .maybeSingle();
      if (mounted && mine?.type) setActiveReaction(mine.type);
    };

    (async () => {
      await fetchCounts();
      await fetchMine();
    })();

    const adjust = (type: string, delta: number) => {
      if (type === "heart") setHeartCount((n) => Math.max(0, n + delta));
      if (type === "wow")   setWowCount((n)   => Math.max(0, n + delta));
      if (type === "like")  setLikeCount((n)  => Math.max(0, n + delta));
    };

    const ch = supabase
      .channel(`live_react:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: REACT_TABLE, filter: `session_id=eq.${sessionId}` },
        (payload: any) => {
          if (payload.eventType === "INSERT") adjust(payload.new?.type, +1);
          else if (payload.eventType === "DELETE") adjust(payload.old?.type, -1);
          else if (payload.eventType === "UPDATE") {
            const o = payload.old?.type;
            const n = payload.new?.type;
            if (o && o !== n) { adjust(o, -1); adjust(n, +1); }
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      try { supabase.removeChannel(ch); } catch {}
    };
  }, [sessionId]);

  // Optimistic bump helpers
  const bumpCounts = (prev: "heart" | "wow" | "like" | null, next: "heart" | "wow" | "like" | null) => {
    if (prev === next) return;
    if (prev === "heart") setHeartCount((c) => Math.max(0, c - 1));
    if (prev === "wow")   setWowCount((c) => Math.max(0, c - 1));
    if (prev === "like")  setLikeCount((c) => Math.max(0, c - 1));
    if (next === "heart") setHeartCount((c) => c + 1);
    if (next === "wow")   setWowCount((c) => c + 1);
    if (next === "like")  setLikeCount((c) => c + 1);
  };

  const upsertReaction = async (nextType: "heart" | "wow" | "like" | null) => {
    const uid = userIdRef.current;
    if (!sessionId || !UUID_RE.test(sessionId) || !uid) {
      console.warn("[reactions] missing/invalid sessionId or uid");
      return;
    }
    const prev = activeReaction;

    try {
      // optimistic
      bumpCounts(prev as any, nextType as any);
      setActiveReaction(nextType);

      if (nextType === null) {
        const { error } = await supabase
          .from(REACT_TABLE)
          .delete()
          .eq("session_id", sessionId)
          .eq("user_id", uid);
        if (error) throw error;
        return;
      }

      const { error } = await supabase
        .from(REACT_TABLE)
        .upsert([{ session_id: sessionId, user_id: uid, type: nextType }], {
          onConflict: "session_id,user_id",
        });
      if (error) throw error;
    } catch (e: any) {
      console.warn("[reactions] upsert/delete error:", e?.message || e);
      // rollback optimistic change
      bumpCounts(nextType as any, prev as any);
      setActiveReaction(prev ?? null);
    }
  };

  const handleReaction = (reaction: string) => {
    const r = reaction as "heart" | "wow" | "like";
    if (activeReaction === r) upsertReaction(null);
    else upsertReaction(r);
  };

  const handleLevelSelect = (level: "Basic" | "Advanced") => {
    setShowLevelModal(false);
    if (level === "Advanced") router.push("/advance-execise-reading");
    else router.push("/basic-exercise-reading");
  };

  return (
    <View className="flex-1 bg-[#0F172A]">
      <BackgroundDecor />
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 pt-4">
            {/* Header */}
            <View className="flex-row top-5 justify-between items-center px-4 py-3">
              <TouchableOpacity className="flex-row items-center" onPress={() => router.back()} activeOpacity={0.7}>
                <Image
                  source={require("../../../assets/Speaksy.png")}
                  className="w-12 h-12 rounded-full right-2"
                  resizeMode="contain"
                />
                <Text className="text-white font-bold text-2xl ml-2 -left-5">Voclaria</Text>
              </TouchableOpacity>

              <View className="flex-row items-center -right-1 space-x-3">
                <TouchableOpacity className="p-2 bg-white/10 rounded-full" onPress={() => handleIconPress("chatbot")} activeOpacity={0.7}>
                  <View className="w-6 h-6 items-center justify-center">
                    <Image
                      source={require("../../../assets/chatbot.png")}
                      className="w-5 h-5"
                      resizeMode="contain"
                      tintColor="white"
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity className="p-2 bg-white/10 rounded-full" onPress={() => handleIconPress("notifications")} activeOpacity={0.7}>
                  <View className="w-6 h-6 items-center justify-center">
                    <Ionicons name="notifications-outline" size={20} color="white" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity className="p-1" onPress={() => setIsProfileMenuVisible(true)} activeOpacity={0.7}>
                  <View className="p-0.5 bg-white/10 rounded-full">
                    <Image
                      source={{ uri: avatarUri || "https://randomuser.me/api/portraits/women/44.jpg" }}
                      className="w-8 h-8 rounded-full"
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Main Content */}
            <View className="mt-2 mb-4">
              {/* Host Card */}
              <View className="flex-row items-center right-3 mb-4">
                <View className="w-14 h-14 rounded-full bg-white/20 justify-center items-center mr-4">
                  <Text className="text-white font-bold text-lg">MC</Text>
                </View>
                <View className="flex-1 flex-row justify-between items-center">
                  <View>
                    <Text className="text-white font-bold text-xl">{coachName}</Text>
                    <Text className="text-violet-300 text-base">Student</Text>
                  </View>
                  <View className="flex-row items-center -right-2">
                    <Ionicons name="star" size={18} color="white" />
                    <Text className="text-white text-xl font-medium ml-1">4.9</Text>
                  </View>
                </View>
              </View>

              {/* Video Container */}
              <View className="mb-4 -mx-4">
                <View className="border-2 border-white/30 rounded-2xl overflow-hidden">
                  <TouchableOpacity activeOpacity={1} className="w-full aspect-[4/3] bg-black" onPress={toggleControls}>
                    <Image
                      source={{
                        uri: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80",
                      }}
                      className="absolute w-full h-full"
                      resizeMode="cover"
                    />

                    {/* Live Badge */}
                    <View className="absolute top-3 left-3 bg-black/50 px-3 py-1 rounded-full flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                      <Text className="text-white text-xs font-bold">LIVE</Text>
                    </View>

                    {/* Viewers Count */}
                    <View className="absolute top-3 right-3 bg-black/50 px-3 py-1 rounded-full flex-row items-center">
                      <Ionicons name="people" size={14} color="white" />
                      <Text className="text-white text-xs font-medium ml-1.5">{viewersText}</Text>
                    </View>

                    {/* Video Controls */}
                    {showControls && (
                      <View className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <View className="w-full h-1.5 bg-gray-500/50 rounded-full mb-3">
                          <View className="h-1.5 bg-white w-3/4 rounded-full" />
                        </View>
                        <View className="flex-row justify-between items-center px-1">
                          <View className="flex-row items-center space-x-4">
                            <TouchableOpacity onPress={togglePlayPause}>
                              <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="white" />
                            </TouchableOpacity>
                            <Text className="text-white text-sm">12:45 / 45:00</Text>
                          </View>
                          <View className="flex-row items-center space-x-4">
                            <Ionicons name="volume-high" size={20} color="white" />
                            <Ionicons name="expand" size={20} color="white" />
                          </View>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Reactions */}
                <View className="flex-row justify-center items-center mt-4 space-x-6">
                  <TouchableOpacity className="flex-row items-center rounded-full px-6 py-2.5 bg-white/5" onPress={() => handleReaction("heart")}>
                    <Ionicons name="heart" size={26} color={activeReaction === "heart" ? "#EC4899" : "white"} />
                    <Text className={`font-medium text-base ml-2 ${activeReaction === "heart" ? "text-pink-400" : "text-white"}`}>{heartCount}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity className="flex-row items-center rounded-full px-6 py-2.5 bg-white/5" onPress={() => handleReaction("wow")}>
                    <Ionicons name="happy-outline" size={26} color={activeReaction === "wow" ? "#F59E0B" : "white"} />
                    <Text className={`font-medium text-base ml-2 ${activeReaction === "wow" ? "text-yellow-400" : "text-white"}`}>{wowCount}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity className="flex-row items-center rounded-full px-6 py-2.5 bg-white/5" onPress={() => handleReaction("like")}>
                    <Ionicons name="thumbs-up" size={26} color={activeReaction === "like" ? "#3B82F6" : "white"} />
                    <Text className={`font-medium text-base ml-2 ${activeReaction === "like" ? "text-blue-400" : "text-white"}`}>{likeCount}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Details */}
              <View className="max-w-md w-full self-center">
                <Text className="text-white text-2xl font-bold mb-6 leading-tight">{sessionTitle}</Text>

                <View className="flex-row flex-wrap gap-2 mb-8">
                  <View className="bg-white/30 px-3 py-1.5 rounded-full">
                    <Text className="text-white text-xs font-medium">Public Speaking</Text>
                  </View>
                  <View className="bg-white/30 px-3 py-1.5 rounded-full">
                    <Text className="text-white text-xs font-medium">Confidence Building</Text>
                  </View>
                  <View className="bg-white/30 px-3 py-1.5 rounded-full">
                    <Text className="text-white text-xs font-medium">45 minutes</Text>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-white text-2xl font-semibold left-2 mb-2">ADVISORY</Text>
                  <Text className="text-gray-300 text-base leading-relaxed bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-xl">
                    This is a live public speaking practice session where students can observe and learn presentation
                    techniques. Support speakers with positive reactions to create an encouraging environment.
                  </Text>
                </View>

                <View className="max-w-md w-full self-center">
                  <TouchableOpacity
                    className="bg-violet-600/80 border border-white/20 rounded-xl py-3 px-6 flex-row justify-center items-center mb-4"
                    onPress={() => handleNavigation("/live-sessions")}
                  >
                    <Text className="text-white font-bold text-base mr-2">Explore More Sessions</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <NavigationBar defaultActiveTab="Community" />

        <ProfileMenuNew
          visible={isProfileOpen}
          onDismiss={() => setIsProfileOpen(false)}
          user={{
            name: "Sarah Johnson",
            email: "sarah@gmail.com",
            image: { uri: "https://randomuser.me/api/portraits/women/44.jpg" },
          }}
        />
        <LivesessionCommunityModal
          visible={showCommunityModal}
          onDismiss={() => setShowCommunityModal(false)}
          onSelectOption={handleCommunitySelect}
        />
        <LevelSelectionModal
          visible={showLevelModal}
          onDismiss={() => setShowLevelModal(false)}
          onSelectLevel={handleLevelSelect}
        />
      </View>
    </View>
  );
}
