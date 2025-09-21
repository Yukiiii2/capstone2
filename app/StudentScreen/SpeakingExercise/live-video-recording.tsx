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
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname, useLocalSearchParams } from "expo-router";
import ProfileMenuNew from "../../../components/ProfileModal/ProfileMenuNew";
import EndSessionModal from "../../../components/StudentModal/EndSessionModal";
import LivesessionCommunityModal from "../../../components/StudentModal/LivesessionCommunityModal";

import { supabase } from "@/lib/supabaseClient";

/** SDK 50/51: CameraView is the JSX component; Camera hosts the permission APIs */
import { Camera, CameraView, type CameraType } from "expo-camera";

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

  // ========= Capture lesson/module context from router =========
  const normalizeParam = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const module_id = normalizeParam(params.module_id);
  const module_title = normalizeParam(params.module_title);
  const level = normalizeParam(params.level);
  const display = normalizeParam(params.display); // visual 1..N you passed

  // Accept either ?session or ?session_id
  const routeSessionId =
    normalizeParam(params.session) || normalizeParam(params.session_id) || null;

  // Pack in one place so we never forget anything when navigating
  const moduleCtx = useMemo(
    () => ({
      ...(module_id ? { module_id } : {}),
      ...(module_title ? { module_title } : {}),
      ...(level ? { level } : {}),
      ...(display ? { display } : {}),
    }),
    [module_id, module_title, level, display]
  );

  // Helper: push including module context (no UI change)
  const pushWithCtx = (pathname: string, extra?: Record<string, any>) => {
    router.push({ pathname, params: { ...moduleCtx, ...(extra || {}) } });
  };
  // ================================================================

  // UI state
  const [isRecording, setIsRecording] = useState(false);
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

  // Animations
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Camera + recording
  const cameraRef = useRef<CameraView | null>(null);
  const [isCamReady, setIsCamReady] = useState(false);
  const [hasPerms, setHasPerms] = useState<boolean | null>(null);
  const recordPromiseRef = useRef<Promise<any> | null>(null);

  // Robust mounting/retry
  const [camKey, setCamKey] = useState(0);
  const [facing, setFacing] = useState<"front" | "back">("front");
  const retryGuardRef = useRef<NodeJS.Timeout | null>(null);

  // Resulting file + upload
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Timer
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<any>(null);
  const recordStartRef = useRef<number | null>(null);

  // Tips / feedback
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState("");
  const [aiConnected, setAiConnected] = useState(false);
  const aiSubRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Live session viewers (subscribe to live_sessions changes)
  const [liveViewers, setLiveViewers] = useState<number | null>(null);
  const liveSubRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const screenWidth = Dimensions.get("window").width;

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

      // resolve signed avatar
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
    if (isRecording) {
      setIsFullScreen(true);
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulseLoopRef.current.start();

      const feedbackInterval = setInterval(() => {
        if (aiConnected) return;
        const randomIndex = Math.floor(Math.random() * feedbackMessages.length);
        setCurrentFeedback(feedbackMessages[randomIndex]);
        Animated.sequence([
          Animated.timing(feedbackAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.delay(3000),
          Animated.timing(feedbackAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
      }, 4000);

      return () => clearInterval(feedbackInterval);
    } else {
      if (pulseLoopRef.current) {
        try {
          pulseLoopRef.current.stop();
        } catch {}
        pulseLoopRef.current = null;
      }
      setIsFullScreen(false);
      pulseAnim.setValue(1);
      setCurrentFeedback("");
      Animated.timing(feedbackAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
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

  // Permissions (+ probe camera types to pick a working lens on Android)
  const ensurePermissions = async () => {
    try {
      const cam = await Camera.requestCameraPermissionsAsync();
      const mic = await Camera.requestMicrophonePermissionsAsync();
      const granted = cam.status === "granted" && mic.status === "granted";
      setHasPerms(granted);
      if (!granted) {
        Alert.alert(
          "Permission required",
          "Camera and microphone permissions are needed to record.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }

      // Fallback to a camera type that actually exists (workaround for some Androids)
      try {
        const types: CameraType[] | undefined =
          (Camera as any)?.getAvailableCameraTypesAsync
            ? await (Camera as any).getAvailableCameraTypesAsync()
            : undefined;
        if (types && !types.includes("front")) setFacing("back");
      } catch {
        // ignore if API not present
      }

      return true;
    } catch (e) {
      console.warn("permission error", e);
      setHasPerms(false);
      return false;
    }
  };

  // Ask permissions once when screen mounts (so preview can show)
  useEffect(() => {
    ensurePermissions();
  }, []);

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
    }, 250);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recordStartRef.current = null;
  };

  // ===== Attendance + viewers =====
  const bumpParticipants = async (delta: number) => {
    if (!routeSessionId) return;
    try {
      await supabase.rpc("live_sessions_bump_viewers", {
        p_session_id: routeSessionId,
        p_delta: delta,
      });
    } catch {
      // optional
    }
  };

  const markJoined = async () => {
    if (!userId || !routeSessionId) return;
    try {
      await supabase
        .from("live_attendances")
        .upsert(
          [
            {
              session_id: routeSessionId,
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
    if (!userId || !routeSessionId) return;
    try {
      await supabase
        .from("live_attendances")
        .update({ left_at: new Date().toISOString() })
        .eq("session_id", routeSessionId)
        .eq("user_id", userId);
      await bumpParticipants(-1);
    } catch (e) {
      console.warn("attendance leave error:", (e as any)?.message || e);
    }
  };

  // Realtime viewers subscription
  const subscribeViewers = () => {
    if (!routeSessionId || liveSubRef.current) return;
    liveSubRef.current = supabase
      .channel(`live_sessions:${routeSessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "live_sessions", filter: `id=eq.${routeSessionId}` },
        (payload: any) => {
          // IMPORTANT: read the correct column name; prefer `viewers`
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

  // ===== AI feedback bridge =====
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
          ...(routeSessionId
            ? { filter: `session_id=eq.${routeSessionId}` }
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
            Animated.delay(3000),
            Animated.timing(feedbackAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
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

  // Start / Stop recording
  const startRecordingInternal = async () => {
    try {
      if (!(await ensurePermissions())) return;
      if (!isCamReady) return; // extra guard: only record when camera is ready

      setRecordedUri(null);
      setUploadUrl(null);

      await markJoined();
      subscribeViewers();
      await connectAI();

      if (cameraRef.current) {
        recordPromiseRef.current = (cameraRef.current as any).recordAsync({
          maxDuration: 600,
          videoQuality: "1080p",
          isMuted: false,
        });

        startTimer();

        recordPromiseRef.current
          ?.then((video) => {
            stopTimer();
            const uri = video?.uri as string | undefined;
            if (uri) setRecordedUri(uri);
            setShowContinueButton(true);
          })
          .catch(() => {
            stopTimer();
          });
      }
    } catch (e: any) {
      console.warn("record start error:", e?.message || e);
      stopTimer();
    }
  };

  const stopRecordingInternal = async () => {
    try {
      cameraRef.current?.stopRecording();
    } catch {}
  };

  // Robust auto-start on mount when recording view opens
  useEffect(() => {
    if (!isRecording || !isFullScreen) return;

    if (!isCamReady) {
      if (retryGuardRef.current) clearTimeout(retryGuardRef.current);
      retryGuardRef.current = setTimeout(() => {
        setCamKey((k) => k + 1); // remount once
        retryGuardRef.current = setTimeout(() => {
          setFacing((f) => (f === "front" ? "back" : "front"));
          setCamKey((k) => k + 1); // remount again
          setTimeout(() => {
            setFacing("front");
            setCamKey((k) => k + 1);
          }, 600);
        }, 2200);
      }, 2200);
      return () => {
        if (retryGuardRef.current) {
          clearTimeout(retryGuardRef.current);
          retryGuardRef.current = null;
        }
      };
    }

    (async () => {
      try {
        const ok = await ensurePermissions();
        if (!ok) return;
        if (retryGuardRef.current) {
          clearTimeout(retryGuardRef.current);
          retryGuardRef.current = null;
        }
        await startRecordingInternal();
      } catch {}
    })();

    return () => {
      if (retryGuardRef.current) {
        clearTimeout(retryGuardRef.current);
        retryGuardRef.current = null;
      }
    };
  }, [isRecording, isFullScreen, isCamReady]);

  // Upload to Supabase — bucket 'recordings', path '<uid>/<filename>.mp4'
  const uploadRecording = async () => {
    if (!recordedUri) return;
    try {
      setIsUploading(true);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id || "anonymous";
      const filename = `recording-${Date.now()}.mp4`;
      const objectPath = `${uid}/${filename}`;

      const resp = await fetch(recordedUri);
      const blob = await resp.blob();

      const { error: upErr } = await supabase.storage
        .from("recordings")
        .upload(objectPath, blob, {
          cacheControl: "3600",
          contentType: "video/mp4",
          upsert: false,
        });
      if (upErr) throw upErr;

      const { data: signed, error: linkErr } = await supabase.storage
        .from("recordings")
        .createSignedUrl(objectPath, 60 * 60 * 24 * 7); // 7 days
      if (linkErr) throw linkErr;

      setUploadUrl(signed?.signedUrl ?? null);
    } catch (e: any) {
      console.warn("upload error:", e?.message || e);
      Alert.alert("Upload failed", "Could not upload the recording right now.");
    } finally {
      setIsUploading(false);
    }
  };

  // Auto-upload once the modal opens after stopping
  useEffect(() => {
    if (showEndSessionModal && recordedUri && !uploadUrl && !isUploading) {
      uploadRecording().catch(() => {});
    }
  }, [showEndSessionModal, recordedUri, uploadUrl, isUploading]);

  // Leave attendance & cleanup
  useEffect(() => {
    return () => {
      markLeft().finally(() => {
        disconnectAI();
        unsubscribeViewers();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!isFullScreen) {
      markLeft().finally(() => {
        disconnectAI();
        unsubscribeViewers();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullScreen]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  // ===== sub-components =====

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

  const FullScreenRecording = () => (
    <View className="flex-1 bg-black justify-center items-center">
      {hasPerms ? (
        // HARDENED: only render CameraView when permissions exist; removed useCamera2Api
        <CameraView
          key={`cam-${camKey}-${facing}`}
          ref={(r) => {
            cameraRef.current = r;
          }}
          style={StyleSheet.absoluteFill}
          facing={facing}
          onCameraReady={() => setIsCamReady(true)}
          onMountError={(err) => {
            const msg = (err as any)?.message ?? (err as any)?.nativeEvent?.message ?? String(err);
            console.warn("CameraView onMountError:", msg);
            setCamKey((k) => k + 1); // quick recovery remount
          }}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
          <Text style={{ color: "white" }}>
            Camera permission not granted. Open Settings and allow access.
          </Text>
        </View>
      )}

      {/* Debug chip */}
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
          perms:{String(hasPerms)} | ready:{String(isCamReady)}
          {liveViewers !== null ? ` | viewers:${liveViewers}` : ""}
        </Text>
      </View>

      <View className="absolute top-[60px] right-[24px] flex-row items-center bg-black/50 px-3 py-1.5 rounded-full z-10">
        <Ionicons name="camera" size={16} color="white" style={{ marginRight: 6, marginTop: 2 }} />
        <Text className="text-white text-sm">Front Camera</Text>
      </View>

      <AIFeedback />

      <View className="absolute top-[60px] left-[24px] bg-black/50 px-3 py-1.5 rounded-full z-10">
        <View className="flex-row items-center">
          <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
          <Text className="text-white text-sm">Recording</Text>
          <Text className="text-white/70 text-sm ml-2">{fmt(elapsedSec)}</Text>
        </View>
      </View>

      <TouchableOpacity
        className="absolute bottom-10 w-[70px] h-[70px] rounded-full bg-white justify-center items-center z-10"
        onPress={() => {
          stopRecordingInternal().finally(() => {
            setIsRecording(false);
            setShowContinueButton(true);
          });
        }}
        activeOpacity={0.7}
      >
        <View className="w-[30px] h-[30px] bg-red-500 rounded" />
      </TouchableOpacity>

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

  // Tabs / active
  const getActiveTab = (): string => {
    if (pathname.includes("StudentScreen/HomePage/home-page")) return "Home";
    if (
      pathname.includes("exercise-speaking") ||
      pathname.includes("basic-contents") ||
      pathname.includes("advanced-contents") ||
      pathname.includes("private-video-recording") ||
      pathname.includes("live-video-recording") // include this screen
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
      pushWithCtx("/community-selection");
    }
  };

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") router.replace("/login-page");
    else if (iconName === "chatbot") router.push("/ButtonIcon/chatbot");
    else if (iconName === "notifications") router.push("/ButtonIcon/notification");
  };

  const handleViewAIAnalysis = () => {
    setShowEndSessionModal(false);
    pushWithCtx("/full-results-speaking", uploadUrl ? { media_url: uploadUrl } : {});
  };

  // Save to gallery
  const downloadVideo = async () => {
    try {
      setIsDownloading(true);

      // Cross-platform Photos permission (iOS + Android)
      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        if (Platform.OS === "android" && !canAskAgain) {
          Alert.alert(
            "Permission Required",
            "Storage permission is required to save videos. Enable it in Settings.",
            [
              {
                text: "OK",
                onPress: () => {
                  setIsDownloading(false);
                  setShowEndSessionModal(false);
                },
              },
              {
                text: "Open Settings",
                onPress: () => {
                  setIsDownloading(false);
                  setShowEndSessionModal(false);
                  Linking.openSettings();
                },
              },
            ]
          );
        } else {
          Alert.alert("Permission Required", "Photos permission is required to save videos.");
        }
        return;
      }

      if (recordedUri) {
        const asset = await MediaLibrary.createAssetAsync(recordedUri);
        await MediaLibrary.createAlbumAsync("Recordings", asset, false);
        Alert.alert("Success", "Video saved to gallery!");
      } else if (uploadUrl) {
        const fileName = `recording-${Date.now()}.mp4`;
        const downloadResult = await FileSystem.downloadAsync(
          uploadUrl,
          FileSystem.documentDirectory + fileName
        );
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        await MediaLibrary.createAlbumAsync("Recordings", asset, false);
        Alert.alert("Success", "Video saved to gallery!");
      } else {
        Alert.alert("No recording", "Please record a video first.");
      }
    } catch (error: any) {
      const msg = error?.message || String(error);
      if (!msg.toLowerCase().includes("permission") && !msg.toLowerCase().includes("denied")) {
        console.error("Error saving video:", error);
        Alert.alert("Error", "Failed to save video. Please try again.");
      }
    } finally {
      setIsDownloading(false);
      setShowEndSessionModal(false);
    }
  };

  /** Start button: request perms, then open full-screen + recording (tiny delay helps Android bind surfaces) */
  const handleStartPress = async () => {
    const ok = await ensurePermissions();
    if (!ok) return;

    setIsCamReady(false);
    setFacing("front");
    setIsRecording(true);

    setTimeout(() => {
      setIsFullScreen(true);
      setCamKey((k) => k + 1);
    }, 120);
  };

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
        onSelectOption={handleCommunitySelect}
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

                {/* Video Container */}
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
                        {isUploading ? "Uploading..." : "Continue"}
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
