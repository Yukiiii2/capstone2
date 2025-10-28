import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
  TextInput,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import NavigationBar from "@/components/NavigationBar/nav-bar-teacher";
import ProfileMenuTeacher from "@/components/ProfileModal/ProfileMenuTeacher";
import { useFocusEffect } from "@react-navigation/native";
import type { ImageSourcePropType } from "react-native";

import { supabase } from "@/lib/supabaseClient";

const AVATAR_BUCKET = "avatars";

const TRANSPARENT_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

/* ─────────────────────────────────────────
   Background Deco (keep updated UI styling)
   ───────────────────────────────────────── */
const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#0F172A"]}
        className="flex-1"
      />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-60 h-60 bg-[#a78bfa]/5 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[120px] h-[120px] bg-[#a78bfa]/5 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-12 h-12 bg-[#a78bfa]/5 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-8 h-8 bg-[#a78bfa]/5 rounded-full" />
  </View>
);

/* ─────────────────────────────────────────
   Utils
   ───────────────────────────────────────── */
const getInitials = (str: string) => {
  if (!str) return "U";
  const s = str.trim();
  if (s.includes(" ")) {
    const parts = s.split(/\s+/).filter(Boolean);
    return (
      (parts[0]?.[0] || "") + (parts[1]?.[0] || "")
    ).toUpperCase();
  }
  const base = s.includes("@") ? s.split("@")[0] : s;
  return base.slice(0, 2).toUpperCase();
};

// "2h ago" helper
function timeAgo(dateISO?: string | null) {
  if (!dateISO) return "";
  const seconds = Math.floor(
    (Date.now() - new Date(dateISO).getTime()) / 1000
  );
  const steps = [60, 60, 24, 7, 4.345, 12];
  let acc = seconds;
  let i = 0;
  while (i < steps.length && acc >= steps[i]) {
    acc = Math.floor(acc / steps[i]);
    i++;
  }
  const labels = [
    "s",
    "m",
    "h",
    "d",
    "w",
    "mo",
    "y",
  ];
  return `${acc}${labels[i] || "s"} ago`;
}

/* ─────────────────────────────────────────
   Types
   ───────────────────────────────────────── */
type BaseCard = {
  id: string;
  name: string;
  avatar?: string | null;
  lastPractice: string;
  rating?: number | null;
  lesson?: {
    id: number;
    title: string;
    subtitle: string;
    desc: string;
    type: "Review" | "Start" | "Continue" | "New";
    progress: number;
    difficulty: "Basic" | "Advanced";
  };
};

type PostCard = BaseCard & {
  kind: "post";
};

type AnyCard = PostCard;

// rows from supabase "posts" join profiles
type ProfileJoin = {
  name: string | null;
  avatar_url: string | null;
};

type JoinedRow = {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  media_url: string | null;
  created_at: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
};

/* ─────────────────────────────────────────
   Component
   ───────────────────────────────────────── */
