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
} from "react-native";
import NavigationBar from "../../../components/NavigationBar/nav-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import ProfileMenuNew from "../../../components/ProfileModal/ProfileMenuNew";
import { LevelSelectionModal } from "../../../components/StudentModal/LevelSelectionModal";
import LivesessionCommunityModal from "../../../components/StudentModal/LivesessionCommunityModal";

interface Review {
  id: string;
  role: "Teacher" | "Student" | "Peer" | "Reviewer";
  name: string;
  stars?: number;
  time: string;
  text: string;
}


// Helper function to generate unique IDs - only for React keys, not for rendering
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
    role: "Student",
    name: "Student • Anna Lee",
    time: "12 hours ago",
    text: "Very clear explanation and good pacing.",
  },
  {
    id: generateUid("r_"),
    role: "Student",
    name: "Student • John Park",
    time: "1 day ago",
    text: "Good pace and clear slides. Maybe slow down during Q&A.",
  },
  {
    id: generateUid("r_"),
    role: "Student",
    name: "Student • Mia Torres",
    time: "2 days ago",
    text: "Great job. Confident and well-structured.",
  },
  {
    id: generateUid("r_"),
    role: "Student",
    name: "Student • Liam Cruz",
    time: "3 days ago",
    text: "Solid presentation. Improve transitions between topics.",
  },
];

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

