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
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "@/lib/supabaseClient";

// 🎙️ audio-only (no expo-camera)
import { Audio } from "expo-av";

/* ---------- Version-safe Audio Mode helpers ---------- */
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
/* ---------------------------------------------------- */

/* ---- Base64 -> Uint8Array (Expo Go safe) ---- */
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
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();

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

  // avatar
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // ===== Animations =====
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  // ===== Audio-only recording (like live) =====
  const audioRecordingRef = useRef<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null); // .m4a
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [didAutoUpload, setDidAutoUpload] = useState(false);

  // timer
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<any>(null);
  const recordStartRef = useRef<number | null>(null);

  // perms
  const [hasPerms, setHasPerms] = useState<boolean | null>(null);

  const screenWidth = Dimensions.get("window").width;
  const appStateRef = useRef(AppState.currentState);

  // ===== Status bar =====
  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent");
      StatusBar.setTranslucent(true);
    }
  }, []);

  // ===== Load Supabase avatar =====
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user || !mounted) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
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
      if (!objectPath) return;
      const { data: signed } = await supabase
        .storage
        .from("avatars")
        .createSignedUrl(objectPath, 3600);
      if (!mounted) return;
      setAvatarUri(signed?.signedUrl ?? null);
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

  // ===== Recording animations + faux feedback (same feel as live) =====
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

  // 🔐 Permissions (mic only)
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

  useEffect(() => {
    ensurePermissions();
  }, []);

  // Focus effect (no-op here but keeps parity with live)
  useFocusEffect(
    React.useCallback(() => {
      return () => {};
    }, [])
  );

  // Track app state
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

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

  // ===== Timer =====
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

  // ===== Audio start/stop =====
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
      setIsRecording(true);
      startTimer();

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

      await setAudioModeCompatIdle();

      return uri;
    } catch (e) {
      stopTimer();
      setIsRecording(false);
      return null;
    }
  };

  // ---------- Upload (same as live; m4a into 'recordings') ----------
  const uploadRecording = async () => {
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

      // try with audio/mp4 (m4a), fallback to octet-stream if your storage validation is strict
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

  // auto-upload when the end-session modal opens (once)
  useEffect(() => {
    if (showEndSessionModal && !didAutoUpload) {
      setDidAutoUpload(true);
      if (recordedUri && !uploadUrl && !isUploading) {
        uploadRecording().catch(() => {});
      }
    }
    if (!showEndSessionModal) setDidAutoUpload(false);
  }, [showEndSessionModal, recordedUri, uploadUrl, isUploading, didAutoUpload]);

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

  // ===== Fullscreen "recording" view (audio overlays to match live) =====
  const FullScreenRecording = () => (
    <View className="flex-1 bg-black justify-center items-center">
      {/* No camera preview; we keep the same HUD feel */}
      {hasPerms ? null : (
        <View
          style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}
        >
          <Text style={{ color: "white" }}>
            Microphone permission not granted. Open Settings and allow access.
          </Text>
        </View>
      )}

      {/* Indicator */}
      <View className="absolute top-[60px] right-[24px] flex-row items-center bg-black/50 px-3 py-1.5 rounded-full z-10">
        <Ionicons name="mic" size={16} color="white" style={{ marginRight: 6, marginTop: 2 }} />
        <Text className="text-white text-sm">Microphone Active</Text>
      </View>

      <AIFeedback />

      {/* Timer */}
      <View className="absolute top-[60px] left-[24px] bg-black/50 px-3 py-1.5 rounded-full z-10">
        <View className="flex-row items-center">
          <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
          <Text className="text-white text-sm">Recording</Text>
          <Text className="text-white/70 text-sm ml-2">{fmt(elapsedSec)}</Text>
        </View>
      </View>

      {/* Stop */}
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

  const handleViewAIAnalysis = () => {
    setShowEndSessionModal(false);
    pushWithCtx("/full-results-speaking", uploadUrl ? { media_url: uploadUrl } : {});
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
    await startAudioRecording();
  };

  // auto-upload kick when modal opens (single-shot)
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

                {/* “Video” container – same look, but we record audio-only */}
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
