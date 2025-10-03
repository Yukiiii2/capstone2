// app/StudentsScreen/SpeakingExercise/live-video-recording.tsx
import NavigationBar from "../../../components/NavigationBar/nav-bar";
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
  Platform,
  Linking,
  StatusBar,
  Dimensions,
  StyleSheet,
  AppState,
  BackHandler,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname, useLocalSearchParams } from "expo-router";
import ProfileMenuNew from "../../../components/ProfileModal/ProfileMenuNew";
import EndSessionModal from "../../../components/StudentModal/EndSessionModal";
import LivesessionCommunityModal from "../../../components/StudentModal/LivesessionCommunityModal";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "@/lib/supabaseClient";

/** We keep camera imports but won’t use them while we prioritize audio */
import Constants from "expo-constants";

/** 🎙️ expo-av for audio-only recording */
import { Audio } from "expo-av";

/* ---------- VERSION-SAFE AUDIO MODE HELPER (fixes TS errors) ---------- */
async function setAudioModeCompatRecording() {
  const A: any = Audio as any;
  const mode: any = {
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  };
  // iOS
  if (A?.InterruptionModeIOS?.DoNotMix != null) {
    mode.interruptionModeIOS = A.InterruptionModeIOS.DoNotMix;
  } else if (A?.INTERRUPTION_MODE_IOS_DO_NOT_MIX != null) {
    mode.interruptionModeIOS = A.INTERRUPTION_MODE_IOS_DO_NOT_MIX;
  }
  // Android
  if (A?.InterruptionModeAndroid?.DoNotMix != null) {
    mode.interruptionModeAndroid = A.InterruptionModeAndroid.DoNotMix;
  } else if (A?.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX != null) {
    mode.interruptionModeAndroid = A.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX;
  }
  await Audio.setAudioModeAsync(mode);
}
async function setAudioModeCompatIdle() {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
  } as any);
}
/* --------------------------------------------------------------------- */

