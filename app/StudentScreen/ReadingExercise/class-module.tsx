// app/StudentScreen/ReadingExercise/class-module.tsx
import NavigationBar from "../../../components/NavigationBar/nav-bar";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ProfileMenuNew from "../../../components/ProfileModal/ProfileMenuNew";

// 🔧 Supabase
import { supabase } from "@/lib/supabaseClient";

// ===== CONSTS =====
const PROFILE_PIC = { uri: "https://randomuser.me/api/portraits/women/44.jpg" };

type ClassModule = {
  id: string;
  class_id: string | null;
  teacher_id: string;
  title: string;
  body: string | null;
  resource_url: string | null;
  due_at: string | null;
  created_at?: string;
};

type EnrolledClass = { class_id: string };

// Build initials from "First Last" or from email before '@'
const getInitials = (name?: string, email?: string) => {
  const base = (name && name.trim()) || (email && email.split("@")[0]) || "";
  if (!base) return "U";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
};

const ClassModulesReadingPage = () => {
  const router = useRouter();

  // UI state
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<ClassModule[]>([]);
  const [fullName, setFullName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Animations (match feel of your other pages)
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations = isProfileMenuVisible
      ? [
          Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]
      : [
          Animated.timing(slideAnim, { toValue: -50, duration: 200, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ];
    Animated.parallel(animations).start();
  }, [isProfileMenuVisible]);

  // Avatar/profile (same pattern you already use)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user || !mounted) return;

      setUserEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      const nameValue =
        (profile?.name ?? user.user_metadata?.full_name ?? user.email ?? "").trim();
      if (!mounted) return;
      setFullName(nameValue);

      const resolveSigned = async (): Promise<string | null> => {
        const stored = profile?.avatar_url?.toString() || user.id;
        const normalized = stored.replace(/^avatars\//, "");
        let objectPath: string | null = null;

        if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
          objectPath = normalized;
        } else {
          const { data: list } = await supabase.storage
            .from("avatars")
            .list(normalized, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
          if (list && list.length > 0) objectPath = `${normalized}/${list[0].name}`;
        }

        if (!objectPath) return null;
        const { data: signed } = await supabase.storage
          .from("avatars")
          .createSignedUrl(objectPath, 60 * 60);
        return signed?.signedUrl ?? null;
      };

      try {
        const url = await resolveSigned();
        if (!mounted) return;
        setAvatarUri(url);
      } catch {
        if (!mounted) return;
        setAvatarUri(null);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Load modules for classes the user joined
  const loadClassModules = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        setModules([]);
        return;
      }

      // 1) Find active enrollments
      const { data: enrolls, error: enrErr } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .eq("student_id", user.id)
        .eq("status", "active");
      if (enrErr || !enrolls || enrolls.length === 0) {
        setModules([]);
        return;
      }

      const classIds = (enrolls as EnrolledClass[])
        .map(e => e.class_id)
        .filter(Boolean) as string[];

      if (classIds.length === 0) {
        setModules([]);
        return;
      }

      // 2) Fetch only READING modules for those classes
      const { data: mods } = await supabase
        .from("class_modules")
        .select("id, class_id, teacher_id, title, body, resource_url, due_at, created_at")
        .in("class_id", classIds)
        .eq("module_type", "READING")
        .order("created_at", { ascending: false });

      setModules((mods as ClassModule[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      await loadClassModules();

      // Realtime refresh on class_modules changes
      const channel = supabase
        .channel("class-modules-reading")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "class_modules" },
          () => loadClassModules()
        )
        .subscribe();

      unsub = () => {
        try { supabase.removeChannel(channel); } catch {}
      };
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [loadClassModules]);

  // ===== Sub-components (match your style) =====
  const BackgroundDecor = () => (
    <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
      <View className="absolute left-0 right-0 top-0 bottom-0">
        <LinearGradient colors={["#0F172A", "#1E293B", "#0F172A"]} className="flex-1" />
      </View>
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
    </View>
  );

  // ── header button actions (same as your reference page)
  const handleIconPress = (iconName: string) => {
    if (iconName === "chatbot") {
      router.push("/ButtonIcon/chatbot");
    } else if (iconName === "notifications") {
      router.push("/ButtonIcon/notification");
    }
  };

  // Header copied to match your reference (with initials fallback)
  const Header = () => (
    <View className="flex-row justify-between items-center mt-4 mb-3 w-full">
      <TouchableOpacity
        className="flex-row items-center"
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Image
          source={require("../../../assets/Speaksy.png")}
          className="w-12 h-12 rounded-full right-2"
          resizeMode="contain"
        />
        <Text className="text-white font-bold text-2xl ml-2 -left-5">Voclaria</Text>
      </TouchableOpacity>

      <View className="flex-row items-center -right-1 space-x-3">
        <TouchableOpacity
          className="p-2 bg-white/10 rounded-full"
          onPress={() => handleIconPress("chatbot")}
          activeOpacity={0.7}
        >
          <View className="w-6 h-6 items-center justify-center">
            <Image
              source={require("../../../assets/chatbot.png")}
              className="w-5 h-5"
              resizeMode="contain"
              tintColor="white"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="p-2 bg-white/10 rounded-full"
          onPress={() => handleIconPress("notifications")}
          activeOpacity={0.7}
        >
          <View className="w-6 h-6 items-center justify-center">
            <Ionicons name="notifications-outline" size={20} color="white" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="p-1"
          onPress={() => setIsProfileMenuVisible(true)}
          activeOpacity={0.7}
        >
          <View className="p-0.5 bg-white/10 rounded-full">
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="w-8 h-8 rounded-full" />
            ) : (
              <View className="w-8 h-8 rounded-full bg-white/15 border border-white/20 items-center justify-center">
                <Text className="text-white font-semibold text-xs">
                  {getInitials(fullName, userEmail)}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View className="mt-10 items-center px-6">
      <Ionicons name="documents-outline" size={28} color="#a78bfa" />
      <Text className="text-white font-semibold text-lg mt-2 text-center">
        No class modules yet
      </Text>
      <Text className="text-white/70 text-xs mt-1 text-center">
        Join a class or ask your teacher to publish a reading module.
      </Text>
    </View>
  );

  const ModuleCard = ({ mod }: { mod: ClassModule }) => {
    const due = mod.due_at ? new Date(mod.due_at).toLocaleString() : null;
    return (
      <View className="bg-white/5 backdrop-blur-lg border border-white/30 rounded-2xl p-6 mb-4 w-full shadow-lg shadow-violet-900/20">
        <View className="mb-3">
          <Text className="text-violet-300 font-bold text-xs tracking-wider uppercase mb-1 -mt-2">
            Class Module
          </Text>
          <Text className="text-white font-bold text-lg">{mod.title || "Untitled"}</Text>
          {due && <Text className="text-violet-300 text-xs mt-1">Due {due}</Text>}
        </View>

        {mod.body ? (
          <Text className="text-white/80 text-sm leading-6 mb-5" numberOfLines={3}>
            {mod.body}
          </Text>
        ) : (
          <Text className="text-white/50 text-sm leading-6 mb-5">
            No description provided.
          </Text>
        )}

        <TouchableOpacity
          onPress={() =>
            router.push({
              // NOTE: kept as-is; change path if you have a dedicated reading detail route
              pathname: "/StudentScreen/SpeakingExercise/class-module",
              params: { moduleId: mod.id, classId: mod.class_id ?? "" },
            })
          }
          className="py-3.5 rounded-xl bg-violet-500/70 active:bg-violet-500/80 border border-violet-400/30"
          activeOpacity={0.7}
        >
          <Text className="font-semibold text-center text-base text-white">Open Module</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#0F172A] relative">
      <StatusBar barStyle="light-content" />
      <BackgroundDecor />

      <ProfileMenuNew
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        user={{
          name: fullName || "Student",
          email: userEmail || "",
          image: avatarUri ? { uri: avatarUri } : PROFILE_PIC,
        }}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        <View className="flex-1 items-center p-5 w-full max-w-md mx-auto" style={{ paddingBottom: 0 }}>
          <Header />

          <View className="mb-8 w-full">
            <Text className="text-white text-2xl font-bold mb-2">Class Reading Modules</Text>
            <Text className="text-gray-300 text-xs leading-5">
              These modules are from the classes you’ve joined.
            </Text>
          </View>

          {loading ? (
            <View className="w-full items-center mt-10">
              <ActivityIndicator size="large" />
              <Text className="text-white/80 mt-3">Loading modules…</Text>
            </View>
          ) : modules.length === 0 ? (
            <EmptyState />
          ) : (
            <View className="w-full">
              {modules.map((m) => (
                <ModuleCard key={m.id} mod={m} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <NavigationBar defaultActiveTab="Reading" />
    </View>
  );
};

export default React.memo(ClassModulesReadingPage);
