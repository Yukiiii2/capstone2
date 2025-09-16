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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabaseClient";

export interface UserProfile {
  name: string;
  email: string;
  image: ImageSourcePropType;
}

export interface ProfileMenuProps {
  visible: boolean;
  onDismiss: () => void;
  user?: UserProfile;      // optional – if passed, we hydrate from it first
  onSignOut?: () => void;
}

/* ───────────────────────────────────────────────────────────── */
/*  Avatar helper (same logic as your home/profilemenunew)       */
/* ───────────────────────────────────────────────────────────── */
async function resolveSignedAvatar(
  userId: string,
  storedPath?: string | null
): Promise<string | null> {
  const stored = (storedPath ?? userId).toString();
  const normalized = stored.replace(/^avatars\//, "");
  let objectPath: string | null = null;

  // If looks like "file.ext", use directly
  if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
    objectPath = normalized;
  } else {
    // Otherwise list user folder, newest first
    const { data: listed, error } = await supabase
      .storage
      .from("avatars")
      .list(normalized, {
        sortBy: { column: "created_at", order: "desc" },
        limit: 1,
      });
    if (error) return null;
    if (listed && listed.length > 0) {
      objectPath = `${normalized}/${listed[0].name}`;
    }
  }

  if (!objectPath) return null;

  const signedRes = await supabase
    .storage
    .from("avatars")
    .createSignedUrl(objectPath, 60 * 60);
  if (signedRes.error) return null;

  return signedRes.data?.signedUrl ?? null;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  visible,
  onDismiss,
  user,
  onSignOut,
}) => {
  const router = useRouter();

  /* display state hydrated from props or Supabase */
  const [fullName, setFullName] = useState<string>(user?.name ?? "");
  const [email, setEmail] = useState<string>(user?.email ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const initials = useMemo(() => {
    const n = (fullName || email || "").trim();
    if (!n) return "U";
    const parts = n.split(/\s+/);
    const a = (parts[0]?.[0] || "").toUpperCase();
    const b = (parts[1]?.[0] || "").toUpperCase();
    return (a + b) || a || "U";
  }, [fullName, email]);

  /* animations (kept like your original) */
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const pan = useRef<Animated.ValueXY>(new Animated.ValueXY()).current;
  const isClosing = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (): boolean => true,
      onMoveShouldSetPanResponder: (
        _: GestureResponderEvent,
        g: PanResponderGestureState
      ): boolean => Math.abs(g.dy) > Math.abs(g.dx * 3),
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

  /* open → hydrate from prop first, then from Supabase */
  useEffect(() => {
    let mounted = true;

    const hydrateFromProp = () => {
      if (!user) return;
      setFullName(user.name ?? "");
      setEmail(user.email ?? "");
      if (typeof user.image === "string") {
        setAvatarUri(user.image);
      } else if ((user.image as any)?.uri) {
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

      const displayName =
        (profile?.name ?? u.user_metadata?.full_name ?? u.email ?? "").toString().trim();

      if (!mounted) return;
      setFullName(displayName);

      const signed = await resolveSignedAvatar(u.id, profile?.avatar_url?.toString() ?? null);
      if (!mounted) return;
      setAvatarUri(signed);
    };

    if (visible) {
      hydrateFromProp();
      loadFromSupabase();
    } else {
      // reset animations when hidden
      pan.setValue({ x: 0, y: 0 });
      sheetOpacity.setValue(0);
    }

    return () => {
      mounted = false;
    };
  }, [visible, user, pan, sheetOpacity]);

  useEffect(() => {
    if (!visible) return;
    isClosing.current = false;

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
    return () => animation.stop();
  }, [visible, pan, sheetOpacity]);

  const handleSignOut = () => {
    onDismiss();
    setTimeout(() => onSignOut?.(), 300);
  };

  // Image source resolution (prop overrides supabase if provided)
  const imageSource =
    avatarUri
      ? { uri: avatarUri }
      : typeof user?.image === "string"
        ? { uri: user.image }
        : user?.image ?? undefined;

  return (
    <View>
      <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
        <Animated.View className="flex-1 bg-black/50" style={{ opacity: sheetOpacity }}>
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={handleClose} />
          <Animated.View
            className="absolute bottom-0 left-0 right-0 bg-[#1A1F2E]/95 border-t border-white/15 rounded-t-3xl p-6 pb-10"
            style={{ transform: [{ translateY: pan.y }] }}
            {...panResponder.panHandlers}
          >
            {/* Handle bar */}
            <View className="items-center mb-4">
              <View className="w-16 h-1 bg-white/30 rounded-full mb-4" />
            </View>

            {/* Profile section (UI unchanged) */}
            <View className="items-center mb-6">
              <View className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#8A5CFF]/50 items-center justify-center bg-white/10">
                {imageSource ? (
                  <Image source={imageSource as any} className="w-20 h-20" resizeMode="cover" />
                ) : (
                  <Text className="text-white text-2xl font-bold">{initials}</Text>
                )}
                <View className="absolute -bottom-1 -right-1 bg-[#8A5CFF] w-5 h-5 rounded-full items-center justify-center border-2 border-[#1A1F2E]">
                  <Ionicons name="checkmark" size={12} color="white" />
                </View>
              </View>
              <Text className="text-white text-xl font-bold mt-4">
                {fullName || "Teacher"}
              </Text>
              <Text className="text-white/60 text-sm mt-1">{email || "—"}</Text>
            </View>

            {/* Menu items */}
            <View className="space-y-2">
              <TouchableOpacity
                className="flex-row items-center p-4 rounded-xl active:bg-white/5"
                onPress={() => {
                  handleClose();
                  setTimeout(() => {
                    // keep your teacher route here
                    // (change to "/settings" if that's your unified route)
                    router.push("/ProfileMenu/settings");
                  }, 300);
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

              <View className="h-px bg-white/10 my-2" />

              <TouchableOpacity
                className="flex-row items-center p-4 rounded-xl active:bg-white/5"
                onPress={handleSignOut}
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
    </View>
  );
};

export default ProfileMenu;
