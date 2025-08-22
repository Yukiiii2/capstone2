import React, { useRef, useEffect } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

type SelectionModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSelectOption: (option: "Live Session" | "Community Post") => void;
};

export const LivesessionCommunityModal: React.FC<SelectionModalProps> = ({
  visible,
  onDismiss,
  onSelectOption,
}) => {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        // Only respond to vertical swipes
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 3);
      },
      onPanResponderMove: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        // Only allow dragging downward with resistance
        if (gestureState.dy > 0) {
          // Add resistance to the drag
          const resistance = 0.5; // Higher value = more resistance
          const newY = gestureState.dy * resistance;
          pan.setValue({ x: 0, y: newY });
          // Fade out the overlay as user drags down
          fadeAnim.setValue(1 - newY / 300);
        }
      },
      onPanResponderRelease: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        // Close if dragged down more than 100px or if the velocity is high enough
        if (gestureState.dy > 100 || gestureState.vy > 0.2) {
          handleClose();
        } else {
          // Return to original position with a spring animation
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            tension: 50,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset animations when modal becomes visible
      slideAnim.setValue(300);
      fadeAnim.setValue(0);
      pan.setValue({ x: 0, y: 0 });

      // Start animations
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: false,
          bounciness: 0,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSelect = (option: "Live Session" | "Community Post") => {
    // Animate out before dismissing
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 300,
        useNativeDriver: false,
        bounciness: 0,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onSelectOption(option);
    });
  };

  const handleClose = () => {
    // Animate out before dismissing with a smooth slide-down effect
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 500, // Slide down further for a smoother exit
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(onDismiss);
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Animated.View 
        className="flex-1 justify-end"
        style={{ opacity: fadeAnim }}
      >
        <TouchableOpacity
          className="absolute top-0 left-0 right-0 bottom-0 bg-black/60"
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          className="w-full"
          style={{
            transform: [
              { translateY: Animated.add(slideAnim, pan.y) },
            ]
          }}
        >
          <View className="bg-[#1A1F2E]/95 backdrop-blur-xl rounded-t-3xl overflow-hidden shadow-2xl border-t border-white/10" {...panResponder.panHandlers}>
            {/* Decorative top handle */}
            <View className="items-center py-3">
              <View className="w-12 h-1 bg-white/30 rounded-full" />
            </View>

            <View className="p-5">
              <View className="items-center mb-6">
                <Text className="text-white text-2xl font-bold mb-1">Community</Text>
                <Text className="text-gray-300 text-sm">Choose what to see on community</Text>
              </View>

              <View className="space-y-4 mb-6">
                {/* Live Session Option */}
                <TouchableOpacity
                  className="bg-white/5 border border-white/5 rounded-xl p-4 flex-row items-center active:bg-white/10 shadow"
                  onPress={() => handleSelect("Live Session")}
                  activeOpacity={0.9}
                >
                  <View className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center mr-4">
                    <Ionicons name="videocam-outline" size={22} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-base">Live Session</Text>
                    <Text className="text-gray-300 text-xs">See student live session</Text>
                  </View>
                  <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                    <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                {/* Community Post Option */}
                <TouchableOpacity
                  className="bg-white/5 border border-white/5 rounded-xl p-4 flex-row items-center active:bg-white/10 shadow"
                  onPress={() => handleSelect("Community Post")}
                  activeOpacity={0.9}
                >
                  <View className="w-12 h-12 rounded-xl bg-white/10 items-center justify-center mr-4">
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-base">Peer Review</Text>
                    <Text className="text-gray-300 text-xs">Community share performances</Text>
                  </View>
                  <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center">
                    <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className="py-4 rounded-xl bg-violet-500/80 border border-white/30 items-center justify-center active:bg-white/20"
                onPress={handleClose}
                activeOpacity={0.9}
              >
                <Text className="text-white font-medium text-base">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Bottom safe area for iOS */}
            <View className="h-4 bg-transparent" />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default LivesessionCommunityModal;