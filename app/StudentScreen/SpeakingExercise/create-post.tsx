import React, { useState, useRef, useEffect } from "react";
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
import { Switch } from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { supabase } from "@/lib/supabaseClient";

const CreatePost = () => {
  const { videoUri } = useLocalSearchParams<{ videoUri: string }>();
  const router = useRouter();
  
  // Refs
  const videoRef = useRef<Video>(null);
  const tagInputRef = useRef<TextInput>(null);
  
  // State variables
  const [postText, setPostText] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState(["Business", "Presentation", "Professional"]);
  const [allowComments, setAllowComments] = useState(true);
  const [allowRatings, setAllowRatings] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Video status state
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

  // ------- NEW: module selected for DB (no UI change) -------
  // We’ll resolve the first active speaking module for Basic/Advanced
  const [moduleTitle, setModuleTitle] = useState<string | null>(null);

  useEffect(() => {
    // level: true => "Advanced" in your chip, false => "Basic"
    const level = isPublic ? "advanced" : "basic";
    (async () => {
      try {
        const { data, error } = await supabase
          .from("modules")
          .select("title")
          .eq("category", "speaking")
          .eq("level", level)
          .eq("active", true)
          .order("order_index", { ascending: true })
          .limit(1);
        if (error) {
          console.log("[create-post] modules query error:", error.message);
          setModuleTitle(null);
          return;
        }
        setModuleTitle(data?.[0]?.title ?? null);
      } catch (e) {
        console.log("[create-post] modules query threw:", e);
        setModuleTitle(null);
      }
    })();
  }, [isPublic]);

  // Initialize video on mount and when videoUri changes
  useEffect(() => {
    if (!videoRef.current || !videoUri) return;

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
  }, [videoUri]);

  /**
   * Handles video playback toggle
   */
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

      if (!hasPlayed) {
        setHasPlayed(true);
      }
    } catch (error) {
      console.error("Error toggling video playback:", error);
    }
  };

  /**
   * Downloads video to device gallery
   */
  const downloadVideo = async () => {
    if (!videoUri) {
      Alert.alert("Error", "No video available to save.");
      return;
    }

    try {
      setIsDownloading(true);

      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();

      if (status !== "granted") {
        if (!canAskAgain) {
          Alert.alert(
            "Permission Required",
            "Storage permission is required to save videos. You can enable it in app settings if you change your mind.",
            [
              {
                text: "OK",
                style: "default",
                onPress: () => setIsDownloading(false),
              },
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

      const fileName = `recording-${new Date().getTime()}.mp4`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: videoUri as string,
        to: fileUri,
      });

      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync("Recordings", asset, false);

      Alert.alert("Success", "Video saved to gallery!");
    } catch (error) {
      console.error("Error saving video:", error);
      Alert.alert(
        "Error", 
        error instanceof Error ? `Failed to save video: ${error.message}` : "An unknown error occurred while saving the video."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Handles posting content
   * (DB insert only; UI unchanged)
   */
  const handlePost = async () => {
    if (!postText.trim()) {
      Alert.alert("Add something first", "Write a short caption before posting.");
      return;
    }

    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        Alert.alert("Not signed in", "Please log in again.");
        return;
      }

      // Your title block in the card says "Business Presentation Practice".
      // We’ll keep that as the DB title to match visual.
      const titleForDb = "Business Presentation Practice";

      const { error: insertErr } = await supabase
        .from("posts")
        .insert([
          {
            user_id: user.id,
            title: titleForDb,
            content: postText.trim(),
            media_url: (videoUri as string) || null,
            module: moduleTitle,            // resolved from modules table
            type: "speaking",
            status: "published",            // it’s going to community
            visibility: "public",           // visible in community-selection
            allow_comments: allowComments,  // NEW column
            allow_reviews: allowRatings,    // NEW column
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
      router.back(); // keep your original behavior
    } catch (e: any) {
      console.log("[create-post] unhandled error:", e?.message || e);
      Alert.alert("Post failed", e?.message || "Something went wrong.");
    }
  };

  /**
   * Adds a new tag to the tags list
   */
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
    setShowTagInput(false);
  };

  /**
   * Removes a tag from the tags list
   */
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  /**
   * Background decoration component
   */
  const BackgroundDecor = () => (
    <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
      <View className="absolute left-0 right-0 top-0 bottom-0">
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A"]}
          style={{ flex: 1 }}
        />
      </View>
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
    </View>
  );

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
          <Text className="text-white text-xl font-bold">Create Post</Text>
          <View className="w-8" />
        </View>

        {/* Video Preview */}
        {videoUri && (
          <View className="mb-4 rounded-xl overflow-hidden">
            <View className="relative">
              <Video
                ref={videoRef}
                source={{ uri: videoUri }}
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
          </View>
        )}

        {/* Post Content */}
        <View className="bg-white/10 rounded-2xl p-5 mb-4 border border-white/10">
          <View className="flex-row items-start space-x-3 mb-4">
            <Image
              source={{
                uri: "https://randomuser.me/api/portraits/women/44.jpg",
              }}
              className="w-12 h-12 rounded-full"
            />
            <View className="flex-1">
              <Text className="text-white font-medium">You</Text>
              <TouchableOpacity
                onPress={() => setIsPublic(!isPublic)}
                className="flex-row items-center mt-1 bg-white/10 rounded-full px-3 py-1 self-start"
              >
                <Ionicons
                  name={isPublic ? "school" : "school-outline"}
                  size={14}
                  color="#9CA3AF"
                />
                <Text className="text-gray-400 text-xs ml-1">
                  {isPublic ? "Advanced" : "Basic"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-2 mt-2" style={{ left: 6 }}>
            <Text className="text-white text-xl font-bold">
              Business Presentation Practice
            </Text>
          </View>

          <View className="mb-4 rounded-xl overflow-hidden bg-black/30 border border-white/10">
            {hasPlayed ? (
              <View className="relative">
                <Video
                  ref={videoRef}
                  style={{
                    width: "100%",
                    aspectRatio: 16 / 9,
                    backgroundColor: "#000",
                  }}
                  source={{ uri: videoUri }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping
                  shouldPlay={isPlaying}
                  onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                    if (!status.isLoaded) return;
                    setIsPlaying(status.isPlaying);
                    if (status.durationMillis) {
                      setDuration(status.durationMillis);
                    }
                    if (status.positionMillis !== undefined) {
                      setCurrentTime(status.positionMillis);
                      const newProgress = status.durationMillis
                        ? (status.positionMillis / status.durationMillis) * 100
                        : 0;
                      setProgress(newProgress);
                    }
                  }}
                />
                {!isPlaying && (
                  <TouchableOpacity
                    className="absolute inset-0 bg-black/30"
                    activeOpacity={1}
                    onPress={handlePlayVideo}
                  />
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
            ) : (
              <TouchableOpacity
                className="aspect-video bg-black/50 items-center justify-center"
                activeOpacity={0.8}
                onPress={handlePlayVideo}
              >
                <Ionicons
                  name="play-circle"
                  size={60}
                  color="white"
                  style={{ opacity: 0.8 }}
                />
                <Text className="text-white mt-2 text-sm">Tap to preview</Text>
              </TouchableOpacity>
            )}
            <View className="p-3">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-white font-medium">Your Recording</Text>
                <Text className="text-gray-400 text-xs">
                  {`${Math.floor(currentTime / 60000)}:${Math.floor(
                    (currentTime % 60000) / 1000
                  )
                    .toString()
                    .padStart(
                      2,
                      "0"
                    )} / ${Math.floor(duration / 60000)}:${Math.floor(
                    (duration % 60000) / 1000
                  )
                    .toString()
                    .padStart(2, "0")}`}
                </Text>
              </View>
              <View className="w-full bg-white/20 rounded-full h-1.5">
                <View
                  className="bg-white h-full rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
            </View>
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
                className={`px-3 py-1 rounded-full ${postText.trim() ? "bg-violet-600" : "bg-white/10"}`}
              >
                <Text
                  className={`text-xs font-medium ${postText.trim() ? "text-white" : "text-gray-400"}`}
                >
                  {postText.trim() ? "Ready" : "Not Ready"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tags */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <TouchableOpacity
              key={index}
              className="flex-row items-center bg-white/10 px-3 py-1 rounded-full"
              onPress={() => removeTag(tag)}
            >
              <Text className="text-white text-xs">#{tag}</Text>
              <Ionicons
                name="close"
                size={14}
                color="#fff"
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          ))}
          {showTagInput ? (
            <View className="flex-row items-center bg-white/5 border border-white/20 px-3 py-1 rounded-full">
              <TextInput
                ref={tagInputRef}
                autoFocus
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={handleAddTag}
                onBlur={handleAddTag}
                placeholder="Tag name..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                className="text-white text-xs py-1 px-1 min-w-[80px]"
                maxLength={20}
                returnKeyType="done"
              />
              <TouchableOpacity onPress={handleAddTag} className="ml-1">
                <Ionicons name="checkmark" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="border border-white/20 px-3 py-1 rounded-full flex-row items-center"
              onPress={() => {
                setShowTagInput(true);
                setTimeout(() => tagInputRef.current?.focus(), 100);
              }}
            >
              <Text className="text-white/60 text-xs">+ Add Tag</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Post Settings */}
        <View className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
          <Text className="text-white font-medium mb-3">Post Settings</Text>

          <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-white/5">
            <View>
              <Text className="text-white text-sm">Allow Comments</Text>
              <Text className="text-gray-400 text-xs">
                Let others comment on your post
              </Text>
            </View>
            <Switch
              value={allowComments}
              onValueChange={setAllowComments}
              trackColor={{ false: "#3b3b3b", true: "#7c3aed" }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-white text-sm">
                Allow Ratings & Reviews
              </Text>
              <Text className="text-gray-400 text-xs">
                Let others rate and review your post
              </Text>
            </View>
            <Switch
              value={allowRatings}
              onValueChange={setAllowRatings}
              trackColor={{ false: "#3b3b3b", true: "#7c3aed" }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Post Guidelines */}
        <View className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <View className="p-3">
            <Text className="text-white font-medium mb-2">
              Community Guidelines
            </Text>
            <View className="space-y-1">
              <Text className="text-gray-400 text-sm">
                • Keep content relevant to language learning.
              </Text>
              <Text className="text-gray-400 text-sm">
                • No inappropriate Caption.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-between mt-5 mb-6 space-x-3">
          <TouchableOpacity
            className="flex-1 bg-white/30 border border-white/20 rounded-xl py-3 items-center justify-center"
            activeOpacity={0.7}
            onPress={downloadVideo}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-white text-[13px] font-semibold">
                Save Video
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-violet-600/90 border border-white/30 rounded-xl py-3 items-center justify-center"
            activeOpacity={0.8}
            onPress={handlePost}
          >
            <Text className="text-white text-[13px] font-semibold">
              Post Performance
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreatePost;
