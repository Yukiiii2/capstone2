// app/StudentScreen/SpeakingExercise/live-vid-selection.tsx
import NavigationBar from "../../../components/NavigationBar/nav-bar";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  useWindowDimensions,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, usePathname, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import ProfileMenu from "../../../components/ProfileModal/ProfileMenuNew";
import { supabase } from "@/lib/supabaseClient";

// ===== Constants & Types =====
type FeatureType = {
  title: string;
  desc: string;
  icon: string;
  iconLib?: typeof Ionicons | typeof MaterialCommunityIcons;
};

const normalize = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default function LiveVidSelection() {
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const { width, height } = useWindowDimensions();
  const statusBarHeight = StatusBar.currentHeight || 0;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // ⬇️ READ module context forwarded from lessons-basic/lessons-advanced
  const raw = useLocalSearchParams<{
    module_id?: string | string[];
    module_title?: string | string[];
    level?: string | string[];   // "basic" | "advanced"
    display?: string | string[]; // display lesson # if you passed it
  }>();

  // Build normalized context (keep everything as strings)
  const moduleCtx = {
    ...(normalize(raw.module_id) ? { module_id: normalize(raw.module_id)! } : {}),
    ...(normalize(raw.module_title) ? { module_title: normalize(raw.module_title)! } : {}),
    ...(normalize(raw.level) ? { level: normalize(raw.level)! } : {}),
    ...(normalize(raw.display) ? { display: normalize(raw.display)! } : {}),
  };

  // Tiny helper so every navigation forwards the same context
  const pushWithCtx = (pathname: string, extra?: Record<string, any>) => {
    const safeTitle =
      moduleCtx.module_title ? encodeURIComponent(moduleCtx.module_title) : undefined;

    router.push({
      pathname,
      params: {
        ...moduleCtx,
        ...(safeTitle ? { module_title: safeTitle } : {}),
        ...(extra || {}),
      },
    });
  };

  // ===== dynamic user profile (replaces hard-coded userProfile) =====
  const [fullName, setFullName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const initials = useMemo(() => {
    const parts = (fullName || "").trim().split(/\s+/);
    const a = (parts[0]?.[0] || "").toUpperCase();
    const b = (parts[1]?.[0] || "").toUpperCase();
    return (a + b) || a || "U";
  }, [fullName]);

  // Load Supabase user + signed avatar (matches Home page logic)
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

  // Build the user object for ProfileMenu (same shape as before, just dynamic)
  const userProfile = {
    name: fullName || "Student",
    email: userEmail || "",
    image: { uri: avatarUri || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==" },
  };

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") {
      router.replace("/login-page");
    } else if (iconName === "chatbot") {
      router.push("/ButtonIcon/chatbot");
    } else if (iconName === "notifications") {
      router.push("/ButtonIcon/notification");
    }
  };

  useEffect(() => {
    const toValue = isProfileMenuVisible ? 0 : -50;
    const opacityValue = isProfileMenuVisible ? 1 : 0;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: opacityValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isProfileMenuVisible]);

  return (
    <View className="flex-1 bg-gray-900" style={{ width, height }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <View className="flex-1">
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A"]}
          style={{
            flex: 1,
            paddingTop: Platform.OS === "android" ? statusBarHeight : 0,
          }}
        >
          {/* Decorative Circles */}
          <View className="absolute w-40 h-40 bg-[#a78bfa]/10 rounded-full -top-20 -left-20" />
          <View className="absolute w-24 h-24 bg-[#a78bfa]/10 rounded-full top-1/4 -right-12" />
          <View className="absolute w-32 h-32 bg-[#a78bfa]/5 rounded-full top-1/3 -left-16" />
          <View className="absolute w-48 h-48 bg-[#a78bfa]/5 rounded-full bottom-1/4 -right-24" />
          <View className="absolute w-28 h-28 bg-[#a78bfa]/5 rounded-full bottom-2 right-8" />
          <View className="absolute w-28 h-28 bg-[#a78bfa]/5 rounded-full top-15 right-12" />
          <View className="absolute w-32 h-32 bg-[#a78bfa]/5 rounded-full bottom-24 left-1/6" />

          <View
            className="flex-1 -top- px-4"
            style={{
              paddingTop: Platform.OS === "ios" ? 50 : statusBarHeight + 10,
            }}
          >
            <View className="w-full max-w-[400px] self-center">
              {/* Header */}
              <View className="flex-row justify-between bottom-10 items-center mt-4 mb-3 w-full">
                <View className="flex-row items-center">
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
                    <Text className="text-white font-bold text-2xl ml-2 -left-5">
                      Voclaria
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center right-4 space-x-3">
                  <TouchableOpacity
                    className="p-2 rounded-full bg-white/10 active:bg-white/20"
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
                    className="p-2 rounded-full bg-white/10 active:bg-white/20"
                    onPress={() => handleIconPress("notifications")}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="notifications-outline" size={20} color="white" />
                  </TouchableOpacity>

                  {/* Avatar (unchanged size/position), now dynamic */}
                  <TouchableOpacity
                    onPress={() => setIsProfileMenuVisible(true)}
                    activeOpacity={0.7}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 2,
                      borderColor: "rgba(255,255,255,0.8)",
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
            </View>

            {/* Main Content Container */}
            <View className=" top-1 mx-1  mb-5 bg-white/5 backdrop-blur-xl -top-10 rounded-3xl p-3 -px-2 border border-white/20">
              {/* Title Section */}
              <View className="items-center mb-6">
                <View className="relative">
                  <View className="absolute -inset-2 bg-purple-500/20 rounded-2xl" />
                  <Image
                    source={require("../../../assets/Live.png")}
                    style={{ width: 60, height: 60 }}
                    resizeMode="contain"
                  />
                </View>

                <Text className="text-white text-2xl font-bold mt-6 -top-3 mb-2 text-center">
                  Interactive Live Session
                </Text>
                <Text className="text-gray-200 px-2 text-center text-sm -top-4">
                  Stream live and get real-time feedback from your audience
                </Text>
              </View>

              {/* Features List */}
              <View className="space-y-3 mb-6 items-center">
                {[
                  {
                    title: "Real-time Interaction",
                    desc: "Engage with live comments and reactions",
                    icon: "chatbubbles-outline",
                    iconLib: Ionicons,
                  },
                  {
                    title: "Instant Feedback",
                    desc: "AI-powered feedback, Advice and Guide",
                    icon: "rocket-outline",
                    iconLib: Ionicons,
                  },
                ].map((feature, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center p-3 -top-7 rounded-lg"
                  >
                    <View className="bg-white/10 p-2 rounded-lg mr-3 flex items-center justify-center ">
                      {feature.iconLib ? (
                        <feature.iconLib
                          name={feature.icon as any}
                          size={20}
                          color="#FFFFFF"
                        />
                      ) : (
                        <Ionicons name={feature.icon as any} size={20} color="#FF0000" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base mb-0.5">
                        {feature.title}
                      </Text>
                      <Text className="text-white/70 text-xs">{feature.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Action Buttons */}
              <View className="px-3 -mt-8 mb-5">
                <View className="flex-row justify-center items-center space-x-6 w-full">
                  <TouchableOpacity
                    className="flex-row items-center bg-violet-500/90 border border-white/30 px-6 py-2.5 rounded-lg w-[45%] justify-center"
                    activeOpacity={0.8}
                    onPress={() =>
                      pushWithCtx("StudentScreen/SpeakingExercise/live-video-recording", {
                        // ensure level defaults to basic if it wasn’t set
                        level: moduleCtx.level || "basic",
                      })
                    }
                  >
                    <Text className="text-white font-bold text-sm">Go Live</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-row items-center bg-white/30 border border-white/20 px-6 py-2.5 rounded-lg w-[47%] justify-center"
                    activeOpacity={0.8}
                    onPress={() =>
                      pushWithCtx("StudentScreen/SpeakingExercise/private-video-recording", {
                        level: moduleCtx.level || "basic",
                      })
                    }
                  >
                    <Text className="text-white font-bold text-sm">Practice Solo</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Tips */}
              <View className="bg-white/10 backdrop-blur-md rounded-xl p-5 mb-2 border border-white/20 shadow-sm">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="bulb-outline" size={16} color="#FFFFFF" />
                  <Text className="text-white font-medium ml-2.5 text-sm">Quick Tips</Text>
                </View>
                <View className="space-y-2">
                  {[
                    "Maintain eye contact with the camera",
                    "Speak clearly and at a steady pace",
                    "Use hand gestures naturally",
                    "Check your internet connection stability",
                    "Keep your energy up and stay confident",
                    "Choose a quiet, well-lit environment",
                  ].map((tip, idx) => (
                    <View key={idx} className="flex-row items-start">
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="white"
                        style={{ marginTop: 2, marginRight: 8 }}
                      />
                      <Text className="text-white text-xs flex-1">{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Profile Menu */}
      <ProfileMenu
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        onSignOut={async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/logout');
        }}
        user={{
          name: fullName || "Student",
          email: userEmail,
          image: avatarUri ? { uri: avatarUri } : require('@/assets/student.png'),
        }}
      />

      {/* Shared NavigationBar added with defaultActiveTab="Speaking" */}
      <NavigationBar defaultActiveTab="Speaking" />
    </View>
  );
}
