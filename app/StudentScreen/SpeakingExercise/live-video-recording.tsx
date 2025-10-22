// app/StudentsScreen/SpeakingExercise/live-video-recording.tsx
import NavigationBar from "../../../components/NavigationBar/nav-bar";
import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import ProfileMenuNew from "../../../components/ProfileModal/ProfileMenuNew";
import EndSessionModal from "../../../components/StudentModal/EndSessionModal";
import LivesessionCommunityModal from "../../../components/StudentModal/LivesessionCommunityModal";
import CompletionModal from "@/components/StudentModal/CompletionModal";

// ⬇️ keep-awake + orientation
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import * as ScreenOrientation from "expo-screen-orientation";

// ⬇️ Vision Camera
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  VideoFile,
} from "react-native-vision-camera";

// ⬇️ Supabase (logic only; UI unchanged)
import { supabase } from "@/lib/supabaseClient";

// Constants
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

  // opening camera: state holders for recording and fullscreen UI
  const [isRecording, setIsRecording] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [recordedVideoPath, setRecordedVideoPath] = useState<string | null>(null);
  const cameraRef = useRef<Camera>(null);

  // opening camera: readiness flags used to auto-start when <Camera/> finishes init
  const [cameraReady, setCameraReady] = useState(false);
  const [pendingStart, setPendingStart] = useState(false);

  // output: simple on-screen timer during capture
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

  // opening camera: pick devices (front preferred, back fallback)
  const deviceFront = useCameraDevice("front");
  const deviceBack = useCameraDevice("back");
  const [useBack, setUseBack] = useState(false);
  const device = useBack ? deviceBack : deviceFront;

  // ===== Stable, fixed format selection (choose once and never change) =====
  const stableFormat = React.useMemo(() => {
    if (!device) return undefined;
    const formats = device.formats ?? [];

    // helper: pick an fps from a range that's closest to 30
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
      // lower score is better; stabilize streams preferred slightly
      const score = areaDelta * 1.0 + fpsDelta * 500 - (supportsVideoStabilization ? 200 : 0);
      return { f, score };
    });

    scored.sort((a, b) => a.score - b.score);
    return (scored[0]?.f as any) ?? (formats[0] as any);
  }, [device]);

  // Always keep audio enabled to avoid session restarts later
  const [audioEnabled] = useState(true);

  // opening camera: permissions (request both up-front!)
  const { hasPermission: hasCamPerm, requestPermission: reqCam } = useCameraPermission();
  const { hasPermission: hasMicPerm, requestPermission: reqMic } = useMicrophonePermission();

  useEffect(() => {
    (async () => {
      try { if (!hasCamPerm) await reqCam(); } catch {}
      try { if (!hasMicPerm) await reqMic(); } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mount once when we have device + perms (⚠️ do NOT block on stableFormat)
  const [mountCamera, setMountCamera] = useState(false);
  useEffect(() => {
    setMountCamera(!!device && !!hasCamPerm && !!hasMicPerm);
  }, [device, hasCamPerm, hasMicPerm]);

  // AppState awareness to avoid OS tearing down the session in background
  const [appActive, setAppActive] = useState(true);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      setAppActive(next === "active");
    });
    return () => sub.remove();
  }, []);

  // ui: other modals and state unchanged
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultsPrompt, setShowResultsPrompt] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState("");
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  const endSessionModalProps = {
    showEndSessionModal,
    setShowEndSessionModal,
    showCompletionModal,
    setShowCompletionModal,
    isProcessing,
    setIsProcessing,
    showResultsPrompt,
    setShowResultsPrompt,
    showContinueButton,
    setShowContinueButton,
    isDownloading,
    setIsDownloading,
  };

  // 🔧 dynamic profile
  const [fullName, setFullName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // animations
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // status bar styling
  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent");
      StatusBar.setTranslucent(true);
    }
  }, []);

  // user profile + signed avatar
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

      const resolveSigned = async (): Promise<string | null> => {
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
        if (!objectPath) return null;

        const { data: signed } = await supabase.storage
          .from("avatars")
          .createSignedUrl(objectPath, 60 * 60);
        return signed?.signedUrl ?? null;
      };

      try {
        const url = await resolveSigned();
        if (!mounted) return;
        setAvatarUri(url);
      } catch {
        if (!mounted) return;
        setAvatarUri(null);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // rotate fallback tips
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % tips.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // recording animations
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();

      const feedbackInterval = setInterval(() => {
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
      pulseAnim.setValue(1);
      setCurrentFeedback("");
      Animated.timing(feedbackAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    }
  }, [isRecording, pulseAnim, feedbackAnim]);

  // profile menu animation
  useEffect(() => {
    const animations = isProfileMenuVisible
      ? [
          Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]
      : [
          Animated.timing(slideAnim, { toValue: -50, duration: 200, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ];
    Animated.parallel(animations).start();
  }, [isProfileMenuVisible, slideAnim, opacityAnim]);

  // ======== guards ========
  const shuttingDownRef = useRef(false);

  // ⬇️ Watchdog to avoid infinite "Initializing…" + one-time auto-remount
  const initWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initAttemptsRef = useRef(0);
  const [camKey, setCamKey] = useState(0);

  const startInitWatchdog = () => {
    if (initWatchdogRef.current) clearTimeout(initWatchdogRef.current);
    initWatchdogRef.current = setTimeout(() => {
      if (!cameraReady) {
        console.warn("[LiveRec] init watchdog: still not ready after 3000ms, attempt:", initAttemptsRef.current);
        if (initAttemptsRef.current === 0) {
          // one controlled remount of the camera session
          initAttemptsRef.current = 1;
          setCamKey((k) => k + 1);
          startInitWatchdog();
        } else {
          Alert.alert(
            "Camera slow to start",
            "We’re having trouble starting the camera. Close other apps using the camera and try again."
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

  // ⬇️ Fallback: if preview is clearly active in fullscreen but onInitialized never fires,
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

  // keep-awake + lock orientation during fullscreen/recording
  useEffect(() => {
    const enable = async () => {
      try { await activateKeepAwakeAsync("live-rec"); } catch {}
      try { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); } catch {}
    };
    const disable = () => {
      try { deactivateKeepAwake("live-rec"); } catch {}
      (async () => { try { await ScreenOrientation.unlockAsync(); } catch {} })();
    };

    if (isFullScreen || isRecording) enable();
    else disable();

    return () => { disable(); };
  }, [isFullScreen, isRecording]);

  // ======== CAMERA HELPERS ========

  const ensurePermissions = async () => {
    let cam = hasCamPerm;
    let mic = hasMicPerm;

    if (!cam) cam = await reqCam();
    if (!mic) mic = await reqMic();

    if (!cam || !mic) {
      Alert.alert(
        "Permissions required",
        "Camera and microphone permissions are needed to record.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings?.() },
        ]
      );
      return false;
    }
    return true;
  };

  // enter fullscreen and arm auto-start (camera is already mounted)
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
    startInitWatchdog();
  };

  // start capture once camera is initialized
  const startRecordingNow = async () => {
    if (!cameraRef.current || !cameraReady || isRecording) return;
    try {
      setIsRecording(true);
      startTimer();
      await cameraRef.current.startRecording({
        flash: "off",
        onRecordingFinished: (video: VideoFile) => {
          stopTimer();
          setRecordedVideoPath(video.path ?? null);
          setIsRecording(false);
          setIsFullScreen(false);
          setShowContinueButton(true);
        },
        onRecordingError: (err) => {
          console.error("Recording error:", err);
          stopTimer();
          setIsRecording(false);
          setIsFullScreen(false);
          setShowContinueButton(false);
          Alert.alert("Recording failed", "Please try again.");
        },
      });
    } catch (err) {
      console.error("startRecording error:", err);
      stopTimer();
      setIsRecording(false);
      setIsFullScreen(false);
      setShowContinueButton(false);
      Alert.alert("Camera not ready", "Please try again.");
    }
  };

  // stop capture safely (do NOT unmount camera, just exit fullscreen)
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
      await cameraRef.current?.stopRecording();
    } catch (e: any) {
      const msg = String(e?.toString?.() ?? e);
      if (!msg.includes("no-recording-in-progress")) {
        console.error("stopRecording error:", e);
      }
    } finally {
      stopTimer();
      setIsRecording(false);
      setShowContinueButton((prev) => prev || !!recordedVideoPath);
    }
  };

  // ===== Upload helpers =====
  const uploadVideo = async () => {
    if (!recordedVideoPath) {
      Alert.alert("No video", "Please record first.");
      return;
    }
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token =
        sess?.session?.access_token ||
        (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string);
      const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
      if (!token || !SUPABASE_URL) throw new Error("Missing Supabase config");

      const BUCKET = "recordings";
      const objectPath = `live/${Date.now()}.mp4`;
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
      console.warn("Upload error:", e?.message || e);
      Alert.alert("Upload failed", "Please try again later.");
    }
  };

  // ===== SUB-COMPONENTS =====

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
    if (iconName === "log-out-outline") {
      router.replace("/login-page");
    } else if (iconName === "chatbot") {
      router.push("/ButtonIcon/chatbot");
    } else if (iconName === "notifications") {
      router.push("/ButtonIcon/notification");
    }
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
        {currentFeedback}
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
            <Text className="text-xs text-gray-400">
              {item.trend === "up" ? "Improving" : "Needs work"}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  // ===== Full Screen Recording View (overlays only; camera is a global layer) =====
  const FullScreenRecording = () => (
    <View style={StyleSheet.absoluteFill} className="bg-black">
      {/* ui: right badge shows camera type */}
      <View className="absolute top-[60px] right-[24px] flex-row items-center bg-black/50 px-3 py-1.5 rounded-full z-10">
        <Ionicons name="camera" size={16} color="white" style={{ marginRight: 6, marginTop: 2 }} />
        <Text className="text-white text-sm">{useBack ? "Back Camera" : "Front Camera"}</Text>
      </View>

      {/* ui: left badge shows recording status + timer */}
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

      {/* ui: floating AI feedback / tips while recording */}
      <AIFeedback />

      {/* controls: tap to start or stop recording */}
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

      {/* ui: rotating tip chip */}
      <View className="absolute bottom-[120px] self-center flex-row items-center bg-black/50 px-3 py-2 rounded-full z-10">
        <Image
          source={require("../../../assets/tips.png")}
          className="w-4 h-4 bottom-0.5 mr-1"
          resizeMode="contain"
        />
        <Text className="text-white text-xs">{tips[currentTipIndex]}</Text>
      </View>
    </View>
  );

  // ===== Page content =====
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
    if (pathname.includes("community-selection") || pathname.includes("community"))
      return "Community";
    return "Speaking";
  };
  const activeTab = getActiveTab();

  // ===== GLOBAL SINGLE-MOUNT CAMERA LAYER (mounted when ready; shown when fullscreen) =====
  const cameraVisible = isFullScreen;
  const cameraActive = cameraVisible && appActive;

  return (
    <View className="flex-1 bg-[#0F172A] relative">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <BackgroundDecor />

      {/* DEV HUD to see gating flags (remove if you want) */}
      {__DEV__ && (
        <View style={{ position: "absolute", top: 8, left: 8, zIndex: 9999, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 }}>
          <Text style={{ color: "white", fontSize: 10 }}>
            mountCamera: {String(mountCamera)}{"\n"}
            device: {device ? (useBack ? "back" : "front") : "none"}{"\n"}
            perms cam/mic: {String(hasCamPerm)}/{String(hasMicPerm)}{"\n"}
            fullscreen: {String(isFullScreen)} active: {String(cameraActive)}{"\n"}
            ready: {String(cameraReady)} attempts: {initAttemptsRef.current}
          </Text>
        </View>
      )}

      {/* GLOBAL CAMERA: single mount; no prop thrash; no remounts */}
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
            ref={cameraRef}
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

      {/* Profile Menu */}
      <ProfileMenuNew
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        user={{
          name: fullName || "Student",
          email: userEmail || "",
          image: avatarUri ? { uri: avatarUri } : PROFILE_PIC,
        }}
      />

      {/* End Session Modal */}
      <EndSessionModal
        visible={showEndSessionModal}
        onDismiss={() => setShowEndSessionModal(false)}
        isDownloading={isDownloading}
        setIsDownloading={setIsDownloading}
        onViewAIAnalysis={() => {
          // show results modal; upload already happened on "Continue"
          setShowEndSessionModal(false);
          setShowCompletionModal(true);
          setIsProcessing(false);
          setShowResultsPrompt(true);
        }}
        onDownloadVideo={async () => {
          try {
            setIsDownloading(true);
            if (!recordedVideoPath) {
              Alert.alert("Nothing to save", "Please record a video first.");
              return;
            }
            if (Platform.OS === "android") {
              const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
              if (status !== "granted") {
                if (!canAskAgain) {
                  Alert.alert(
                    "Permission Required",
                    "Storage permission is required to save videos.",
                    [
                      { text: "OK", onPress: () => {} },
                      { text: "Open Settings", onPress: () => Linking.openSettings() },
                    ]
                  );
                }
                return;
              }
            }
            const asset = await MediaLibrary.createAssetAsync(recordedVideoPath);
            await MediaLibrary.createAlbumAsync("Recordings", asset, false);
            Alert.alert("Success", "Video saved to gallery!");
          } catch (error) {
            console.error("Error saving video:", error);
            Alert.alert("Error", "Failed to save video. Please try again.");
          } finally {
            setIsDownloading(false);
            setShowEndSessionModal(false);
          }
        }}
      />

      {/* Completion Modal (kept) */}
      <CompletionModal
        visible={showCompletionModal}
        showResultsPrompt={showResultsPrompt}
        isProcessing={isProcessing}
        onClose={() => setShowCompletionModal(false)}
        onLater={() => setShowCompletionModal(false)}
        onSeeResults={() => {
          setShowCompletionModal(false);
          router.push("StudentScreen/SpeakingExercise/full-results-speaking");
        }}
        ai_feedback={aiFeedback}
      />

      <LivesessionCommunityModal
        visible={showCommunityModal}
        onDismiss={() => setShowCommunityModal(false)}
        onSelectOption={(option: "Live Session" | "Community Post") => {
          setShowCommunityModal(false);
          if (option === "Live Session") {
            router.push("/live-sessions-select");
          } else if (option === "Community Post") {
            router.push("/community-selection");
          }
        }}
      />

      {/* Fullscreen recorder overlays */}
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

            {/* Main content */}
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
                      <Text className="text-gray-300 text-xs ml-1">25</Text>
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

                {/* Video Container / Start Button that opens fullscreen */}
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

                {/* After stop -> Continue / Cancel */}
                {showContinueButton && (
                  <View className="w-full px-4 py-3 bg-gray-800/50 flex-row justify-center space-x-4">
                    <TouchableOpacity
                      onPress={async () => {
                        // ⬅️ Upload MP4 first, then show End Session modal
                        await uploadVideo();
                        setShowEndSessionModal(true);
                      }}
                      className="bg-violet-600 px-8 py-3 rounded-lg items-center flex-1 max-w-xs"
                    >
                      <Text className="text-white font-semibold">Continue</Text>
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

                {/* Optional: quick upload button */}
                {recordedVideoPath && (
                  <View className="px-4 pb-4">
                    <TouchableOpacity
                      onPress={uploadVideo}
                      className="mt-2 bg-white/10 border border-white/20 px-4 py-3 rounded-lg items-center"
                    >
                      <Text className="text-white">Upload to cloud</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Status Row */}
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
