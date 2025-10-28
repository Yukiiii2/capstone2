import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams, usePathname } from "expo-router";
import NavigationBar from "@/components/NavigationBar/nav-bar-teacher";
import ProfileMenuTeacher from "@/components/ProfileModal/ProfileMenuTeacher";
import LevelSelectionModal from "@/components/StudentModal/LevelSelectionModal";

import { supabase } from "@/lib/supabaseClient";

/* ────────────────────────────── constants / helpers ───────────────────────────── */

const LIVE_TABLE = "live_sessions";
const REACT_TABLE = "live_session_reactions";

const TRANSPARENT_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveSignedAvatar(
  userId: string,
  storedPath?: string | null
) {
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
    if (listed && listed.length > 0) {
      objectPath = `${normalized}/${listed[0].name}`;
    }
  }

  if (!objectPath) return null;

  const signedRes = await supabase.storage
    .from("avatars")
    .createSignedUrl(objectPath, 3600);
  if (signedRes.error) return null;
  return signedRes.data?.signedUrl ?? null;
}

/** Resolve route id (uuid or slug) to a UUID and return it */
async function resolveSessionUUID(idOrSlug: string): Promise<string | null> {
  if (UUID_RE.test(idOrSlug)) return idOrSlug;

  // try matching slug
  const { data: found } = await supabase
    .from(LIVE_TABLE)
    .select("id")
    .eq("slug", idOrSlug)
    .maybeSingle();
  if (found?.id) return String(found.id);

  // if not found, create a new session row w/ that slug
  const { data: created } = await supabase
    .from(LIVE_TABLE)
    .insert({
      slug: idOrSlug,
      title: "Live Session",
      status: "live",
      viewers: 0,
    })
    .select("id")
    .single();
  if (created?.id) return String(created.id);

  return null;
}

/* ────────────────────────────── background decor ───────────────────────────── */

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

/* ───────────────────────────── component ───────────────────────────── */

