import React, { useRef, useEffect, useState, useMemo } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import JoinClassModal from "../StudentModal/JoinClassModal";

// ⬇️ same import style as your project
import { supabase } from "@/lib/supabaseClient";


export interface UserProfile {
  name: string;
  email: string;
  image: ImageSourcePropType;
}

export interface ProfileMenuProps {
  visible: boolean;
  onDismiss: () => void;
  user?: UserProfile;                  // optional – if not passed, we load from Supabase
  onSignOut?: () => void;
  onLeaveClass?: () => void;
  hasJoinedClass?: boolean;
  setHasJoinedClass?: (value: boolean) => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  visible,
  onDismiss,
  user,
  onLeaveClass,
  hasJoinedClass: propHasJoinedClass,
  setHasJoinedClass: propSetHasJoinedClass,
  onSignOut,
}) => {
  const router = useRouter();

  // Local user display state (kept in sync with props if provided)
  const [fullName, setFullName] = useState<string>(user?.name ?? "");
  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // initials fallback
  const initials = useMemo(() => {
    const n = (fullName || email || "").trim();
    if (!n) return "U";
    const parts = n.split(/\s+/);
    const a = (parts[0]?.[0] || "").toUpperCase();
    const b = (parts[1]?.[0] || "").toUpperCase();
    return (a + b) || a || "U";
  }, [fullName, email]);

  // Join/leave class UI state
  const [showJoinClassModal, setShowJoinClassModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const pan = useRef<Animated.ValueXY>(new Animated.ValueXY()).current;
  const isClosing = useRef(false);

  // Use prop value if provided, otherwise local state
  const [localHasJoinedClass, setLocalHasJoinedClass] = useState(
    propHasJoinedClass || false
  );
  const hasJoinedClass =
    propHasJoinedClass !== undefined ? propHasJoinedClass : localHasJoinedClass;
  const setHasJoinedClass =
    propSetHasJoinedClass || setLocalHasJoinedClass;

  // ---------- Load user (name/email/avatar) when opened ----------
  useEffect(() => {
    let mounted = true;

    const hydrateFromProps = () => {
      if (!user) return;
      setFullName(user.name);
      setEmail(user.email);

      // If the caller already passed an image, use it
      if (typeof user.image === "string") {
        setAvatarUri(user.image);
      } else if (user.image && (user.image as any).uri) {
        setAvatarUri((user.image as any).uri);
      }
    };

    const loadFromSupabase = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u || !mounted) return;

      setEmail(u.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", u.id)
        .single();

      const nameValue =
        (profile?.name ?? u.user_metadata?.full_name ?? u.email ?? "").trim();

      if (!mounted) return;
      setFullName(nameValue);

      // Resolve avatar from private "avatars" bucket
      const resolveSigned = async (): Promise<string | null> => {
        const stored = profile?.avatar_url?.toString() || u.id;
        const normalized = stored.replace(/^avatars\//, "");
        let objectPath: string | null = null;

        // If includes a filename (has extension) use it
        if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
          objectPath = normalized;
        } else {
          // Otherwise list newest file in user's folder
          const { data: list, error: listErr } = await supabase.storage
            .from("avatars")
            .list(normalized, {
              limit: 1,
              sortBy: { column: "created_at", order: "desc" },
            });
          if (listErr) return null;
          if (list && list.length > 0)
            objectPath = `${normalized}/${list[0].name}`;
        }

        if (!objectPath) return null;

        const { data: signed, error: signErr } = await supabase.storage
          .from("avatars")
          .createSignedUrl(objectPath, 60 * 60);
        if (signErr) return null;
        return signed?.signedUrl ?? null;
      };

      const signedUrl = await resolveSigned();
      if (!mounted) return;
      setAvatarUri(signedUrl);
    };

    if (visible) {
      // Prefer explicit user prop if provided, then hydrate from Supabase
      hydrateFromProps();
      loadFromSupabase();
    }

    return () => {
      mounted = false;
    };
  }, [visible, user]);

  // ---------- Pan responder for sheet ----------
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 3),
      onPanResponderMove: (_: GestureResponderEvent, g: PanResponderGestureState) => {
        if (g.dy > 0) {
          const resistance = 0.6;
          const newY = g.dy * resistance;
          pan.setValue({ x: 0, y: newY });
          sheetOpacity.setValue(1 - newY / 500);
        }
      },
      onPanResponderRelease: (_: GestureResponderEvent, g: PanResponderGestureState) => {
        if (g.dy > 100 || (g.vy ?? 0) > 0.2) handleClose();
        else {
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
    if (!visible) {
      pan.setValue({ x: 0, y: 0 });
      sheetOpacity.setValue(0);
      return;
    }
    isClosing.current = false;

    Animated.parallel([
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
    ]).start();
  }, [visible, pan, sheetOpacity]);

  const handleClose = () => {
    if (isClosing.current) return;
    isClosing.current = true;

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

  const handleLeaveClass = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsLeaving(false);
      onLeaveClass?.();
      setHasJoinedClass(false);
      setShowLeaveModal(false);
      onDismiss();
    }, 1000);
  };

  const handleJoinClass = (data: { classCode: string; gradeLevel: string; strand: string }) => {
    if (!data.classCode.trim()) return;
    setHasJoinedClass(true);
    setShowJoinClassModal(false);
    setSuccessMessage(`Successfully joined class as Grade ${data.gradeLevel} ${data.strand}`);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleSignOutPress = () => {
    handleClose();
    setTimeout(() => onSignOut?.(), 300);
  };

  return (
    <View>
      <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
        <Animated.View className="flex-1 bg-black/50" style={{ opacity: sheetOpacity }}>
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={handleClose} />
          <Animated.View
            className="absolute bottom-0 left-0 right-0 bg-[#1A1F2E]/95 rounded-t-3xl p-6 pt-4 pb-8"
            style={{
              borderTopWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.15)",
              paddingBottom: 40,
              transform: [{ translateY: pan.y }],
            }}
            {...panResponder.panHandlers}
          >
            {/* Handle bar */}
            <View className="items-center mb-4">
              <View className="w-16 h-1 bg-white/30 rounded-full mb-4" />
            </View>

            {/* Profile */}
            <View className="items-center mb-6">
              <View className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#8A5CFF]/50 items-center justify-center bg-white/10">
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} className="w-20 h-20" resizeMode="cover" />
                ) : (
                  <Text className="text-white text-2xl font-bold">{initials}</Text>
                )}
                <View className="absolute -bottom-1 -right-1 bg-[#8A5CFF] w-5 h-5 rounded-full items-center justify-center border-2 border-[#1A1F2E]">
                  <Ionicons name="checkmark" size={12} color="white" />
                </View>
              </View>
              <Text className="text-white text-xl font-bold mt-4">{fullName || "User"}</Text>
              <Text className="text-white/60 text-sm mt-1">{email || "—"}</Text>
            </View>

            {/* Menu items */}
            <View className="space-y-2">
              <TouchableOpacity
                className="flex-row items-center p-4 rounded-xl active:bg-white/5"
                onPress={() => {
                  handleClose();
                  setTimeout(() => router.push("/settings"), 300); // 
                }}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 bg-[#2D3748] rounded-xl items-center justify-center mr-3">
                  <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base font-medium">Settings</Text>
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
                      router.push("/ProfileMenu/class-progress");
                    }}
                    activeOpacity={0.7}
                  >
                    <View className="w-10 h-10 bg-[#2D3748] rounded-xl items-center justify-center mr-3">
                      <Ionicons name="people-outline" size={20} color="#FFFFFF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-base font-medium">Class Progress</Text>
                      <Text className="text-white/50 text-xs mt-0.5">
                        View your class progress and compare with classmates.
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#718096" />
                  </TouchableOpacity>
                  <View className="items-center mt-2">
                    <TouchableOpacity
                      className="flex-row items-center bg-red-500/5 px-3 py-1.5 right-10 bottom-3 rounded-lg border border-red-500/30"
                      onPress={() => setShowLeaveModal(true)}
                    >
                      <Ionicons
                        name="exit-outline"
                        size={16}
                        color="#F87171"
                        style={{ marginRight: 6 }}
                      />
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
                      <Text className="text-white text-base font-medium">Join Class</Text>
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
                onPress={handleSignOutPress}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 bg-[#2D3748] rounded-xl items-center justify-center mr-3">
                  <View className="ml-1.5">
                    <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-[#FF6B6B] text-base font-medium">Sign Out</Text>
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

      {/* Leave Class Confirmation */}
      <Modal
        visible={showLeaveModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/70">
          <Animated.View
            className="bg-slate-800 rounded-2xl p-6 w-11/12 max-w-md border border-white/10"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 5,
            }}
          >
            <View className="items-center mb-6">
              <Ionicons name="warning" size={32} color="#FFFFFF" />
              <Text className="text-white text-xl font-bold mt-3 mb-2">Leave Class?</Text>
              <Text className="text-gray-400 text-sm text-center">
                Are you sure you want to leave this class? You'll lose access to class progress and
                materials.
              </Text>
            </View>

            <View className="flex-row justify-between">
              <TouchableOpacity
                className="flex-1 bg-white/10 py-4 rounded-xl mr-2 items-center"
                onPress={() => setShowLeaveModal(false)}
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
                  <Text className="text-white text-base font-semibold">Yes, Leave Class</Text>
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

      {/* Success Message */}
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
