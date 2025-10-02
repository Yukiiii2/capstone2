import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Alert, Animated, Easing } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface EndSessionModalProps {
  visible: boolean;
  onDismiss: () => void;

  // Parent-owned actions (parent knows the recorded URI + upload state)
  onDownloadVideo?: () => Promise<void>;
  onViewAIAnalysis: () => void;
  onShareToCommunity?: () => Promise<void> | void;

  // Busy flags from parent to disable buttons while uploading/saving
  isDownloading: boolean;
  setIsDownloading: (downloading: boolean) => void;
  isUploading?: boolean;
  actionBusyText?: string;
}

const EndSessionModal: React.FC<EndSessionModalProps> = ({
  visible,
  onDismiss,
  isDownloading,
  setIsDownloading,
  onViewAIAnalysis,
  onDownloadVideo,
  onShareToCommunity,
  isUploading = false,
  actionBusyText = "Please wait…",
}) => {
  const router = useRouter();

  // Hooks MUST be called unconditionally, before any early return.
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [isFiring, setIsFiring] = useState(false);

  // Animate in when visible flips true
  useEffect(() => {
    if (!visible) {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      setIsFiring(false);
      return;
    }

    const scaleAnimation = Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    });

    const opacityAnimation = Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    });

    const parallelAnim = Animated.parallel([scaleAnimation, opacityAnimation]);
    parallelAnim.start();

    return () => {
      parallelAnim.stop();
    };
  }, [visible, scaleAnim, opacityAnim]);

  const handleDownload = async () => {
    if (!onDownloadVideo) {
      Alert.alert("No recording available", "Please record first, then tap Continue to save.");
      return;
    }
    if (isFiring || isDownloading) return;
    setIsFiring(true);
    try {
      await onDownloadVideo();
    } finally {
      setIsFiring(false);
    }
  };

  const handleShareToCommunity = async () => {
    if (isFiring || isUploading) return;
    setIsFiring(true);
    try {
      if (onShareToCommunity) {
        await onShareToCommunity(); // parent ensures upload, then navigates
        onDismiss();
      } else {
        // fallback only (not recommended)
        onDismiss();
        router.push("StudentScreen/SpeakingExercise/create-post");
      }
    } catch (e: any) {
      Alert.alert("Unable to share", String(e?.message || e));
    } finally {
      setIsFiring(false);
    }
  };

  const handleAIAnalysis = () => {
    if (isFiring || isUploading) return;
    setIsFiring(true);
    try {
      onViewAIAnalysis(); // parent passes local_uri/media_url when navigating
    } finally {
      setIsFiring(false);
    }
  };

  // Now it’s safe to early-return AFTER all hooks were called
  if (!visible) return null;

  const saveDisabled = isDownloading || isFiring;
  const communityDisabled = isUploading || isFiring;
  const analysisDisabled = isUploading || isFiring;

  const options = [
    {
      key: "save",
      icon: isDownloading ? "cloud-download" : "save",
      iconSet: isDownloading ? "MaterialIcons" : "Ionicons",
      title: isDownloading ? "Saving..." : "Save to gallery",
      description: "Save this session to your personal collection",
      iconBg: "bg-white/10",
      iconColor: "#FFFFFF",
      onPress: handleDownload,
      disabled: saveDisabled,
    },
    {
      key: "community",
      icon: "people",
      iconSet: "Ionicons",
      title: communityDisabled ? actionBusyText : "Post to Community",
      description: communityDisabled ? "Please wait…" : "Get feedback from the community",
      iconBg: "bg-white/10",
      iconColor: "#FFFFFF",
      onPress: handleShareToCommunity,
      disabled: communityDisabled,
    },
    {
      key: "analysis",
      icon: "analytics",
      iconSet: "Ionicons",
      title: analysisDisabled ? actionBusyText : "Full AI Analysis",
      description: analysisDisabled ? "Please wait…" : "Detailed performance insights",
      iconBg: "bg-white/10",
      iconColor: "#FFFFFF",
      onPress: handleAIAnalysis,
      disabled: analysisDisabled,
    },
  ];

  return (
    <Animated.View
      className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center z-50"
      style={{ opacity: opacityAnim }}
    >
      <View className="absolute top-0 left-0 right-0 bottom-0 bg-[#1A1F2E]/95 backdrop-blur-xl" />

      <Animated.View
        className="w-[90%] max-w-md rounded-3xl overflow-hidden"
        style={{
          transform: [{ scale: scaleAnim }],
          shadowColor: "rgba(0,0,0,0.3)",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 15,
          elevation: 5,
        }}
      >
        <View className="bg-[#1A1F2E] p-6">
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-2xl bg-white/20 items-center justify-center mb-3">
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </View>
            <Text className="text-white text-2xl font-bold text-center">Session Complete!</Text>
            <Text className="text-gray-300 text-center mt-2 text-base">
              What would you like to do next?
            </Text>
          </View>

          <View className="space-y-3 mb-6">
            {options.map((option) => (
              <TouchableOpacity
                key={option.key}
                className={`flex-row items-center p-4 rounded-2xl bg-white/5 border border-white/10 ${
                  option.disabled ? "opacity-70" : "opacity-100"
                }`}
                activeOpacity={0.8}
                onPress={option.onPress}
                disabled={option.disabled}
              >
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${option.iconBg}`}
                >
                  {option.iconSet === "Ionicons" ? (
                    <Ionicons name={option.icon as any} size={22} color={option.iconColor} />
                  ) : (
                    <MaterialIcons name={option.icon as any} size={22} color={option.iconColor} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">{option.title}</Text>
                  <Text className="text-gray-300 text-xs mt-1">{option.description}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#64748B"
                  style={{ opacity: option.disabled ? 0.3 : 0.7 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className="w-full py-4 bg-violet-500/90 border border-white/30 rounded-xl items-center justify-center mt-2 active:bg-white/20"
            onPress={onDismiss}
            activeOpacity={0.9}
          >
            <Text className="text-white font-medium text-base">Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

export default EndSessionModal;
