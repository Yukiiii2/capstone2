import React, { useRef, useEffect, useState } from "react";
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
  TextInput,
  Keyboard,
  Alert,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import JoinClassModal from "../StudentModal/JoinClassModal";

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
  onLeaveClass?: () => void;
  hasJoinedClass?: boolean;
  setHasJoinedClass?: (value: boolean) => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  visible,
  onDismiss,
  user = {
    name: "Sarah Johnson",
    email: "sarah@gmail.com",
    image: { uri: "https://randomuser.me/api/portraits/women/44.jpg" },
  },
  onLeaveClass,
  hasJoinedClass: propHasJoinedClass,
  setHasJoinedClass: propSetHasJoinedClass,
  onSignOut,
}) => {
  const router = useRouter();
  const [showJoinClassModal, setShowJoinClassModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  // Use prop value if provided, otherwise use local state
  const [localHasJoinedClass, setLocalHasJoinedClass] = useState(propHasJoinedClass || false);
  const hasJoinedClass = propHasJoinedClass !== undefined ? propHasJoinedClass : localHasJoinedClass;
  const setHasJoinedClass = propSetHasJoinedClass || setLocalHasJoinedClass;

  const handleJoinClass = (data: { classCode: string; gradeLevel: string; strand: string }) => {
    const { classCode, gradeLevel, strand } = data;
    
    if (!classCode.trim()) {
      Alert.alert("Error", "Please enter a class code");
      return;
    }
    
    if (!gradeLevel || !strand) {
      Alert.alert("Error", "Please select both grade level and strand");
      return;
    }
    
    // Here you would typically make an API call to join the class
    console.log('Joining class with:', { classCode, gradeLevel, strand });
    
    // For now, we'll simulate a successful join
    setHasJoinedClass(true);
    setShowJoinClassModal(false);
    
    // Show success message with custom modal
    setShowSuccessMessage(true);
    setSuccessMessage(`Successfully joined class as Grade ${gradeLevel} ${strand}`);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  // Animation functions for modal
  const fadeIn = () => {
    setShowLeaveModal(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fadeOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setShowLeaveModal(false));
  };

  const handleLeaveClass = () => {
    setIsLeaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsLeaving(false);
      // Call the onLeaveClass prop if provided
      if (onLeaveClass) {
        onLeaveClass();
      }
      // Update the local state
      setHasJoinedClass(false);
      // Close the modal and profile menu
      fadeOut();
      onDismiss();
    }, 1000);
  };

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
    <View>
      <Modal
        visible={visible}
        transparent
        animationType="none"
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
                setTimeout(() => router.push("/ProfileMenu/settings"), 300);
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

            {hasJoinedClass ? (
              <View>
                <TouchableOpacity
                  className="flex-row items-center p-4 rounded-xl active:bg-white/5"
                  onPress={() => {
                    handleClose();
                    router.push('/ProfileMenu/class-progress');
                  }}
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 bg-[#2D3748] rounded-xl items-center justify-center mr-3">
                    <Ionicons name="people-outline" size={20} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-base font-medium">
                      Class Progress
                    </Text>
                    <Text className="text-white/50 text-xs mt-0.5">
                      View your class progress and compare with classmates.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#718096" />
                </TouchableOpacity>
                <View className="items-center mt-2">
                  <TouchableOpacity
                    className="flex-row items-center bg-red-500/5 px-3 py-1.5 right-10 bottom-3 rounded-lg border border-red-500/30"
                    onPress={fadeIn}
                  >
                    <Ionicons name="exit-outline" size={16} color="#F87171" style={{ marginRight: 6 }} />
                    <Text className="text-red-400 font-medium text-sm">Leave Class</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                className="flex-row items-center p-4 rounded-xl active:bg-white/5"
                onPress={() => {
                  handleClose();
                  setShowJoinClassModal(true);
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
            )}

            <View className="h-px bg-white/10 my-2" />

            <TouchableOpacity
              className="flex-row items-center p-4 rounded-xl active:bg-white/5"
              onPress={() => router.push('/ProfileMenu/logout')}
                activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-[#2D3748] rounded-xl items-center justify-center mr-3">
                <View className="ml-1.5">
                  <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                </View>
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
              <Text className="text-white/30 text-xs">App Version 1.0.0</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Leave Class Confirmation Modal */}
      <Modal
        visible={showLeaveModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={fadeOut}
      >
        <View className="flex-1 justify-center items-center bg-black/70">
          <Animated.View 
            className="bg-slate-800 rounded-2xl p-6 w-11/12 max-w-md border border-white/10"
            style={{ 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 5
            }}
          >
            <View className="items-center mb-6">
              <Ionicons name="warning" size={32} color="#FFFFFF" />
              <Text className="text-white text-xl font-bold mt-3 mb-2">Leave Class?</Text>
              <Text className="text-gray-400 text-sm text-center">
                Are you sure you want to leave this class? You'll lose access to class progress and materials.
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <TouchableOpacity 
                className="flex-1 bg-white/10 py-4 rounded-xl mr-2 items-center"
                onPress={fadeOut}
                disabled={isLeaving}
              >
                <Text className="text-gray-200 text-base font-semibold">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 bg-violet-600/80 py-4 rounded-xl ml-2 items-center"
                onPress={handleLeaveClass}
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    Yes, Leave Class
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <JoinClassModal 
        visible={showJoinClassModal}
        onClose={() => setShowJoinClassModal(false)}
        onJoinClass={handleJoinClass}
      />

      {/* Success Message Modal */}
      <Modal
        visible={showSuccessMessage}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowSuccessMessage(false)}
      >
        <View className="flex-1 justify-center items-center p-4">
          <View className="bg-[#1A1F2E]/95 backdrop-blur-xl rounded-2xl p-6 w-full max-w-md">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mr-3">
                <Ionicons name="checkmark" size={24} color="#8A5CFF" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">Success</Text>
                <Text className="text-white/80 text-sm mt-1">{successMessage}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileMenu;