import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter, useLocalSearchParams } from "expo-router";
import CompletionModal from "@/components/StudentModal/CompletionModal";

/* === Audio recording (unchanged UI) === */
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

/* === Added: Supabase upload === */
import { supabase } from "@/lib/supabaseClient";

const { width, height } = Dimensions.get("window");

/* ---- helper: Base64 -> Uint8Array (Expo Go safe) ---- */
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

export default function StudentVoiceReadingRecording() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // State management
  const [recording, setRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState("");
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultsPrompt, setShowResultsPrompt] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);

  // Recording refs/state
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  // === Added: cloud upload state (doesn’t change UI) ===
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioUploadUrl, setAudioUploadUrl] = useState<string | null>(null);
  const [audioStoragePath, setAudioStoragePath] = useState<string | null>(null);

  const isStartingRef = useRef(false);
  const isStoppingRef = useRef(false);

  // Profile icon
  const ProfileIcon = () => (
    <View className="w-8 h-8 rounded-full bg-indigo-600 items-center justify-center">
      <Ionicons name="person" size={20} color="white" />
    </View>
  );

  // Handle icon press
  const handleIconPress = (icon: string) => {
    console.log(`${icon} icon pressed`);
  };

  // Animations & intervals
  const feedbackInterval = useRef<NodeJS.Timeout | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const waveformAnim = useRef(new Animated.Value(0)).current;

  const feedbackMessages = [
    "Great job! Keep going!",
    "Try to speak a bit louder",
    "Excellent pronunciation!",
    "You're doing great, keep it up!",
    "Try to slow down a bit",
    "Your pacing is perfect",
    "Project your voice more",
    "Excellent enunciation!",
  ];

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // ✅ FIX: Don't stop the recorder in this effect's cleanup anymore.
  useEffect(() => {
    if (recording) {
      startPulse();
      startRotate();
      startWaveform();
    } else {
      stopPulse();
      stopRotate();
      stopWaveform();
    }

    return () => {
      if (feedbackInterval.current) {
        clearInterval(feedbackInterval.current);
        feedbackInterval.current = null;
      }
    };
  }, [recording]);

  // ✅ Unmount-only cleanup for the recorder
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, []);

  const startPulse = () => {
    setShowFeedback(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();

    feedbackInterval.current = setInterval(() => {
      const randomFeedback = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
      setAiFeedback(randomFeedback);
    }, 5000);
  };

  const stopPulse = () => {
    pulse.stopAnimation();
    pulse.setValue(1);
    if (feedbackInterval.current) {
      clearInterval(feedbackInterval.current);
      feedbackInterval.current = null;
    }
    setShowFeedback(false);
    setAiFeedback("");
  };

  const startRotate = () => {
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  };

  const stopRotate = () => {
    rotateAnim.stopAnimation();
    rotateAnim.setValue(0);
  };

  const startWaveform = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveformAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(waveformAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
      ])
    ).start();
  };

  const stopWaveform = () => {
    waveformAnim.stopAnimation();
    waveformAnim.setValue(0);
  };

  /* === Mic permission + audio mode === */
  async function ensureMicPermission() {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") throw new Error("Microphone permission not granted");
  }

  async function configureAudioForRecording() {
    const IOS_DO_NOT_MIX =
      (Audio as any).INTERRUPTION_MODE_IOS_DO_NOT_MIX ??
      (Audio as any).InterruptionModeIOS?.DoNotMix ??
      1;

    const ANDROID_DO_NOT_MIX =
      (Audio as any).INTERRUPTION_MODE_ANDROID_DO_NOT_MIX ??
      (Audio as any).InterruptionModeAndroid?.DoNotMix ??
      1;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: IOS_DO_NOT_MIX,
      shouldDuckAndroid: true,
      interruptionModeAndroid: ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
    });
  }

  // === Updated uploader (Expo-Go safe, saves to recordings/<uid>/audio/...) ===
  async function uploadReadingAudio(localUri: string) {
    try {
      setIsUploadingAudio(true);

      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? "anonymous";

      const filename = `reading-${Date.now()}.m4a`;
      const objectPath = `${uid}/audio/${filename}`;

      // Read file as base64 and convert to bytes (fetch(file://) is unreliable on Expo Go)
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = base64ToUint8Array(base64);
      const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

      // Try uploading with the standard .m4a MIME
      let res = await supabase.storage
        .from("recordings")
        .upload(objectPath, buf as ArrayBuffer, {
          contentType: "audio/mp4", // m4a standard MIME
          upsert: false,
        });

      // Fallback if bucket complains about MIME
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

      setAudioStoragePath(objectPath);
      setAudioUploadUrl(signed.data?.signedUrl ?? null);
      return { path: objectPath, url: signed.data?.signedUrl ?? null };
    } finally {
      setIsUploadingAudio(false);
    }
  }

  // Start recording
  const startRecording = async () => {
    if (isStartingRef.current || recordingRef.current) return;
    isStartingRef.current = true;

    try {
      await ensureMicPermission();
      await configureAudioForRecording();

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setAudioUploadUrl(null);
      setAudioStoragePath(null);
      setRecordingUri(null);
      setRecording(true);
    } catch (e) {
      console.warn("startRecording error:", e);
      Alert.alert("Microphone", "Could not start recording. Please try again.");
    } finally {
      isStartingRef.current = false;
    }
  };

  // Stop recording → upload to Supabase → show completion modal
  const stopRecording = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    try {
      let uri: string | null = null;

      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
          uri = recordingRef.current.getURI() || null;
        } catch (e) {
          console.warn("stopAndUnloadAsync error:", e);
        } finally {
          recordingRef.current = null;
        }
      }

      setRecording(false);

      if (uri) {
        try {
          const info = await FileSystem.getInfoAsync(uri);
          if (!info.exists) {
            console.warn("Recorded file missing:", uri);
            uri = null;
          }
        } catch (e) {
          console.warn("File info error:", e);
        }
      }

      setRecordingUri(uri);

      // Upload to Supabase as soon as we have the file
      if (uri) {
        try {
          await uploadReadingAudio(uri);
        } catch (e: any) {
          console.warn("audio upload error:", e?.message || e);
          Alert.alert("Upload failed", "We couldn't upload your audio right now.");
        }
      }

      setShowCompletionPopup(true);
      setIsProcessing(true);
      setShowResultsPrompt(false);

      // Simulate analysis
      setTimeout(() => {
        setIsProcessing(false);
        setShowResultsPrompt(true);
        setAiFeedback(
          "Your pronunciation is good, but try to speak a bit slower for better clarity."
        );
        setAnalysisComplete(true);
      }, 1500);
    } catch (err) {
      console.error("Failed to stop recording", err);
      setShowCompletionPopup(false);
      setIsProcessing(false);
    } finally {
      isStoppingRef.current = false;
    }
  };

  // Later button
  const handleLater = () => {
    setShowCompletionPopup(false);
    setShowFeedback(true);
  };

  // See results (kept same behavior)
  const handleSeeResults = () => {
    setShowCompletionPopup(false);
    const moduleType = typeof params.module === "string" ? params.module : "basic";
    const levelParam =
      moduleType === "advance" || moduleType === "advanced" ? "advanced" : "basic";
    const scoreParam = 78; // replace with FastAPI score when wired

    router.replace(
      `/StudentScreen/ReadingExercise/full-result-reading?level=${encodeURIComponent(
        levelParam
      )}&module_title=${encodeURIComponent("Reading Passage")}&score=${scoreParam}`
    );
  };

  const handleModalClose = () => {
    setShowCompletionPopup(false);
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
      <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
    </View>
  );

  const statusMetrics = [
    { title: "Pronunciation", rating: 4.8, icon: "mic-outline" as const, trend: "up" as const },
    { title: "Pace", rating: 3.5, icon: "speedometer-outline" as const, trend: "down" as const },
    { title: "Confidence", rating: 4.2, icon: "happy-outline" as const, trend: "up" as const },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "transparent" }}
      contentContainerStyle={{ minHeight: "100%" }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <BackgroundDecor />

      {/* Header copy */}
      <View>
        <View>
          <Text className="text-white text-xl p-5 top-1 left font-bold mb-2">
            Reading Confidence Assessment
          </Text>
          <Text className="text-gray-200 text-justify p-5 bottom-10 text-sm opacity-80 leading-5">
            Read the following passage aloud to help us 
          </Text>
          <Text className="text-gray-200 text-justify p-5 bottom-16 -top-20 text-sm opacity-80 leading-5">
            evaluate your reading confidence level
          </Text>
        </View>
      </View>

      {/* Passage Card */}
      <View className="mx-5 -top-10 -mt-8 rounded-2xl overflow-hidden border-2 border-white/40 shadow-lg shadow-black/10">
        <BlurView intensity={20} tint="light" className="p-5 bg-white/45">
          <Text className="text-white text-base leading-[39px] text-shadow">
            Liam reads every morning before school. Today, he picked a story
            about a boy and his dog. He focused on each sentence and used
            pictures to imagine the events. After reading, he thought about the
            main idea to remember the details.
          </Text>
        </BlurView>
      </View>

      {/* Status (only while recording) */}
      {recording && (
        <View className="absolute bottom-6 left-5 right-5">
          <View className="mb-4">
            <View className="items-center mb-1">
              <Text className="text-white text-base font-bold">Current Status</Text>
            </View>
          </View>

          <View className="flex-row justify-between px-1">
            {statusMetrics.map((item, idx) => (
              <View key={idx} className="items-center flex-1 px-2">
                <View className="w-10 h-10 rounded-full bg-white/10 justify-center items-center mb-2">
                  <Ionicons name={item.icon} size={20} color="white" />
                </View>
                <Text className="text-white/90 text-xs font-semibold mb-1 text-center">
                  {item.title}
                </Text>
                <View className="flex-row items-center bg-white/10 px-2 py-1 rounded-xl min-w-[60px] justify-center">
                  <Text className="text-white text-sm font-bold mr-1">
                    {item.rating.toFixed(1)}
                  </Text>
                  <Ionicons
                    name={item.trend === "up" ? "trending-up" : "trending-down"}
                    size={14}
                    color="white"
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Mic Button + bars */}
      <View className="absolute left-0 right-0 items-center" style={{ top: height * 0.45 }}>
        <View className="flex-row justify-center top-20 items-end h-[60px] mb-5 w-full">
          {[...Array(15)].map((_, i) => {
            const baseHeight = 8;
            const heightMultiplier = 0.6 + Math.sin(i * 0.5) * 0.4;

            const animatedHeight = waveformAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [
                baseHeight,
                baseHeight * 2.5 * heightMultiplier,
                baseHeight * 3 * heightMultiplier,
              ],
            });

            const verticalOffset = waveformAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, -3, 0],
            });

            return (
              <Animated.View
                key={i}
                style={{
                  width: 3,
                  marginHorizontal: 4,
                  height: animatedHeight,
                  backgroundColor: "#fff",
                  borderRadius: 3,
                  transform: [{ translateY: verticalOffset }],
                }}
              />
            );
          })}
        </View>

        <TouchableOpacity
          onPress={recording ? stopRecording : startRecording}
          className="w-16 h-16 top-20 rounded-full bg-[#FF3131] justify-center items-center shadow-lg shadow-black/25"
          style={{
            shadowColor: "#fff",
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <Ionicons name={recording ? "stop" : "mic"} size={28} color="#fff" />
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>

        <Text className="text-gray-400 top-20 text-xs mt-3">
          {recording ? "Recording" : "Tap to start"}
        </Text>
      </View>

      {/* Bottom actions */}
      {!recording && (
        <View
          className={`absolute bottom-5 left-0 right-0 flex-row px-5 ${
            analysisComplete ? "justify-center" : "justify-between"
          }`}
        >
          {!analysisComplete && (
            <TouchableOpacity
              onPress={() => {
                if (params.module === "advance" || params.module === "advanced") {
                  router.replace("/StudentScreen/ReadingExercise/advance-execise-reading");
                } else {
                  router.replace("/StudentScreen/ReadingExercise/basic-exercise-reading");
                }
              }}
              className="flex-1 bg-white/10 rounded-xl py-3.5 px-4 items-center justify-center mr-2 border border-white/20"
            >
              <Text className="text-white font-semibold text-base">Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              const moduleType = typeof params.module === "string" ? params.module : "basic";
              const levelParam =
                moduleType === "advance" || moduleType === "advanced" ? "advanced" : "basic";
              const scoreParam = 78;
              router.replace(
                `/StudentScreen/ReadingExercise/full-result-reading?level=${encodeURIComponent(
                  levelParam
                )}&module_title=${encodeURIComponent("Reading Passage")}&score=${scoreParam}`
              );
            }}
            disabled={!analysisComplete}
            className={`${analysisComplete ? "flex-[0.8] min-w-[200px] ml-0" : "flex-1 ml-2"} ${
              analysisComplete ? "bg-violet-500/80" : "bg-gray-500"
            } rounded-xl py-3.5 px-4 items-center justify-center`}
          >
            <Text className="text-white font-bold">
              {analysisComplete ? "View Full Results Now" : "Start First"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Completion Modal */}
      <CompletionModal
        visible={showCompletionPopup}
        showResultsPrompt={showResultsPrompt}
        isProcessing={isProcessing}
        onClose={handleModalClose}
        onLater={handleLater}
        onSeeResults={handleSeeResults}
      />
    </ScrollView>
  );
}
