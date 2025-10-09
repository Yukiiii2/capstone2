import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Audio } from "expo-av";
import { Switch } from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { supabase } from "@/lib/supabaseClient";

const isAudioUrl = (uri?: string | null) =>
  !!uri && /\.(m4a|mp3|aac|wav|ogg)(\?|#|$)/i.test(uri || "");

// ---------- NEW: helpers to resolve recording path/signing ----------
const normalizeRecordingPath = (p: string) => p.replace(/^recordings\//, "").replace(/^\/+/, "");

async function signRecording(objectPath: string | null): Promise<string | null> {
  if (!objectPath) return null;
  try {
    const { data, error } = await supabase
      .storage
      .from("recordings")
      .createSignedUrl(objectPath, 60 * 60 * 24 * 7); // 7 days
    if (error) {
      console.warn("[recordings] sign error:", error.message);
      return null;
    }
    return data?.signedUrl ?? null;
  } catch (e) {
    console.warn("[recordings] sign exception:", e);
    return null;
  }
}

// Try to find the MOST RECENT file in recordings/<userId>/
// (falls back to top-level 'recordings' if not organized by user folder)
async function findLatestRecordingPath(userId: string): Promise<string | null> {
  // First, try user folder
  const tryFolder = async (folder: string) => {
    const { data, error } = await supabase.storage
      .from("recordings")
      .list(folder, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
    if (error) return null;
    if (data && data.length > 0) return `${folder}/${data[0].name}`.replace(/^\/+/, "");
    return null;
  };

  let objectPath =
    (await tryFolder(userId)) ||
    (await tryFolder("")) // root bucket (if not organized by user folder)
  ;

  return objectPath;
}

const CreatePost = () => {
  const router = useRouter();

  // ---------- Robust params handling (+ audio support) ----------
  const rawParams = useLocalSearchParams<{
    videoUri?: string | string[];
    audioUri?: string | string[];
    recordingPath?: string | string[]; // NEW: if EndSession passes storage path directly
    module_id?: string | string[];
    module_title?: string | string[];
    moduleTitle?: string | string[];
    level?: "basic" | "advanced" | (string & {});
  }>();

  const pick = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

  const incomingVideoUri = pick(rawParams.videoUri) ?? undefined;
  const incomingAudioUri = pick(rawParams.audioUri) ?? undefined;
  const incomingRecordingPath = pick(rawParams.recordingPath) ?? undefined; // ← storage path like "userId/file.m4a"

  // If they pass a "videoUri" that is actually an audio file (e.g., .m4a),
  // treat it as audio to avoid black Video component.
  const coercedAudioFromVideo = isAudioUrl(incomingVideoUri) ? incomingVideoUri : undefined;

  // These are *preview* URIs for the UI (signed URLs or local file URIs)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | undefined>(undefined);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | undefined>(undefined);

  // This is what we will persist in DB: the STORAGE PATH if available (clean, durable)
  // e.g. "user-uuid/1699999999.m4a"
  const [mediaPathForDB, setMediaPathForDB] = useState<string | null>(null);
  const [mediaTypeForDB, setMediaTypeForDB] = useState<"audio" | "video" | null>(null);

  const module_id = pick(rawParams.module_id);
  const levelParam = pick(rawParams.level) as "basic" | "advanced" | undefined;

  // Prefer snake_case; fallback to camelCase; decode if encoded
  const rawTitleFromParams = pick(rawParams.module_title) ?? pick(rawParams.moduleTitle) ?? null;
  const initialTitle =
    rawTitleFromParams != null
      ? (() => {
          try {
            return decodeURIComponent(rawTitleFromParams);
          } catch {
            return rawTitleFromParams;
          }
        })()
      : "";

  // ------- Title is now editable by the user -------
  const [postTitle, setPostTitle] = useState<string>(initialTitle);

  // Refs
  const videoRef = useRef<Video>(null);
  const tagInputRef = useRef<TextInput>(null);

  // 🎧 audio sound ref
  const soundRef = useRef<Audio.Sound | null>(null);

  // State variables
  const [postText, setPostText] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState(["Presentation", "Practice", "Professional"]);
  const [allowComments, setAllowComments] = useState(true);
  const [allowRatings, setAllowRatings] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // Video state
  const [hasPlayed, setHasPlayed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoStatus, setVideoStatus] = useState<{
    isLoaded: boolean;
    isPlaying: boolean;
    durationMillis?: number;
    positionMillis?: number;
  }>({
    isLoaded: false,
    isPlaying: false,
    durationMillis: 0,
    positionMillis: 0,
  });

  // Audio state
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0); // ms
  const [audioPosition, setAudioPosition] = useState(0); // ms
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // ------- Profile: avatar or initials -------
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("You");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // NEW: needed for locating recordings

  const initials = useMemo(() => {
    const parts = (displayName || "").trim().split(/\s+/);
    const a = (parts[0]?.[0] || "").toUpperCase();
    const b = (parts[1]?.[0] || "").toUpperCase();
    return (a + b) || a || "U";
  }, [displayName]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user || !mounted) return;
      setCurrentUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      if (!mounted) return;

      const nameValue = (profile?.name ?? user.user_metadata?.full_name ?? "You").trim();
      setDisplayName(nameValue || "You");

      const resolveAndSign = async (): Promise<string | null> => {
        const stored = profile?.avatar_url?.toString();
        if (!stored) return null;

        const normalized = stored.replace(/^avatars\//, "");
        let objectPath: string | null = null;

        if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
          objectPath = normalized;
        } else {
          const { data: files } = await supabase.storage
            .from("avatars")
            .list(normalized, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
          if (files && files.length > 0) objectPath = `${normalized}/${files[0].name}`;
        }

        if (!objectPath) return null;

        const { data: signed } = await supabase.storage
          .from("avatars")
          .createSignedUrl(objectPath, 60 * 60);
        return signed?.signedUrl ?? null;
      };

      try {
        const url = await resolveAndSign();
        if (!mounted) return;
        setAvatarUri(url);
      } catch {
        if (!mounted) return;
        setAvatarUri(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ---------- NEW: Resolve which media to show/post ----------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // If EndSession already passed a storage path, prefer it.
      // Example: recordingPath="user-uuid/1700000000000.m4a" or "recordings/user-uuid/..."
      if (incomingRecordingPath) {
        const cleanPath = normalizeRecordingPath(incomingRecordingPath);
        const signed = await signRecording(cleanPath);
        if (!cancelled) {
          setMediaPathForDB(cleanPath);
          setMediaTypeForDB("audio");
          setAudioPreviewUrl(signed || undefined);
          setVideoPreviewUrl(undefined);
        }
        return;
      }

      // Else if an explicit audioUri param is provided
      if (incomingAudioUri || isAudioUrl(incomingVideoUri)) {
        const aud = (incomingAudioUri || coercedAudioFromVideo)!;

        // If it's a storage path, sign for preview and keep path for DB
        if (!/^https?:\/\//i.test(aud) && !/^file:\/\//i.test(aud)) {
          const cleanPath = normalizeRecordingPath(aud);
          const signed = await signRecording(cleanPath);
          if (!cancelled) {
            setMediaPathForDB(cleanPath);
            setMediaTypeForDB("audio");
            setAudioPreviewUrl(signed || undefined);
            setVideoPreviewUrl(undefined);
          }
          return;
        }

        // If it's http/file, assume already saved or local preview only.
        // We can't derive the storage path reliably; still show preview.
        if (!cancelled) {
          setMediaPathForDB(/^file:\/\//i.test(aud) ? null : aud); // fallback: store URL if not local
          setMediaTypeForDB("audio");
          setAudioPreviewUrl(aud);
          setVideoPreviewUrl(undefined);
        }
        return;
      }

      // Else if a *video* param was passed (normal behavior)
      if (incomingVideoUri && !isAudioUrl(incomingVideoUri)) {
        if (!cancelled) {
          setMediaPathForDB(incomingVideoUri); // if you also upload/stored your videos, swap to its path
          setMediaTypeForDB("video");
          setVideoPreviewUrl(incomingVideoUri);
          setAudioPreviewUrl(undefined);
        }
        return;
      }

      // Else nothing came via params -> locate MOST RECENT recording saved by Continue button
      if (currentUserId) {
        const latest = await findLatestRecordingPath(currentUserId);
        if (latest) {
          const signed = await signRecording(latest);
          if (!cancelled) {
            setMediaPathForDB(latest);
            setMediaTypeForDB("audio");
            setAudioPreviewUrl(signed || undefined);
            setVideoPreviewUrl(undefined);
          }
          return;
        }
      }

      // If nothing at all, ensure blanks
      if (!cancelled) {
        setMediaPathForDB(null);
        setMediaTypeForDB(null);
        setAudioPreviewUrl(undefined);
        setVideoPreviewUrl(undefined);
      }
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingRecordingPath, incomingAudioUri, incomingVideoUri, coercedAudioFromVideo, currentUserId]);

  // Seed tags from title’s first word
  useEffect(() => {
    const first = (postTitle || "").trim().split(/\s+/)[0];
    if (!first) return;
    setTags((prev) => {
      const rest = prev.filter((t, i) => i > 0);
      const baseRest = rest.length ? rest : ["Practice", "Professional"];
      if (prev[0] === first) return prev;
      return [first, ...baseRest];
    });
  }, [postTitle]);

  // --------- VIDEO setup ----------
  useEffect(() => {
    if (!videoRef.current || !videoPreviewUrl) return;
    const setupVideo = async () => {
      try {
        setHasPlayed(false);
      } catch (error) {
        console.error("Error initializing video:", error);
      }
    };
    setupVideo();
    return () => {
      if (videoRef.current) {
        videoRef.current.pauseAsync();
      }
    };
  }, [videoPreviewUrl]);

  const handlePlayVideo = async () => {
    if (!videoRef.current) return;
    try {
      if (videoStatus.isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
      if (!hasPlayed) setHasPlayed(true);
    } catch (error) {
      console.error("Error toggling video playback:", error);
    }
  };

  // --------- AUDIO setup ----------
  useEffect(() => {
    let mounted = true;
    const loadAudio = async () => {
      if (!audioPreviewUrl) return;
      setIsLoadingAudio(true);
      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioPreviewUrl },
          { shouldPlay: false },
          (s) => {
            if (!s.isLoaded) return;
            setIsAudioPlaying(s.isPlaying);
            setAudioDuration(s.durationMillis ?? 0);
            setAudioPosition(s.positionMillis ?? 0);
          }
        );
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
        const st = await sound.getStatusAsync();
        setIsAudioLoaded(st.isLoaded);
        setAudioDuration(st.isLoaded ? st.durationMillis ?? 0 : 0);
        setAudioPosition(st.isLoaded ? st.positionMillis ?? 0 : 0);
      } catch (e) {
        console.warn("Audio load error:", e);
        setIsAudioLoaded(false);
      } finally {
        setIsLoadingAudio(false);
      }
    };
    loadAudio();

    return () => {
      mounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [audioPreviewUrl]);

  const toggleAudioPlay = async () => {
    if (!soundRef.current || !isAudioLoaded) return;
    const s = soundRef.current;
    const status = await s.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await s.pauseAsync();
      setIsAudioPlaying(false);
    } else {
      await s.playAsync();
      setIsAudioPlaying(true);
    }
  };

  // --------- Save media (video OR audio) ----------
  const downloadMedia = async () => {
    const mediaUri = videoPreviewUrl || audioPreviewUrl;
    if (!mediaUri) {
      Alert.alert("Error", "No media available to save.");
      return;
    }

    try {
      setIsDownloading(true);

      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        if (!canAskAgain) {
          Alert.alert(
            "Permission Required",
            "Storage permission is required to save. You can enable it in app settings.",
            [
              { text: "OK", style: "default", onPress: () => setIsDownloading(false) },
              {
                text: "Open Settings",
                onPress: () => {
                  setIsDownloading(false);
                  Linking.openSettings();
                },
              },
            ]
          );
        } else {
          setIsDownloading(false);
        }
        return;
      }

      const isAud = isAudioUrl(mediaUri);
      const ext = isAud ? "m4a" : "mp4";
      const fileName = `recording-${Date.now()}.${ext}`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      if (/^file:\/\//i.test(mediaUri)) {
        await FileSystem.copyAsync({ from: mediaUri, to: fileUri });
      } else {
        await FileSystem.downloadAsync(mediaUri, fileUri);
      }

      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync("Recordings", asset, false);

      Alert.alert("Success", `${isAud ? "Audio" : "Video"} saved to gallery!`);
    } catch (error) {
      console.error("Error saving media:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? `Failed to save: ${error.message}`
          : "An unknown error occurred while saving."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // --------- Create post ----------
  const handlePost = async () => {
    const safeTitle = postTitle.trim() || "Untitled";

    if (!postText.trim()) {
      Alert.alert("Add something first", "Write a short caption before posting.");
      return;
    }

    // Prefer STORAGE PATH for DB. If we don't have it (e.g., http URL only), fall back.
    const media_url = mediaPathForDB;
    const media_type = mediaTypeForDB;

    if (!media_url || !media_type) {
      Alert.alert("Missing media", "No attached recording found to share.");
      return;
    }

    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        Alert.alert("Not signed in", "Please log in again.");
        return;
      }

      const { error: insertErr } = await supabase
        .from("posts")
        .insert([
          {
            user_id: user.id,
            title: safeTitle,
            content: postText.trim(),
            media_url,          // ← storage path (e.g., "user-uuid/xxx.m4a")
            media_type,         // "audio" or "video"
            module: postTitle || null,
            type: "speaking",
            status: "published",
            visibility: "public",
            allow_comments: allowComments,
            allow_reviews: allowRatings,
            // module_id, level: levelParam, ...
          },
        ])
        .select("id")
        .single();

      if (insertErr) {
        console.log("[create-post] insert error:", insertErr.message);
        Alert.alert("Post failed", insertErr.message);
        return;
      }

      Alert.alert("Posted!", "Your post has been shared successfully.");
      setPostText("");
      router.back();
    } catch (e: any) {
      console.log("[create-post] unhandled error:", e?.message || e);
      Alert.alert("Post failed", e?.message || "Something went wrong.");
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
    setShowTagInput(false);
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const BackgroundDecor = () => (
    <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
      <View className="absolute left-0 right-0 top-0 bottom-0">
        <LinearGradient colors={["#0F172A", "#1E293B", "#0F172A"]} style={{ flex: 1 }} />
      </View>
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
    </View>
  );

  const levelLabel =
    levelParam === "advanced"
      ? "Advanced"
      : levelParam === "basic"
      ? "Basic"
      : isPublic
      ? "Advanced"
      : "Basic";

  const fmt = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <View className="flex-1 bg-gray-900">
      {/* Full screen background with status bar cover */}
      <View className="absolute top-0 left-0 right-0 bottom-0 bg-gray-900">
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <View className="flex-1 bg-gray-900 pt-12">
          <BackgroundDecor />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-2 top-6"
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center top-2 mt-2 mb-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bottom-5 left-2 -ml-2">
            <Ionicons name="arrow-back" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ===== Media Preview(s) ===== */}

        {/* Video Preview */}
        {videoPreviewUrl && (
          <View className="mb-4 rounded-xl overflow-hidden">
            <View className="relative">
              <Video
                ref={videoRef}
                source={{ uri: videoPreviewUrl }}
                style={{ width: "100%", aspectRatio: 16 / 9 }}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                isLooping
                shouldPlay={isPlaying}
                onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                  if (!status.isLoaded) return;
                  setVideoStatus({
                    isLoaded: status.isLoaded,
                    isPlaying: status.isPlaying,
                    durationMillis: status.durationMillis,
                    positionMillis: status.positionMillis,
                  });
                  setDuration(status.durationMillis || 0);
                  setCurrentTime(status.positionMillis || 0);
                  setIsPlaying(status.isPlaying);
                  const newProgress = status.durationMillis
                    ? ((status.positionMillis || 0) / status.durationMillis) * 100
                    : 0;
                  setProgress(newProgress);
                }}
              />
              {!isPlaying && (
                <TouchableOpacity
                  className="absolute inset-0 items-center justify-center bg-black/30"
                  activeOpacity={0.9}
                  onPress={handlePlayVideo}
                >
                  <View className="bg-black/50 w-16 h-16 rounded-full items-center justify-center">
                    <Ionicons name="play" size={32} color="#fff" />
                  </View>
                </TouchableOpacity>
              )}
              {isPlaying && (
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-black/50 w-10 h-10 rounded-full items-center justify-center"
                  onPress={handlePlayVideo}
                >
                  <Ionicons name="pause" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {/* Simple video progress row */}
            <View className="px-1 py-2">
              <Text className="text-gray-300 text-xs">
                {fmt(currentTime)} / {fmt(duration)}
              </Text>
              <View className="w-full bg-white/20 rounded-full h-1.5 mt-1">
                <View className="bg-white h-full rounded-full" style={{ width: `${progress}%` }} />
              </View>
            </View>
          </View>
        )}

        {/* Audio Preview */}
        {audioPreviewUrl && (
          <View className="mb-4 rounded-xl overflow-hidden bg-white/10 border border-white/10 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-white font-medium">Audio Preview</Text>
              <TouchableOpacity
                onPress={toggleAudioPlay}
                className="bg-black/40 rounded-full px-3 py-1.5"
                disabled={!isAudioLoaded || isLoadingAudio}
              >
                <Text className="text-white text-sm">
                  {isLoadingAudio ? "Loading…" : isAudioPlaying ? "Pause" : "Play"}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-2">
              <View className="w-full bg-white/20 rounded-full h-1.5">
                <View
                  className="bg-white h-full rounded-full"
                  style={{
                    width: `${
                      audioDuration ? Math.min(100, (audioPosition / audioDuration) * 100) : 0
                    }%`,
                  }}
                />
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-gray-300 text-xs">{fmt(audioPosition)}</Text>
                <Text className="text-gray-300 text-xs">{fmt(audioDuration)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Post Content */}
        <View className="bg-white/10 rounded-2xl p-5 mb-4 border border-white/10">
          <View className="flex-row items-start space-x-3 mb-4">
            {/* Avatar or initials */}
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="w-12 h-12 rounded-full" />
            ) : (
              <View className="w-12 h-12 rounded-full bg-white/10 border border-white/30 items-center justify-center">
                <Text className="text-white font-bold">{initials}</Text>
              </View>
            )}

            <View className="flex-1">
              <Text className="text-white font-medium">{displayName || "You"}</Text>
              <TouchableOpacity
                onPress={() => setIsPublic(!isPublic)}
                className="flex-row items-center mt-1 bg-white/10 rounded-full px-3 py-1 self-start"
              >
                <Ionicons
                  name={
                    (levelParam ?? (isPublic ? "advanced" : "basic")) === "advanced"
                      ? "school"
                      : "school-outline"
                  }
                  size={14}
                  color="#9CA3AF"
                />
                <Text className="text-gray-400 text-xs ml-1">
                  {(levelParam ?? (isPublic ? "advanced" : "basic")) === "advanced"
                    ? "Advanced"
                    : "Basic"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Editable Title */}
          <View className="mb-2 mt-2" style={{ left: 6 }}>
            <TextInput
              value={postTitle}
              onChangeText={setPostTitle}
              placeholder="Title"
              placeholderTextColor="#9CA3AF"
              className="text-white text-xl font-bold p-0"
              style={{ paddingVertical: 0 }}
              maxLength={120}
            />
          </View>

          <TextInput
            className="text-white text-base mt-2 p-0"
            placeholder="What's on your mind?"
            placeholderTextColor="#9CA3AF"
            multiline
            value={postText}
            onChangeText={setPostText}
            style={{ minHeight: 120, textAlignVertical: "top" }}
          />

          <View className="mt-4 border-t border-white/10 pt-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-400 text-sm">Status</Text>
              <View
                className={`px-3 py-1 rounded-full ${
                  postText.trim() && (mediaTypeForDB && mediaPathForDB) ? "bg-violet-600" : "bg-white/10"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    postText.trim() && (mediaTypeForDB && mediaPathForDB) ? "text-white" : "text-gray-400"
                  }`}
                >
                  {postText.trim() && (mediaTypeForDB && mediaPathForDB) ? "Ready" : "Not Ready"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tags */}
        {/* ... (unchanged) ... */}

        {/* Post Settings */}
        {/* ... (unchanged) ... */}

        {/* Guidelines */}
        {/* ... (unchanged) ... */}

        {/* Action Buttons */}
        <View className="flex-row justify-between mt-5 mb-6 space-x-3">
          <TouchableOpacity
            className="flex-1 bg-white/30 border border-white/20 rounded-xl py-3 items-center justify-center"
            activeOpacity={0.7}
            onPress={downloadMedia}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-white text-[13px] font-semibold">Save to Device</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-violet-600/90 border border-white/30 rounded-xl py-3 items-center justify-center"
            activeOpacity={0.8}
            onPress={handlePost}
          >
            <Text className="text-white text-[13px] font-semibold">Post Performance</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreatePost;