export default function LiveSession() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const pathname = usePathname?.() || "";

  // header menu / modal
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);

  // UI state for player
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // profile avatar animation (kept for parity)
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // current teacher info (header avatar)
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("Teacher");
  const [email, setEmail] = useState<string>("");

  // auth user id (teacher)
  const [userId, setUserId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  // resolved session UUID
  const [sessionId, setSessionId] = useState<string | null>(null);

  // session meta (live row data)
  const [sTitle, setSTitle] = useState<string | null>(null);
  const [sName, setSName] = useState<string | null>(null);
  const [sViewers, setSViewers] = useState<number>(0);

  // reaction state
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [heartCount, setHeartCount] = useState<number>(0);
  const [wowCount, setWowCount] = useState<number>(0);
  const [likeCount, setLikeCount] = useState<number>(0);

  // we'll debounce writes to live_sessions.viewers
  const presenceWriteThroughTimer = useRef<any>(null);

  // ----- helpers -----

  const getParam = (key: string, defaultValue: string = ""): string => {
    const value = params[key];
    if (Array.isArray(value)) return value[0] || defaultValue;
    return (value as string) || defaultValue;
  };

  // derived session data for rendering (fallbacks to URL params)
  const sessionData = useMemo(() => {
    return {
      id: sessionId ?? getParam("id", "1"),
      title: sTitle ?? getParam("title", "Public Speaking Practice"),
      name: sName ?? getParam("name", "Professional Coach"),
      viewers: String(
        Number.isFinite(sViewers)
          ? sViewers
          : Number(getParam("viewers", "0"))
      ),
    };
  }, [sessionId, sTitle, sName, sViewers, params]);

  // ----- UI handlers -----

  const togglePlayPause = () => setIsPlaying((p) => !p);
  const toggleControls = () => setShowControls((p) => !p);

  const handleIconPress = (icon: string) => {
    if (icon === "/ButtonIcon/add-student") {
      router.push("/ButtonIcon/add-student");
    } else if (icon === "modules") {
      router.push("/ButtonIcon/post-module");
    }
  };

  const handleNavigation = (/* page: string */) => {
    // leave as stub - same as original new UI
  };

  // user toggles a reaction
  const upsertReaction = useCallback(
    async (nextType: "heart" | "wow" | "like" | null) => {
      const uid = userIdRef.current;
      if (!sessionId || !UUID_RE.test(sessionId) || !uid) return;
      const prev = activeReaction;

      const bumpCounts = (
        prevType: "heart" | "wow" | "like" | null,
        nextType2: "heart" | "wow" | "like" | null
      ) => {
        // decrement prev
        if (prevType === "heart")
          setHeartCount((c) => Math.max(0, c - 1));
        if (prevType === "wow")
          setWowCount((c) => Math.max(0, c - 1));
        if (prevType === "like")
          setLikeCount((c) => Math.max(0, c - 1));
        // increment next
        if (nextType2 === "heart") setHeartCount((c) => c + 1);
        if (nextType2 === "wow") setWowCount((c) => c + 1);
        if (nextType2 === "like") setLikeCount((c) => c + 1);
      };

      try {
        // optimistic update
        bumpCounts(prev as any, nextType as any);
        setActiveReaction(nextType);

        if (nextType === null) {
          await supabase
            .from(REACT_TABLE)
            .delete()
            .eq("session_id", sessionId)
            .eq("user_id", uid);
          return;
        }

        await supabase
          .from(REACT_TABLE)
          .upsert(
            [{ session_id: sessionId, user_id: uid, type: nextType }],
            { onConflict: "session_id,user_id" }
          );
      } catch (e) {
        // rollback
        bumpCounts(nextType as any, prev as any);
        setActiveReaction(prev ?? null);
      }
    },
    [activeReaction, sessionId]
  );

  const handleReactionPress = (reaction: "heart" | "wow" | "like") => {
    if (activeReaction === reaction) {
      upsertReaction(null);
    } else {
      upsertReaction(reaction);
    }
  };

  // ----- effects: profile header -----

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
          "Teacher") + "";

      if (!mounted) return;
      setFullName(name.trim());

      const signed = await resolveSignedAvatar(
        uid,
        (prof as any)?.avatar_url ?? null
      );
      if (!mounted) return;
      setAvatarUri(signed);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ----- effects: open/close profile menu anim -----

  useEffect(() => {
    if (isProfileMenuVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isProfileMenuVisible, slideAnim, opacityAnim]);

  // ----- effects: resolve session id from route -----

  useEffect(() => {
    let mounted = true;
    (async () => {
      const raw = getParam("id", "");
      if (raw) {
        const uuid = await resolveSessionUUID(raw);
        if (mounted && uuid) setSessionId(uuid);
        return;
      }

      // fallback to latest session or create a default
      const { data: found } = await supabase
        .from(LIVE_TABLE)
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!mounted) return;
      if (found?.[0]?.id) {
        setSessionId(String(found[0].id));
        return;
      }

      const { data: created } = await supabase
        .from(LIVE_TABLE)
        .insert({
          title: "Voice Warm-Up & Articulation Techniques",
          viewers: 0,
          status: "live",
          slug: "static-1",
        })
        .select("id")
        .single();

      if (mounted && created?.id) {
        setSessionId(String(created.id));
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  // ----- effects: listen to session row / author -----

  useEffect(() => {
    if (!sessionId || !UUID_RE.test(sessionId)) return;
    let mounted = true;

    const fetchOne = async () => {
      const { data: row } = await supabase
        .from(LIVE_TABLE)
        .select("id, host_id, title, viewers, status")
        .eq("id", sessionId)
        .maybeSingle();

      if (!mounted || !row) return;

      setSTitle((row.title || "Live Session").toString());

      // we don't set viewers here because presence below is the source of truth
      if (row.host_id) {
        const { data: host } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", row.host_id)
          .maybeSingle();

        if (mounted) {
          setSName(((host?.name as string) || "Unknown").toString());
        }
      }
    };

    (async () => {
      await fetchOne();
    })();

    const ch = supabase
      .channel(`live:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: LIVE_TABLE,
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const row: any = payload.new || payload.old;
          if (!row) return;
          if (row.title) setSTitle(row.title);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(ch);
      } catch {}
      mounted = false;
    };
  }, [sessionId]);

  // ----- effects: presence viewer tracking (+ write through to DB) -----

  useEffect(() => {
    if (!sessionId || !UUID_RE.test(sessionId) || !userId) return;

    const presence = supabase.channel(`presence:live:${sessionId}`, {
      config: { presence: { key: userId } },
    });

    presence
      .on("presence", { event: "sync" }, () => {
        const state = presence.presenceState();
        const count = Object.keys(state).length || 0;
        setSViewers(count);

        // debounce write to DB so viewers column reflects presence
        if (sessionId) {
          if (presenceWriteThroughTimer.current) {
            clearTimeout(presenceWriteThroughTimer.current);
          }
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
          try {
            await presence.track({
              online_at: new Date().toISOString(),
            });
          } catch {}
        }
      });

    return () => {
      try {
        presence.untrack();
      } catch {}
      try {
        supabase.removeChannel(presence);
      } catch {}
    };
  }, [sessionId, userId]);

  // ----- effects: attendance table join/leave -----

  useEffect(() => {
    if (!sessionId || !UUID_RE.test(sessionId) || !userId) return;

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
      );

    return () => {
      supabase
        .from("live_attendances")
        .update({ left_at: new Date().toISOString() })
        .eq("session_id", sessionId)
        .eq("user_id", userId);
    };
  }, [sessionId, userId]);

  // ----- effects: realtime reactions counts -----

  useEffect(() => {
    if (!sessionId || !UUID_RE.test(sessionId)) return;
    let mounted = true;

    const setByType = (type: string, n: number) => {
      if (type === "heart") setHeartCount(Math.max(0, n));
      if (type === "wow") setWowCount(Math.max(0, n));
      if (type === "like") setLikeCount(Math.max(0, n));
    };

    const fetchCounts = async () => {
      const types: Array<"heart" | "wow" | "like"> = [
        "heart",
        "wow",
        "like",
      ];
      await Promise.all(
        types.map(async (t) => {
          const { count } = await supabase
            .from(REACT_TABLE)
            .select("*", { count: "exact", head: true })
            .eq("session_id", sessionId)
            .eq("type", t);
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
      if (mounted && mine?.type) {
        setActiveReaction(mine.type);
      }
    };

    (async () => {
      await fetchCounts();
      await fetchMine();
    })();

    // realtime subscription
    const adjust = (type: string, delta: number) => {
      if (type === "heart") setHeartCount((n) => Math.max(0, n + delta));
      if (type === "wow") setWowCount((n) => Math.max(0, n + delta));
      if (type === "like") setLikeCount((n) => Math.max(0, n + delta));
    };

    const ch = supabase
      .channel(`live_react:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: REACT_TABLE,
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT")
            adjust(payload.new?.type, +1);
          else if (payload.eventType === "DELETE")
            adjust(payload.old?.type, -1);
          else if (payload.eventType === "UPDATE") {
            const o = payload.old?.type;
            const n = payload.new?.type;
            if (o && o !== n) {
              adjust(o, -1);
              adjust(n, +1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      try {
        supabase.removeChannel(ch);
      } catch {}
    };
  }, [sessionId]);

  /* ───────────────────────────── render ───────────────────────────── */

  return (
    <View className="flex-1 bg-[#0F172A]">
      <BackgroundDecor />

      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 bottom-2 pt-4">
            {/* Header */}
            <View className="z-10 bottom-4">
              <SafeAreaView>
                <View className="flex-row justify-between items-center top-6 px-4 py-3">
                  <View className="flex-row items-center">
                    <Image
                      source={require("../../../assets/Speaksy.png")}
                      className="w-12 h-12 right-3 -mr-4 right-6"
                      resizeMode="contain"
                    />
                    <Text className="text-white right-3 font-bold text-2xl">
                      Voclaria
                    </Text>
                  </View>

                  <View className="flex-row items-center right-2">
                    <TouchableOpacity
                      onPress={() => handleIconPress("modules")}
                      activeOpacity={0.7}
                      className="p-2 bg-white/10 left-6 rounded-full mr-4"
                    >
                      <Image
                        source={require("../../../assets/Modules.png")}
                        className="w-5 h-5"
                        resizeMode="contain"
                        tintColor="white"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        handleIconPress("/ButtonIcon/add-student")
                      }
                      activeOpacity={0.7}
                      className="p-2 bg-white/10 left-6 rounded-full mr-4"
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
                        source={{
                          uri: avatarUri || TRANSPARENT_PNG,
                        }}
                        className="w-9 h-9 rounded-full left-6 border-2 border-white/80"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </SafeAreaView>
            </View>

            {/* Main Content */}
            <View className="mt-2 mb-4">
              {/* Host Card */}
              <View className="flex-row items-center right-3 mb-4">
                <View className="w-14 h-14 rounded-full bg-white/20 justify-center items-center mr-4">
                  <Text className="text-white font-bold text-lg">
                    {(sessionData.name || "U")
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "U"}
                  </Text>
                </View>

                <View className="flex-1 flex-row justify-between items-center">
                  <View>
                    <Text className="text-white font-bold text-xl">
                      {sessionData.name}
                    </Text>
                    <Text className="text-violet-300 text-base">Student</Text>
                  </View>
                  <View className="flex-row items-center -right-2">
                    <Ionicons name="star" size={18} color="white" />
                    <Text className="text-white text-xl font-medium ml-1">
                      4.9
                    </Text>
                  </View>
                </View>
              </View>

              {/* Video Container */}
              <View className="mb-4 -mx-4">
                <View className="border-2 border-white/30 rounded-2xl overflow-hidden">
                  <TouchableOpacity
                    activeOpacity={1}
                    className="w-full aspect-[4/3] bg-black"
                    onPress={toggleControls}
                  >
                    {/* placeholder video frame */}
                    <Image
                      source={{
                        uri: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80",
                      }}
                      className="absolute w-full h-full"
                      resizeMode="cover"
                    />

                    {/* LIVE badge */}
                    <View className="absolute top-3 left-3 bg-black/50 px-3 py-1 rounded-full flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                      <Text className="text-white text-xs font-bold">
                        LIVE
                      </Text>
                    </View>

                    {/* viewers bubble (realtime from presence) */}
                    <View className="absolute top-3 right-3 bg-black/50 px-3 py-1 rounded-full flex-row items-center">
                      <Ionicons name="people" size={14} color="white" />
                      <Text className="text-white text-xs font-medium ml-1.5">
                        {sessionData.viewers}
                      </Text>
                    </View>

                    {/* controls overlay */}
                    {showControls && (
                      <View className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <View className="w-full h-1.5 bg-gray-500/50 rounded-full mb-3">
                          <View className="h-1.5 bg-white w-3/4 rounded-full" />
                        </View>
                        <View className="flex-row justify-between items-center px-1">
                          <View className="flex-row items-center space-x-4">
                            <TouchableOpacity onPress={togglePlayPause}>
                              <Ionicons
                                name={isPlaying ? "pause" : "play"}
                                size={24}
                                color="white"
                              />
                            </TouchableOpacity>
                            <Text className="text-white text-sm">
                              12:45 / 45:00
                            </Text>
                          </View>
                          <View className="flex-row items-center space-x-4">
                            <Ionicons
                              name="volume-high"
                              size={20}
                              color="white"
                            />
                            <Ionicons name="expand" size={20} color="white" />
                          </View>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Reactions Below Video */}
                <View className="flex-row justify-center items-center mt-4 space-x-6">
                  <TouchableOpacity
                    className="flex-row items-center rounded-full px-6 py-2.5 bg-white/5"
                    onPress={() => handleReactionPress("heart")}
                  >
                    <Ionicons
                      name="heart"
                      size={26}
                      color={
                        activeReaction === "heart" ? "#EC4899" : "white"
                      }
                    />
                    <Text
                      className={`font-medium text-base ml-2 ${
                        activeReaction === "heart"
                          ? "text-pink-400"
                          : "text-white"
                      }`}
                    >
                      {heartCount}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center rounded-full px-6 py-2.5 bg-white/5"
                    onPress={() => handleReactionPress("wow")}
                  >
                    <Ionicons
                      name="happy-outline"
                      size={26}
                      color={
                        activeReaction === "wow" ? "#F59E0B" : "white"
                      }
                    />
                    <Text
                      className={`font-medium text-base ml-2 ${
                        activeReaction === "wow"
                          ? "text-yellow-400"
                          : "text-white"
                      }`}
                    >
                      {wowCount}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center rounded-full px-6 py-2.5 bg-white/5"
                    onPress={() => handleReactionPress("like")}
                  >
                    <Ionicons
                      name="thumbs-up"
                      size={26}
                      color={
                        activeReaction === "like" ? "#3B82F6" : "white"
                      }
                    />
                    <Text
                      className={`font-medium text-base ml-2 ${
                        activeReaction === "like"
                          ? "text-blue-400"
                          : "text-white"
                      }`}
                    >
                      {likeCount}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Session Details */}
              <View className="max-w-md w-full self-center">
                {/* Title */}
                <Text className="text-white text-2xl font-bold mb-6 leading-tight">
                  {sessionData.title}
                </Text>

                {/* Tags */}
                <View className="flex-row flex-wrap gap-2 mb-8">
                  <View className="bg-white/30 px-3 py-1.5 rounded-full">
                    <Text className="text-white text-xs font-medium">
                      Public Speaking
                    </Text>
                  </View>
                  <View className="bg-white/30 px-3 py-1.5 rounded-full">
                    <Text className="text-white text-xs font-medium">
                      Confidence Building
                    </Text>
                  </View>
                  <View className="bg-white/30 px-3 py-1.5 rounded-full">
                    <Text className="text-white text-xs font-medium">
                      45 minutes
                    </Text>
                  </View>
                </View>

                {/* Advisory / Description */}
                <View className="mb-4">
                  <Text className="text-white text-2xl font-semibold left-2 mb-2">
                    ADVISORY
                  </Text>
                  <Text className="text-gray-300 text-base leading-relaxed bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-xl">
                    This is a live public speaking practice session where
                    students can observe and learn presentation techniques.
                    Support speakers with positive reactions to create an
                    encouraging environment.
                  </Text>
                </View>

                {/* CTA */}
                <View className="max-w-md w-full self-center">
                  <TouchableOpacity
                    className="bg-indigo-600 rounded-xl py-3 px-6 flex-row justify-center items-center mb-4"
                    onPress={() => handleNavigation()}
                  >
                    <Text className="text-white font-bold text-base mr-2">
                      Explore More Sessions
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Nav */}
        <NavigationBar defaultActiveTab="Live Session" />

        {/* Profile menu modal */}
        <ProfileMenuTeacher
          visible={isProfileMenuVisible}
          onDismiss={() => setIsProfileMenuVisible(false)}
        />

        {/* Level selection modal (kept from original logic version) */}
        <LevelSelectionModal
          visible={showLevelModal}
          onDismiss={() => setShowLevelModal(false)}
          onSelectLevel={(level) => {
            setShowLevelModal(false);
            if (level === "Basic") {
              router.push("/basic-exercise-reading");
            } else {
              router.push("/advance-exercise-reading");
            }
          }}
        />
      </View>
    </View>
  );
}