const ReviewsService = {
  store: [...MOCK_REVIEWS],

  async list(): Promise<Review[]> {
    await new Promise((res) => setTimeout(res, 220));
    return [...this.store];
  },

  async post(rev: Omit<Review, "id" | "time">): Promise<Review> {
    await new Promise((res) => setTimeout(res, 260));
    const newRev: Review = {
      id: generateUid("r_"),
      time: "just now",
      ...rev,
    };
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

const GlassContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "", ...props }) => (
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

const RowAction: React.FC<{
  icon: string;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
}> = ({ icon, label, onPress, destructive }) => (
  <TouchableOpacity
    onPress={onPress || (() => {})}
    className={`flex-row items-center px-2 py-3 rounded-lg mb-2 ${destructive ? "bg-red-50" : ""}`}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View
      className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${destructive ? "bg-red-100" : "bg-white/6"}`}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={destructive ? "#ef4444" : "#fff"}
      />
    </View>
    <Text className={`text-white ${destructive ? "text-red-500" : ""}`}>
      {label}
    </Text>
    <View className="flex-1" />
    <Ionicons
      name="chevron-forward"
      size={18}
      color={destructive ? "#ef4444" : "#9ca3af"}
    />
  </TouchableOpacity>
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

interface BottomNavProps {
  setShowLevelModal: (show: boolean) => void;
}

interface BottomNavProps {
  setShowLevelModal: (show: boolean) => void;
}

const BottomNav: React.FC<BottomNavProps & { onCommunityPress: () => void }> = ({ 
  setShowLevelModal, 
  onCommunityPress 
}) => {
  const router = useRouter();
  const pathname = usePathname?.() || "";

  const navItems = [
    {
      icon: "home-outline",
      label: "Overview",
      route: "/home-page",
  onPress: () => router.push("/StudentScreen/HomePage/home-page"),
    },
    {
      icon: "mic-outline",
      label: "Speaking",
      route: "/exercise-speaking",
      onPress: () => router.push("/exercise-speaking"),
    },
    {
      icon: "book-outline",
      label: "Reading",
      route: "/exercise-reading",
      onPress: () => setShowLevelModal(true),
    },
    {
      icon: "people-outline",
      label: "Community",
      route: "/community-page",
      onPress: onCommunityPress,
    },
  ];

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-[#0F172A]/90 backdrop-blur-lg rounded-t-3xl">
      <View className="flex-row justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              className="items-center py-2 px-1 rounded-xl"
              style={{
                backgroundColor: isActive
                  ? "rgba(255, 255, 255, 0.14)"
                  : "transparent",
              }}
              onPress={item.onPress}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={isActive ? "#A78BFA" : "rgb(255, 255, 255)"}
              />
              <Text
                className="text-xs mt-1"
                style={{ color: isActive ? "#A78BFA" : "rgb(255, 255, 255)" }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const CommunityPage: React.FC = () => {
  const router = useRouter?.() || { replace: () => {} };
  const pathname = usePathname?.() || "";
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [activeTab, setActiveTab] = useState("Community");
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [level, setLevel] = useState<"Basic" | "Advanced">("Basic");
  const [submitting, setSubmitting] = useState(false);
  const [ratingDelivery, setRatingDelivery] = useState(0);
  const [ratingConfidence, setRatingConfidence] = useState(0);
  const [typed, setTyped] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(24);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [commentEntered, setCommentEntered] = useState("");
  const [localOverall, setLocalOverall] = useState(0);
  const [canSubmit, setCanSubmit] = useState(false);
  const [overall, setOverall] = useState(0);

  const handleCommunityPress = () => {
    // Handle community item press
    console.log(`Pressed on Community`);
  };

  const handleCommunitySelect = (option: 'Live Session' | 'Community Post') => {
    setShowCommunityModal(false);
    if (option === 'Live Session') {
      router.push('/live-sessions-select');
    } else if (option === 'Community Post') {
      router.push('/community-selection');
    }
  };

  const postReview = async () => {
    // Implementation for posting a review
    setSubmitting(true);
    try {
      // Your review posting logic here
      setSubmitting(false);
    } catch (error) {
      console.error('Error posting review:', error);
      setSubmitting(false);
    }
  };

  const handleSignOut = () => {
    // Handle sign out logic
    router.replace('/login-page');
  };

  const handleIconPress = (iconName: string) => {
    if (iconName === 'log-out-outline') {
      handleSignOut();
    } else if (iconName === 'chatbot') {
      router.push('/ButtonIcon/chatbot');
    } else if (iconName === 'notifications') {
      router.push('/ButtonIcon/notification');
    } else if (iconName === 'menu-outline') {
      // Handle menu press
    }
  };

  const handleLevelSelect = (selectedLevel: "Basic" | "Advanced") => {
    setLevel(selectedLevel);
    setShowLevelModal(false);
  };

  const handleTabPress = (tab: string) => {
    if (tab === 'Community') {
      setShowCommunityModal(true);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <View className="flex-1 bg-slate-900">
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
                    <Image
                      source={{
                        uri: "https://randomuser.me/api/portraits/women/44.jpg"
                      }}
                      className="w-8 h-8 rounded-full"
                    />
                  </View>
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
            {/* Body */}
            <GlassContainer className="mb-5 -bottom- overflow-hidden">
              <View className="relative">
                <View className="flex-row right-2 items-center mb-1 ml-4">
                  <Image
                    source={{
                      uri: "https://randomuser.me/api/portraits/women/32.jpg",
                    }}
                    className="w-12 h-12 rounded-full border-2 border-white/20"
                  />
                  <View className="ml-4 flex-1">
                    <Text className="text-white font-semibold text-base">
                      Sarah Johnson
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      Posted 2 hours ago
                    </Text>
                  </View>
                </View>
                <Text className="text-white right-4 text-2xl font-bold mb-2 px-4">
                  Quarterly Sales Presentation
                </Text>
                <Text className="text-gray-300 text-base leading-relaxed mb-4">
                  This is a focused practice session to refine delivery,
                  structure, and slide flow.
                </Text>

                {/* Video */}

                <View className="h-64 bg-gray-800 overflow-hidden relative rounded-t-2xl">
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=900&q=80",
                    }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute top-3 left-3  rounded-full px-2 py-1 flex-row items-center z-10">
                    <Ionicons name="time-outline" size={16} color="white" />
                    <Text className="text-white text-sm ml-2 font-medium">
                      5:24 min
                    </Text>
                  </View>
                  <View className="absolute top-3 right-3 bg-black/50 rounded-full px-2 py-1 flex-row items-center z-10">
                    <Ionicons name="eye-outline" size={14} color="#9ca3af" />
                    <Text className="text-gray-200 text-xs ml-1 font-medium">
                      127 views
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

                {/* Icons below video */}
                <View className="p-2 bg-white/5 rounded-b-2xl">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center space-x-6">
                      <TouchableOpacity
                        className="flex-row items-center left-1 p-2 rounded-full bg-white/10"
                        onPress={() => {
                          const newLikeState = !isLiked;
                          setIsLiked(newLikeState);
                          setLikeCount((prev) =>
                            newLikeState ? prev + 1 : prev - 1
                          );
                        }}
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
                    <View className="flex-row items-center right-1 space-x-3">
                      <TouchableOpacity className="p-2 rounded-full bg-white/10">
                        <Ionicons
                          name="share-outline"
                          size={20}
                          color="#9ca3af"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </GlassContainer>

            {/* Improved comment + rating post area */}
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
                  {!commentEntered && (
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
                            commentEntered ? setRatingDelivery : undefined
                          }
                          disabled={!commentEntered}
                        />
                      </View>

                      <View className="flex-1 pl-2">
                        <Text className="text-white font-medium mb-2">
                          Confidence
                        </Text>
                        <Stars
                          value={ratingConfidence}
                          onPress={
                            commentEntered ? setRatingConfidence : undefined
                          }
                          disabled={!commentEntered}
                        />
                      </View>
                    </View>

                    {/* Overall Rating */}
                    <View className="pt-2">
                      <Text className="text-white font-medium mb-2">
                        Overall Rating
                      </Text>
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

            {/* Reviews list (teacher + student feed) */}
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
                            <View className="w-10 h-10 bg-violet-500/20 rounded-full items-center justify-center mr-3">
                              <Text className="text-white font-bold">
                                {review.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
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

            {/* More from community horizontal scroller */}
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

  {/* Bottom Navigation */}
  <NavigationBar defaultActiveTab="Community" />

      {/* Level Selection Modal */}
      <LevelSelectionModal
        visible={showLevelModal}
        onDismiss={() => setShowLevelModal(false)}
        onSelectLevel={(selectedLevel) => {
          setLevel(selectedLevel);
          setShowLevelModal(false);
          // Navigate to the appropriate reading page based on level
          if (selectedLevel === "Basic") {
            router.push("/basic-exercise-reading");
          } else {
            router.push("/advance-execise-reading");
          }
        }}
      />

      {/* Profile Menu */}
      <ProfileMenuNew
        visible={profileOpen}
        onDismiss={() => setProfileOpen(false)}
        user={{
          name: "Sarah Johnson",
          email: "sarah@gmail.com",
          image: { uri: "https://randomuser.me/api/portraits/women/44.jpg" },
        }}
      />
      <LivesessionCommunityModal
        visible={showCommunityModal}
        onDismiss={() => setShowCommunityModal(false)}
        onSelectOption={handleCommunitySelect}
      />

      {/* Profile Modal bottom sheet */}
      <Modal
        visible={profileOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setProfileOpen(false)}
      >
        <View style={{ flex: 1 }}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.3)" },
            ]}
          />
          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#0e1724",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 16,
            }}
          >
            <View className="w-10 h-1 rounded bg-white/12 self-center mb-3" />
            <View className="items-center">
              <Image
                source={{
                  uri: "https://randomuser.me/api/portraits/women/44.jpg",
                }}
                className="w-18 h-18 rounded-full border border-white/12"
              />
              <Text className="text-white mt-2 font-bold text-base">
                Sarah Johnson
              </Text>
              <Text className="text-gray-400 text-sm">sarah@fluentech.app</Text>
            </View>

            <View className="mt-4">
              <RowAction
                icon="settings-outline"
                label="Settings"
                onPress={() => router?.push?.("/settings")}
              />
              <RowAction
                icon="sparkles-outline"
                label="Upgrade"
                onPress={() =>
                  Alert.alert("Upgrade", "Upgrade flow not implemented in demo")
                }
              />
              <RowAction
                icon="log-out-outline"
                label="Log out"
                destructive
                onPress={() => handleSignOut()}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default CommunityPage;
