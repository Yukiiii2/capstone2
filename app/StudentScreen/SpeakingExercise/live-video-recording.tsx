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
  ActivityIndicator,
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
import Constants from "expo-constants";

/** Live-session helpers (DB logic) */
import {
  createLiveSession,
  subscribeSessionRow,
  markJoined as markJoinedDB,
  markLeft as markLeftDB,
  endLiveSession as endLiveSessionDB,
  countParticipants as countParticipantsDB,
} from "@/lib/livesessions";

/** VisionCamera */
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  CameraCaptureError,
  VideoFile,
  CameraDeviceFormat,
} from "react-native-vision-camera";

/* ---- utils: convert Base64 -> Uint8Array ---- */
const base64ToUint8Array = (base64: string) => {
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

export default function LiveVideoRecording() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();

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
  const [isRecording, setIsRecording] = useState(false);
  const [camKey, setCamKey] = useState(0); // (1) you already added this
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Status chip / viewers
  const [liveStatus, setLiveStatus] = useState<"idle" | "live" | "ended">("idle");
  const [liveViewers, setLiveViewers] = useState<number | null>(null);

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

  // Video recording result
  const [recordedUri, setRecordedUri] = useState<string | null>(null); // .mp4 path
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [didAutoUpload, setDidAutoUpload] = useState(false);

  // Timer
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<any>(null);
  const recordStartRef = useRef<number | null>(null);

  // Tips / feedback
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState("");

  const screenWidth = Dimensions.get("window").width;

  // === VisionCamera setup ===
  const device = useCameraDevice("front"); // front cam for speaking
  const { hasPermission: hasCamPerm, requestPermission: requestCam } = useCameraPermission();
  const { hasPermission: hasMicPerm, requestPermission: requestMic } = useMicrophonePermission();
  const cameraRef = useRef<Camera>(null);

  // format helpers (safe selection + fps only when supported)
  const getFormatResolution = (f: CameraDeviceFormat) => {
    const w = (f as any).videoWidth ?? (f as any).width ?? 0;
    const h = (f as any).videoHeight ?? (f as any).height ?? 0;
    return { w, h };
  };
  const getRanges = (f: CameraDeviceFormat): Array<{ minFrameRate?: number; maxFrameRate?: number }> => {
    const ranges: any = (f as any).frameRateRanges;
    if (Array.isArray(ranges) && ranges.length) return ranges;
    const minFps = (f as any).minFps ?? 0;
    const maxFps = (f as any).maxFps ?? 0;
    return (minFps || maxFps) ? [{ minFrameRate: minFps, maxFrameRate: maxFps }] : [];
  };
  const supportsFps = (f: CameraDeviceFormat, desired: number) =>
    getRanges(f).length ? getRanges(f).some(r => desired >= (r.minFrameRate ?? 1) && desired <= (r.maxFrameRate ?? 120)) : true;

  const preferredFormat = useMemo<CameraDeviceFormat | undefined>(() => {
    if (!device) return undefined;
    const fmts = device.formats ?? [];
    // Prefer exact 1280x720 @ ~30fps
    const exact = fmts
      .filter(f => {
        const { w, h } = getFormatResolution(f);
        return w === 1280 && h === 720 && supportsFps(f, 30);
      })
      .sort((a, b) => {
        const aMax = Math.max(...getRanges(a).map(r => r.maxFrameRate ?? 30), 30);
        const bMax = Math.max(...getRanges(b).map(r => r.maxFrameRate ?? 30), 30);
        if (aMax !== bMax) return aMax - bMax;
        const aw = getFormatResolution(a).w;
        const bw = getFormatResolution(b).w;
        return aw - bw;
      })[0];
    if (exact) return exact;

    // fallback: closest to 720p that supports ~30
    const targetArea = 1280 * 720;
    const closest = fmts
      .map(f => {
        const { w, h } = getFormatResolution(f);
        const area = w * h;
        const diff = Math.abs(area - targetArea);
        return { f, diff };
      })
      .filter(({ f }) => supportsFps(f, 30))
      .sort((a, b) => a.diff - b.diff)[0]?.f;
    return closest ?? fmts[0];
  }, [device]);

  const clampFps = (f: CameraDeviceFormat | undefined, desired: number) => {
    if (!f) return desired;
    const ranges = getRanges(f);
    if (!ranges.length) return desired;
    const mins = ranges.map(r => r.minFrameRate ?? 1);
    const maxs = ranges.map(r => r.maxFrameRate ?? 60);
    const min = Math.min(...mins);
    const max = Math.max(...maxs);
    return Math.min(Math.max(desired, min), max);
  };
  const targetFps = clampFps(preferredFormat, 30);

  // gate: only start after preview is initialized to avoid "no-data"
  const [camReady, setCamReady] = useState(false);
  const [canRecord, setCanRecord] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const hasShownCamError = useRef(false);
  const [autoStartPending, setAutoStartPending] = useState(false);

  // ============ HELPER LOGIC (matches the audio page behavior) ============
  const ensurePermissions = async () => {
    try {
      let camOK = hasCamPerm;
      let micOK = hasMicPerm;
      if (!camOK) camOK = await requestCam();
      if (!micOK) micOK = await requestMic();
      if (!(camOK && micOK)) {
        Alert.alert(
          "Permission required",
          "Camera and Microphone permissions are needed to record.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
      }
      return camOK && micOK;
    } catch (e) {
      console.warn("permission error", e);
      return false;
    }
  };

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

  // ====== VIDEO RECORDING (VisionCamera) ======
  const startVideoRecording = async () => {
    const ok = await ensurePermissions();
    if (!ok) return false;

    // Only once preview is warmed (no alerts, like audio page)
    if (!device || !camReady || !canRecord || isStarting) return false;

    try {
      // session + status
      let id = sessionId;
      if (!id) {
        const s = await createLiveSession(module_title ?? "Live Session");
        if (s?.id) {
          id = s.id;
          setSessionId(s.id);
        }
      }
      if (id) {
        await markJoinedDB(id);
        await supabase.from("live_sessions").update({ status: "live" }).eq("id", id);
        setLiveStatus("live");
        subscribeSessionRow(id, (row) => {
          if (typeof row.viewers === "number") setLiveViewers(row.viewers);
        });
      }

      setRecordedUri(null);
      setUploadUrl(null);
      setIsStarting(true);
      setIsRecording(true);
      startTimer();

      // tiny wait to ensure frames have begun
      await new Promise((r) => setTimeout(r, 120));

      cameraRef.current?.startRecording({
        fileType: "mp4",
        flash: "off",
        onRecordingFinished: async (video: VideoFile) => {
          stopTimer();
          setIsStopping(false);
          setIsStarting(false);
          setIsRecording(false);

          // normalize uri
          const uri = video.path.startsWith("file://") ? video.path : `file://${video.path}`;
          setRecordedUri(uri);

          // show actions on the card like audio flow
          setShowContinueButton(true);

          // mark ended and EXIT fullscreen now (audio-page behavior)
          if (sessionId) {
            await supabase.from("live_sessions").update({ status: "ended" }).eq("id", sessionId);
            setLiveStatus("ended");
          }
          setIsFullScreen(false);            // leave preview
          setCamReady(false);
          setCanRecord(false);
          setCamKey(k => k + 1);             // hard release mic
        },
        onRecordingError: (err: CameraCaptureError) => {
          stopTimer();
          setIsStopping(false);
          setIsStarting(false);
          setIsRecording(false);
          setCamError(err?.message ?? "Recording failed.");
          Alert.alert(
            "Recording error",
            err?.message ||
              "The recording failed. Make sure the camera preview is running and try again."
          );
          // Return to card, keep UX consistent
          setIsFullScreen(false);
          setLiveStatus("idle");
          setCamKey(k => k + 1);             // ensure mic is released on error
        },
      });

      return true;
    } catch (e: any) {
      stopTimer();
      setIsStarting(false);
      setIsRecording(false);
      Alert.alert("Video error", String(e?.message || e));
      return false;
    }
  };

  const stopVideoRecording = async () => {
    if (!cameraRef.current || isStopping) {
      // behave like audio page: even if already stopping, leave fullscreen and reveal actions
      setIsFullScreen(false);
      setShowContinueButton(true);
      setIsRecording(false);
      setCamReady(false);
      setCanRecord(false);
      if (sessionId) {
        await supabase.from("live_sessions").update({ status: "ended" }).eq("id", sessionId);
        setLiveStatus("ended");
      }
      setCamKey(k => k + 1);
      return;
    }

    setIsStopping(true);
    setIsRecording(false);
    try {
      await cameraRef.current.stopRecording();
      // onRecordingFinished moves us back to the card and sets buttons
    } catch {
      // benign “not recording” error
      setIsFullScreen(false);
      setShowContinueButton(true);
      setCamKey(k => k + 1);
    } finally {
      stopTimer();
    }
  };

  // Robust stop + exit (prevents stuck mic/green indicator)
  const stopVideoRecordingAndExit = async () => {
    try {
      if (cameraRef.current) {
        await cameraRef.current.stopRecording();
      }
    } catch (e) {
      // ignore benign "not recording"
    }
    try {
      if (sessionId) {
        await supabase.from("live_sessions").update({ status: "ended" }).eq("id", sessionId);
      }
    } catch {}
    setIsRecording(false);
    setIsFullScreen(false);
    setShowContinueButton(true);
    setLiveStatus("ended");
    setCamKey((k) => k + 1);  // (2) force-unmount to release mic
    stopTimer();
    setCamReady(false);
    setCanRecord(false);
  };

  // ---------- Upload controls (Supabase only) ----------
  const uploadRecording = async () => {
    if (!recordedUri) return;
    try {
      setIsUploading(true);

      const filename = `speaking-${Date.now()}.mp4`;
      const objectPath = `${filename}`;

      const base64 = await FileSystem.readAsStringAsync(recordedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = base64ToUint8Array(base64);
      const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

      let res = await supabase.storage
        .from("recordings")
        .upload(objectPath, buf as ArrayBuffer, {
          contentType: "video/mp4",
          upsert: false,
        });

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

  // when upload URL becomes available, end the session row
  useEffect(() => {
    (async () => {
      if (!sessionId || !uploadUrl) return;
      const participantsCount = await countParticipantsDB(sessionId);
      await endLiveSessionDB(sessionId, {
        session_link: uploadUrl,
        duration: elapsedSec || null,
        participants: participantsCount ?? null,
      });
    })();
  }, [sessionId, uploadUrl, elapsedSec]); // eslint-disable-line

  // Leave attendance & cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        markLeftDB(sessionId);
      }
    };
  }, [sessionId]);

  // ===== UI behavior mirrored from the audio page =====

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

  // Rotate tips (fallback demo feedback)
  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTipIndex((i) => (i + 1) % tips.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

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
  }, [isRecording]);

  // 🔒 Block Android “Back” during recording (same feel as audio)
  useEffect(() => {
    const block = () => true;
    let backHandlerSub: { remove: () => void } | undefined;
    if (isFullScreen && isRecording) {
      backHandlerSub = BackHandler.addEventListener("hardwareBackPress", block);
      return () => {
        backHandlerSub?.remove();
      };
    }
  }, [isFullScreen, isRecording]);

  // Enter fullscreen and auto-start when user taps the card (audio-style flow)
  const handleStartPress = async () => {
    const ok = await ensurePermissions();
    if (!ok) return;
    setShowContinueButton(false);
    setRecordedUri(null);
    setUploadUrl(null);
    setIsFullScreen(true);
    setCamError(null);
    setLiveStatus("idle");
    setAutoStartPending(true); // trigger start in onInitialized (after preview warms)
  };

  // auto-start when preview is warmed (like audio auto-start)
  useEffect(() => {
    const go = async () => {
      if (isFullScreen && camReady && canRecord && autoStartPending && !isRecording && !isStarting) {
        await startVideoRecording();
        setAutoStartPending(false);
      }
    };
    go();
  }, [isFullScreen, camReady, canRecord, autoStartPending, isRecording, isStarting]); // eslint-disable-line

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

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") router.replace("/login-page");
    else if (iconName === "chatbot") router.push("/ButtonIcon/chatbot");
    else if (iconName === "notifications") router.push("/ButtonIcon/notification");
  };

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
        {currentFeedback || tips[currentTipIndex]}
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
    const uiReady = isFullScreen && camReady && canRecord;

    // Build camera props; only set fps when format exists (prevents flicker/errors)
    const common: any = {
  // ❌ no key here
  ref: cameraRef,
  style: StyleSheet.absoluteFill,
  device,
  isActive: isFullScreen,
  video: true,
  audio: true,
  photo: false,
  videoHdr: false,
  enableZoomGesture: true,
  androidPreviewViewType: "texture-view",
  onInitialized: () => {
    setCamError(null);
    setCamReady(true);
    setTimeout(() => setCanRecord(true), 220);
  },
  onError: (e: any) => {
        const code: string = e?.code || "";
        const msg: string = e?.message || "";
        if (
          code.includes("session/invalid-output-configuration") ||
          /invalid[- ]output[- ]configuration/i.test(msg)
        ) {
          setCamError("Switching to a safe camera configuration…");
          setCamReady(false);
          setCanRecord(false);
          setTimeout(() => {
            setCamError(null);
            setCamReady(true);
            setCanRecord(true);
          }, 300);
          return;
        }
        if (code.includes("system/camera-is-restricted")) {
          Alert.alert(
            "Camera restricted",
            Platform.select({
              ios: "Camera is restricted (Screen Time/MDM). Enable it in Settings.",
              android: "Camera is restricted (Work Profile/MDM). Enable it in Settings.",
            }) as string,
            [{ text: "Open Settings", onPress: () => Linking.openSettings() }, { text: "OK" }]
          );
          setIsFullScreen(false);
          return;
        }
        if (!hasShownCamError.current) {
          setCamError(msg || "Camera configuration failed.");
          hasShownCamError.current = true;
          setTimeout(() => (hasShownCamError.current = false), 2000);
        }
        console.warn("Camera error:", e);
      },
    };

    const strict = preferredFormat
  ? { format: preferredFormat, fps: targetFps, videoStabilizationMode: "off" as const }
  : {};


    return (
      <View className="flex-1 bg-black">
        {device ? (
  <Camera
    key={`cam-${camKey}`}   // ✅ key passed directly here
    {...common}
    {...strict}
  />
) : (
  <View
    style={[
      StyleSheet.absoluteFill,
      { alignItems: "center", justifyContent: "center", backgroundColor: "black" },
    ]}
  >
    <ActivityIndicator size="large" />
    <Text style={{ color: "white", marginTop: 12 }}>Loading camera…</Text>
  </View>
)}


        {/* HUD (like audio page) */}
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
            status:{liveStatus} · rec:{String(isRecording)} · ready:{String(camReady && canRecord)}
            {liveViewers !== null ? ` · viewers:${liveViewers}` : ""}
          </Text>
        </View>

        {camError ? (
          <View className="absolute top-[100px] self-center bg-black/60 px-4 py-2 rounded-xl z-10">
            <Text className="text-white text-xs">{camError}</Text>
          </View>
        ) : null}

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
            {currentFeedback || tips[currentTipIndex]}
          </Text>
        </Animated.View>

        {/* Timer chip */}
        <View className="absolute top-[60px] left-[24px] bg-black/50 px-3 py-1.5 rounded-full z-10">
          <View className="flex-row items-center">
            <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
            <Text className="text-white text-sm">{isRecording ? "Recording" : "Ready"}</Text>
            <Text className="text-white/70 text-sm ml-2">
              {String(Math.floor(elapsedSec / 60)).padStart(2, "0")}:
              {String(elapsedSec % 60).padStart(2, "0")}
            </Text>
          </View>
        </View>

        {/* Mic chip */}
        <View className="absolute top-[60px] right-[24px] flex-row items-center bg-black/50 px-3 py-1.5 rounded-full z-10">
          <Ionicons name="mic" size={16} color="white" style={{ marginRight: 6, marginTop: 2 }} />
          <Text className="text-white text-sm">{isRecording ? "Microphone Active" : "Mic Idle"}</Text>
        </View>

        {/* Controls – same “one tap” behavior */}
        {!uiReady ? (
          <>
            <TouchableOpacity
              className="absolute bottom-10 w-[80px] h-[80px] rounded-full bg-white/20 justify-center items-center z-10 self-center"
              activeOpacity={1}
              disabled
            >
              <Ionicons name="videocam" size={30} color="#9ca3af" />
            </TouchableOpacity>
            <View className="absolute bottom-[120px] self-center bg-black/60 px-3 py-2 rounded-full">
              <Text className="text-white text-xs">Initializing camera…</Text>
            </View>
          </>
        ) : isRecording ? (
          <TouchableOpacity
            className="absolute bottom-10 w-[70px] h-[70px] rounded-full bg-white justify-center items-center z-10 self-center"
            onPress={stopVideoRecordingAndExit}  // (3) robust stop+exit
            disabled={isStopping}
            activeOpacity={0.7}
          >
            <View className="w-[30px] h-[30px] bg-red-500 rounded" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="absolute bottom-10 w-[80px] h-[80px] rounded-full bg-white/90 justify-center items-center z-10 self-center"
            onPress={startVideoRecording}
            activeOpacity={0.9}
            disabled={!uiReady || isStarting}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name="videocam" size={30} color="#e11d48" />
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* Tip chip */}
        <View className="absolute bottom-[120px] flex-row items-center bg-black/50 px-3 py-2 rounded-full z-10 self-center">
          <Image
            source={require("../../../assets/tips.png")}
            className="w-4 h-4 bottom-0.5 mr-1"
            resizeMode="contain"
          />
          <Text className="text-white text-xs">{tips[currentTipIndex]}</Text>
        </View>
      </View>
    );
  };

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
      if (!uploadUrl) {
        Alert.alert("Upload needed", "Please wait while we upload your recording.");
        return;
      }
      pushWithCtx("/community-selection", { videoUri: uploadUrl });
    }
  };

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
        const fileName = `recording-${Date.now()}.mp4`;
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

  // auto-upload once when modal opens (no spam)
  useEffect(() => {
    if (showEndSessionModal && !didAutoUpload) {
      setDidAutoUpload(true);
      if (recordedUri && !uploadUrl && !isUploading) {
        uploadRecording().catch(() => {});
      }
    }
    if (!showEndSessionModal) setDidAutoUpload(false);
  }, [showEndSessionModal, recordedUri, uploadUrl, isUploading, didAutoUpload]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  return (
    <View className="flex-1 bg-[#0F172A] relative">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background */}
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

      {/* Profile menu / modals */}
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
                    Record your live presentation and receive real-time AI Powered feedback and analysis.
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
                      <Text className="text-gray-300 text-xs ml-1">
                        {liveStatus === "live" ? "Live" : liveStatus === "ended" ? "Ended" : "Ready"}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center space-x-1">
                    <View className="flex-row items-center space-x-1">
                      <View className="w-2 h-2 bg-red-500 rounded-full" />
                      <Text className="text-gray-300 text-xs">LIVE</Text>
                    </View>
                  </View>
                </View>

                {/* Preview placeholder + start */}
                <View className="w-full aspect-[4/3] bg-gray-900 border border-white/30 relative items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-black/30">
                  <View className="absolute">
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                      <TouchableOpacity
                        onPress={handleStartPress}
                        className="w-16 h-16 rounded-full items-center justify-center"
                        activeOpacity={0.8}
                        style={{
                          backgroundColor: "rgba(255,255,255,0.08)",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.25)",
                        }}
                      >
                        <Ionicons name="videocam" size={24} color="#FF5A5F" />
                      </TouchableOpacity>
                    </Animated.View>
                  </View>

                  <Text className="absolute bottom-8 self-center text-white text-xs bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-sm">
                    Tap to start recording
                  </Text>
                </View>

                {showContinueButton && (
                  <View className="w-full px-4 py-3 bg-gray-800/50 flex-row justify-center space-x-4">
                    <TouchableOpacity
                      onPress={() => {
                        if (recordedUri && !uploadUrl && !isUploading) uploadRecording().catch(() => {});
                        setShowEndSessionModal(true);
                      }}
                      className="bg-violet-600 px-8 py-3 rounded-lg items-center flex-1 max-w-xs"
                      disabled={!recordedUri || isUploading}   // (4) wait until file path exists
                    >
                      <Text className="text-white font-semibold">
                        {!recordedUri
                          ? "Finalizing…"
                          : (isUploading && !uploadUrl)
                          ? "Uploading…"
                          : "Continue"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setShowContinueButton(false);
                        setRecordedUri(null);
                        setUploadUrl(null);
                        setLiveStatus("idle");
                      }}
                      className="bg-transparent border border-white/30 px-8 py-3 rounded-lg items-center flex-1 max-w-xs"
                    >
                      <Text className="text-white">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View className="flex-1">
                <View className="flex-row justify-between items-center bg-white/10 rounded-xl p-3 mt-3">
                  {[
                    { title: "Pronunciation", rating: 4.8, trend: "up" },
                    { title: "Pace", rating: 3.5, trend: "down" },
                    { title: "Confidence", rating: 4.2, trend: "up" },
                  ].map((item, idx) => (
                    <View key={idx} className="items-center flex-1">
                      <Text className="text-white text-xs font-semibold mb-1">{item.title}</Text>
                      <View className="flex-row items-center">
                        <Text className="text-white font-bold text-sm">
                          {item.rating.toFixed(1)}
                        </Text>
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
              </View>
            </View>
          </ScrollView>

          <NavigationBar defaultActiveTab="Speaking" />
        </>
      )}
    </View>
  );
}
