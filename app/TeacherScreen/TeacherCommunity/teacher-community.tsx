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
  Animated,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import NavigationBar from "../../../components/NavigationBar/nav-bar-teacher";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname, useLocalSearchParams } from "expo-router";
import ProfileMenuTeacher from "../../../components/ProfileModal/ProfileMenuTeacher";

// Supabase
import { supabase } from "@/lib/supabaseClient";

// Media players
import { Audio, Video, ResizeMode } from "expo-av";

// Downloads & native share (same as student page)
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// ---------- helpers ----------
const isAudioUrl = (uri?: string | null) =>
  !!uri && /\.(m4a|mp3|aac|wav|ogg)(\?|#|$)/i.test(uri || "");

const isVideoUrl = (uri?: string | null) =>
  !!uri && /\.(mp4|mov|mkv|webm)(\?|#|$)/i.test(uri || "");

async function resolveSignedAvatar(
  userId: string,
  storedPath?: string | null
): Promise<string | null> {
  try {
    if (storedPath && /^https?:\/\//i.test(storedPath)) return storedPath;
    const base = (storedPath ?? userId).toString().replace(/^avatars\//, "");
    const hasFile = /\.[a-zA-Z0-9]+$/.test(base);
    let objectPath: string | null = null;

    if (hasFile) {
      objectPath = base;
    } else {
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(base, { limit: 1, sortBy: { column: "created_at", order: "desc" } });
      if (files && files.length > 0) objectPath = `${base}/${files[0].name}`;
    }

    if (!objectPath) return null;

    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(objectPath, 60 * 60);
    return signed?.signedUrl ?? null;
  } catch {
    return null;
  }
}

async function resolveSignedRecording(mediaUrl?: string | null): Promise<string | null> {
  if (!mediaUrl) return null;
  if (/^https?:\/\//i.test(mediaUrl)) return mediaUrl;
  // Normalize (allow both "recordings/..." and raw path)
  const base = mediaUrl.replace(/^recordings\//, "");
  const objectPath = base;
  const { data: signed, error } = await supabase
    .storage
    .from("recordings")
    .createSignedUrl(objectPath, 60 * 60 * 24 * 7);
  if (error) {
    if (!String(error.message || "").toLowerCase().includes("object not found")) {
      console.warn("[media] sign error:", error.message);
    }
    return null;
  }
  return signed?.signedUrl ?? null;
}

const timeAgo = (iso?: string | null) => {
  if (!iso) return "";
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const steps = [60, 60, 24, 7, 4.345, 12];
  const labels = ["s", "m", "h", "d", "w", "mo", "y"];
  let i = 0, acc = s;
  while (i < steps.length && acc >= steps[i]) { acc = Math.floor(acc / steps[i]); i++; }
  return `${acc}${labels[i] || "s"} ago`;
};

interface Review {
  id: string;
  role: "Teacher" | "Student" | "Peer" | "Reviewer";
  name: string;
  stars?: number;
  time: string;
  text: string;
  avatar?: string | null;
  initials?: string;
  ratingDelivery?: number | null;
  ratingConfidence?: number | null;
  ratingOverall?: number | null;
}

const roleFromProfile = (p: any): "Teacher" | "Student" | "Peer" => {
  const roleStr = (p?.role || "").toString().toLowerCase();
  if (roleStr === "teacher") return "Teacher";
  if (roleStr === "student") return "Student";
  return "Peer";
};

const generateUid = (prefix: string = ""): string =>
  `${prefix}${Math.random().toString(36).slice(2, 9)}`;

const MOCK_REVIEWS: Review[] = [
  {
    id: generateUid("r_"),
    role: "Teacher",
    name: "Teacher • Michael Chen",
    time: "1 hour ago",
    text: "Excellent presentation. Your confidence shows, and the visuals are clear. Keep steadier eye contact in the opening.",
  },
  {
    id: generateUid("r_"),
    role: "Teacher",
    name: "Teacher • Anna Lee",
    time: "12 hours ago",
    text: "Very clear explanation and good pacing.",
  },
  {
    id: generateUid("r_"),
    role: "Teacher",
    name: "Teacher • John Park",
    time: "1 day ago",
    text: "Good pace and clear slides. Maybe slow down during Q&A.",
  },
];

const ReviewsService = {
  store: [...MOCK_REVIEWS],
  async list(): Promise<Review[]> {
    await new Promise((res) => setTimeout(res, 220));
    return [...this.store];
  },
  async post(rev: Omit<Review, "id" | "time">): Promise<Review> {
    await new Promise((res) => setTimeout(res, 260));
    const newRev: Review = { id: generateUid("r_"), time: "just now", ...rev };
    this.store = [newRev, ...this.store];
    return newRev;
  },
  async overall(): Promise<number> {
    const reviewsWithStars = this.store.filter((r) => r.stars !== undefined);
    if (reviewsWithStars.length === 0) return 0;
    const avg =
      reviewsWithStars.reduce((s, r) => s + (r.stars || 0), 0) /
      reviewsWithStars.length;
    return Math.round(avg * 10) / 10;
  },
};

const GlassContainer: React.FC<{ children: React.ReactNode; className?: string; }> = ({ children, className = "", ...props }) => (
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
    {...props}
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

const formatCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`.replace(".0", "");
  }
  return count.toString();
};

// ===================== PAGE =====================

const CommunityPage: React.FC = () => {
  const router = useRouter?.() || { replace: () => {} };
  const pathname = usePathname?.() || "";
  const { postId, studentId } = useLocalSearchParams<{ postId?: string; studentId?: string }>();
  const effectivePostId = (postId || studentId) as string | undefined;

  // Profile menu (Teacher)
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);

  // current user avatar + initials
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [initials, setInitials] = useState<string>("");

  // post header data
  const [postAuthorName, setPostAuthorName] = useState<string>("Sarah Johnson");
  const [postAuthorAvatar, setPostAuthorAvatar] = useState<string | null>(null);
  const [postAuthorInitials, setPostAuthorInitials] = useState<string>("SJ");
  const [postCreatedAgo, setPostCreatedAgo] = useState<string>("Posted 2 hours ago");
  const [postTitle, setPostTitle] = useState<string>("Quarterly Sales Presentation");
  const [postContent, setPostContent] = useState<string>("This is a focused practice session to refine delivery, structure, and slide flow.");
  const [postMediaUrl, setPostMediaUrl] = useState<string | null>(null);

  // post owner id (notifications)
  const [postOwnerId, setPostOwnerId] = useState<string | null>(null);

  // media type
  const [postMediaType, setPostMediaType] = useState<"audio" | "video" | "none">("none");

  // likes
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(24);

  // reviews/comments
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // helpful (same working logic as student)
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});
  const [helpfulMine, setHelpfulMine] = useState<Set<string>>(new Set());

  // other state
  const [activeTab, setActiveTab] = useState("Community");
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [level, setLevel] = useState<"Basic" | "Advanced">("Basic");
  const [submitting, setSubmitting] = useState(false);
  const [ratingDelivery, setRatingDelivery] = useState(0);
  const [ratingConfidence, setRatingConfidence] = useState(0);
  const [typed, setTyped] = useState("");
  const [commentEntered, setCommentEntered] = useState("");
  const [localOverall, setLocalOverall] = useState(0);
  const [canSubmit, setCanSubmit] = useState(false);
  const [overall, setOverall] = useState<number | null>(null);

  // user id
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // audio player state
  const soundRef = useRef<Audio.Sound | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);

  const fmt = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // >>> NEW: views state/logic
  const [viewsCount, setViewsCount] = useState<number>(0);
  const [viewInserted, setViewInserted] = useState<boolean>(false);

  const loadViews = useCallback(async () => {
    if (!effectivePostId) return;
    try {
      const { count, error } = await supabase
        .from("post_views")
        .select("id", { head: true, count: "exact" })
        .eq("post_id", effectivePostId);
      if (error) throw error;
      setViewsCount(typeof count === "number" ? count : 0);
    } catch (e) {
      // ignore
    }
  }, [effectivePostId]);

  useEffect(() => {
    (async () => {
      if (!effectivePostId || viewInserted) return;
      try {
        await supabase.from("post_views").insert({
          post_id: effectivePostId,
          user_id: currentUserId ?? null,
        });
        setViewInserted(true);
        await loadViews();
      } catch {}
    })();
  }, [effectivePostId, currentUserId, viewInserted, loadViews]);

  useEffect(() => {
    if (!effectivePostId) return;

    const ch = supabase
      .channel(`views-${effectivePostId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_views",
          filter: `post_id=eq.${effectivePostId}`,
        },
        (_payload) => {
          void loadViews(); // run and ignore returned promise
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [effectivePostId, loadViews]);

  // >>> NEW: More from Community (real posts)
  type MiniPost = {
    id: string;
    title: string;
    avatar: string | null;
    created_at: string;
    views: number;
  };
  const [morePosts, setMorePosts] = useState<MiniPost[]>([]);

  const shortAge = (iso: string) => {
    const secs = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    const wks = Math.floor(days / 7);
    if (wks < 4) return `${wks}w`;
    const mos = Math.floor(days / 30);
    if (mos < 12) return `${mos}mo`;
    const yrs = Math.floor(days / 365);
    return `${yrs}y`;
  };

  const loadMoreFromCommunity = useCallback(async () => {
    try {
      let q = supabase
        .from("posts")
        .select(`
          id,
          title,
          created_at,
          user_id,
          profiles!posts_user_id_fkey(name, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (effectivePostId) q = q.neq("id", effectivePostId);

      const { data, error } = await q;
      if (error || !data) {
        setMorePosts([]);
        return;
      }

      const mapped: MiniPost[] = await Promise.all(
        data.map(async (row: any) => {
          const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          let avatar: string | null = null;
          if (p?.avatar_url) {
            avatar = await resolveSignedAvatar(row.user_id, p.avatar_url);
          }
          return {
            id: String(row.id),
            title: row.title || "Untitled",
            avatar,
            created_at: row.created_at,
            views: Math.floor(Math.random() * 220) + 15,
          };
        })
      );

      const shuffled = mapped.sort(() => Math.random() - 0.5).slice(0, 5);
      setMorePosts(shuffled);
    } catch {
      setMorePosts([]);
    }
  }, [effectivePostId]);
  // <<< NEW

  useEffect(() => {
    setCommentEntered(typed.trim().length > 0 ? "y" : "");
    const rounded = Math.round(((ratingDelivery + ratingConfidence) / 2) * 10) / 10;
    setLocalOverall(rounded);
    setCanSubmit(typed.trim().length > 0 && ratingDelivery > 0 && ratingConfidence > 0);
  }, [typed, ratingDelivery, ratingConfidence]);

  // boot: auth + header avatar
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (mounted) setCurrentUserId(user?.id ?? null);
      if (!user || !mounted) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      const name = (profile?.name ?? user.user_metadata?.full_name ?? user.email ?? "Teacher").trim();
      const parts = name.split(/\s+/).filter(Boolean);
      const inits = (parts[0]?.[0] ?? "T").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();

      if (!mounted) return;
      setFullName(name);
      setInitials(inits || "T");

      const url = await resolveSignedAvatar(user.id, profile?.avatar_url ?? undefined);
      if (!mounted) return;
      setAvatarUri(url);
    })();
    return () => { mounted = false; };
  }, []);

  // fetch post + author
  const loadPost = useCallback(async () => {
    if (!effectivePostId) return;

    const { data, error } = await supabase
      .from("posts")
      .select(`
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
      `)
      .eq("id", effectivePostId)
      .single();

    if (error || !data) return;

    const author = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
    const authorName = author?.name ?? "User";
    const initials = (() => {
      const s = (authorName || "User").trim();
      const parts = s.split(/\s+/).filter(Boolean);
      return ((parts[0]?.[0] || "U") + (parts[1]?.[0] || "")).toUpperCase();
    })();

    setPostOwnerId(data.user_id);
    setPostAuthorName(authorName);
    setPostAuthorInitials(initials);
    setPostCreatedAgo(`Posted ${timeAgo(data.created_at)}`);
    setPostTitle(data.title || postTitle);
    setPostContent(data.content || postContent);

    let signedMedia: string | null = null;
    if (data.media_url) signedMedia = await resolveSignedRecording(data.media_url);
    setPostMediaUrl(signedMedia);
    if (signedMedia) {
      setPostMediaType(isAudioUrl(signedMedia) ? "audio" : (isVideoUrl(signedMedia) ? "video" : "video"));
    } else {
      setPostMediaType("none");
    }

    const signed = await resolveSignedAvatar(data.user_id, author?.avatar_url ?? null);
    setPostAuthorAvatar(signed);
  }, [effectivePostId, postTitle, postContent]);

  // likes
  const loadLikes = useCallback(async () => {
    if (!effectivePostId) return;
    try {
      const { count: totalCount, error: totalErr } = await supabase
        .from("likes")
        .select("id", { head: true, count: "exact" })
        .eq("post_id", effectivePostId);
      if (totalErr) throw totalErr;

      const { data: mineRows, error: mineErr } = currentUserId
        ? await supabase
            .from("likes")
            .select("id")
            .eq("post_id", effectivePostId)
            .eq("user_id", currentUserId)
        : { data: null, error: null };
      if (mineErr) throw mineErr;

      setLikeCount(typeof totalCount === "number" ? totalCount : 24);
      setIsLiked(Boolean(mineRows && mineRows.length > 0));
    } catch (e) {
      console.warn("[likes] load error:", e);
    }
  }, [effectivePostId, currentUserId]);

  useEffect(() => { loadLikes(); }, [loadLikes]);

  useEffect(() => {
    if (!effectivePostId) return;
    const channel = supabase
      .channel(`likes-${effectivePostId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "likes",
        filter: `post_id=eq.${effectivePostId}`,
      }, () => {
        loadLikes();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [effectivePostId, loadLikes]);

  const insertNotification = useCallback(async (type: "like" | "comment") => {
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
  }, [effectivePostId, currentUserId, postOwnerId]);

  const toggleLike = useCallback(async () => {
    if (!effectivePostId || !currentUserId) return;
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount(prev => (next ? prev + 1 : Math.max(0, prev - 1)));
    try {
      if (next) {
        const { error } = await supabase.from("likes").insert({
          post_id: effectivePostId,
          user_id: currentUserId,
        });
        if (error) throw error;
        insertNotification("like");
      } else {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", effectivePostId)
          .eq("user_id", currentUserId);
        if (error) throw error;
      }
    } catch (e) {
      setIsLiked(!next);
      setLikeCount(prev => (next ? Math.max(0, prev - 1) : prev + 1));
      console.warn("[likes] toggle error:", e);
      return;
    }
    loadLikes();
  }, [effectivePostId, currentUserId, isLiked, loadLikes, insertNotification]);

  // >>> NEW: Helpful — load, realtime handled implicitly by UI updates
  const loadHelpful = useCallback(async (commentIds: string[]) => {
    if (!commentIds.length) {
      setHelpfulCounts({});
      setHelpfulMine(new Set());
      return;
    }
    try {
      const { data, error } = await supabase
        .from("comment_helpful")
        .select("comment_id, user_id")
        .in("comment_id", commentIds);

      if (error) throw error;

      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      for (const row of (data || []) as { comment_id: string; user_id: string }[]) {
        counts[row.comment_id] = (counts[row.comment_id] || 0) + 1;
        if (row.user_id === currentUserId) mine.add(row.comment_id);
      }
      commentIds.forEach((id) => {
        if (counts[id] == null) counts[id] = 0;
      });

      setHelpfulCounts(counts);
      setHelpfulMine(mine);
    } catch (e) {
      // silent
    }
  }, [currentUserId]);

  const toggleHelpful = useCallback(async (commentId: string) => {
    if (!currentUserId) return;

    const isMine = helpfulMine.has(commentId);
    const nextMine = new Set(helpfulMine);
    const nextCounts = { ...helpfulCounts };

    // optimistic
    if (isMine) {
      nextMine.delete(commentId);
      nextCounts[commentId] = Math.max(0, (nextCounts[commentId] || 0) - 1);
    } else {
      nextMine.add(commentId);
      nextCounts[commentId] = (nextCounts[commentId] || 0) + 1;
    }
    setHelpfulMine(nextMine);
    setHelpfulCounts(nextCounts);

    try {
      if (isMine) {
        const { error } = await supabase
          .from("comment_helpful")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", currentUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("comment_helpful")
          .upsert(
            { comment_id: commentId, user_id: currentUserId },
            { onConflict: "comment_id,user_id" }
          );
        if (error) throw error;
      }
    } catch (e) {
      // revert on failure
      const revertMine = new Set(helpfulMine);
      const revertCounts = { ...helpfulCounts };
      if (isMine) {
        revertMine.add(commentId);
        revertCounts[commentId] = (revertCounts[commentId] || 0) + 1;
      } else {
        revertMine.delete(commentId);
        revertCounts[commentId] = Math.max(0, (revertCounts[commentId] || 0) - 1);
      }
      setHelpfulMine(revertMine);
      setHelpfulCounts(revertCounts);
    }
  }, [currentUserId, helpfulMine, helpfulCounts]);
  // <<< NEW

  // comments/reviews
  const loadComments = useCallback(async () => {
    if (!effectivePostId) return;
    setLoadingReviews(true);

    const { data, error } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        user_id,
        rating_delivery,
        rating_confidence,
        profiles!comments_user_id_fkey (
          name,
          avatar_url,
          role
        )
      `)
      .eq("post_id", effectivePostId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("[comments] load error:", error);
      setReviews(MOCK_REVIEWS);
      setOverall(null);
      setLoadingReviews(false);
      return;
    }

    const mapped: Review[] = await Promise.all(
      data.map(async (row: any) => {
        const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        const humanRole = roleFromProfile(p);
        const nameBase = p?.name || "User";
        const displayName = `${humanRole} • ${nameBase}`;
        const parts = nameBase.trim().split(/\s+/).filter(Boolean);
        const initials = ((parts[0]?.[0] || "U") + (parts[1]?.[0] || "")).toUpperCase();

        let avatar: string | null = null;
        if (p?.avatar_url) avatar = await resolveSignedAvatar(row.user_id, p.avatar_url);

        const rd = row.rating_delivery ?? null;
        const rc = row.rating_confidence ?? null;
        const ro = rd != null && rc != null ? Math.round(((rd + rc) / 2) * 10) / 10 : null;

        return {
          id: row.id,
          role: humanRole,
          name: displayName,
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

    const rated = mapped
      .map(r => r.ratingOverall)
      .filter((n): n is number => typeof n === "number");

    const postAvgRounded = rated.length
      ? Math.round((rated.reduce((s, n) => s + n, 0) / rated.length) * 10) / 10
      : null;

    // load helpful counts for these comments
    await loadHelpful(mapped.map(r => r.id));

    setReviews(mapped);
    setOverall(postAvgRounded);
    setLoadingReviews(false);
  }, [effectivePostId, loadHelpful]);

  // realtime: comments INSERT
  useEffect(() => {
    if (!effectivePostId) return;
    const channel = supabase
      .channel(`comments-${effectivePostId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "comments",
        filter: `post_id=eq.${effectivePostId}`,
      }, async (payload) => {
        try {
          const row: any = payload.new;
          const { data: prof } = await supabase
            .from("profiles")
            .select("name, avatar_url, role")
            .eq("id", row.user_id)
            .single();

          const humanRole = roleFromProfile(prof);
          const nameBase = prof?.name || "User";
          const displayName = `${humanRole} • ${nameBase}`;
          const parts = nameBase.trim().split(/\s+/).filter(Boolean);
          const initials = ((parts[0]?.[0] || "U") + (parts[1]?.[0] || "")).toUpperCase();

          let avatar: string | null = null;
          if (prof?.avatar_url) avatar = await resolveSignedAvatar(row.user_id, prof.avatar_url);

          const rd = row.rating_delivery ?? null;
          const rc = row.rating_confidence ?? null;
          const ro = rd != null && rc != null ? Math.round(((rd + rc) / 2) * 10) / 10 : null;

          const review: Review = {
            id: String(row.id),
            role: humanRole,
            name: displayName,
            time: timeAgo(row.created_at),
            text: row.content || "",
            avatar,
            initials,
            ratingDelivery: rd,
            ratingConfidence: rc,
            ratingOverall: ro,
          };

          setReviews(prev => {
            const next = [review, ...prev];
            const rated = next
              .map(r => r.ratingOverall)
              .filter((n): n is number => typeof n === "number");
            const avg =
              rated.length
                ? Math.round((rated.reduce((s, n) => s + n, 0) / rated.length) * 10) / 10
                : null;
            setOverall(avg);
            return next;
          });

          // init helpful count for the new comment
          setHelpfulCounts(c => ({ ...c, [String(row.id)]: 0 }));
        } catch (e) {
          console.log("[comments realtime] hydrate error:", e);
          loadComments(); // fallback refresh
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
        rating_delivery: ratingDelivery,
        rating_confidence: ratingConfidence,
      });

      if (error) {
        console.warn("[comments] insert error:", error);
        setSubmitting(false);
        return;
      }

      await insertNotification("comment");

      setTyped("");
      setRatingDelivery(0);
      setRatingConfidence(0);
      await loadComments();
    } finally {
      setSubmitting(false);
    }
  }, [effectivePostId, currentUserId, typed, insertNotification, loadComments, ratingDelivery, ratingConfidence]);

  // boot: load all
  useEffect(() => {
    (async () => {
      await loadPost();
      await loadLikes();
      await loadComments();
      await loadViews();
      await loadMoreFromCommunity();
    })();
  }, [loadPost, loadLikes, loadComments, loadViews, loadMoreFromCommunity]);

  const handleIconPress = (iconName: string) => {
    if (iconName === "log-out-outline") router.replace("/login-page");
    else if (iconName === "add-student") router.push("/ButtonIcon/add-student");
    else if (iconName === "settings") router.push("/settings");
  };

  const handleLevelSelect = (selectedLevel: "Basic" | "Advanced") => {
    setLevel(selectedLevel);
    setShowLevelModal(false);
  };

  // ===== Share/Download (same logic as student) =====
  const filenameFromUrl = (url: string) => {
    try {
      const u = new URL(url);
      const last = u.pathname.split("/").pop() || "media";
      return last.includes(".") ? last : `${last}.bin`;
    } catch {
      return "media.bin";
    }
  };

  const downloadMedia = useCallback(async () => {
    if (!postMediaUrl) return;
    try {
      const localUri = FileSystem.documentDirectory + filenameFromUrl(postMediaUrl);
      const res = await FileSystem.downloadAsync(postMediaUrl, localUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(res.uri);
      } else {
        Alert.alert("Downloaded", `Saved to: ${res.uri}`);
      }
    } catch (e) {
      Alert.alert("Download failed", "Please try again.");
    }
  }, [postMediaUrl]);

  const ensureLocalMediaFile = useCallback(async (remoteUrl?: string | null) => {
    if (!remoteUrl) return null;
    if (remoteUrl.startsWith("file://")) return remoteUrl;
    try {
      const filename = filenameFromUrl(remoteUrl);
      const dest = FileSystem.documentDirectory + `shared_${Date.now()}_${filename}`;
      const res = await FileSystem.downloadAsync(remoteUrl, dest);
      if (res.status !== 200) return null;
      return res.uri;
    } catch (e) {
      console.warn("[share] download failed:", e);
      return null;
    }
  }, []);

  const shareMedia = useCallback(async () => {
    if (!postMediaUrl) return;
    try {
      const localUri = await ensureLocalMediaFile(postMediaUrl);
      if (localUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(localUri);
        return;
      }
      await Share.share({ message: postMediaUrl, url: postMediaUrl });
    } catch (e) {
      console.warn("[share] error:", e);
    }
  }, [postMediaUrl, ensureLocalMediaFile]);
  // ================================================

  // audio load/unload
  useEffect(() => {
    let mounted = true;
    const loadAudio = async () => {
      if (postMediaType !== "audio" || !postMediaUrl) return;
      setAudioLoading(true);
      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        const { sound } = await Audio.Sound.createAsync(
          { uri: postMediaUrl },
          { shouldPlay: false },
          (status) => {
            if (!status.isLoaded) return;
            setAudioPlaying(status.isPlaying);
            setAudioDuration(status.durationMillis ?? 0);
            setAudioPosition(status.positionMillis ?? 0);
            if ((status as any).didJustFinish) {
              setAudioPlaying(false);
              setAudioPosition(0);
              try { soundRef.current?.setPositionAsync(0); } catch {}
            }
          }
        );
        if (!mounted) { await sound.unloadAsync(); return; }
        soundRef.current = sound;
        const st = await sound.getStatusAsync();
        setAudioLoaded(st.isLoaded);
        setAudioDuration(st.isLoaded ? st.durationMillis ?? 0 : 0);
        setAudioPosition(st.isLoaded ? st.positionMillis ?? 0 : 0);
      } catch (e) {
        console.warn("[audio] load error:", e);
        setAudioLoaded(false);
      } finally {
        setAudioLoading(false);
      }
    };
    loadAudio();
    return () => {
      mounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [postMediaType, postMediaUrl]);

  const toggleAudioPlay = async () => {
    if (!soundRef.current || !audioLoaded) return;
    const s = soundRef.current;
    const st = await s.getStatusAsync();
    if (!st.isLoaded) return;
    const RESTART_EPS = 800;
    const atEnd =
      (st.durationMillis ?? 0) > 0 &&
      Math.abs((st.positionMillis ?? 0) - (st.durationMillis ?? 0)) < RESTART_EPS;
    if (st.isPlaying) {
      await s.pauseAsync();
      setAudioPlaying(false);
    } else {
      if (atEnd) {
        await s.setPositionAsync(0);
        setAudioPosition(0);
      }
      await s.playAsync();
      setAudioPlaying(true);
    }
  };

  // ===================== UI (Teacher header style) =====================
  return (
    <View className="flex-1 bg-slate-900">
      {/* Background with gradient and decorative circles */}
      <View className="absolute top-0 left-0 right-0 bottom-0">
        <LinearGradient colors={["#0F172A", "#1E293B", "#0F172A"]} className="flex-1" />
        <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
        <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
        <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
        <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
        <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
      </View>

      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 90 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
        >
          <View className="w-full max-w-[400px] self-center px-4">
            {/* Header (teacher style like selection) */}
            <View className="flex-row justify-between items-center mt-8 mb-3 w-full">
              <View className="flex-row items-center">
                <Image
                  source={require("../../../assets/Speaksy.png")}
                  className="w-12 h-12 rounded-full right-2"
                  resizeMode="contain"
                />
                <Text className="text-white font-bold text-2xl ml-2 -left-5">
                  Voclaria
                </Text>
              </View>

              <View className="flex-row items-center right-2">
                <TouchableOpacity
                  onPress={() => handleIconPress("add-student")}
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
                  onPress={() => setIsProfileMenuVisible(true)}
                  activeOpacity={0.7}
                  className="w-9 h-9 rounded-full border-2 border-white/80 overflow-hidden"
                >
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} className="w-9 h-9" />
                  ) : (
                    <View className="w-9 h-9 bg-violet-600 items-center justify-center">
                      <Text className="text-white text-xs font-bold">
                        {initials || "T"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

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
            {/* Body card with media */}
            <GlassContainer className="mb-1 -bottom-1.5 overflow-hidden">
              <View className="relative">
                <View className="flex-row right-2 items-center mb-1 ml-4">
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

                {postMediaType === "audio" && postMediaUrl ? (
                  <View className="mx-4 mb-3 bg-white/10 border border-white/10 rounded-xl p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-white font-medium">Audio Preview</Text>
                      <TouchableOpacity
                        onPress={toggleAudioPlay}
                        className="bg-black/40 rounded-full px-3 py-1.5"
                        disabled={!audioLoaded || audioLoading}
                      >
                        <Text className="text-white text-sm">
                          {audioLoading ? "Loading…" : audioPlaying ? "Pause" : "Play"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View className="mt-2">
                      <View className="w-full bg-white/20 rounded-full h-1.5">
                        <View
                          className="bg-white h-full rounded-full"
                          style={{
                            width: `${audioDuration ? Math.min(100, (audioPosition / audioDuration) * 100) : 0}%`,
                          }}
                        />
                      </View>
                      <View className="flex-row justify-between mt-1">
                        <Text className="text-gray-300 text-xs">{fmt(audioPosition)}</Text>
                        <Text className="text-gray-300 text-xs">{fmt(audioDuration)}</Text>
                      </View>
                    </View>
                  </View>
                ) : postMediaType === "video" && postMediaUrl ? (
                  <View className="mx-4 mb-3 rounded-xl overflow-hidden bg-black">
                    <Video
                      source={{ uri: postMediaUrl }}
                      style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" }}
                      resizeMode={ResizeMode.CONTAIN}
                      useNativeControls
                      isLooping
                      shouldPlay={false}
                    />
                  </View>
                ) : (
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
                    <View className="absolute top-3 left-3 rounded-full px-2 py-1 flex-row items-center z-10">
                      <Ionicons name="time-outline" size={16} color="white" />
                      <Text className="text-white text-sm ml-2 font-medium">5:24 min</Text>
                    </View>
                    <View className="absolute top-3 right-3 bg-black/50 rounded-full px-2 py-1 flex-row items-center z-10">
                      <Ionicons name="eye-outline" size={14} color="#9ca3af" />
                      <Text className="text-gray-200 text-xs ml-1 font-medium">
                        {viewsCount} views
                      </Text>
                    </View>
                    <View className="absolute inset-0 bg-black/30" />
                    <View
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: [{ translateX: -40 }, { translateY: -40 }],
                        width: 80,
                        height: 80,
                        backgroundColor: "rgba(255, 255, 255, 0.3)",
                        borderRadius: 40,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: "rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      <Ionicons name="play" size={36} color="#fff" />
                    </View>
                  </View>
                )}

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
                          className={`text-sm ml-1 right-0.1 font-medium ${isLiked ? "text-red-500" : "text-gray-400"}`}
                        >
                          {likeCount} {likeCount === 1 ? "like" : "likes"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {/* Right-side actions: SHARE ONLY (tap = share, long-press = download) */}
                    <View className="flex-row items-center right-1 space-x-3">
                      <TouchableOpacity
                        className="p-2 rounded-full bg-white/10"
                        onPress={shareMedia}
                        onLongPress={downloadMedia}
                        delayLongPress={300}
                      >
                        <Ionicons name="share-outline" size={20} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </GlassContainer>

            {/* Feedback composer */}
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
                      {overall ?? localOverall}
                      <Text className="text-gray-400 text-base">/5</Text>
                    </Text>
                    <Text className="text-gray-300 text-xs">Overall</Text>
                  </View>
                </View>

                <View className="bg-white/10 rounded-xl p-4 border border-white/20">
                  {/* Comment */}
                  <View className="mb-3">
                    <Text className="text-white font-bold text-xl -mb-1">Your Comment</Text>
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
                  {!commentEntered && (
                    <Text className="text-amber-400 text-xs mt-2 bottom-3">
                      Please write a comment before rating
                    </Text>
                  )}

                  {/* Ratings */}
                  <View className="space-y-4">
                    <View className="flex-row justify-between">
                      <View className="flex-1 pr-2">
                        <Text className="text-white font-medium mb-2">Delivery</Text>
                        <Stars
                          value={ratingDelivery}
                          onPress={commentEntered ? setRatingDelivery : undefined}
                          disabled={!commentEntered}
                        />
                      </View>

                      <View className="flex-1 pl-2">
                        <Text className="text-white font-medium mb-2">Confidence</Text>
                        <Stars
                          value={ratingConfidence}
                          onPress={commentEntered ? setRatingConfidence : undefined}
                          disabled={!commentEntered}
                        />
                      </View>
                    </View>

                    {/* Overall */}
                    <View className="pt-2">
                      <Text className="text-white font-medium mb-2">Overall Rating</Text>
                      <Stars
                        value={Math.round(localOverall)}
                        onPress={
                          commentEntered
                            ? (val) => {
                                setRatingDelivery(val);
                                setRatingConfidence(val);
                              }
                            : undefined
                        }
                        disabled={!commentEntered}
                      />
                      <Text className="text-gray-400 text-xs mt-1">
                        Average of Delivery & Confidence
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={postReview}
                    disabled={!canSubmit || submitting}
                    className={`py-3 rounded-xl items-center justify-center mt-4 ${canSubmit ? "bg-violet-600" : "bg-gray-600"}`}
                  >
                    <Text className="text-white font-bold text-base">
                      {submitting ? "Posting..." : "Post Feedback"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </GlassContainer>
            </View>

            {/* Reviews list */}
            <GlassContainer className="mb-8 top-4">
              <View className="p-1">
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <Text className="text-white text-xl font-bold">Community Reviews</Text>
                    <Text className="text-gray-300 text-sm">Feedback from teachers</Text>
                  </View>
                </View>

                {loadingReviews ? (
                  <View className="py-8 items-center">
                    <ActivityIndicator color="#8B5CF6" />
                    <Text className="text-gray-400 mt-2">Loading reviews...</Text>
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
                                  {review.initials || review.name.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                            <View>
                              <Text className="text-white font-medium">{review.name}</Text>
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
                          <TouchableOpacity className="flex-row items-center" onPress={() => toggleHelpful(review.id)}>
                            <Ionicons
                              name={helpfulMine.has(review.id) ? "heart" : "heart-outline"}
                              size={18}
                              color={helpfulMine.has(review.id) ? "#ef4444" : "#9CA3AF"}
                            />
                            <Text className="text-gray-400 text-xs ml-1">Helpful</Text>
                            <Text className="text-gray-500 text-xs ml-1">• {helpfulCounts[review.id] ?? 0}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="py-8 items-center">
                    <Ionicons name="chatbubbles-outline" size={48} color="#4B5563" />
                    <Text className="text-gray-400 mt-3 text-center">
                      No reviews yet. Be the first to share your feedback!
                    </Text>
                  </View>
                )}
              </View>
            </GlassContainer>

            {/* More from community */}
            <GlassContainer className="mb-2 bottom-1">
              <View className="p-1">
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <Text className="text-white text-lg font-bold">More from Community</Text>
                    <Text className="text-gray-400 text-xs">Discover trending practice sessions</Text>
                  </View>
                  {/* View All → teacher can jump to the shared community list */}
                  <TouchableOpacity
                    className="bg-white/10 px-3 py-1 rounded-full"
                    onPress={() => router.push("/StudentScreen/StudentCommunity/community-selection")}
                  >
                    <Text className="text-white text-xs font-medium">View All</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 16 }}
                  className="-ml-2"
                >
                  {morePosts.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      className="w-48 bg-white/5 rounded-xl p-3 mr-3 border border-white/5"
                      activeOpacity={0.8}
                      onPress={() => router.push(`/TeacherScreen/TeacherCommunity/teacher-community?postId=${c.id}`)}
                    >
                      <View className="aspect-video bg-gray-800 rounded-lg overflow-hidden mb-3">
                        <Image
                          source={{ uri: c.avatar || "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&q=60&auto=format" }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                        <View className="absolute inset-0 bg-black/30" />
                        <View className="absolute bottom-2 right-2 bg-black/60 px-1.5 py-0.5 rounded">
                          <Text className="text-white text-[10px]">2:45</Text>
                        </View>
                      </View>
                      <Text className="text-white font-medium text-sm mb-1" numberOfLines={1}>
                        {c.title}
                      </Text>
                      <View className="flex-row items-center">
                        <View className="flex-row items-center">
                          <Ionicons name="eye-outline" size={12} color="#9ca3af" />
                          <Text className="text-gray-400 text-xs ml-1">{formatCount(c.views)}</Text>
                        </View>
                        <View className="w-1 h-1 bg-gray-600 rounded-full mx-2" />
                        <Text className="text-gray-400 text-xs">{shortAge(c.created_at)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </GlassContainer>
          </Animated.ScrollView>
        </ScrollView>
      </SafeAreaView>

      {/* Bottom Navigation (teacher) */}
      <NavigationBar defaultActiveTab="Community" />

      {/* Profile Menu */}
      <ProfileMenuTeacher
        visible={isProfileMenuVisible}
        onDismiss={() => setIsProfileMenuVisible(false)}
        user={{
          name: fullName || "Teacher",
          email: "",
          image: { uri: avatarUri || "" },
        }}
      />
    </View>
  );
};

export default CommunityPage;
