// app/StudentsScreen/SpeakingExercise/private-video-recording.tsx
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
import EndSessionModal from "../../../components/StudentModal/EndSessionModal";
import LivesessionCommunityModal from "../../../components/StudentModal/LivesessionCommunityModal";
import CompletionModal from "@/components/StudentModal/CompletionModal"; // ✅ add the completion modal
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "@/lib/supabaseClient";

// ⬇️ keep-awake + orientation (match Live)
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import * as ScreenOrientation from "expo-screen-orientation";

// ⬇️ Vision Camera (match Live)
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  VideoFile,
} from "react-native-vision-camera";

// ✅ bring back expo-av for AI audio sidecar (UNTOUCHED logic relies on this)
import { Audio } from "expo-av";
import axios from "axios";

/* ---- Base64 -> Uint8Array (kept, used for uploads if needed) ---- */
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

export default function PrivateVideoRecording() {
  // ===== Router + module/lesson context (same pattern as live) =====
  const params = useLocalSearchParams();
  const lessonPrompt = params.lessonPrompt as string;
  const topic = params.topic as string;
  const criteria = params.criteria as string;
  const generatedScript = (params.generatedScript as string) || "No script available.";
  const [feedback, setFeedback] = useState(null);
  const [cameraRef, setCameraRef] = useState<React.RefObject<typeof Camera> | null>(null); // unused now but kept to preserve structure
  const [cameraType, setCameraType] = useState<"front" | "back">("front"); // kept
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isEndSessionModalVisible, setIsEndSessionModalVisible] = useState(true);
  const [isCompletionModalVisible, setIsCompletionModalVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showGeneratedScript, setShowGeneratedScript] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const normalizeParam = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const module_id = normalizeParam(params.module_id);
  const module_title_raw = normalizeParam(params.module_title);
  const level = normalizeParam(params.level);
  const display = normalizeParam(params.display);

  const module_title = module_title_raw
    ? (() => {
        try {
          return decodeURIComponent(module_title_raw);
        } catch {
          return module_title_raw;
        }
      })()
    : undefined;

  const moduleCtx = useMemo(
    () => ({
      ...(module_id ? { module_id } : {}),
      ...(module_title ? { module_title } : {}),
      ...(level ? { level } : {}),
      ...(display ? { display } : {}),
    }),
    [module_id, module_title, level, display]
  );
  const pushWithCtx = (pathname: string, extra?: Record<string, any>) => {
    router.push({ pathname, params: { ...moduleCtx, ...(extra || {}) } });
  };

  // ===== UI state =====
  const [isRecording, setIsRecording] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState("");

  // ✅ completion modal state (same as live-video-recording)
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultsPrompt, setShowResultsPrompt] = useState(false);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [expectedText, setExpectedText] = useState<string | null>(null);

  // ====== AI logic state (UNTOUCHED) ======
  

  // avatar
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // ===== Animations =====
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  // ===== Timer (mm:ss like live) =====
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<any>(null);
  const formatTime = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60).toString().padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  const startTimer = () => {
    if (timerRef.current) return;
    const started = Date.now();
    setElapsedMs(0);
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - started);
    }, 200);
  };
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ===== Vision Camera setup (match Live) =====
  const cameraRefVC = useRef<Camera>(null);

  const deviceFront = useCameraDevice("front");
  const deviceBack = useCameraDevice("back");
  const [useBack, setUseBack] = useState(false);
  const device = useBack ? deviceBack : deviceFront;

  // stable format chooser (same heuristic as live)
  const stableFormat = React.useMemo(() => {
    if (!device) return undefined;
    const formats = device.formats ?? [];

    const pickFps = (range?: any) => {
      if (!range) return 30;
      const minFps = typeof range.minFps === "number" ? range.minFps : 15;
      const maxFps = typeof range.maxFps === "number" ? range.maxFps : 30;
      if (minFps <= 30 && 30 <= maxFps) return 30;
      const mid = (minFps + maxFps) / 2;
      return Math.round(Math.abs(mid - 30) < Math.abs(maxFps - 30) ? mid : maxFps);
    };

    const scored = formats.map((f) => {
      const w = (f as any).videoWidth ?? 0;
      const h = (f as any).videoHeight ?? 0;
      const area = w * h;
      const areaDelta = Math.abs(area - 1280 * 720); // prefer ~720p
      const fps = pickFps((f as any).frameRateRanges?.[0]);
      const fpsDelta = Math.abs(fps - 30);
      const supportsVideoStabilization = (f as any)?.supportsVideoStabilization ?? false;
      const score = areaDelta * 1.0 + fpsDelta * 500 - (supportsVideoStabilization ? 200 : 0);
      return { f, score };
    });

    scored.sort((a, b) => a.score - b.score);
    return (scored[0]?.f as any) ?? (formats[0] as any);
  }, [device]);

  // Always keep audio enabled (like Live)
  const [audioEnabled] = useState(true);

  // permissions via Vision Camera (like Live)
  const { hasPermission: hasCamPerm, requestPermission: reqCam } = useCameraPermission();
  const { hasPermission: hasMicPerm, requestPermission: reqMic } = useMicrophonePermission();

  useEffect(() => {
    (async () => {
      try { if (!hasCamPerm) await reqCam(); } catch {}
      try { if (!hasMicPerm) await reqMic(); } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // mount camera when we have device + perms (don’t block on format)
  const [mountCamera, setMountCamera] = useState(false);
  useEffect(() => {
    setMountCamera(!!device && !!hasCamPerm && !!hasMicPerm);
  }, [device, hasCamPerm, hasMicPerm]);

  // AppState awareness
  const appStateRef = useRef(AppState.currentState);
  const [appActive, setAppActive] = useState(true);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      appStateRef.current = next;
      setAppActive(next === "active");
    });
    return () => sub.remove();
  }, []);

  // Recording state
  const [recordedVideoPath, setRecordedVideoPath] = useState<string | null>(null);

  // readiness gating
  const [cameraReady, setCameraReady] = useState(false);
  const [pendingStart, setPendingStart] = useState(false);

  // guards + watchdog (match Live)
  const shuttingDownRef = useRef(false);
  const initWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initAttemptsRef = useRef(0);
  const [camKey, setCamKey] = useState(0);

  const startInitWatchdog = () => {
    if (initWatchdogRef.current) clearTimeout(initWatchdogRef.current);
    initWatchdogRef.current = setTimeout(() => {
      if (!cameraReady) {
        console.warn("[PrivateRec] init watchdog: still not ready after 3000ms, attempt:", initAttemptsRef.current);
        if (initAttemptsRef.current === 0) {
          initAttemptsRef.current = 1;
          setCamKey((k) => k + 1); // one-time remount
          startInitWatchdog();
        } else {
          Alert.alert(
            "Camera slow to start",
            "We’re having trouble starting the camera. Close other camera apps and try again."
          );
          setIsFullScreen(false);
        }
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (initWatchdogRef.current) clearTimeout(initWatchdogRef.current);
    };
  }, []);

  // ⬇️ Fallback: if preview is active in fullscreen but onInitialized never fires,
  // flip the UI to "Ready" after ~900ms so the button isn't stuck.
  useEffect(() => {
    if (!isFullScreen || !mountCamera || !device || cameraReady || !appActive) return;
    const t = setTimeout(() => {
      if (isFullScreen && appActive && !cameraReady) {
        setCameraReady(true);
      }
    }, 900);
    return () => clearTimeout(t);
  }, [isFullScreen, mountCamera, device, appActive, cameraReady, camKey]);

  // reset flags & timer when leaving fullscreen
  useEffect(() => {
    if (!isFullScreen) {
      setCameraReady(false);
      setPendingStart(false);
      stopTimer();
      setElapsedMs(0);
      shuttingDownRef.current = false;
      initAttemptsRef.current = 0;
      if (initWatchdogRef.current) {
        clearTimeout(initWatchdogRef.current);
        initWatchdogRef.current = null;
      }
    }
  }, [isFullScreen]);

  // keep-awake + lock orientation
  useEffect(() => {
    const enable = async () => {
      try { await activateKeepAwakeAsync("private-rec"); } catch {}
      try { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); } catch {}
    };
    const disable = () => {
      try { deactivateKeepAwake("private-rec"); } catch {}
      (async () => { try { await ScreenOrientation.unlockAsync(); } catch {} })();
    };

    if (isFullScreen || isRecording) enable();
    else disable();

    return () => { disable(); };
  }, [isFullScreen, isRecording]);

  // ===== Profile + avatar (kept) =====
  const [fullName, setFullName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user || !mounted) return;

      setUserEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, name")
        .eq("id", user.id)
        .single();

      const stored = profile?.avatar_url?.toString() || user.id;
      const normalized = stored.replace(/^avatars\//, "");
      let objectPath: string | null = null;
      if (/\.[a-zA-Z0-9]+$/.test(normalized)) objectPath = normalized;
      else {
        const { data: list } = await supabase.storage
          .from("avatars")
          .list(normalized, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
        if (list && list.length > 0) objectPath = `${normalized}/${list[0].name}`;
      }
      if (objectPath) {
        const { data: signed } = await supabase
          .storage
          .from("avatars")
          .createSignedUrl(objectPath, 3600);
        if (mounted) setAvatarUri(signed?.signedUrl ?? null);
      }
      if (mounted) setFullName((profile?.name ?? user.email ?? "").trim());
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ===== Tips rotation =====
  useEffect(() => {
    const t = setInterval(() => {
      setCurrentTipIndex((i) => (i + 1) % tips.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // ===== Recording animations (kept feel) =====
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let feedbackInterval: any = null;

    if (isRecording) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      loop.start();

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
      try { /* @ts-ignore */ loop?.stop?.(); } catch {}
      if (feedbackInterval) clearInterval(feedbackInterval);
    };
  }, [isRecording]);

  // ===== Profile menu animation =====
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

  // 🔐 Permissions helper (Vision Camera) + expo-av mic for sidecar
  const ensurePermissions = async () => {
    try {
      let cam = hasCamPerm;
      let mic = hasMicPerm;
      if (!cam) cam = await reqCam();
      if (!mic) mic = await reqMic();

      const micPermission = await Audio.requestPermissionsAsync();
      const ok = !!cam && !!mic && micPermission?.status === "granted";

      if (!ok) {
        Alert.alert(
          "Permission required",
          "Camera and microphone permissions are needed to record video.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings?.() },
          ]
        );
        return false;
      }
      return true;
    } catch (e) {
      console.warn("Permission error", e);
      return false;
    }
  };

  useEffect(() => {
    ensurePermissions();
  }, []);

  // Focus effect (no-op here but keeps parity with live)
  useFocusEffect(
    React.useCallback(() => {
      return () => {};
    }, [])
  );

  // 🔒 Block Android back during fullscreen/recording
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

  // ====================== AI AUDIO SIDECAR (UNTOUCHED LOGIC) ======================
  const audioRecordingRef = useRef<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null); // .m4a
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [didAutoUpload, setDidAutoUpload] = useState(false);

  async function setAudioModeCompatRecording() {
    const A: any = Audio as any;
    const mode: any = {
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    };
    if (A?.InterruptionModeIOS?.DoNotMix != null) {
      mode.interruptionModeIOS = A.InterruptionModeIOS.DoNotMix;
    } else if (A?.INTERRUPTION_MODE_IOS_DO_NOT_MIX != null) {
      mode.interruptionModeIOS = A.INTERRUPTION_MODE_IOS_DO_NOT_MIX;
    }
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

  const startAudioRecording = async () => {
    try {
      const ok = await ensurePermissions();
      if (!ok) return false;

      await setAudioModeCompatRecording();

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();

      audioRecordingRef.current = rec;
      setRecordedUri(null);
      setUploadUrl(null);

      // do not flip global isRecording; camera controls that UI
      return true;
    } catch (e: any) {
      Alert.alert("Audio error", String(e?.message || e));
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

      if (uri) {
        setRecordedUri(uri);

        // *** UNTOUCHED: AI expects a File-like object ***
        const audioFile = {
          uri,
          name: `recording-${Date.now()}.m4a`,
          type: "audio/m4a",
        };
        setSelectedAudioFile(audioFile as any);
      }
      // *** UNTOUCHED: expected text fed to AI ***
      if (generatedScript) {
        setExpectedText(generatedScript);
        console.log("Expected Text Set:", generatedScript);
      }

      await setAudioModeCompatIdle();
      return uri;
    } catch (e) {
      console.error("Error stopping audio recording:", e);
      return null;
    }
  };

  // ---------- Upload (unchanged; .m4a into 'recordings') ----------
  const uploadAudio = async () => {
    if (!recordedUri) return;
    try {
      setIsUploading(true);

      const filename = `private-${Date.now()}.m4a`;
      const objectPath = `${filename}`;

      const base64 = await FileSystem.readAsStringAsync(recordedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = base64ToUint8Array(base64);
      const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

      // try with audio/mp4 (m4a), fallback to octet-stream
      let res = await supabase.storage
        .from("recordings")
        .upload(objectPath, buf as ArrayBuffer, {
          contentType: "audio/mp4",
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

  // auto-upload when end-session modal opens (once)
  useEffect(() => {
    if (showEndSessionModal && !didAutoUpload) {
      setDidAutoUpload(true);
      if (recordedUri && !uploadUrl && !isUploading) {
        uploadAudio().catch(() => {});
      }
    }
    if (!showEndSessionModal) setDidAutoUpload(false);
  }, [showEndSessionModal, recordedUri, uploadUrl, isUploading, didAutoUpload]);

  // ====================== Camera start/stop (now also runs audio sidecar) ======================
  const handleStartPress = async () => {
    const ok = await ensurePermissions();
    if (!ok) return;
    if (!device) {
      Alert.alert("Error", "No camera device available.");
      return;
    }
    setCameraReady(false);
    setPendingStart(true);
    setIsFullScreen(true);
    // start watchdog immediately (match Live)
    startInitWatchdog();
  };

  const startRecordingNow = async () => {
    if (!cameraRefVC.current || !cameraReady || isRecording) return;
    try {
      // start AI audio sidecar BEFORE video
      await startAudioRecording();

      setIsRecording(true);
      startTimer();
      await cameraRefVC.current.startRecording({
        flash: "off",
        onRecordingFinished: async (video: VideoFile) => {
          stopTimer();
          setRecordedVideoPath(video.path ?? null);
          setIsRecording(false);
          setIsFullScreen(false);
          setShowContinueButton(true);

          // stop audio sidecar after video completes
          await stopAudioRecording();
        },
        onRecordingError: async (err) => {
          console.error("Recording error:", err);
          stopTimer();
          setIsRecording(false);
          setIsFullScreen(false);
          setShowContinueButton(false);

          // ensure audio sidecar stopped
          await stopAudioRecording();

          Alert.alert("Recording failed", "Please try again.");
        },
      });
    } catch (err) {
      console.error("startRecording error:", err);
      stopTimer();
      setIsRecording(false);
      setIsFullScreen(false);
      setShowContinueButton(false);

      // ensure audio sidecar stopped
      await stopAudioRecording();
      Alert.alert("Camera not ready", "Please try again.");
    }
  };

  const stopRecording = async () => {
    if (!isRecording) {
      setCameraReady(false);
      setIsFullScreen(false);
      return;
    }
    try {
      shuttingDownRef.current = true;
      setCameraReady(false);
      setIsFullScreen(false);
      await cameraRefVC.current?.stopRecording();
    } catch (e: any) {
      const msg = String(e?.toString?.() ?? e);
      if (!msg.includes("no-recording-in-progress")) {
        console.error("stopRecording error:", e);
      }
    } finally {
      stopTimer();
      setIsRecording(false);
      setShowContinueButton((prev) => prev || !!recordedVideoPath);

      // ensure audio sidecar stopped
      await stopAudioRecording();
    }
  };

  // ---------- Upload (same as Live; .mp4 into 'recordings') ----------
  const uploadRecording = async () => {
    if (!recordedVideoPath) return;
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token =
        sess?.session?.access_token ||
        (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string);
      const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
      if (!token || !SUPABASE_URL) throw new Error("Missing Supabase config");

      const BUCKET = "recordings";
      const objectPath = `private/${Date.now()}.mp4`;
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(
        objectPath
      )}`;

      const res = await FileSystem.uploadAsync(uploadUrl, recordedVideoPath, {
        httpMethod: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: token,
          "Content-Type": "video/mp4",
          "x-upsert": "false",
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });

      if (res.status !== 200 && res.status !== 201) {
        throw new Error(`Upload failed (${res.status}): ${res.body?.slice(0, 160)}`);
      }

      const { data: signed, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(objectPath, 60 * 60 * 24 * 7);
      if (error) throw error;

      Alert.alert("Uploaded", "Signed URL created for your video.");
    } catch (e: any) {
      console.warn("[upload] failed:", e?.message || e);
      Alert.alert(
        "Upload failed",
        "Check your connection and Supabase storage policies for the 'recordings' bucket."
      );
    }
  };

  // ===== Helpers =====
  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  };

  // ===== Sub-components (UI preserved) =====
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
            className="w-10 h-10 right-3 rounded-full"
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

  // ===== Fullscreen "recording" view (camera overlays to match live) =====
  const FullScreenRecording = () => (
    <View className="flex-1 bg-black justify-center items-center">
      {/* Indicator: camera type */}
      <View className="absolute top-[60px] right-[24px] flex-row items-center bg-black/50 px-3 py-1.5 rounded-full z-10">
        <Ionicons name="camera" size={16} color="white" style={{ marginRight: 6, marginTop: 2 }} />
        <Text className="text-white text-sm">{useBack ? "Back Camera" : "Front Camera"}</Text>
      </View>

      {/* Timer / status */}
      <View className="absolute top-[60px] left-[24px] bg-black/50 px-3 py-1.5 rounded-full z-10">
        <View className="flex-row items-center">
          <View
            style={{ opacity: isRecording ? (Math.floor(elapsedMs / 500) % 2 ? 1 : 0.3) : 1 }}
            className="w-2 h-2 bg-red-500 rounded-full mr-2"
          />
        {isRecording ? (
          <>
            <Text className="text-white text-sm">REC</Text>
            <Text className="text-white/90 text-sm ml-6 font-semibold">
              {formatTime(elapsedMs)}
            </Text>
          </>
        ) : (
          <Text className="text-white text-sm">{cameraReady ? "Ready" : "Initializing…"}</Text>
        )}
        </View>
      </View>

      {/* Faux AI/tips */}
      <AIFeedback />

      {/* Generated Script (kept) */}
      {generatedScript && (
        <View className="absolute bottom-[200px] bg-black/50 px-4 py-3 rounded-lg z-10 w-[90%]">
          <Text className="text-white text-lg font-bold text-center">Script:</Text>
          <Text className="text-gray-300 text-base text-center mt-2">{generatedScript}</Text>
        </View>
      )}

      {/* Start/Stop controls */}
      {!isRecording ? (
        <TouchableOpacity
          className="absolute bottom-10 w-[80px] h-[80px] rounded-full bg-white/90 justify-center items-center z-10 self-center"
          onPress={startRecordingNow}
          activeOpacity={0.8}
          disabled={!cameraReady}
        >
          <View
            className="w-[34px] h-[34px] rounded-full"
            style={{ backgroundColor: cameraReady ? "#ef4444" : "#6b7280" }}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          className="absolute bottom-10 w-[80px] h-[80px] rounded-full bg-white justify-center items-center z-10 self-center"
          onPress={stopRecording}
          activeOpacity={0.8}
        >
          <View className="w-[30px] h-[30px] bg-red-500 rounded" />
        </TouchableOpacity>
      )}

      {/* Tip pill */}
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

  // ===== Actions =====
  const handleCommunitySelect = (option: "Live Session" | "Community Post") => {
    setShowCommunityModal(false);
    if (option === "Live Session") pushWithCtx("/live-sessions-select");
    else pushWithCtx("/community-selection");
  };

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") router.replace("/login-page");
    else if (iconName === "chatbot") router.push("/ButtonIcon/chatbot");
    else if (iconName === "notifications") router.push("/ButtonIcon/notification");
  };

  // ===================== AI ANALYSIS (UNTOUCHED CODE) =====================
  const handleViewAIAnalysis = async () => {
    if (!selectedAudioFile) {
      Alert.alert("Error", "No audio file found. Please record a session first.");
      return;
    }

    // Show the CompletionModal and set it to "Processing" state
    setIsCompletionModalVisible(true);
    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("User is not logged in.");
      }

      const token = session.access_token;

      const formData = new FormData();
      formData.append("file", selectedAudioFile as any);
      if (expectedText) formData.append("expected_text", expectedText);
      if (criteria) formData.append("criteria", criteria);

      // Call /process-audio
      const processAudioResponse = await axios.post(
        "https://unbalanceable-lyman-microstomatous.ngrok-free.dev/process-audio",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { transcription, spacy_stats } = processAudioResponse.data;

      // Call /analyze-feedback
      const analyzeFeedbackResponse = await axios.post(
        "https://unbalanceable-lyman-microstomatous.ngrok-free.dev/analyze-feedback",
        {
          speech_text: transcription,
          spacy_stats,
          criteria,
          category: "speaking",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { ai_feedback } = analyzeFeedbackResponse.data;
      setAiFeedback(ai_feedback); // Store the AI feedback
    } catch (error) {
      console.error("Error processing audio or analyzing feedback:", error);
      Alert.alert(
        "Error",
        "An error occurred while processing the audio or analyzing feedback. Please try again."
      );
    } finally {
      setIsProcessing(false); // Stop processing
    }
  };
  // =======================================================================

  // Save to gallery (video)
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
          Alert.alert("Permission Required", "Photos/Media permission is required to save.");
        }
        return;
      }

      if (recordedVideoPath) {
        const asset = await MediaLibrary.createAssetAsync(recordedVideoPath);
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

  // auto-upload trigger when end-session opens (optional)
  useEffect(() => {
    // Kept structure; actual upload is on user action in this screen (Continue -> Upload)
  }, [showEndSessionModal]);

  // ===== GLOBAL CAMERA like Live (single mount, hidden under UI until fullscreen) =====
  const cameraVisible = isFullScreen;
  const cameraActive = cameraVisible && appActive;

  return (
    <View className="flex-1 bg-[#0F172A] relative">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <BackgroundDecor />

     
     

      {mountCamera && device ? (
        <View
          key={camKey}
          pointerEvents={cameraVisible ? "auto" : "none"}
          style={[
            StyleSheet.absoluteFill,
            { zIndex: 5, opacity: cameraVisible ? 1 : 0, backgroundColor: "black" },
          ]}
        >
          <Camera
            ref={cameraRefVC}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={cameraActive}
            video
            audio={audioEnabled}
            photo={false}
            {...(stableFormat ? { format: stableFormat } : {})}
            enableZoomGesture={false}
            onInitialized={() => {
              if (initWatchdogRef.current) {
                clearTimeout(initWatchdogRef.current);
                initWatchdogRef.current = null;
              }
              setTimeout(() => setCameraReady(true), 120);
              if (pendingStart && !isRecording) {
                setPendingStart(false);
                startRecordingNow();
              }
            }}
            onError={(e) => {
              if (shuttingDownRef.current) return;
              console.warn("Camera session error:", e);
              setCameraReady(false);
              if (initWatchdogRef.current) {
                clearTimeout(initWatchdogRef.current);
                initWatchdogRef.current = null;
              }
              Alert.alert(
                "Camera not available",
                "Your device's camera session could not start. Close other camera apps and try again."
              );
              setIsFullScreen(false);
            }}
          />
        </View>
      ) : null}

      <EndSessionModal
        visible={showEndSessionModal}
        onDismiss={() => setShowEndSessionModal(false)}
        isDownloading={isDownloading}
        setIsDownloading={setIsDownloading}
        onViewAIAnalysis={handleViewAIAnalysis}   // ✅ runs your AI pipeline
        onDownloadVideo={downloadVideo}
      />

      {/* ✅ Completion modal that mirrors Live */}
      <CompletionModal
        visible={isCompletionModalVisible}
        showResultsPrompt={showResultsPrompt}
        isProcessing={isProcessing}
        onClose={() => setIsCompletionModalVisible(false)}
        onLater={() => setShowCompletionModal(false)}
        onSeeResults={() => {
          setShowCompletionModal(false);
          router.push({
            pathname: "StudentScreen/SpeakingExercise/full-results-speaking",
            params: { 
              ...moduleCtx,
              ai_feedback: aiFeedback || 'No feedback available', // Add AI feedback to params
              module_id: module_id,
              level: level || 'basic',
            },
          });
        }}
        ai_feedback={aiFeedback}
        module_id={module_id}
        level={level}
        
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
                  <Text className="text-white text-2xl font-bold mb-1">
                    Private Video Recording
                  </Text>
                  <Text className="text-gray-300 text-sm text-justify">
                    Record your presentation and receive real-time AI Powered feedback and analysis.
                  </Text>
                </View>
              </View>

              <View className="w-full bg-white/5 rounded-2xl shadow-xl mb-1 overflow-hidden border border-gray-700/30">
                <View className="flex-row items-center justify-between px-4 py-2 bg-gray-800/50">
                  <View className="flex-row items-center space-x-4">
                    <View className="flex-row items-center">
                      <Ionicons name="mic" size={14} color="#FFFFFF" />
                      <Text className="text-gray-300 text-xs ml-1">Active</Text>
                    </View>
                  </View>
                </View>

                {/* Container (UI unchanged) */}
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
                    className={`absolute ${
                      isRecording ? "bottom-4" : "bottom-8"
                    } self-center text-white text-xs bg-black/60 px-4 py-1.5 rounded-full backdrop-blur-sm`}
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
                        setRecordedVideoPath(null);
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

const styles = StyleSheet.create({});
