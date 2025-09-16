import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import NavigationBar from "../../../components/NavigationBar/nav-bar";
import ProfileMenu from "@/components/ProfileModal/ProfileMenuNew";

// ⬇️ keep your project's supabase import style
import { supabase } from "@/lib/supabaseClient";

// ===== TYPES =====
type ModuleType = {
  key: string;
  label: string;
  title: string;
  desc: string;
  progress: number;
  color: string;
  navigateTo: string;
  isActive?: boolean;
};

// ===== MODULES (progress = 0 for now) =====
const BASE_MODULES: ModuleType[] = [
  {
    key: "Basic",
    label: "BASIC",
    title: "Foundation Public Speaking Skills",
    desc: "Master essential self-introduction techniques and learn to manage speaking anxiety in a supportive virtual classroom environment.",
    progress: 0,
    color: "#a78bfa",
    navigateTo: "StudentScreen/SpeakingExercise/basic-contents",
  },
  {
    key: "Advanced",
    label: "ADVANCED",
    title: "Advanced Public Speaking Mastery",
    desc: "Deliver compelling presentations to large audiences while handling complex Q&A sessions and unexpected challenges.",
    progress: 0,
    color: "#a78bfa",
    navigateTo: "StudentScreen/SpeakingExercise/advanced-contents",
  },
];

