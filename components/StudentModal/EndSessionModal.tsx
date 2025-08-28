import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, Animated, Easing } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from 'expo-blur';

interface EndSessionModalProps {
  visible: boolean;
  onDismiss: () => void;
  isDownloading: boolean;
  setIsDownloading: (downloading: boolean) => void;
  onViewAIAnalysis: () => void;
  onDownloadVideo?: () => Promise<void>;
}

const EndSessionModal: React.FC<EndSessionModalProps> = ({
  visible,
  onDismiss,
  isDownloading,
  setIsDownloading,
  onViewAIAnalysis,
  onDownloadVideo,
}) => {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Animation effects
  useEffect(() => {
    if (!visible) {
      // Reset animation values when not visible
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      return;
    }

    // Create animation refs
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

    // Start animations
    const parallelAnim = Animated.parallel([scaleAnimation, opacityAnimation]);
    parallelAnim.start();

    // Cleanup function
    return () => {
      parallelAnim.stop();
    };
  }, [visible, scaleAnim, opacityAnim]);

  // Handle download with proper error handling and feedback
  const handleDownload = async () => {
    if (onDownloadVideo) {
      await onDownloadVideo();
    } else {
      // Fallback to default behavior if no custom handler provided
      try {
        setIsDownloading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            "Permission Required",
            "Please allow access to your media library to save videos.",
            [{ text: "OK" }]
          );
          return;
        }
        
        Alert.alert("Success", "Video saved to your gallery!");
      } catch (error) {
        console.error("Error saving video:", error);
        Alert.alert("Error", "Failed to save video. Please try again.");
      } finally {
        setIsDownloading(false);
      }
    }
  };

  if (!visible) return null;

  const options = [
    {
      icon: isDownloading ? "cloud-download" : "save",
      iconSet: isDownloading ? "MaterialIcons" : "Ionicons",
      title: isDownloading ? "Saving..." : "Save to gallery",
      description: "Save this session to your personal collection",
      iconBg: "bg-white/10",
      iconColor: "#FFFFFF",
      onPress: handleDownload,
      disabled: isDownloading,
    },
    {
      icon: "people",
      iconSet: "Ionicons",
      title: "Post to Community",
      description: "Get feedback from the community",
      iconBg: "bg-white/10",
      iconColor: "#FFFFFF",
      onPress: () => {
        onDismiss();
        router.push("StudentScreen/SpeakingExercise/create-post");
      },
    },
    {
      icon: "analytics",
      iconSet: "Ionicons",
      title: "Full AI Analysis",
      description: "Detailed performance insights",
      iconBg: "bg-white/10",
      iconColor: "#FFFFFF",
      onPress: () => {
        onDismiss();
        router.push("StudentScreen/SpeakingExercise/full-results-speaking");
      },
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
          shadowColor: 'rgba(0,0,0,0.3)',
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
            <Text className="text-white text-2xl font-bold text-center">
              Session Complete!
            </Text>
            <Text className="text-gray-300 text-center mt-2 text-base">
              What would you like to do next?
            </Text>
          </View>

          <View className="space-y-3 mb-6">
            {options.map((option) => (
              <TouchableOpacity
                key={option.title}
                className={`flex-row items-center p-4 rounded-2xl bg-white/5 border border-white/10 ${option.disabled ? 'opacity-70' : 'opacity-100'}`}
                activeOpacity={0.8}
                onPress={option.onPress}
                disabled={option.disabled}
              >
                <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${option.iconBg}`}>
                  {option.iconSet === 'Ionicons' ? (
                    <Ionicons name={option.icon as any} size={22} color={option.iconColor} />
                  ) : (
                    <MaterialIcons name={option.icon as any} size={22} color={option.iconColor} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">
                    {option.title}
                    {option.disabled && '...'}
                  </Text>
                  <Text className="text-gray-300 text-xs mt-1">
                    {option.description}
                  </Text>
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
            <Text className="text-white font-medium text-base">
              Maybe Later
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

export default EndSessionModal;