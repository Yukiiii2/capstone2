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
import { supabase } from "@/lib/supabaseClient";

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
  onLeaveClass?: () => void; // optional external callback
  hasJoinedClass?: boolean;
  setHasJoinedClass?: (value: boolean) => void;
}

const JOIN_TABLE = "class_join_requests";
const STUDENT_CLASS_TABLE = "teacher_students";

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

  // Sheet UI state
  const [showJoinClassModal, setShowJoinClassModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Animations for bottom sheet
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const pan = useRef<Animated.ValueXY>(new Animated.ValueXY()).current;
  const isClosing = useRef(false);

  // Animations for Leave modal
  const leaveFadeAnim = useRef(new Animated.Value(0)).current;
  const leaveSlideAnim = useRef(new Animated.Value(40)).current;

  // Prop/local joined toggle
  const [localHasJoinedClass, setLocalHasJoinedClass] = useState(propHasJoinedClass || false);
  const hasJoinedClass = propHasJoinedClass !== undefined ? propHasJoinedClass : localHasJoinedClass;
  const setHasJoinedClass = propSetHasJoinedClass || setLocalHasJoinedClass;

  // Join request status (pending/approved)
  const [joinStatus, setJoinStatus] = useState<"none" | "pending" | "approved">("none");
  const [latestCode, setLatestCode] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);

  // ---------- Load user (name/email/avatar) when opened ----------
  useEffect(() => {
    let mounted = true;

    const hydrateFromProps = () => {
      if (!user) return;
      setFullName(user.name);
      setEmail(user.email);

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

      const signedUrl = await resolveSigned();
      if (!mounted) return;
      setAvatarUri(signedUrl);
    };

    if (visible) {
      hydrateFromProps();
      loadFromSupabase();
    }

    return () => {
      mounted = false;
    };
  }, [visible, user]);

  // ---------- Active class membership (teacher_students) ----------
  useEffect(() => {
    if (!visible) return;

    let mounted = true;
    let chan: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;

      // Is the student currently in an active class?
      const { data: membership } = await supabase
        .from(STUDENT_CLASS_TABLE)
        .select("id")
        .eq("student_id", uid)
        .eq("status", "active")
        .limit(1);

      if (!mounted) return;
      setHasJoinedClass(Boolean(membership && membership.length > 0));

      // Realtime: reflect future changes (leave/rejoin/approval creates row)
      chan = supabase
        .channel(`pm-classes-${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: STUDENT_CLASS_TABLE, filter: `student_id=eq.${uid}` },
          async () => {
            const { data: cur } = await supabase
              .from(STUDENT_CLASS_TABLE)
              .select("id")
              .eq("student_id", uid)
              .eq("status", "active")
              .limit(1);
            setHasJoinedClass(Boolean(cur && cur.length > 0));
          }
        )
        .subscribe();
    })();

    return () => {
      mounted = false;
      if (chan) supabase.removeChannel(chan);
    };
  }, [visible, setHasJoinedClass]);

  // ---------- Fetch latest join request + subscribe for approval ----------
  useEffect(() => {
    if (!visible) return;

    let mounted = true;
    let chan: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      setStatusLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        setStatusLoading(false);
        return;
      }

      const { data: last } = await supabase
        .from(JOIN_TABLE)
        .select("status, code_entered")
        .eq("student_id", uid)
        .order("requested_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;

      if (!last) {
        setJoinStatus("none");
        setLatestCode(null);
      } else {
        const s = (last.status as string).toLowerCase();
        const norm =
          s === "approved" ? "approved" : s === "pending" ? "pending" : "none";
        setJoinStatus(norm);
        setLatestCode(last.code_entered ?? null);
      }
      setStatusLoading(false);

      // realtime: flip when teacher approves
      chan = supabase
        .channel(`pm-join-${uid}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: JOIN_TABLE, filter: `student_id=eq.${uid}` },
          (payload: any) => {
            const s = (payload?.new?.status as string | undefined)?.toLowerCase();
            if (!s) return;
            const norm =
              s === "approved" ? "approved" : s === "pending" ? "pending" : "none";
            setJoinStatus(norm);
            setLatestCode(payload?.new?.code_entered ?? null);
          }
        )
        .subscribe();
    })();

    return () => {
      mounted = false;
      if (chan) supabase.removeChannel(chan);
    };
  }, [visible]);

  // ---------- Pan responder for bottom sheet ----------
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_: GestureResponderEvent, g: PanResponderGestureState) =>
        Math.abs(g.dy) > Math.abs(g.dx * 3),
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

  // open/close animations for sheet
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

  // animate Leave modal entrance
  useEffect(() => {
    if (showLeaveModal) {
      leaveFadeAnim.setValue(0);
      leaveSlideAnim.setValue(40);
      Animated.parallel([
        Animated.timing(leaveFadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(leaveSlideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [showLeaveModal, leaveFadeAnim, leaveSlideAnim]);

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

  // ---------- Leave Class (SOFT LEAVE + delete approved join requests for same teacher(s)) ----------
  const handleLeaveClass = async () => {
    try {
      setIsLeaving(true);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) throw new Error("Not signed in");

      // 1) fetch active memberships to know which teacher(s) to clean requests for
      const { data: activeRows, error: fetchErr } = await supabase
        .from(STUDENT_CLASS_TABLE)
        .select("teacher_id")
        .eq("student_id", uid)
        .eq("status", "active");

      if (fetchErr) throw fetchErr;

      const teacherIds = (activeRows ?? [])
        .map((r: any) => r.teacher_id)
        .filter((t: string | null) => !!t);

      // 2) soft-leave all active memberships
      const { error: leaveErr } = await supabase
        .from(STUDENT_CLASS_TABLE)
        .update({ status: "left", left_at: new Date().toISOString() })
        .eq("student_id", uid)
        .eq("status", "active");

      if (leaveErr) throw leaveErr;

      // 3) delete approved class_join_requests for those teacher(s)
      if (teacherIds.length > 0) {
        const { error: delErr } = await supabase
          .from(JOIN_TABLE)
          .delete()
          .eq("student_id", uid)
          .in("teacher_id", teacherIds)
          .eq("status", "approved");

        if (delErr) throw delErr;
      }

      setIsLeaving(false);
      setShowLeaveModal(false);
      setHasJoinedClass(false);
      onLeaveClass?.();

      // Small toast + route to Join screen
      setSuccessMessage("You left the class. You can join again anytime.");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2200);

      handleClose();
      setTimeout(() => {
        router.push("/StudentScreen/ClassProgress/join-class");
      }, 200);
    } catch (e: any) {
      setIsLeaving(false);
      setSuccessMessage(e?.message || "Failed to leave class.");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2200);
    }
  };

  // ⬇️ Do NOT mark joined here; the request is only pending. The listener flips UI on approval.
  const handleJoinClass = (data: { classCode: string; gradeLevel: string; strand: string }) => {
    if (!data.classCode.trim()) return;
    setShowJoinClassModal(false);

    setSuccessMessage(`Request sent for ${data.classCode}. Waiting for teacher approval.`);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 2500);
  };

  const handleSignOutPress = () => {
    handleClose();
    setTimeout(() => router.push("/ProfileMenu/logout"), 300);
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
                  setTimeout(() => router.push("/ProfileMenu/settings"), 300);
                }}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 bg-[#2D3748] rounded-xl items-center justify-center mr-3">
                  <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base font-medium">Settings</Text>
                  <Text className="text-white/50 text-xs mt-0.5">Account and app preferences</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#718096" />
              </TouchableOpacity>

              {/* Class item */}
              {statusLoading ? (
                <View className="flex-row items-center p-4 rounded-xl">
                  <View className="w-10 h-10 bg-[#2D3748] rounded-xl items-center justify-center mr-3">
                    <ActivityIndicator />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-base font-medium">Checking class…</Text>
                    <Text className="text-white/50 text-xs mt-0.5">Please wait</Text>
                  </View>
                </View>
              ) : hasJoinedClass ? (
                <View>
                  <TouchableOpacity
                    className="flex-row items-center p-4 rounded-xl active:bg-white/5"
                    onPress={() => {
                      handleClose();
                      router.push("/StudentScreen/ClassProgress/class-progress");
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
                      <Text className="text-white text-base font-medium">Join Class</Text>
                      {joinStatus === "pending" && (
                        <View className="ml-2 bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                          <Text className="text-white text-xs font-medium">Pending…</Text>
                        </View>
                      )}
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
              opacity: leaveFadeAnim,
              transform: [{ translateY: leaveSlideAnim }],
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

      {/* Join Class */}
      <JoinClassModal
        visible={showJoinClassModal}
        onClose={() => setShowJoinClassModal(false)}
        onJoinClass={handleJoinClass}
      />

      {/* Info toast */}
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
                <Ionicons name="information-circle" size={22} color="#8A5CFF" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">Notice</Text>
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