const SpeakingHome = () => {
  const router = useRouter();
  const pathname = usePathname();

  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // ---- avatar like Home page (private avatars bucket or initials) ----
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const initials = useMemo(() => {
    const base = (fullName || email || "U").trim();
    const parts = base.split(/\s+/);
    const a = (parts[0]?.[0] || "").toUpperCase();
    const b = (parts[1]?.[0] || "").toUpperCase();
    return (a + b) || a || "U";
  }, [fullName, email]);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user || !mounted) return;

      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      const nameValue =
        (profile?.name ?? user.user_metadata?.full_name ?? user.email ?? "").trim();

      if (!mounted) return;
      setFullName(nameValue);

      // resolve avatar from private "avatars" bucket
      const resolveSigned = async (): Promise<string | null> => {
        const stored = profile?.avatar_url?.toString() || user.id;
        const normalized = stored.replace(/^avatars\//, "");
        let objectPath: string | null = null;

        if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
          objectPath = normalized;
        } else {
          const { data: list, error: listErr } = await supabase.storage
            .from("avatars")
            .list(normalized, {
              limit: 1,
              sortBy: { column: "created_at", order: "desc" },
            });
          if (listErr) return null;
          if (list && list.length > 0) objectPath = `${normalized}/${list[0].name}`;
        }

        if (!objectPath) return null;

        const { data: signed, error: signErr } = await supabase.storage
          .from("avatars")
          .createSignedUrl(objectPath, 60 * 60);
        if (signErr) return null;
        return signed?.signedUrl ?? null;
      };

      const url = await resolveSigned();
      if (!mounted) return;
      setAvatarUri(url);
    };

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  // ----- header & handlers -----
  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") {
      router.replace("/login-page");
    } else if (iconName === "chatbot") {
      router.push("/ButtonIcon/chatbot");
    } else if (iconName === "notifications") {
      router.push("/ButtonIcon/notification");
    }
  };

  const navigateToModule = (moduleKey: string, navigateTo: string) => {
    setSelectedModule(moduleKey);
    router.push(navigateTo);
  };

  const getProgressStatus = (progress: number) =>
    progress <= 0 ? "Getting Started" : progress < 0.7 ? "In Progress" : "Almost There";

  const Header = () => (
    <View className="flex-row justify-between items-center bottom-8 mt-4 mb-3 w-full">
      <TouchableOpacity
        className="flex-row items-center"
        onPress={() => router.push("/StudentScreen/HomePage/home-page")}
        activeOpacity={0.7}
      >
        <Image
          source={require("../../../assets/Speaksy.png")}
          className="w-12 h-12 rounded-full right-2"
          resizeMode="contain"
        />
        <Text className="text-white font-bold text-2xl ml-2 -left-5">
          Voclaria
        </Text>
      </TouchableOpacity>
      <View className="flex-row items-center right space-x-3">
        <TouchableOpacity
          className="p-2 bg-white/5 rounded-full active:bg-white/10"
          onPress={() => handleIconPress("chatbot")}
          activeOpacity={0.7}
        >
          <Image
            source={require("../../../assets/chatbot.png")}
            className="w-5 h-5"
            resizeMode="contain"
            tintColor="white"
          />
        </TouchableOpacity>
        <TouchableOpacity
          className="p-2 bg-white/5 rounded-full active:bg-white/10"
          onPress={() => handleIconPress("notifications")}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          className="rounded-full active:opacity-80 bg-white/5 active:bg-white/10"
          onPress={() => setIsProfileMenuVisible(true)}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.6)",
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={{ width: 36, height: 36 }} />
          ) : (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(167,139,250,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
                {initials}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const BackgroundDecor = () => (
    <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
      <View className="absolute left-0 right-0 top-0 bottom-0">
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A"]}
          className="flex-1"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
    </View>
  );

  const ModuleCard = ({ mod }: { mod: ModuleType }) => (
    <View className="bg-white/5 backdrop-blur-lg border border-white/30 rounded-2xl p-6 mb-4 bottom-8 w-full shadow-lg shadow-violet-900/20">
      <View className="mb-4">
        <Text className="text-violet-300 font-bold text-xs tracking-wider uppercase mb-1 -mt-2">
          {mod.label}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-white font-bold text-lg flex-1">
            {mod.title}
          </Text>
          <View className="bg-violet-500/10 px-3 py-1.5 rounded-full ml-3 -mt-10">
            <Text className="text-violet-300 text-xs font-medium">
              {Math.round(mod.progress * 100)}%
            </Text>
          </View>
        </View>
      </View>

      <Text className="text-white/80 text-sm leading-6 mb-5">{mod.desc}</Text>

      <View className="mb-5">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white/80 text-xs">Module Progress</Text>
          <Text className="text-violet-300 text-xs font-medium">
            {getProgressStatus(mod.progress)}
          </Text>
        </View>
        <View className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full bg-[#a78bfa]"
            style={{ width: `${mod.progress * 100}%` }}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={() => navigateToModule(mod.key, mod.navigateTo)}
        className="py-3.5 rounded-xl bg-violet-500/90 active:bg-violet-500/80 border border-violet-400/30"
        activeOpacity={0.7}
      >
        <Text className="font-semibold text-center text-base text-white">
          Start Module
        </Text>
      </TouchableOpacity>
    </View>
  );

  const LivePracticeSection = () => (
    <View className="mb-8 bottom-8 w-full">
      <Text className="text-white text-2xl font-bold mb-2">
        Speech Video Practice
      </Text>
      <Text className="text-white text-xs leading-5 text-justify">
        Sharpen your speaking skills through live video practice with real audience feedback.
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#0F172A] pt-1">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <BackgroundDecor />

      <View className="flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30, paddingTop: StatusBar.currentHeight }}
          className="flex-1"
        >
          <View className="items-center p-5 w-full max-w-md mx-auto">
            <Header />

            {/* Profile Menu (loads name/email/avatar itself) */}
            <ProfileMenu
              visible={isProfileMenuVisible}
              onDismiss={() => setIsProfileMenuVisible(false)}
              // no user prop needed; it fetches from Supabase for consistency with Home
            />

            <LivePracticeSection />

            <View className="w-full">
              <Text className="text-white bottom-8 text-xl font-bold mb-4">
                Learning Paths
              </Text>
              {BASE_MODULES.map((mod) => (
                <ModuleCard
                  key={mod.key}
                  mod={{ ...mod, isActive: selectedModule === mod.key }}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <NavigationBar />
      </View>
    </View>
  );
};

export default React.memo(SpeakingHome);