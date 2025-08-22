import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Modal,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export interface UserProfile {
  name: string;
  email: string;
  image: ImageSourcePropType;
}

export interface ProfileMenuProps {
  visible: boolean;
  onDismiss: () => void;
  user?: UserProfile;
  onSignOut?: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  visible,
  onDismiss,
  user = {
    name: "Sarah Johnson",
    email: "sarah@gmail.com",
    image: { uri: "https://randomuser.me/api/portraits/women/44.jpg" },
  },
  onSignOut,
}) => {
  const router = useRouter();
  const sheetY = useRef(new Animated.Value(0)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const pan = useRef<Animated.ValueXY>(new Animated.ValueXY()).current;

  // Use ref to track if we're closing to prevent multiple calls
  const isClosing = useRef(false);

  // Initialize PanResponder with proper types
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (): boolean => true,
      onMoveShouldSetPanResponder: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ): boolean => {
        // Only respond to vertical swipes
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 3);
      },
      onPanResponderMove: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ): void => {
        // Only allow dragging downward with resistance
        if (gestureState.dy > 0) {
          // Add resistance to the drag
          const resistance = 0.6;
          const newY = gestureState.dy * resistance;
          pan.setValue({ x: 0, y: newY });
          // Fade out the overlay as user drags down
          sheetOpacity.setValue(1 - newY / 500);
        }
      },
      onPanResponderRelease: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ): void => {
        // Close if dragged down more than 100px or if the velocity is high enough
        if (gestureState.dy > 100 || (gestureState.vy ?? 0) > 0.2) {
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

  const handleClose = () => {
    if (isClosing.current) return;
    isClosing.current = true;

    // Animate out with a smooth slide-down effect
    Animated.parallel([
      Animated.timing(pan, {
        toValue: { x: 0, y: 500 },
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      isClosing.current = false;
      onDismiss();
    });
  };

  useEffect(() => {
    if (!visible) {
      // Reset values when not visible
      pan.setValue({ x: 0, y: 0 });
      sheetOpacity.setValue(0);
      return;
    }

    // Reset closing state when modal becomes visible
    isClosing.current = false;

    // Start animations
    const animation = Animated.parallel([
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
        bounciness: 0,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [visible, pan, sheetOpacity]);

  // Handle sign out with proper cleanup
  const handleSignOut = () => {
    onDismiss();
    // Use setTimeout to ensure modal is fully dismissed before sign out
    setTimeout(() => {
      onSignOut?.();
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none" // Changed to none since we handle our own animations
      onRequestClose={handleClose}
    >
      <Animated.View
        className="flex-1 bg-black/50"
        style={{ opacity: sheetOpacity }}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          className="absolute bottom-0 left-0 right-0 bg-[#1A1F2E]/95 rounded-t-3xl p-6 pt-4 pb-8"
          style={{
            borderTopWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.15)',
            paddingBottom: 40,
            transform: [{ translateY: pan.y }],
          }}
          {...panResponder.panHandlers}
        >
          {/* Handle bar */}
          <View className="items-center mb-4">
            <View className="w-16 h-1 bg-white/30 rounded-full mb-4" />
          </View>

          {/* Profile section */}
          <View className="items-center mb-6">
            <View className="relative">
              <Image
                source={
                  typeof user.image === 'string'
                    ? { uri: user.image }
                    : user.image
                }
                className="w-20 h-20 rounded-full border-2 border-[#8A5CFF]/50"
                resizeMode="cover"
              />
              <View className="absolute -bottom-1 -right-1 bg-[#8A5CFF] w-5 h-5 rounded-full items-center justify-center border-2 border-[#1A1F2E]">
                <Ionicons name="checkmark" size={12} color="white" />
              </View>
            </View>
            <Text className="text-white text-xl font-bold mt-4">
              {user.name}
            </Text>
            <Text className="text-white/60 text-sm mt-1">
              {user.email}
            </Text>
          </View>

          {/* Menu items */}
          <View className="space-y-2">
            <TouchableOpacity
              className="flex-row items-center p-4 rounded-xl active:bg-white/5"
              onPress={() => {
                handleClose();
                setTimeout(() => router.push("/settings"), 300);
              }}
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-[#2D3748] rounded-xl items-center justify-center mr-3">
                <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-base font-medium">
                  Settings
                </Text>
                <Text className="text-white/50 text-xs mt-0.5">
                  Account and app preferences
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#718096" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 rounded-xl active:bg-white/5"
              onPress={() => {
                handleClose();
                setTimeout(() => router.push("/join-class-section"), 300);
              }}
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-[#2D3748] rounded-xl items-center justify-center mr-3">
                <Ionicons name="school-outline" size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-white text-base font-medium">
                    Join Class
                  </Text>
                  <View className="ml-2 bg-[#8A5CFF]/20 px-2 py-0.5 rounded-full">
                    <Text className="text-[#8A5CFF] text-xs font-medium">NEW</Text>
                  </View>
                </View>
                <Text className="text-white/50 text-xs mt-0.5">
                Teacher can track your progress and provide assistance.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#718096" />
            </TouchableOpacity>

            <View className="h-px bg-white/10 my-2" />

            <TouchableOpacity
              className="flex-row items-center p-4 rounded-xl active:bg-white/5"
              onPress={() => router.push('/logout')}
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-[#2D3748] rounded-xl items-center justify-center mr-3">
                <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
              </View>
              <View className="flex-1">
                <Text className="text-[#FF6B6B] text-base font-medium">
                  Sign Out
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* App version */}
          <View className="mt-6 items-center">
            <Text className="text-white/30 text-xs">
              App Version 1.0.0
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default ProfileMenu;