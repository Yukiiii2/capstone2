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
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import ProfileMenuNew from "../../../components/ProfileModal/ProfileMenuNew";
import EndSessionModal from "../../../components/StudentModal/EndSessionModal";
import LivesessionCommunityModal from "../../../components/StudentModal/LivesessionCommunityModal";
import RNFFmpeg from 'react-native-ffmpeg';
import { FFmpegKit } from 'ffmpeg-kit-react-native';


// Supabase
import { supabase } from "@/lib/supabaseClient";

// Vision Camera
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";

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
  // ===== CAMERA FIRST =====
  const cameraRef = useRef<Camera>(null);

  // Prefer front, fallback to back
  const front = useCameraDevice("front");
  const back = useCameraDevice("back");
  const device = front ?? back;

  const { hasPermission: hasCamPerm, requestPermission: requestCamPerm } =
    useCameraPermission();

  const [isRecording, setIsRecording] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const recordingActiveRef = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [pendingStart, setPendingStart] = useState(false); // arm until camera ready

  // Timer
  const [elapsedMs, setElapsedMs] = useState(0);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const formatElapsed = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const mm = Math.floor(total / 60).toString().padStart(2, "0");
    const ss = (total % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // Request camera perm on mount
  useEffect(() => {
    (async () => {
      try {
        if (!hasCamPerm) await requestCamPerm();
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start recording once fullscreen camera is initialized
  useEffect(() => {
    const run = async () => {
      if (!pendingStart || !cameraReady || !device || !cameraRef.current) return;
      if (!hasCamPerm) {
        Alert.alert("Permission required", "Please allow camera to record.");
        setPendingStart(false);
        return;
      }
      if (recordingActiveRef.current || isRecording) {
        setPendingStart(false);
        return;
      }

      try {
        recordingActiveRef.current = true;
        setIsRecording(true);

        // start timer
        setElapsedMs(0);
        if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
        const start = Date.now();
        elapsedTimerRef.current = setInterval(
          () => setElapsedMs(Date.now() - start),
          200
        );

        // tiny delay avoids Camera2 race
        setTimeout(() => {
            cameraRef.current?.startRecording({
              flash: "off",
              onRecordingFinished: async (video) => {
                recordingActiveRef.current = false;

                // Convert the recorded file to .wav
                const inputPath = video.path.startsWith("file://")
                  ? video.path
                  : `file://${video.path}`;
                const outputPath = `${FileSystem.cacheDirectory}recording-${Date.now()}.wav`;

               try {
                  const session = await FFmpegKit.execute(
                    `-i ${inputPath} -acodec pcm_s16le -ar 44100 ${outputPath}`
                  );

                  const returnCode = await session.getReturnCode(); // Returns a ReturnCode object
                  const returnCodeValue = returnCode?.getValue(); // Extract the numeric value

                  if (returnCodeValue === 0) {
                    console.log("Conversion successful:", outputPath);
                    setRecordedUri(outputPath); // Update the recorded URI to the .wav file
                  } else {
                    console.error("Conversion failed with return code:", returnCodeValue);
                  }
                } catch (err) {
                  console.error("FFmpeg error:", err);
                }
              },
            onRecordingError: (err) => {
              recordingActiveRef.current = false;
              setIsRecording(false);
              Alert.alert(
                "Recording error",
                err?.message ?? "Something went wrong while recording."
              );
            },
          });
        }, 200);
      } catch {
        recordingActiveRef.current = false;
        setIsRecording(false);
        Alert.alert("Unable to start", "Could not start recording.");
      } finally {
        setPendingStart(false);
      }
    };
    run();
  }, [pendingStart, cameraReady, device, hasCamPerm, isRecording]);

  // Stop recording when `isRecording` goes false
  useEffect(() => {
    const stop = async () => {
      if (isRecording) return;
      try {
        if (cameraRef.current && recordingActiveRef.current) {
          await cameraRef.current.stopRecording();
        }
      } catch {
      } finally {
        recordingActiveRef.current = false;
        if (elapsedTimerRef.current) {
          clearInterval(elapsedTimerRef.current);
          elapsedTimerRef.current = null;
        }
      }
    };
    stop();
  }, [isRecording]);

  // ===== REST OF SCREEN =====
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState("");

  const [fullName, setFullName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle("light-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent");
      StatusBar.setTranslucent(true);
    }
  }, []);

  // Load user/avatar
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
            .list(normalized, {
              limit: 1,
              sortBy: { column: "created_at", order: "desc" },
            });
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

  // Tips rotator
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % tips.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Fake “AI feedback” while recording
  useEffect(() => {
    if (!isRecording) {
      feedbackAnim.setValue(0);
      return;
    }
    const id = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * feedbackMessages.length);
      setCurrentFeedback(feedbackMessages[randomIndex]);
      Animated.sequence([
        Animated.timing(feedbackAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(feedbackAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  // Profile menu animation
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
  }, [isProfileMenuVisible]);

  const getActiveTab = (): string => {
    if (pathname.includes("StudentScreen/HomePage/home-page")) return "Home";
    if (
      pathname.includes("exercise-speaking") ||
      pathname.includes("basic-contents") ||
      pathname.includes("advanced-contents") ||
      pathname.includes("private-video-recording")
    )
      return "Speaking";
    if (
      pathname.includes("basic-exercise-reading") ||
      pathname.includes("advance-execise-reading")
    )
      return "Reading";
    if (pathname.includes("community-selection") || pathname.includes("community"))
      return "Community";
    return "Speaking";
  };

  const handleCommunitySelect = (option: "Live Session" | "Community Post") => {
    setShowCommunityModal(false);
    if (option === "Live Session") {
      router.push("/live-sessions-select");
    } else if (option === "Community Post") {
      router.push("/community-selection");
    }
  };

  const handleLevelSelect = (level: "Basic" | "Advanced") => {
    setShowLevelModal(false);
    const route = level === "Basic" ? "/basic-exercise-reading" : "/advance-execise-reading";
    router.push(route);
  };

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") {
      router.replace("/login-page");
    } else if (iconName === "chatbot") {
      router.push("/ButtonIcon/chatbot");
    } else if (iconName === "notifications") {
      router.push("/ButtonIcon/notification");
    }
  };

  const handleViewAIAnalysis = () => {
    setShowEndSessionModal(false);
    router.push("/full-results-speaking");
  };

  // Save video
  const downloadVideo = async () => {
    try {
      setIsDownloading(true);

      if (Platform.OS === "android") {
        const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          if (!canAskAgain) {
            Alert.alert(
              "Permission Required",
              "Storage permission is required to save videos. You can enable it in app settings.",
              [
                { text: "OK", onPress: () => {} },
                { text: "Open Settings", onPress: Linking.openSettings },
              ]
            );
          }
          setIsDownloading(false);
          setShowEndSessionModal(false);
          return;
        }
      }

      if (recordedUri) {
        const asset = await MediaLibrary.createAssetAsync(recordedUri);
        await MediaLibrary.createAlbumAsync("Recordings", asset, false);
        Alert.alert("Success", "Recorded video saved to gallery!");
      } else {
        const videoUrl = "https://example.com/path/to/recorded-video.mp4";
        const fileName = `recording-${new Date().getTime()}.mp4`;
        const downloadResult = await FileSystem.downloadAsync(
          videoUrl,
          FileSystem.documentDirectory + fileName
        );
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        await MediaLibrary.createAlbumAsync("Recordings", asset, false);
        Alert.alert("Success", "Video saved to gallery!");
      }
    } catch {
      Alert.alert("Error", "Failed to save video. Please try again.");
    } finally {
      setIsDownloading(false);
      setShowEndSessionModal(false);
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
        { title: "Pronunciation", rating: 4.8, trend: "up" as const },
        { title: "Pace", rating: 3.5, trend: "down" as const },
        { title: "Confidence", rating: 4.2, trend: "up" as const },
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
              className="mr-1"
            />
            <Text className="text-xs text-gray-400">
              {item.trend === "up" ? "Improving" : "Needs work"}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  // Fullscreen recording view (NOTE: no androidPreviewViewType prop)
  const FullScreenRecording = () => (
    <View className="flex-1 bg-black justify-center items-center">
      {device && hasCamPerm ? (
        <Camera
          ref={cameraRef}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          device={device}
          isActive={isFullScreen || isRecording}
          video
          audio={false}
          photo={false}
          onInitialized={() => {
            setTimeout(() => setCameraReady(true), 250);
          }}
          onError={(err) => {
            Alert.alert("Camera error", err?.message ?? "Camera failed to start.");
          }}
        />
      ) : (
        <View className="absolute inset-0 bg-black" />
      )}

      <View className="absolute top-[60px] right-[24px] flex-row items-center bg-black/50 px-3 py-1.5 rounded-full z-10">
        <Ionicons name="camera" size={16} color="white" style={{ marginRight: 6, marginTop: 2 }} />
        <Text className="text-white text-sm">{front ? "Front Camera" : "Back Camera"}</Text>
      </View>

      <AIFeedback />

      <View className="absolute top-[60px] left-[24px] bg-black/50 px-3 py-1.5 rounded-full z-10">
        <View className="flex-row items-center">
          <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
          <Text className="text-white text-sm">Recording</Text>
          <Text className="text-white/70 text-sm ml-2">{formatElapsed(elapsedMs)}</Text>
        </View>
      </View>

      <TouchableOpacity
        className="absolute bottom-10 w-[70px] h-[70px] rounded-full bg-white justify-center items-center z-10"
        onPress={() => {
          setIsRecording(false);
          setShowContinueButton(true);
          setIsFullScreen(false);
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

  return (
    <View className="flex-1 bg-[#0F172A] relative">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
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
        hasCamPerm ? (
          <FullScreenRecording />
        ) : (
          <View className="flex-1 bg-black items-center justify-center">
            <Text className="text-white">Waiting for camera permission…</Text>
          </View>
        )
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerClassName="pb-20"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="pt-2 px-5 z-10">
              <Header />
            </View>

            <View className="flex-1 px-5 w-full max-w-[500px] mx-auto">
              <View className="w-full mb-4">
                <View className="mb-4">
                  <Text className="text-white text-2xl font-bold mb-1">Live Video Recording</Text>
                  <Text className="text-gray-300 text-sm text-justify">
                    Record your Live presentation and receive real-time AI Powered feedback and
                    analysis.
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

                {/* Static card (no inline preview) */}
                <View className="w-full aspect-[4/3] bg-gray-900 border border-white/30 relative items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-black/30">
                  {!isRecording && (
                    <View className="absolute">
                      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity
                          onPress={async () => {
                            if (!hasCamPerm) await requestCamPerm();
                            setIsFullScreen(true);
                            setCameraReady(false);
                            setPendingStart(true);
                          }}
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
                    {isRecording
                      ? "Recording in progress"
                      : cameraReady
                      ? "Tap to start recording"
                      : "Camera will open fullscreen"}
                  </Text>
                </View>

                {showContinueButton && (
                  <View className="w-full px-4 py-3 bg-gray-800/50 flex-row justify-center space-x-4">
                    <TouchableOpacity
                      onPress={() => setShowEndSessionModal(true)}
                      className="bg-violet-600 px-8 py-3 rounded-lg items-center flex-1 max-w-xs"
                    >
                      <Text className="text-white font-semibold">Continue</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowContinueButton(false)}
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