export default function StudentPresentation() {
  const router = useRouter();

  /* UI state */
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudents, setSelectedStudents] =
    useState<string[]>([]);
  const [
    isProfileMenuVisible,
    setIsProfileMenuVisible,
  ] = useState(false);
  const [
    showFilterDropdown,
    setShowFilterDropdown,
  ] = useState(false);

  // internally, logic version used:
  //   "Everyone" | "Classmate"
  // but new UI text is "Everyone" / "My Students"
  // we'll keep logic value but surface UI label
  const [selectedFilter, setSelectedFilter] =
    useState<"Everyone" | "Classmate">(
      "Everyone"
    );

  /* animated sheet refs for profile menu */
  const sheetY = useRef(new Animated.Value(300))
    .current;
  const sheetOpacity = useRef(
    new Animated.Value(0)
  ).current;

  /* teacher profile state (from logic version) */
  const [fullName, setFullName] = useState("");
  const [initials, setInitials] = useState("U");
  const [avatarUri, setAvatarUri] = useState<
    string | null
  >(null);
  const [userEmail, setUserEmail] = useState("");

  /* Supabase post feed cards */
  const [postCards, setPostCards] = useState<
    PostCard[]
  >([]);

  /* ───────── profile dropdown animation ───────── */
  useEffect(() => {
    if (isProfileMenuVisible) {
      sheetY.setValue(300);
      sheetOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(sheetY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetY, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isProfileMenuVisible, sheetOpacity, sheetY]);

  /* ───────── load current user profile (same logic as current file) ───────── */
  const loadUser = useCallback(async () => {
    const { data: auth } =
      await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    setUserEmail(user.email ?? "");

    // fetch profile row
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", user.id)
      .single();

    const fullNameValue = (
      profile?.name ??
      user.user_metadata?.full_name ??
      user.email ??
      ""
    ).trim();

    setFullName(fullNameValue);

    const parts = fullNameValue
      .split(/\s+/)
      .filter(Boolean);
    const inits =
      (parts[0]?.[0] ?? "").toUpperCase() +
      (parts[1]?.[0] ?? "").toUpperCase();
    setInitials(
      inits ||
        getInitials(
          fullNameValue || user.email || "User"
        )
    );

    // resolve avatar from avatars bucket
    const resolveAndSign = async (): Promise<
      string | null
    > => {
      const stored = (
        profile?.avatar_url?.toString() ||
        user.id
      ).replace(/^avatars\//, "");

      let objectPath: string | null = null;

      if (/\.[a-zA-Z0-9]+$/.test(stored)) {
        // looks like file
        objectPath = stored;
      } else {
        // looks like folder -> list newest
        const { data: files } =
          await supabase.storage
            .from(AVATAR_BUCKET)
            .list(stored, {
              limit: 1,
              sortBy: {
                column: "created_at",
                order: "desc",
              },
            });
        if (files && files.length > 0) {
          objectPath = `${stored}/${files[0].name}`;
        }
      }

      if (!objectPath) return null;
      const { data: signed } =
        await supabase.storage
          .from(AVATAR_BUCKET)
          .createSignedUrl(
            objectPath,
            60 * 60
          );
      return signed?.signedUrl ?? null;
    };

    try {
      const signedUrl = await resolveAndSign();
      setAvatarUri(signedUrl || null);
    } catch {
      setAvatarUri(null);
    }
  }, []);

  /* ───────── fetch posts feed (Supabase) ───────── */
  const fetchPostsAsCards = useCallback(
    async () => {
      // posts + profile info
      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          id,
          user_id,
          title,
          content,
          media_url,
          created_at,
          profiles!posts_user_id_fkey (
            name,
            avatar_url
          )
        `
        )
        .eq("status", "published")
        .eq("visibility", "public")
        .order("created_at", {
          ascending: false,
        })
        .limit(20);

      if (error || !data) {
        setPostCards([]);
        return;
      }

      const rows = data as unknown as JoinedRow[];
      const postIds = rows.map((r) => r.id);

      // grab comments to compute rating averages
      let commentRows: Array<{
        post_id: string;
        rating_delivery: number | null;
        rating_confidence: number | null;
      }> = [];

      if (postIds.length > 0) {
        const { data: cdata, error: cerr } =
          await supabase
            .from("comments")
            .select(
              "post_id, rating_delivery, rating_confidence"
            )
            .in("post_id", postIds);

        if (!cerr && cdata) {
          commentRows = cdata as any[];
        }
      }

      // local aggregate average rating per post
      const byPost = new Map<
        string,
        { sum: number; count: number }
      >();

      for (const r of commentRows) {
        const hasDel =
          typeof r.rating_delivery ===
          "number";
        const hasConf =
          typeof r.rating_confidence ===
          "number";
        if (!hasDel && !hasConf) continue;

        const avgOne =
          (Number(
            hasDel ? r.rating_delivery : 0
          ) +
            Number(
              hasConf
                ? r.rating_confidence
                : 0
            )) /
          (Number(hasDel) + Number(hasConf));

        if (!isFinite(avgOne)) continue;

        const acc =
          byPost.get(r.post_id) || {
            sum: 0,
            count: 0,
          };
        acc.sum += avgOne;
        acc.count += 1;
        byPost.set(r.post_id, acc);
      }

      // helper to sign avatar for each user
      const signAvatar = async (
        userId: string,
        avatar_url?: string | null
      ) => {
        const stored = (
          avatar_url ?? userId
        )
          .toString()
          .replace(/^avatars\//, "");
        let objectPath: string | null = null;

        if (/\.[a-zA-Z0-9]+$/.test(stored)) {
          objectPath = stored;
        } else {
          const { data: files } =
            await supabase.storage
              .from(AVATAR_BUCKET)
              .list(stored, {
                limit: 1,
                sortBy: {
                  column: "created_at",
                  order: "desc",
                },
              });
          if (files && files.length > 0) {
            objectPath = `${stored}/${files[0].name}`;
          }
        }

        if (!objectPath) return null;
        const { data: signed } =
          await supabase.storage
            .from(AVATAR_BUCKET)
            .createSignedUrl(
              objectPath,
              60 * 60
            );
        return signed?.signedUrl ?? null;
      };

      // map rows -> PostCard[]
      const mapped: PostCard[] =
        await Promise.all(
          rows.map(async (p, idx) => {
            const prof = Array.isArray(
              p.profiles
            )
              ? p.profiles[0] ?? null
              : p.profiles;

            const name =
              prof?.name || "User";
            const avatarSigned =
              await signAvatar(
                p.user_id,
                prof?.avatar_url ?? null
              );

            const agg = byPost.get(p.id);
            const rating =
              agg && agg.count > 0
                ? Math.round(
                    (agg.sum /
                      agg.count) *
                      10
                  ) / 10
                : null;

            return {
              kind: "post",
              id: p.id,
              name,
              avatar: avatarSigned || null,
              lastPractice:
                timeAgo(p.created_at) ||
                "Posted",
              rating,
              lesson: {
                id: idx + 1000,
                title:
                  p.title ||
                  "Shared to Community",
                subtitle: "Post",
                desc:
                  p.content ||
                  "Community submission",
                type: "Review",
                progress: 1,
                difficulty: "Basic",
              },
            };
          })
        );

      setPostCards(mapped);
    },
    []
  );

  /* ───────── initial + focus refresh ───────── */
  useEffect(() => {
    loadUser();
    const { data: sub } =
      supabase.auth.onAuthStateChange(
        () => {
          loadUser();
        }
      );
    return () => {
      sub?.subscription?.unsubscribe();
    };
  }, [loadUser]);

  useFocusEffect(
    useCallback(() => {
      loadUser();
      fetchPostsAsCards();
    }, [loadUser, fetchPostsAsCards])
  );

  /* ───────── derived feed ─────────
     We REMOVED the static local STUDENTS array.
     So the feed is just postCards from Supabase.
     We keep same structure so UI can render.
  */
  const mergedFeed: AnyCard[] = useMemo(
    () => [...postCards],
    [postCards]
  );

  // label to show in UI
  const selectedFilterLabel =
    selectedFilter === "Classmate"
      ? "My Students"
      : "Everyone";

  // filter + search
  const filteredCards = useMemo(() => {
    return mergedFeed.filter((item) => {
      // filter
      const matchesFilter =
        selectedFilter === "Everyone"
          ? true
          : false; // "Classmate"/"My Students" - we don't yet distinguish ownership for posts, so false means hide all for now

      if (!matchesFilter) return false;

      // search
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      const nameMatch = item.name
        .toLowerCase()
        .includes(q);
      const lessonMatch = item.lesson?.title
        ?.toLowerCase()
        .includes(q);

      return nameMatch || !!lessonMatch;
    });
  }, [mergedFeed, selectedFilter, searchQuery]);

  /* ───────── handlers ───────── */
  const toggleStudentSelection = (
    id: string
  ) => {
    setSelectedStudents((prev) =>
      prev.includes(id)
        ? prev.filter(
            (sel) => sel !== id
          )
        : [...prev, id]
    );
  };

  // route when tapping a card
  // post => community screen with postId
  const goToWatch = (item: AnyCard) => {
    router.push({
      pathname:
        "/TeacherScreen/TeacherCommunity/teacher-community",
      params: { postId: item.id },
    });
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  const handleAddStudent = () => {
    router.push("/ButtonIcon/add-student");
  };

  const handleModules = () => {
    router.push("/ButtonIcon/post-module");
  };

  /* ───────── header (updated UI style) ───────── */
  const Header = () => (
    <View className="z-10 bottom-6">
      <SafeAreaView>
        <View className="flex-row justify-between items-center top-6 px-4 py-3">
          <View className="flex-row items-center">
            <Image
              source={require("../../../assets/Speaksy.png")}
              className="w-12 h-12 right -mr-4"
              resizeMode="contain"
            />
            <Text className="text-white left-3 font-bold text-2xl">
              Voclaria
            </Text>
          </View>

          <View className="flex-row items-center right-2">
            <TouchableOpacity
              onPress={handleModules}
              activeOpacity={0.7}
              className="p-2 bg-white/10 rounded-full mr-4"
            >
              <Image
                source={require("../../../assets/Modules.png")}
                className="w-5 h-5"
                resizeMode="contain"
                tintColor="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddStudent}
              activeOpacity={0.7}
              className="p-2 bg-white/10 rounded-full mr-4"
            >
              <Image
                source={require("../../../assets/add-student.png")}
                className="w-5 h-5"
                resizeMode="contain"
                tintColor="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setIsProfileMenuVisible(true)
              }
              activeOpacity={0.7}
              className="w-9 h-9 rounded-full border-2 border-white/80 overflow-hidden items-center justify-center"
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  className="w-9 h-9"
                />
              ) : (
                <View className="w-9 h-9 bg-violet-600 items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {initials || "U"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );

  /* ───────── render ───────── */
  return (
    <View className="flex-1 bg-[#0F172A]">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <BackgroundDecor />

      <SafeAreaView className="flex-1 top-4 z-10">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: 80,
            maxWidth: 600,
            width: "100%",
            alignSelf: "center",
          }}
          showsVerticalScrollIndicator={false}
          bounces
          overScrollMode="always"
        >
          <View className="flex-1">
            {/* Header */}
            <Header />

            {/* Page Title */}
            <View className="px-5 mb-4">
              <Text className="text-white text-2xl font-bold">
                Student Speech Practice
              </Text>
              <Text className="text-indigo-300 text-sm">
                Watch and learn from peers
              </Text>
            </View>

            {/* Search + Filter Row */}
            <View className="flex-row items-center space-x-3 px-4 mb-4">
              {/* Search Bar */}
              <View className="relative flex-1">
                <TextInput
                  className="bg-white/10 text-white rounded-xl pl-10 pr-6 py-2.5 text-sm"
                  placeholder="Search by name or ..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <Ionicons
                  name="search"
                  size={16}
                  color="#94a3b8"
                  style={{
                    position: "absolute",
                    left: 12,
                    top: 12,
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() =>
                      setSearchQuery("")
                    }
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 12,
                    }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Dropdown */}
              <View className="relative">
                <TouchableOpacity
                  className="flex-row items-center bg-white/15 px-4 py-2.5 rounded-xl"
                  onPress={() =>
                    setShowFilterDropdown(
                      !showFilterDropdown
                    )
                  }
                >
                  <Text className="text-white mr-2 text-sm">
                    {selectedFilterLabel}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color="white"
                  />
                </TouchableOpacity>

                {showFilterDropdown && (
                  <View className="absolute top-12 right-0 bg-[#1E293B] rounded-lg border border-white/20 z-10 w-40">
                    <TouchableOpacity
                      className="px-4 py-2.5 border-b border-white/10"
                      onPress={() => {
                        setSelectedFilter(
                          "Everyone"
                        );
                        setShowFilterDropdown(
                          false
                        );
                      }}
                    >
                      <Text className="text-white text-sm">
                        Everyone
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="px-4 py-2.5"
                      onPress={() => {
                        // internally we keep "Classmate"
                        setSelectedFilter(
                          "Classmate"
                        );
                        setShowFilterDropdown(
                          false
                        );
                      }}
                    >
                      <Text className="text-white text-sm">
                        My Students
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Selection Info (when any selected) */}
            {selectedStudents.length > 0 && (
              <View className="mx-5 mb-4 bg-indigo-500/20 rounded-xl p-3 flex-row justify-between items-center border border-indigo-500/30">
                <Text className="text-white font-medium">
                  {selectedStudents.length}{" "}
                  selected
                </Text>
                <TouchableOpacity
                  onPress={clearSelection}
                >
                  <Text className="text-indigo-300">
                    Clear
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Cards List (posts only now) */}
            <View className="px-5">
              {filteredCards.length === 0 ? (
                <View
                  key="no-items"
                  className="items-center justify-center py-10"
                >
                  <Ionicons
                    name="people-outline"
                    size={48}
                    color="#4B5563"
                  />
                  <Text className="text-gray-400 mt-4">
                    No posts found
                  </Text>
                </View>
              ) : (
                <View>
                  {filteredCards.map(
                    (item) => (
                      <TouchableOpacity
                        key={`post:${item.id}`}
                        onPress={() =>
                          goToWatch(item)
                        }
                        onLongPress={() =>
                          toggleStudentSelection(
                            item.id
                          )
                        }
                        className={`rounded-2xl overflow-hidden mb-4 border border-white/10 bg-white/5 backdrop-blur-sm ${
                          selectedStudents.includes(
                            item.id
                          )
                            ? "border-indigo-500/50"
                            : ""
                        }`}
                        activeOpacity={0.9}
                      >
                        <View className="p-4">
                          <View className="flex-row items-start">
                            <View className="w-12 h-12 rounded-full border-2 border-gray-200 overflow-hidden items-center justify-center">
                              {item.avatar ? (
                                <Image
                                  source={{
                                    uri: item.avatar,
                                  }}
                                  className="w-12 h-12"
                                />
                              ) : (
                                <View className="w-12 h-12 bg-violet-600 items-center justify-center">
                                  <Text className="text-white font-bold">
                                    {getInitials(
                                      item.name
                                    )}
                                  </Text>
                                </View>
                              )}
                            </View>

                            <View className="flex-1 ml-3">
                              <View className="flex-row justify-between items-start">
                                <Text className="text-white font-semibold text-base">
                                  {item.name}
                                </Text>
                                <View className="flex-row items-center">
                                  <Ionicons
                                    name="star"
                                    size={14}
                                    color="#F59E0B"
                                  />
                                  <Text className="text-amber-600 text-sm font-medium ml-1">
                                    {typeof item.rating ===
                                    "number"
                                      ? item.rating.toFixed(
                                          1
                                        )
                                      : "N/A"}
                                  </Text>
                                </View>
                              </View>

                              {item.lesson && (
                                <View className="mt-2">
                                  <Text className="text-indigo-200 text-sm font-medium">
                                    {
                                      item.lesson
                                        .title
                                    }
                                  </Text>

                                  {/* small description text */}
                                  <Text className="text-gray-300/80 text-xs mt-0.5">
                                    {
                                      item.lesson
                                        .desc
                                    }
                                  </Text>

                                  {/* progress bar row */}
                                  <View className="mt-2">
                                    <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                      <View
                                        className="h-full bg-violet-600 rounded-full"
                                        style={{
                                          width: `${
                                            (item
                                              .lesson
                                              ?.progress ||
                                              0) *
                                            100
                                          }%`,
                                        }}
                                      />
                                    </View>
                                    <View className="flex-row justify-between mt-1">
                                      <Text className="text-gray-400 text-xs">
                                        {Math.round(
                                          (item
                                            .lesson
                                            ?.progress ||
                                            0) *
                                            100
                                        )}
                                        % Complete
                                      </Text>
                                      <Text className="text-indigo-300 text-xs font-medium">
                                        Continue
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              )}
                            </View>
                          </View>

                          {/* timestamp */}
                          <View className="mt-2">
                            <Text className="text-gray-400 text-xs">
                              {item.lastPractice}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              )}
            </View>

            {/* Profile Menu Sheet */}
            <ProfileMenuTeacher
              visible={isProfileMenuVisible}
              onDismiss={() =>
                setIsProfileMenuVisible(
                  false
                )
              }
              user={{
                name:
                  fullName ||
                  "Teacher",
                email:
                  userEmail ||
                  "",
                image: ({
                  uri:
                    avatarUri ||
                    TRANSPARENT_PNG,
                } as unknown) as ImageSourcePropType,
              }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <NavigationBar defaultActiveTab="Community" />
    </View>
  );
}
