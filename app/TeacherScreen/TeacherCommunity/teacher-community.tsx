// app/TeacherScreen/TeacherCommunity/teacher-community.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Animated,
  SafeAreaView,
  Platform,
  Alert,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname, useLocalSearchParams } from "expo-router";

// ✅ Teacher variants
import NavigationBar from "@/components/NavigationBar/nav-bar-teacher";
import ProfileMenuTeacher from "@/components/ProfileModal/ProfileMenuTeacher";

// ⬇️ Supabase (same client used by student page)
import { supabase } from "@/lib/supabaseClient";

/* =======================================================================================
 * Helpers (kept the same behavior/shape as the student `community-page.tsx`)
 * ======================================================================================= */

async function resolveSignedAvatar(
  userId: string,
  storedPath?: string | null
): Promise<string | null> {
  try {
    // absolute URL allowed as-is
    if (storedPath && /^https?:\/\//i.test(storedPath)) return storedPath;

    // normalize to bucket object path
    const base = (storedPath ?? userId).toString().replace(/^avatars\//, "");
    let objectPath: string | null = null;

    // file or folder?
    if (/\.[a-zA-Z0-9]+$/.test(base)) {
      objectPath = base;
    } else {
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(base, {
          limit: 1,
          sortBy: { column: "created_at", order: "desc" },
        });
      if (files && files.length > 0) {
        objectPath = `${base}/${files[0].name}`;
      }
    }

    if (!objectPath) return null;

    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(objectPath, 60 * 60); // 1 hour
    return signed?.signedUrl ?? null;
  } catch {
    return null;
  }
}

const timeAgo = (iso?: string | null) => {
  if (!iso) return "";
  const s = Math.max(
    1,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  );
  const steps = [60, 60, 24, 7, 4.345, 12];
  const labels = ["s", "m", "h", "d", "w", "mo", "y"];
  let i = 0,
    acc = s;
  while (i < steps.length && acc >= steps[i]) {
    acc = Math.floor(acc / steps[i]);
    i++;
  }
  return `${acc}${labels[i] || "s"} ago`;
};

const getInitials = (nameOrEmail: string) => {
  if (!nameOrEmail) return "U";
  const s = nameOrEmail.trim();
  if (s.includes(" ")) {
    const parts = s.split(/\s+/).filter(Boolean);
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }
  const base = s.includes("@") ? s.split("@")[0] : s;
  return base.slice(0, 2).toUpperCase();
};

const TRANSPARENT_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

type Role = "Teacher" | "Student" | "Peer" | "Reviewer";

interface Review {
  id: string;
  role: Role;
  name: string; // "Role • Name"
  stars?: number;
  time: string;
  text: string;
  avatar?: string | null;
  initials?: string;

  // ⬇️ ratings on each comment (pulled from student page)
  ratingDelivery?: number | null;
  ratingConfidence?: number | null;
  ratingOverall?: number | null; // rounded avg of delivery + confidence
}

// "More from community" sample (kept same structure for parity)
const MORE_COMMUNITY_SAMPLE = [
  {
    id: "c1",
    user: "https://randomuser.me/api/portraits/men/44.jpg",
    title: "Interview Practice Session",
    views: 130,
    age: "3d",
  },
  {
    id: "c2",
    user: "https://randomuser.me/api/portraits/men/47.jpg",
    title: "Spanish Conversation Practice",
    views: 64,
    age: "6d",
  },
  {
    id: "c3",
    user: "https://randomuser.me/api/portraits/women/12.jpg",
    title: "Pitch Deck Rehearsal",
    views: 88,
    age: "1w",
  },
  {
    id: "c4",
    user: "https://randomuser.me/api/portraits/women/68.jpg",
    title: "Toastmasters-style Practice",
    views: 200,
    age: "2w",
  },
  {
    id: "c5",
    user: "https://randomuser.me/api/portraits/men/31.jpg",
    title: "Product Demo Run",
    views: 64,
    age: "3w",
  },
];

const formatCount = (count: number): string => {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`.replace(".0", "");
  return count.toString();
};

/* =======================================================================================
 * Smaller presentational blocks (kept consistent)
 * ======================================================================================= */

const GlassContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <View
    className={`rounded-2xl overflow-hidden ${className}`}
    style={{
      backgroundColor: "rgba(255, 255, 255, 0.06)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.08)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    }}
  >
    {children}
  </View>
);

const Stars: React.FC<{
  value: number;
  size?: number;
  onPress?: (v: number) => void;
  disabled?: boolean;
}> = ({ value, size = 22, onPress, disabled }) => (
  <View className="flex-row items-center">
    {[1, 2, 3, 4, 5].map((i) => (
      <TouchableOpacity
        key={i}
        disabled={!onPress || disabled}
        onPress={() => onPress?.(i)}
        className="p-0.5"
      >
        <Ionicons
          name={i <= value ? "star" : "star-outline"}
          size={size}
          color={disabled ? "#d1d5db" : "#FFD700"}
        />
      </TouchableOpacity>
    ))}
  </View>
);

/* =======================================================================================
 * PAGE
 * ======================================================================================= */

const TeacherCommunityPage: React.FC = () => {
  const router = useRouter?.() || { replace: () => {} };
  const pathname = usePathname?.() || "";

  // Accept either postId or studentId, mirroring the student page fallback
  const { postId, studentId } =
    useLocalSearchParams<{ postId?: string; studentId?: string }>();
  const effectivePostId = (postId || studentId) as string | undefined;

  // ===== teacher header/profile (dynamic via Supabase) =====
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [initials, setInitials] = useState<string>("T");
  const [userEmail, setUserEmail] = useState<string>("");

  // ===== post header data (author + post) =====
  const [postAuthorName, setPostAuthorName] = useState<string>("Student");
  const [postAuthorAvatar, setPostAuthorAvatar] = useState<string | null>(null);
  const [postAuthorInitials, setPostAuthorInitials] =
    useState<string>("ST");
  const [postCreatedAgo, setPostCreatedAgo] =
    useState<string>("Posted …");
  const [postTitle, setPostTitle] =
    useState<string>("Shared to Community");
  const [postContent, setPostContent] =
    useState<string>("Community submission");
  const [postMediaUrl, setPostMediaUrl] = useState<string | null>(null);

  // NEW: owner for notifications
  const [postOwnerId, setPostOwnerId] = useState<string | null>(null);

  // ===== likes =====
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // ===== reviews/comments =====
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // ===== other states — parity with student page =====
  const [activeTab] = useState("Community");
  const [level, setLevel] = useState<"Basic" | "Advanced">("Basic");
  const [submitting, setSubmitting] = useState(false);
  const [ratingDelivery, setRatingDelivery] = useState(0);
  const [ratingConfidence, setRatingConfidence] = useState(0);
  const [typed, setTyped] = useState("");
  const [localOverall, setLocalOverall] = useState(0);
  const [canSubmit, setCanSubmit] = useState(false);

  // overall computed from comments (matches student logic; UI unchanged)
  const [overall, setOverall] = useState<number | null>(null);

  // current user id cache (for like/comment authoring)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Derived state (match student page behavior)
  useEffect(() => {
    const ov = (ratingDelivery + ratingConfidence) / 2;
    setLocalOverall(ov);
    setCanSubmit(
      typed.trim().length > 0 && ratingDelivery > 0 && ratingConfidence > 0
    );
  }, [typed, ratingDelivery, ratingConfidence]);

  /* -----------------------------------------------------------------------------
   * Boot: auth + teacher header avatar (same flow as student page's header)
   * ---------------------------------------------------------------------------*/
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (mounted) setCurrentUserId(user?.id ?? null);
      if (!user || !mounted) return;

      setUserEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      const name =
        (profile?.name ??
          user.user_metadata?.full_name ??
          user.email ??
          "Teacher").trim();
      const parts = name.split(/\s+/).filter(Boolean);
      const inits =
        (parts[0]?.[0] ?? "T").toUpperCase() +
        (parts[1]?.[0] ?? "").toUpperCase();

      if (!mounted) return;
      setFullName(name);
      setInitials(inits || getInitials(name || user.email || "Teacher"));

      const url = await resolveSignedAvatar(
        user.id,
        profile?.avatar_url ?? undefined
      );
      if (!mounted) return;
      setAvatarUri(url);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* -----------------------------------------------------------------------------
   * Fetch post + author (kept identical to student, only module path differs)
   * ---------------------------------------------------------------------------*/
  const loadPost = useCallback(async () => {
    if (!effectivePostId) return;

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
      .eq("id", effectivePostId)
      .single();

    if (error || !data) return;

    const author = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
    const name = author?.name || "Student";
    setPostOwnerId(data.user_id); // NEW
    setPostAuthorName(name);
    setPostAuthorInitials(getInitials(name));
    setPostCreatedAgo(`Posted ${timeAgo(data.created_at)}`);
    setPostTitle(data.title || "Shared to Community");
    setPostContent(data.content || "Community submission");
    setPostMediaUrl(data.media_url || null);

    const signed = await resolveSignedAvatar(
      data.user_id,
      author?.avatar_url ?? null
    );
    setPostAuthorAvatar(signed);
  }, [effectivePostId]);

  /* -----------------------------------------------------------------------------
   * Likes: count + "did I like?" + realtime (same as student page)
   * ---------------------------------------------------------------------------*/
  const loadLikes = useCallback(async () => {
    if (!effectivePostId) return;

    try {
      const { count: totalCount, error: totalErr } = await supabase
        .from("likes")
        .select("id", { head: true, count: "exact" })
        .eq("post_id", effectivePostId);

      if (totalErr) throw totalErr;

      let mine = false;
      if (currentUserId) {
        const { data: mineRows, error: mineErr } = await supabase
          .from("likes")
          .select("id")
          .eq("post_id", effectivePostId)
          .eq("user_id", currentUserId);
        if (mineErr) throw mineErr;
        mine = Boolean(mineRows && mineRows.length > 0);
      }

      setLikeCount(typeof totalCount === "number" ? totalCount : 0);
      setIsLiked(mine);
    } catch (e) {
      console.warn("[likes] load error:", e);
    }
  }, [effectivePostId, currentUserId]);

  // realtime: likes channel
  useEffect(() => {
    if (!effectivePostId) return;
    const channel = supabase
      .channel(`likes-${effectivePostId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "likes",
          filter: `post_id=eq.${effectivePostId}`,
        },
        () => {
          loadLikes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectivePostId, loadLikes]);

  // notify post owner (don’t notify self)
  const insertNotification = useCallback(
    async (type: "like" | "comment") => {
      try {
        if (!effectivePostId || !currentUserId || !postOwnerId) return;
        if (postOwnerId === currentUserId) return;
        await supabase.from("notifications").insert({
          recipient_id: postOwnerId,
          actor_id: currentUserId,
          post_id: effectivePostId,
          type,
          is_read: false,
        });
      } catch (e) {
        console.log("[notifications] insert error:", e);
      }
    },
    [effectivePostId, currentUserId, postOwnerId]
  );

  const toggleLike = useCallback(async () => {
    if (!effectivePostId || !currentUserId) return;

    const next = !isLiked;

    // optimistic UI
    setIsLiked(next);
    setLikeCount((prev) => (next ? prev + 1 : Math.max(0, prev - 1)));

    try {
      if (next) {
        const { error } = await supabase.from("likes").insert({
          post_id: effectivePostId,
          user_id: currentUserId,
        });
        if (error) throw error;
        insertNotification("like"); // NEW
      } else {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", effectivePostId)
          .eq("user_id", currentUserId);
        if (error) throw error;
      }
    } catch (e) {
      // revert optimistic
      setIsLiked(!next);
      setLikeCount((prev) => (next ? Math.max(0, prev - 1) : prev + 1));
      console.warn("[likes] toggle error:", e);
      return;
    }

    loadLikes();
  }, [effectivePostId, currentUserId, isLiked, loadLikes, insertNotification]);

  /* -----------------------------------------------------------------------------
   * Comments/Reviews: list + add + realtime + rating fields
   * ---------------------------------------------------------------------------*/
  const loadComments = useCallback(async () => {
    if (!effectivePostId) return;
    setLoadingReviews(true);

    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        id,
        content,
        created_at,
        user_id,
        rating_delivery,
        rating_confidence,
        profiles!comments_user_id_fkey (
          name,
          role,
          avatar_url
        )
      `
      )
      .eq("post_id", effectivePostId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("[comments] load error:", error);
      setReviews([]);
      setOverall(null);
      setLoadingReviews(false);
      return;
    }

    const mapped: Review[] = await Promise.all(
      data.map(async (row: any) => {
        const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const name = p?.name || "User";
        const role = (p?.role as Role) || "Student";
        const parts = name.trim().split(/\s+/).filter(Boolean);
        const initials =
          ((parts[0]?.[0] || "U") + (parts[1]?.[0] || "")).toUpperCase();

        let avatar: string | null = null;
        if (p?.avatar_url) {
          avatar = await resolveSignedAvatar(row.user_id, p.avatar_url);
        }

        const rd = row.rating_delivery ?? null;
        const rc = row.rating_confidence ?? null;
        const ro =
          rd != null && rc != null ? Math.round((rd + rc) / 2) : null;

        return {
          id: row.id,
          role,
          name: `${role} • ${name}`,
          time: timeAgo(row.created_at),
          text: row.content || "",
          avatar,
          initials,
          ratingDelivery: rd,
          ratingConfidence: rc,
          ratingOverall: ro,
        } as Review;
      })
    );

    // compute overall rounded from rated comments
    const rated = mapped.filter(
      (r) => r.ratingOverall != null
    ) as Array<Review & { ratingOverall: number }>;
    const postAvgRounded = rated.length
      ? Math.round(
          rated.reduce((s, r) => s + r.ratingOverall!, 0) / rated.length
        )
      : null;

    setReviews(mapped);
    setOverall(postAvgRounded);
    setLoadingReviews(false);
  }, [effectivePostId]);

  // realtime: comments INSERT
  useEffect(() => {
    if (!effectivePostId) return;
    const channel = supabase
      .channel(`comments-${effectivePostId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${effectivePostId}`,
        },
        async (payload) => {
          try {
            const row: any = payload.new;
            const { data: prof } = await supabase
              .from("profiles")
              .select("name, role, avatar_url")
              .eq("id", row.user_id)
              .single();

            const name = prof?.name || "User";
            const role = (prof?.role as Role) || "Student";
            const parts = name.trim().split(/\s+/).filter(Boolean);
            const initials =
              ((parts[0]?.[0] || "U") + (parts[1]?.[0] || "")).toUpperCase();

            let avatar: string | null = null;
            if (prof?.avatar_url)
              avatar = await resolveSignedAvatar(row.user_id, prof.avatar_url);

            const rd = row.rating_delivery ?? null;
            const rc = row.rating_confidence ?? null;
            const ro =
              rd != null && rc != null ? Math.round((rd + rc) / 2) : null;

            const review: Review = {
              id: String(row.id),
              role,
              name: `${role} • ${name}`,
              time: timeAgo(row.created_at),
              text: row.content || "",
              avatar,
              initials,
              ratingDelivery: rd,
              ratingConfidence: rc,
              ratingOverall: ro,
            };

            setReviews((prev) => {
              const next = [review, ...prev];
              const rated = next.filter(
                (r) => r.ratingOverall != null
              ) as Array<Review & { ratingOverall: number }>;
              const postAvgRounded = rated.length
                ? Math.round(
                    rated.reduce((s, r) => s + r.ratingOverall!, 0) /
                      rated.length
                  )
                : null;
              setOverall(postAvgRounded);
              return next;
            });
          } catch (e) {
            console.log("[comments realtime] hydrate error:", e);
            loadComments();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectivePostId, loadComments]);

  const postReview = useCallback(async () => {
    setSubmitting(true);
    try {
      if (!effectivePostId || !currentUserId || !typed.trim()) {
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from("comments").insert({
        post_id: effectivePostId,
        user_id: currentUserId,
        content: typed.trim(),
        // ratings like student page
        rating_delivery: ratingDelivery,
        rating_confidence: ratingConfidence,
      });

      if (error) {
        console.warn("[comments] insert error:", error);
        setSubmitting(false);
        return;
      }

      // notify post owner
      await insertNotification("comment");

      setTyped("");
      setRatingDelivery(0);
      setRatingConfidence(0);
      await loadComments(); // keep consistent with realtime
    } finally {
      setSubmitting(false);
    }
  }, [
    effectivePostId,
    currentUserId,
    typed,
    ratingDelivery,
    ratingConfidence,
    insertNotification,
    loadComments,
  ]);

  /* -----------------------------------------------------------------------------
   * boot: load everything when param changes
   * ---------------------------------------------------------------------------*/
  useEffect(() => {
    (async () => {
      await loadPost();
      await loadLikes();
      await loadComments();
    })();
  }, [loadPost, loadLikes, loadComments]);

  /* =======================================================================================
   * UI
   * ======================================================================================= */

  return (
    <View className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background with gradient and decorative circles */}
      <View className="absolute top-0 left-0 right-0 bottom-0">
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A"]}
          className="flex-1"
        />
        <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
        <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
        <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
        <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
        <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
      </View>

      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 70 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
        >
          {/* ========================== Header ========================== */}
          <View className="w-full max-w-[400px] self-center px-4">
            <View className="flex-row justify-between top-2 items-center mt-4 mb-3 w-full">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Image
                  source={require("../../../assets/Speaksy.png")}
                  className="w-12 h-12 rounded-full right-1"
                  resizeMode="contain"
                />
                <Text className="text-white font-bold text-2xl ml-2 -left-4">
                  Voclaria
                </Text>
              </TouchableOpacity>

              <View className="flex-row items-center -right-1 space-x-2">
                {/* Header avatar uses real teacher avatar & opens ProfileMenuTeacher */}
                <TouchableOpacity
                  className="p-1 rounded-full bg-white/10"
                  onPress={() => setIsProfileMenuVisible(true)}
                  activeOpacity={0.7}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.6)",
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={{ width: 32, height: 32 }} />
                  ) : (
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: "rgba(167,139,250,0.25)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
                        {initials || "T"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ========================== Post Card ========================== */}
          <Animated.ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 0,
              paddingTop: 0,
            }}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
          >
            <GlassContainer className="mb-5 -bottom- overflow-hidden">
              <View className="relative">
                <View className="flex-row right-2 items-center mb-1 ml-4">
                  {/* Author avatar (signed) or initials fallback */}
                  {postAuthorAvatar ? (
                    <Image
                      source={{ uri: postAuthorAvatar }}
                      className="w-12 h-12 rounded-full border-2 border-white/20"
                    />
                  ) : (
                    <View
                      className="w-12 h-12 rounded-full border-2 border-white/20 items-center justify-center"
                      style={{ backgroundColor: "rgba(167,139,250,0.25)" }}
                    >
                      <Text className="text-white font-bold">
                        {postAuthorInitials}
                      </Text>
                    </View>
                  )}
                  <View className="ml-4 flex-1">
                    <Text className="text-white font-semibold text-base">
                      {postAuthorName}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      {postCreatedAgo}
                    </Text>
                  </View>
                </View>

                <Text className="text-white right-4 text-2xl font-bold mb-2 px-4">
                  {postTitle}
                </Text>
                <Text className="text-gray-300 text-base leading-relaxed mb-4 px-4">
                  {postContent}
                </Text>

                {/* Media (image thumbnail while not playing) */}
                <View className="h-64 bg-gray-800 overflow-hidden relative rounded-t-2xl">
                  <Image
                    source={{
                      uri:
                        postMediaUrl ||
                        "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=900&q=80",
                    }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-black/30" />
                </View>

                {/* Icons below media */}
                <View className="p-2 bg-white/5 rounded-b-2xl">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center space-x-6">
                      <TouchableOpacity
                        className="flex-row items-center left-1 p-2 rounded-full bg-white/10"
                        onPress={toggleLike}
                      >
                        <Ionicons
                          name={isLiked ? "heart" : "heart-outline"}
                          size={18}
                          color={isLiked ? "#ef4444" : "#9ca3af"}
                        />
                        <Text
                          className={`text-sm ml-1 right-0.1 font-medium ${
                            isLiked ? "text-red-500" : "text-gray-400"
                          }`}
                        >
                          {likeCount} {likeCount === 1 ? "like" : "likes"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View className="flex-row items-center right-1 space-x-3">
                      <TouchableOpacity className="p-2 rounded-full bg-white/10">
                        <Ionicons name="share-outline" size={20} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </GlassContainer>

            {/* ====================== Comment + Rating Composer ====================== */}
            <View className="-mt-2">
              <GlassContainer className="p-2">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1 top-3">
                    <Text className="text-white text-xl font-bold mb-1">
                      Share Your Feedback
                    </Text>
                    <Text className="text-gray-300 text-sm">
                      Help others by sharing your thoughts
                    </Text>
                  </View>

                  <View className="right-1 top-1 items-center px-3 py-2 ml-4">
                    <Text className="text-white text-2xl font-bold">
                      {Math.round((overall ?? localOverall) * 10) / 10}
                      <Text className="text-gray-400 text-base">/5</Text>
                    </Text>
                    <Text className="text-gray-300 text-xs">Overall</Text>
                  </View>
                </View>

                {/* Combined Comment and Rating Section */}
                <View className="bg-white/10 rounded-xl p-4 border border-white/20">
                  {/* Comment Input */}
                  <View className="mb-3">
                    <Text className="text-white font-bold text-xl -mb-1">
                      Your Comment
                    </Text>
                    <View className="bottom-1.5 border-b border-white/20 pb-2">
                      <TextInput
                        value={typed}
                        onChangeText={setTyped}
                        placeholder="Share your constructive feedback..."
                        placeholderTextColor="#9ca3af"
                        multiline
                        className="text-white top-4 text-medium font-medium leading-6 min-h-[40px] w-full"
                        textAlignVertical="top"
                        accessibilityLabel="Write your comment"
                      />
                    </View>
                  </View>

                  {typed.trim().length === 0 && (
                    <Text className="text-amber-400 text-xs mt-2 bottom-3">
                      Please write a comment before rating
                    </Text>
                  )}

                  {/* Rating Section */}
                  <View className="space-y-4">
                    <View className="flex-row justify-between">
                      <View className="flex-1 pr-2">
                        <Text className="text-white font-medium mb-2">
                          Delivery
                        </Text>
                        <Stars
                          value={ratingDelivery}
                          onPress={
                            typed.trim().length > 0 ? setRatingDelivery : undefined
                          }
                          disabled={typed.trim().length === 0}
                        />
                      </View>

                      <View className="flex-1 pl-2">
                        <Text className="text-white font-medium mb-2">
                          Confidence
                        </Text>
                        <Stars
                          value={ratingConfidence}
                          onPress={
                            typed.trim().length > 0 ? setRatingConfidence : undefined
                          }
                          disabled={typed.trim().length === 0}
                        />
                      </View>
                    </View>

                    {/* Overall Rating quick setter */}
                    <View className="pt-2">
                      <Text className="text-white font-medium mb-2">
                        Overall Rating
                      </Text>
                      <View className="flex-row">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <TouchableOpacity
                            key={`overall-${i}`}
                            disabled={typed.trim().length === 0}
                            onPress={() => {
                              setRatingDelivery(i);
                              setRatingConfidence(i);
                            }}
                            className="p-0.5"
                          >
                            <Ionicons
                              name={
                                i <= Math.round((overall ?? localOverall))
                                  ? "star"
                                  : "star-outline"
                              }
                              size={22}
                              color={
                                typed.trim().length > 0 ? "#FFD700" : "#d1d5db"
                              }
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text className="text-gray-400 text-xs mt-1">
                        Average of Delivery & Confidence
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={postReview}
                    disabled={!canSubmit || submitting}
                    className={`py-3 rounded-xl items-center justify-center mt-4 ${
                      canSubmit ? "bg-violet-600" : "bg-gray-600"
                    }`}
                  >
                    <Text className="text-white font-bold text-base">
                      {submitting ? "Posting..." : "Post Feedback"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </GlassContainer>
            </View>

            {/* ====================== Reviews list ====================== */}
            <GlassContainer className="mb-8 top-4">
              <View className="p-1">
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <Text className="text-white text-xl font-bold">
                      Community Reviews
                    </Text>
                    <Text className="text-gray-300 text-sm">
                      Feedback from teachers and students
                    </Text>
                  </View>
                </View>

                {loadingReviews ? (
                  <View className="py-8 items-center">
                    <ActivityIndicator color="#8B5CF6" />
                    <Text className="text-gray-400 mt-2">
                      Loading reviews...
                    </Text>
                  </View>
                ) : reviews.length > 0 ? (
                  <View className="space-y-4">
                    {reviews.map((review) => (
                      <View
                        key={review.id}
                        className="bg-white/10 rounded-xl p-4 border border-white/20"
                      >
                        <View className="flex-row items-start mb-2">
                          <View className="flex-row items-center">
                            {review.avatar ? (
                              <Image
                                source={{ uri: review.avatar }}
                                className="w-10 h-10 rounded-full mr-3 border border-white/20"
                              />
                            ) : (
                              <View className="w-10 h-10 bg-violet-500/20 rounded-full items-center justify-center mr-3">
                                <Text className="text-white font-bold">
                                  {review.initials ||
                                    review.name.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                            <View>
                              <Text className="text-white font-medium">
                                {review.name}
                              </Text>
                              <Text className="text-gray-400 text-xs">
                                {review.time} • {review.role}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Text className="text-gray-200 mt-2 text-sm leading-5">
                          {review.text}
                        </Text>
                        <View className="flex-row justify-start items-center mt-3 pt-3 border-t border-white/5">
                          <TouchableOpacity className="flex-row items-center">
                            <Ionicons
                              name="heart-outline"
                              size={18}
                              color="#9CA3AF"
                            />
                            <Text className="text-gray-400 text-xs ml-1">
                              Helpful
                            </Text>
                            <Text className="text-gray-500 text-xs ml-1">
                              • {Math.floor(Math.random() * 15) + 1}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="py-8 items-center">
                    <Ionicons
                      name="chatbubbles-outline"
                      size={48}
                      color="#4B5563"
                    />
                    <Text className="text-gray-400 mt-3 text-center">
                      No reviews yet. Be the first to share your feedback!
                    </Text>
                  </View>
                )}
              </View>
            </GlassContainer>

            {/* ====================== More from community ====================== */}
            <GlassContainer className="mb-2 bottom-1">
              <View className="p-1">
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <Text className="text-white text-lg font-bold">
                      More from Community
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      Discover trending practice sessions
                    </Text>
                  </View>
                  <TouchableOpacity className="bg-white/10 px-3 py-1 rounded-full">
                    <Text className="text-white text-xs font-medium">
                      View All
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                  className="-ml-2"
                >
                  {MORE_COMMUNITY_SAMPLE.map((c) => (
                    <View
                      key={c.id}
                      className="w-48 bg-white/5 rounded-xl p-3 mr-3 border border-white/5"
                    >
                      <View className="aspect-video bg-gray-800 rounded-lg overflow-hidden mb-3">
                        <Image
                          source={{ uri: c.user }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                        <View className="absolute inset-0 bg-black/30" />
                        <View className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded">
                          <Text className="text-white text-[10px]">2:45</Text>
                        </View>
                      </View>
                      <Text
                        className="text-white font-medium text-sm mb-1"
                        numberOfLines={1}
                      >
                        {c.title}
                      </Text>
                      <View className="flex-row items-center">
                        <View className="flex-row items-center">
                          <Ionicons
                            name="eye-outline"
                            size={12}
                            color="#9ca3af"
                          />
                          <Text className="text-gray-400 text-xs ml-1">
                            {formatCount(c.views)}
                          </Text>
                        </View>
                        <View className="w-1 h-1 bg-gray-600 rounded-full mx-2" />
                        <Text className="text-gray-400 text-xs">{c.age}</Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </GlassContainer>
          </Animated.ScrollView>
        </ScrollView>
      </SafeAreaView>

      {/* ====================== Bottom Navigation (Teacher) ====================== */}
      <NavigationBar defaultActiveTab="Community" />

      {/* ====================== Profile Menu (Teacher) ====================== */}
      <ProfileMenuTeacher
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        user={{
          name: fullName || "Teacher",
          email: userEmail || "",
          image: { uri: avatarUri || TRANSPARENT_PNG },
        }}
      />
    </View>
  );
};

export default TeacherCommunityPage;