/* ---- utils: convert Base64 -> Uint8Array (Expo Go safe, used for upload) ---- */
const base64ToUint8Array = (base64: string) => {
  // global.atob exists on iOS/Android Hermes; Buffer is fallback for web/dev
  const binary =
    (global as any).atob
      ? (global as any).atob(base64)
      : Buffer.from(base64, "base64").toString("binary");
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const PROFILE_PIC = { uri: "https://randomuser.me/api/portraits/women/44.jpg" };

const tips = [
  "Speak clearly and steadily",
  "Use gestures for emphasis",
  "Stand tall for confidence",
  "Look at the camera",
  "Change tone to engage",
  "Pause after key points",
  "Smile to seem approachable",
];

const feedbackMessages = [
  "Clear pronunciation!",
  "Vary your tone for emphasis",
  "Good pacing, keep it up",
  "Try slowing down slightly",
  "Excellent confidence!",
  "Use more hand gestures",
  "Maintain eye contact with camera",
  "Great energy in your delivery",
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

export default function LiveVideoRecording() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();

  const isExpoGo = Constants.appOwnership === "expo";

  // ========= Capture + normalize + decode lesson/module context =========
  const normalizeParam = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const module_id_raw = normalizeParam(params.module_id);
  const module_title_raw = normalizeParam(params.module_title);
  const level_raw = normalizeParam(params.level);
  const display_raw = normalizeParam(params.display);

  const module_id = module_id_raw || undefined;
  const module_title = module_title_raw
    ? (() => {
        try {
          return decodeURIComponent(module_title_raw);
        } catch {
          return module_title_raw;
        }
      })()
    : undefined;
  const level = level_raw || undefined;
  const display = display_raw || undefined;

  // Accept either ?session or ?session_id
  const initialRouteSessionId =
    normalizeParam(params.session) || normalizeParam(params.session_id) || null;

  // packed module context
  const moduleCtx = useMemo(
    () => ({
      ...(module_id ? { module_id } : {}),
      ...(module_title ? { module_title } : {}),
      ...(level ? { level } : {}),
      ...(display ? { display } : {}),
    }),
    [module_id, module_title, level, display]
  );

  const pushWithCtx = (pathname: any, extra?: Record<string, any>) => {
    router.push({ pathname, params: { ...moduleCtx, ...(extra || {}) } });
  };

  // UI state
  const [isRecording, setIsRecording] = useState(false); // used for audio now
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Profile / user
  const [fullName, setFullName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // current session id
  const [sessionId, setSessionId] = useState<string | null>(initialRouteSessionId);

  // Animations
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  // 🎙️ audio-only recording refs/state
  const audioRecordingRef = useRef<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null); // holds .m4a
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [didAutoUpload, setDidAutoUpload] = useState(false); // ⬅ one-shot modal guard

  // Timer
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<any>(null);
  const recordStartRef = useRef<number | null>(null);

  // Tips / feedback
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState("");
  const [aiConnected, setAiConnected] = useState(false);
  const aiSubRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Live session viewers
  const [liveViewers, setLiveViewers] = useState<number | null>(null);
  const liveSubRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const screenWidth = Dimensions.get("window").width;

  // foreground tracking
  const appStateRef = useRef(AppState.currentState);

  // Status bar
  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent");
      StatusBar.setTranslucent(true);
    }
  }, []);

  // Load user + signed avatar
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user || !mounted) return;

      setUserEmail(user.email ?? "");
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      const nameValue =
        (profile?.name ?? user.user_metadata?.full_name ?? user.email ?? "").trim();
      if (!mounted) return;
      setFullName(nameValue);

      const stored = profile?.avatar_url?.toString() || user.id;
      const normalized = stored.replace(/^avatars\//, "");
      let objectPath: string | null = null;
      if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
        objectPath = normalized;
      } else {
        const { data: list } = await supabase.storage
          .from("avatars")
          .list(normalized, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
        if (list && list.length > 0) objectPath = `${normalized}/${list[0].name}`;
      }
      if (!objectPath) return;
      const { data: signed } = await supabase.storage
        .from("avatars")
        .createSignedUrl(objectPath, 3600);
      if (!mounted) return;
      setAvatarUri(signed?.signedUrl ?? null);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Rotate tips (fallback when AI feedback not connected)
  useEffect(() => {
    const t = setInterval(() => {
      if (aiConnected) return;
      setCurrentTipIndex((i) => (i + 1) % tips.length);
    }, 5000);
    return () => clearInterval(t);
  }, [aiConnected]);

  // Recording UX animations + feedback
  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let feedbackInterval: any = null;

    if (isRecording) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulseLoop.start();

      feedbackInterval = setInterval(() => {
        if (aiConnected) return;
        const randomIndex = Math.floor(Math.random() * feedbackMessages.length);
        setCurrentFeedback(feedbackMessages[randomIndex]);
        Animated.sequence([
          Animated.timing(feedbackAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.delay(2200),
          Animated.timing(feedbackAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      }, 3500);
    } else {
      pulseAnim.setValue(1);
      setCurrentFeedback("");
      Animated.timing(feedbackAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }

    return () => {
      try {
        // @ts-ignore
        pulseLoop?.stop?.();
      } catch {}
      if (feedbackInterval) clearInterval(feedbackInterval);
    };
  }, [isRecording, aiConnected]);

  // Profile menu animation
  useEffect(() => {
    const anis = isProfileMenuVisible
      ? [
          Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]
      : [
          Animated.timing(slideAnim, { toValue: -50, duration: 200, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ];
    Animated.parallel(anis).start();
  }, [isProfileMenuVisible]);

  // 🔐 Permissions (audio-only)
  const ensurePermissions = async () => {
    try {
      const mic = await Audio.requestPermissionsAsync();
      const ok = mic?.status === "granted";
      setHasPerms(ok);
      if (!ok) {
        Alert.alert(
          "Permission required",
          "Microphone permission is needed to record audio.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
      }
      return ok;
    } catch (e) {
      console.warn("permission error", e);
      setHasPerms(false);
      return false;
    }
  };
  const [hasPerms, setHasPerms] = useState<boolean | null>(null);

  useEffect(() => {
    ensurePermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep camera mounted and avoid pause/resume to reduce flicker (no-op now)
  useFocusEffect(
    React.useCallback(() => {
      return () => {};
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  // 🔒 Block Android “Back” while preview/recording to stop accidental navigation
  useEffect(() => {
    const block = () => true;
    let backHandlerSub: { remove: () => void } | undefined;
    if (isFullScreen || isRecording) {
      backHandlerSub = BackHandler.addEventListener("hardwareBackPress", block);
      return () => {
        backHandlerSub?.remove();
      };
    }
  }, [isFullScreen, isRecording]);

  // Timer
  const startTimer = () => {
    recordStartRef.current = Date.now();
    setElapsedSec(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (recordStartRef.current) {
        const s = Math.floor((Date.now() - recordStartRef.current) / 1000);
        setElapsedSec(s);
      }
    }, 500);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recordStartRef.current = null;
  };

  // ===== live_sessions helpers =====
  const createLiveSessionAndReturnId = async (): Promise<string | null> => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id || userId;
      if (!uid) return null;

      const payload = {
        host_id: uid,
        title: module_title ?? "Live Session",
        status: "live" as const,
        viewers: 0,
      };

      const { data, error } = await supabase
        .from("live_sessions")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;
      return data?.id ?? null;
    } catch (e) {
      console.warn("createLiveSession error:", (e as any)?.message || e);
      return null;
    }
  };

  const countParticipants = async (id: string): Promise<number | null> => {
    try {
      const { count } = await supabase
        .from("live_attendances")
        .select("user_id", { count: "exact", head: true })
        .eq("session_id", id);
      return typeof count === "number" ? count : null;
    } catch (e) {
      console.warn("countParticipants error:", (e as any)?.message || e);
      return null;
    }
  };

  const endLiveSession = async (opts: {
    id: string;
    mediaUrl?: string | null;
    durationSec?: number | null;
    participantsCount?: number | null;
  }) => {
    try {
      await supabase
        .from("live_sessions")
        .update({
          status: "ended",
          ...(opts.mediaUrl ? { session_link: opts.mediaUrl } : {}),
          ...(Number.isFinite(opts.durationSec ?? NaN) ? { duration: opts.durationSec } : {}),
          ...(Number.isFinite(opts.participantsCount ?? NaN)
            ? { participants: opts.participantsCount }
            : {}),
        })
        .eq("id", opts.id);
    } catch (e) {
      console.warn("endLiveSession error:", (e as any)?.message || e);
    }
  };

  // Attendance + viewers
  const bumpParticipants = async (delta: number) => {
    if (!sessionId) return;
    try {
      await supabase.rpc("live_sessions_bump_viewers", {
        p_session_id: sessionId,
        p_delta: delta,
      });
    } catch {}
  };

  const markJoined = async () => {
    if (!userId || !sessionId) return;
    try {
      await supabase
        .from("live_attendances")
        .upsert(
          [
            {
              session_id: sessionId,
              user_id: userId,
              joined_at: new Date().toISOString(),
              left_at: null,
            },
          ],
          { onConflict: "session_id,user_id" }
        );
      await bumpParticipants(+1);
    } catch (e) {
      console.warn("attendance join error:", (e as any)?.message || e);
    }
  };

  const markLeft = async () => {
    if (!userId || !sessionId) return;
    try {
      await supabase
        .from("live_attendances")
        .update({ left_at: new Date().toISOString() })
        .eq("session_id", sessionId)
        .eq("user_id", userId);
      await bumpParticipants(-1);
    } catch (e) {
      console.warn("attendance leave error:", (e as any)?.message || e);
    }
  };

  const subscribeViewers = () => {
    if (!sessionId || liveSubRef.current) return;
    liveSubRef.current = supabase
      .channel(`live_sessions:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_sessions", filter: `id=eq.${sessionId}` },
        (payload: any) => {
          const v = payload?.new?.viewers ?? payload?.old?.viewers ?? null;
          if (v !== null) setLiveViewers(v as number);
        }
      )
      .subscribe();
  };
  const unsubscribeViewers = () => {
    if (liveSubRef.current) {
      try {
        supabase.removeChannel(liveSubRef.current);
      } catch {}
      liveSubRef.current = null;
    }
  };

  // AI feedback bridge
  const connectAI = async () => {
    if (aiSubRef.current) return;
    setAiConnected(true);

    aiSubRef.current = supabase
      .channel(`ai_feedback:${userId || "anon"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ai_feedback",
          ...(sessionId
            ? { filter: `session_id=eq.${sessionId}` }
            : userId
            ? { filter: `user_id=eq.${userId}` }
            : {}),
        },
        (payload: any) => {
          const msg = payload?.new?.message as string | undefined;
          if (!msg) return;
          setCurrentFeedback(msg);
          Animated.sequence([
            Animated.timing(feedbackAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.delay(2200),
            Animated.timing(feedbackAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]).start();
        }
      )
      .subscribe();
  };

  const disconnectAI = () => {
    if (aiSubRef.current) {
      try {
        supabase.removeChannel(aiSubRef.current);
      } catch {}
      aiSubRef.current = null;
    }
    setAiConnected(false);
  };

  // ====== AUDIO RECORDING (expo-av) ======
  const startAudioRecording = async () => {
    try {
      const ok = await ensurePermissions();
      if (!ok) return false;

      // Version-safe audio mode setup
      await setAudioModeCompatRecording();

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();

      audioRecordingRef.current = rec;
      setRecordedUri(null);
      setUploadUrl(null);
      setIsRecording(true);
      startTimer();

      // session + AI wiring
      setTimeout(async () => {
        try {
          if (!sessionId) {
            const newId = await createLiveSessionAndReturnId();
            if (newId) setSessionId(newId);
          }
          await markJoined();
          subscribeViewers();
          await connectAI();
        } catch {}
      }, 250);

      return true;
    } catch (e: any) {
      Alert.alert("Audio error", String(e?.message || e));
      setIsRecording(false);
      return false;
    }
  };

  const stopAudioRecording = async () => {
    try {
      const rec = audioRecordingRef.current;
      if (!rec) return null;

      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      audioRecordingRef.current = null;

      stopTimer();
      setIsRecording(false);

      if (uri) {
        setRecordedUri(uri);
        setShowContinueButton(true);
      }

      // relax audio mode
      await setAudioModeCompatIdle();

      return uri;
    } catch (e) {
      stopTimer();
      setIsRecording(false);
      return null;
    }
  };

  // start/stop hook bound to your UI (no-op)
  useEffect(() => {
    if (isFullScreen && isRecording) {
      // already started by handleStartPress
    }
  }, [isFullScreen, isRecording]);

  // ---------- Upload controls ---------- (Expo Go–safe + MIME fallback)
  const uploadRecording = async () => {
    if (!recordedUri) return;
    try {
      setIsUploading(true);

      // speaking uploads go to the ROOT of the "recordings" bucket (not /audio)
      const filename = `speaking-${Date.now()}.m4a`;
      const objectPath = `${filename}`;

      // Read local file as base64 and convert to bytes (fetch(file://) is unreliable on Expo Go)
      const base64 = await FileSystem.readAsStringAsync(recordedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = base64ToUint8Array(base64);
      // Use an ArrayBuffer slice to avoid extra bytes from the underlying buffer
      const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

      // Try with the proper standard MIME for .m4a
      let res = await supabase.storage
        .from("recordings")
        .upload(objectPath, buf as ArrayBuffer, {
          contentType: "audio/mp4", // <-- standard for .m4a
          upsert: false,
        });

      // If the storage returns a MIME-type error, retry with octet-stream
      if (res.error && /mime type .* not supported/i.test(res.error.message || "")) {
        res = await supabase.storage
          .from("recordings")
          .upload(objectPath, buf as ArrayBuffer, {
            contentType: "application/octet-stream",
            upsert: false,
          });
      }

      if (res.error) throw res.error;

      const signed = await supabase.storage
        .from("recordings")
        .createSignedUrl(objectPath, 60 * 60 * 24 * 7);
      if (signed.error) throw signed.error;

      setUploadUrl(signed.data?.signedUrl ?? null);
    } catch (e: any) {
      console.warn("[upload] failed:", e?.message || e);
      Alert.alert(
        "Upload failed",
        "Check your connection and Supabase storage policies for the 'recordings' bucket."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const ensureUploaded = async (): Promise<string | null> => {
    if (uploadUrl) return uploadUrl;
    if (!recordedUri) return null;
    if (!isUploading) {
      await uploadRecording();
    }
    return uploadUrl;
  };

  // when upload URL becomes available, mark session ended
  useEffect(() => {
    (async () => {
      if (!sessionId || !uploadUrl) return;
      const participantsCount = await countParticipants(sessionId);
      await endLiveSession({
        id: sessionId,
        mediaUrl: uploadUrl,
        durationSec: elapsedSec || null,
        participantsCount,
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, uploadUrl]);

  // Leave attendance & cleanup
  useEffect(() => {
    return () => {
      markLeft().finally(() => {
        disconnectAI();
        unsubscribeViewers();
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isFullScreen) {
      markLeft().finally(() => {
        disconnectAI();
        unsubscribeViewers();
      });
    }
  }, [isFullScreen]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  // 🚦 Share to community requires uploaded URL
  const openCreatePost = async () => {
    const url = await ensureUploaded();
    if (!url) {
      Alert.alert("Upload needed", "Please wait while we upload your recording.");
      return;
    }
    pushWithCtx("StudentScreen/SpeakingExercise/create-post", { videoUri: url });
  };

  // ===== sub-components (UI unchanged) =====

  const Header = () => (
    <View className="mt-2">
      <View className="flex-row justify-between items-center mt-4 mb-3 w-full">
        <TouchableOpacity
          className="flex-row items-center px-3 py-2 -ml-3"
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Image
            source={require("../../../assets/Speaksy.png")}
            className="w-10 right-3 h-10 rounded-full"
            resizeMode="contain"
          />
          <Text className="text-white font-bold text-2xl right-5 ml-2">Voclaria</Text>
        </TouchableOpacity>

        <View className="flex-row items-center right-4 space-x-2">
          <TouchableOpacity
            className="p-2 rounded-full bg-white/10 active:bg-white/20"
            onPress={() => handleIconPress("chatbot")}
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
            className="p-2 rounded-full bg-white/10 active:bg-white/20 ml-1"
            onPress={() => handleIconPress("notifications")}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsProfileMenuVisible(true)} activeOpacity={0.7}>
            <Image
              source={avatarUri ? { uri: avatarUri } : PROFILE_PIC}
              className="w-9 h-9 rounded-full border-2 left-3 border-white/80"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const AIFeedback = () => (
    <Animated.View
      className="absolute top-[40%] left-5 right-5 z-10 items-center justify-center"
      style={{
        opacity: feedbackAnim,
        transform: [
          {
            translateY: feedbackAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <Text className="text-white text-lg font-medium text-center bg-black/60 px-4 py-3 rounded-xl">
        {aiConnected ? (currentFeedback || "Analyzing…") : currentFeedback || tips[currentTipIndex]}
      </Text>
    </Animated.View>
  );

  const StatusRow = () => (
    <View className="flex-row justify-between items-center bg-white/10 rounded-xl p-3 mt-3">
      {[
        { title: "Pronunciation", rating: 4.8, trend: "up" },
        { title: "Pace", rating: 3.5, trend: "down" },
        { title: "Confidence", rating: 4.2, trend: "up" },
      ].map((item, idx) => (
        <View key={idx} className="items-center flex-1">
          <Text className="text-white text-xs font-semibold mb-1">{item.title}</Text>
          <View className="flex-row items-center">
            <Text className="text-white font-bold text-sm">{item.rating.toFixed(1)}</Text>
            <Text className="text-gray-400 text-xs ml-0.5">/5.0</Text>
          </View>
          <View className="flex-row items-center mt-1">
            <Ionicons
              name={item.trend === "up" ? "trending-up" : "trending-down"}
              size={12}
              color={item.trend === "up" ? "#00FF00" : "#FF0000"}
            />
            <Text className="text-xs text-gray-400 ml-1">
              {item.trend === "up" ? "Improving" : "Needs work"}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const FullScreenRecording = () => {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        {/* No camera while we prioritize audio; keep same overlays */}
        {hasPerms ? null : (
          <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
            <Text style={{ color: "white" }}>
              Microphone permission not granted. Open Settings and allow access.
            </Text>
          </View>
        )}

        {/* Debug chip (optional) */}
        <View
          style={{
            position: "absolute",
            top: 18,
            alignSelf: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: "white", fontSize: 12 }}>
            audio:{String(isRecording)} | perms:{String(hasPerms)}
            {liveViewers !== null ? ` | viewers:${liveViewers}` : ""}
          </Text>
        </View>

        {/* Top chips + stop/exit button */}
        <View className="absolute top-[60px] right-[24px] flex-row items-center bg-black/50 px-3 py-1.5 rounded-full z-10">
          <Ionicons name="mic" size={16} color="white" style={{ marginRight: 6, marginTop: 2 }} />
          <Text className="text-white text-sm">Microphone Active</Text>
        </View>

        <AIFeedback />

        <View className="absolute top-[60px] left-[24px] bg-black/50 px-3 py-1.5 rounded-full z-10">
          <View className="flex-row items-center">
            <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
            <Text className="text-white text-sm">Recording</Text>
            <Text className="text-white/70 text-sm ml-2">{fmt(elapsedSec)}</Text>
          </View>
        </View>

        {/* Middle button: stop audio & exit to card */}
        <TouchableOpacity
          className="absolute bottom-10 w-[70px] h-[70px] rounded-full bg-white justify-center items-center z-10"
          onPress={async () => {
            await stopAudioRecording();
            setIsFullScreen(false);
          }}
          activeOpacity={0.7}
        >
          <View className="w-[30px] h-[30px] bg-red-500 rounded" />
        </TouchableOpacity>

        {/* Tip chip */}
        <View className="absolute bottom-[120px] flex-row items-center bg-black/50 px-3 py-2 rounded-full z-10">
          <View className="flex-row items-center">
            <Image
              source={require("../../../assets/tips.png")}
              className="w-4 h-4 bottom-0.5 mr-1"
              resizeMode="contain"
            />
            <Text className="text-white text-xs">{tips[currentTipIndex]}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Tabs / active (unchanged)
  const getActiveTab = (): string => {
    if (pathname.includes("StudentScreen/HomePage/home-page")) return "Home";
    if (
      pathname.includes("exercise-speaking") ||
      pathname.includes("basic-contents") ||
      pathname.includes("advanced-contents") ||
      pathname.includes("private-video-recording") ||
      pathname.includes("live-video-recording")
    )
      return "Speaking";
    if (pathname.includes("basic-exercise-reading") || pathname.includes("advance-execise-reading"))
      return "Reading";
    if (pathname.includes("community-selection") || pathname.includes("community")) return "Community";
    return "Speaking";
  };
  const activeTab = getActiveTab();

  const handleCommunitySelect = (option: "Live Session" | "Community Post") => {
    setShowCommunityModal(false);
    if (option === "Live Session") {
      pushWithCtx("/live-sessions-select");
    } else {
      openCreatePost();
    }
  };

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") router.replace("/login-page");
    else if (iconName === "chatbot") router.push("/ButtonIcon/chatbot");
    else if (iconName === "notifications") router.push("/ButtonIcon/notification");
  };

  // 👇 View AI analysis — for audio we still pass local URI and cloud if ready
  const handleViewAIAnalysis = async () => {
    if (!recordedUri) {
      Alert.alert("No recording", "Please record first.");
      return;
    }
    setShowEndSessionModal(false);
    pushWithCtx("/full-results-speaking", {
      local_uri: recordedUri,
      ...(uploadUrl ? { media_url: uploadUrl } : {}),
    });
  };

  // Save to gallery (works with audio files too)
  const downloadVideo = async () => {
    try {
      setIsDownloading(true);

      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        if (Platform.OS === "android" && !canAskAgain) {
          Alert.alert(
            "Permission Required",
            "Storage permission is required to save. Enable it in Settings.",
            [
              { text: "OK", onPress: () => { setIsDownloading(false); setShowEndSessionModal(false); } },
              { text: "Open Settings", onPress: () => { setIsDownloading(false); setShowEndSessionModal(false); Linking.openSettings(); } },
            ]
          );
        } else {
          Alert.alert("Permission Required", "Photos/Media permission is required to save.");
        }
        return;
      }

      if (recordedUri) {
        const asset = await MediaLibrary.createAssetAsync(recordedUri);
        await MediaLibrary.createAlbumAsync("Recordings", asset, false);
        Alert.alert("Success", "Saved to gallery!");
      } else if (uploadUrl) {
        const fileName = `recording-${Date.now()}.m4a`;
        const downloadResult = await FileSystem.downloadAsync(
          uploadUrl,
          FileSystem.documentDirectory + fileName
        );
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        await MediaLibrary.createAlbumAsync("Recordings", asset, false);
        Alert.alert("Success", "Saved to gallery!");
      } else {
        Alert.alert("Nothing to save", "Please record first.");
      }
    } catch (error: any) {
      const msg = error?.message || String(error);
      if (!msg.toLowerCase().includes("permission") && !msg.toLowerCase().includes("denied")) {
        console.error("Error saving:", error);
        Alert.alert("Error", "Failed to save. Please try again.");
      }
    } finally {
      setIsDownloading(false);
      setShowEndSessionModal(false);
    }
  };

  /** Start button — now: fullscreen + start audio recording */
  const handleStartPress = async () => {
    const ok = await ensurePermissions();
    if (!ok) return;

    setIsFullScreen(true);
    // start audio immediately
    await startAudioRecording();
  };

  // 👉 Start upload automatically once when the modal opens (no spam)
  useEffect(() => {
    if (showEndSessionModal && !didAutoUpload) {
      setDidAutoUpload(true);
      if (recordedUri && !uploadUrl && !isUploading) {
        uploadRecording().catch(() => {});
      }
    }
    if (!showEndSessionModal) setDidAutoUpload(false);
  }, [showEndSessionModal, recordedUri, uploadUrl, isUploading, didAutoUpload]);

  return (
    <View className="flex-1 bg-[#0F172A] relative">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <BackgroundDecor />

      <ProfileMenuNew
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        user={{
          name: fullName || "Student",
          email: userEmail || "",
          image: avatarUri ? { uri: avatarUri } : PROFILE_PIC,
        }}
      />

      <EndSessionModal
        visible={showEndSessionModal}
        onDismiss={() => setShowEndSessionModal(false)}
        isDownloading={isDownloading}
        setIsDownloading={setIsDownloading}
        onViewAIAnalysis={handleViewAIAnalysis}
        onDownloadVideo={downloadVideo}
      />

      <LivesessionCommunityModal
        visible={showCommunityModal}
        onDismiss={() => setShowCommunityModal(false)}
        onSelectOption={async (option) => {
          setShowCommunityModal(false);
          if (option === "Live Session") {
            pushWithCtx("/live-sessions-select");
          } else {
            await openCreatePost(); // ensures upload
          }
        }}
      />

      {isFullScreen ? (
        <FullScreenRecording />
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerClassName="pb-20"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View className="pt-2 px-5 z-10">
              <Header />
            </View>

            {/* Main */}
            <View className="flex-1 px-5 w-full max-w-[500px] mx-auto">
              <View className="w-full mb-4">
                <View className="mb-4">
                  <Text className="text-white text-2xl font-bold mb-1">Live Video Recording</Text>
                  <Text className="text-gray-300 text-sm text-justify">
                    Record your Live presentation and receive real-time AI Powered feedback and analysis.
                  </Text>
                </View>
              </View>

              <View className="w-full bg-white/5 rounded-2xl shadow-xl mb-1 overflow-hidden border border-gray-700/30">
                <View className="flex-row items-center justify-between px-4 py-2 bg-gray-800/50">
                  <View className="flex-row items-center space-x-4">
                    <View className="flex-row items-center">
                      <Ionicons name="people" size={14} color="#FFFFFF" />
                      <Text className="text-gray-300 text-xs ml-1">{liveViewers ?? 0}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="mic" size={14} color="#FFFFFF" />
                      <Text className="text-gray-300 text-xs ml-1">Active</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center space-x-1">
                    <View className="flex-row items-center space-x-1">
                      <View className="w-2 h-2 bg-red-500 rounded-full" />
                      <Text className="text-gray-300 text-xs">LIVE</Text>
                    </View>
                  </View>
                </View>

                {/* Video Container (unchanged visual) */}
                <View className="w-full aspect-[4/3] bg-gray-900 border border-white/30 relative items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-black/30">
                  {!isRecording && (
                    <View className="absolute">
                      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity
                          onPress={handleStartPress}
                          className="w-16 h-16 rounded-full items-center justify-center bg-gradient-to-br from-red-600 to-indigo-700 border-2 border-red-500"
                          activeOpacity={0.8}
                        >
                          <Ionicons name="videocam" size={24} color="#FF0000" />
                        </TouchableOpacity>
                      </Animated.View>
                    </View>
                  )}

                  <Text
                    className={`absolute ${isRecording ? "bottom-4" : "bottom-8"} self-center text-white text-xs bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-sm`}
                  >
                    {isRecording ? "Recording in progress" : "Tap to start recording"}
                  </Text>
                </View>

                {showContinueButton && (
                  <View className="w-full px-4 py-3 bg-gray-800/50 flex-row justify-center space-x-4">
                    <TouchableOpacity
                      onPress={() => setShowEndSessionModal(true)}
                      className="bg-violet-600 px-8 py-3 rounded-lg items-center flex-1 max-w-xs"
                    >
                      <Text className="text-white font-semibold">
                        {isUploading && !uploadUrl ? "Uploading…" : "Continue"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setShowContinueButton(false);
                        setRecordedUri(null);
                        setUploadUrl(null);
                      }}
                      className="bg-transparent border border-white/30 px-8 py-3 rounded-lg items-center flex-1 max-w-xs"
                    >
                      <Text className="text-white">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <StatusRow />
            </View>
          </ScrollView>

          <NavigationBar defaultActiveTab="Speaking" />
        </>
      )}
    </View>
  );
}
