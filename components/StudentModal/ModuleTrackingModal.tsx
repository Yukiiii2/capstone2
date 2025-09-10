import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabaseClient";

// ---------- Your local type (kept) ----------
type Module = {
  id: string;
  title: string;
  subtitle: string; // "Lesson N"
  level: "basic" | "advanced";
  type: "speaking" | "reading";
  completed: boolean;
  upcoming: boolean;
};

type ModuleTrackingModalProps = {
  visible: boolean;
  onClose: () => void;
  filterType: "completed" | "upcoming";
};

// ---------- Fallback static lists (kept) ----------
const STATIC_SPEAKING: Module[] = [
  { id: "s1", title: "Effective Non-Verbal Communication", subtitle: "Lesson 1", level: "basic", type: "speaking", completed: true, upcoming: false },
  { id: "s2", title: "Diaphragmatic Breathing Practice", subtitle: "Lesson 2", level: "basic", type: "speaking", completed: true, upcoming: false },
  { id: "s3", title: "Voice Warm-up and Articulation", subtitle: "Lesson 3", level: "basic", type: "speaking", completed: true, upcoming: false },
  { id: "s4", title: "Eye Contact and Facial Expression", subtitle: "Lesson 4", level: "basic", type: "speaking", completed: true, upcoming: false },
  { id: "s5", title: "Basic Self-Introduction", subtitle: "Lesson 5", level: "basic", type: "speaking", completed: true, upcoming: false },
  { id: "s6", title: "Telling a Personal Story", subtitle: "Lesson 6", level: "basic", type: "speaking", completed: true, upcoming: false },
  { id: "s7", title: "Persuasive Speech Building", subtitle: "Lesson 1", level: "advanced", type: "speaking", completed: false, upcoming: true },
  { id: "s8", title: "Advanced Debate Practice", subtitle: "Lesson 2", level: "advanced", type: "speaking", completed: false, upcoming: true },
  { id: "s9", title: "Panel Interview Simulation", subtitle: "Lesson 3", level: "advanced", type: "speaking", completed: false, upcoming: true },
  { id: "s10", title: "Crisis Communication Response", subtitle: "Lesson 4", level: "advanced", type: "speaking", completed: false, upcoming: true },
  { id: "s11", title: "Intercultural Communication", subtitle: "Lesson 5", level: "advanced", type: "speaking", completed: false, upcoming: true },
];

const STATIC_READING: Module[] = [
  { id: "r1", title: "Reading Fundamentals", subtitle: "Lesson 1", level: "basic", type: "reading", completed: true, upcoming: false },
  { id: "r2", title: "Vocabulary Building Basics", subtitle: "Lesson 2", level: "basic", type: "reading", completed: true, upcoming: false },
  { id: "r3", title: "Sentence Structure & Grammar", subtitle: "Lesson 3", level: "basic", type: "reading", completed: true, upcoming: false },
  { id: "r4", title: "Critical Analysis & Interpretation", subtitle: "Lesson 4", level: "advanced", type: "reading", completed: false, upcoming: true },
  { id: "r5", title: "Academic Research Reading", subtitle: "Lesson 5", level: "advanced", type: "reading", completed: false, upcoming: true },
  { id: "r6", title: "Literary Analysis Deep Dive", subtitle: "Lesson 6", level: "advanced", type: "reading", completed: false, upcoming: true },
];

// ---------- DB row shapes (optional columns are nullable) ----------
type DBModule = {
  id: string;
  title: string | null;
  category?: "speaking" | "reading" | null;
  level?: "Basic" | "Advanced" | null;
  order_index?: number | null;
  active?: boolean | null;
};
type DBProgress = { module_id: string; progress: number | null };

const ModuleTrackingModal: React.FC<ModuleTrackingModalProps> = ({
  visible,
  onClose,
  filterType,
}) => {
  const [selectedModuleType, setSelectedModuleType] = useState<"speaking" | "reading">("speaking");
  const [loading, setLoading] = useState(false);
  const [speakingModules, setSpeakingModules] = useState<Module[]>(STATIC_SPEAKING);
  const [readingModules, setReadingModules] = useState<Module[]>(STATIC_READING);

  // ---------- animation (kept) ----------
  const translateY = useSharedValue(500);
  useEffect(() => {
    if (visible) translateY.value = withSpring(0, { damping: 20, stiffness: 120 });
    else translateY.value = withTiming(500);
  }, [visible]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  // ---------- build UI modules from DB rows (updated: unlocked-only upcoming) ----------
  const buildDisplay = useCallback(
    (mods: DBModule[], progresses: DBProgress[]): { spk: Module[]; read: Module[] } => {
      const pMap = new Map<string, number>();
      (progresses || []).forEach((p) => pMap.set(p.module_id, p.progress ?? 0));

      const activeMods = (mods || []).filter((m) => (m.active ?? true));

      // Split by category (fallback null => speaking)
      const byCat = {
        speaking: activeMods.filter((m) => m.category === "speaking" || m.category == null),
        reading: activeMods.filter((m) => m.category === "reading"),
      } as const;

      const toUIList = (rows: DBModule[], cat: "speaking" | "reading") => {
        // group by level to form tracks (fallback "default")
        const groups = new Map<string, DBModule[]>();
        rows.forEach((m) => {
          const key = (m.level ? String(m.level).toLowerCase() : "default") as string;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(m);
        });

        const out: Module[] = [];

        for (const [levelKey, list] of groups) {
          // stable order
          list.sort((a, b) => {
            const ai = Number.isFinite(a.order_index) ? (a.order_index as number) : 0;
            const bi = Number.isFinite(b.order_index) ? (b.order_index as number) : 0;
            if (ai !== bi) return ai - bi;
            return (a.title ?? "").localeCompare(b.title ?? "");
          });

          let prevCompleted = false;
          list.forEach((m, idx) => {
            const progress = pMap.get(m.id) ?? 0;
            const completed = progress >= 100;
            const unlocked = idx === 0 ? true : prevCompleted;

            const level =
              ((m.level ?? "Advanced").toString().toLowerCase() as "basic" | "advanced") ||
              "advanced";

            const lessonNum =
              typeof m.order_index === "number" ? (m.order_index as number) + 1 : idx + 1;

            out.push({
              id: m.id,
              title: m.title ?? "Untitled Module",
              subtitle: `Lesson ${lessonNum}`,
              level,
              type: cat,
              completed,
              upcoming: !completed && unlocked, // 👈 only unlocked items are upcoming
            });

            // carry forward for lock logic
            prevCompleted = completed;
          });
        }

        return out;
      };

      return {
        spk: toUIList(byCat.speaking, "speaking"),
        read: toUIList(byCat.reading, "reading"),
      };
    },
    []
  );

  // ---------- load from Supabase ----------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }

      // fetch modules (with optional columns if present)
      const { data: modules, error: modErr } = await supabase
        .from("modules")
        .select("id, title, category, level, order_index, active")
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: true });

      if (modErr) {
        console.warn("modules error:", modErr);
        setLoading(false);
        return;
      }

      // fetch user progress
      const { data: prog, error: progErr } = await supabase
        .from("student_progress")
        .select("module_id, progress")
        .eq("student_id", uid);

      if (progErr) {
        console.warn("progress error:", progErr);
        setLoading(false);
        return;
      }

      // If no modules in DB yet, keep static lists
      if (!modules || modules.length === 0) {
        setSpeakingModules(STATIC_SPEAKING);
        setReadingModules(STATIC_READING);
        setLoading(false);
        return;
      }

      const { spk, read } = buildDisplay(modules as DBModule[], prog as DBProgress[]);
      // If category column not present (all null), reading may be empty — keep static reading then.
      setSpeakingModules(spk.length ? spk : STATIC_SPEAKING);
      setReadingModules(read.length ? read : STATIC_READING);
    } finally {
      setLoading(false);
    }
  }, [buildDisplay]);

  // Load when opened
  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  // Realtime updates on this user's progress
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;

      channel = supabase
        .channel("rt-student-progress-modal")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "student_progress",
            filter: `student_id=eq.${uid}`,
          },
          () => load()
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [load]);

  // ---------- pick tab list + filter ----------
  const modules = selectedModuleType === "speaking" ? speakingModules : readingModules;

  const filteredModules = useMemo(
    () => modules.filter((m) => (filterType === "completed" ? m.completed : m.upcoming)),
    [modules, filterType]
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/40" />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[animatedStyle, { maxHeight: "85%" }]}
        className="absolute bottom-0 left-0 right-0 h-[85%] bg-[#1A1F2E]/95 backdrop-blur-xl rounded-t-2xl shadow-lg"
      >
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-white/10">
          <Text className="text-lg font-semibold text-white">
            {filterType === "completed" ? "Completed Modules" : "Upcoming Modules"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row space-x-6 px-4 mt-3">
          {(["speaking", "reading"] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedModuleType(type)}
              className="flex items-start"
            >
              <Text
                className={`text-base font-medium ${
                  selectedModuleType === type ? "text-white" : "text-gray-400"
                }`}
              >
                {type === "speaking" ? "Speaking" : "Reading"}
              </Text>
              {selectedModuleType === type && <View className="h-0.5 w-full bg-blue-500 mt-1" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Body */}
        <ScrollView
          className="p-4"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={true}
        >
          {loading ? (
            <View className="py-10 items-center">
              <ActivityIndicator color="#8B5CF6" />
              <Text className="text-gray-400 mt-2">Loading modules…</Text>
            </View>
          ) : filteredModules.length === 0 ? (
            <Text className="text-center text-gray-400 mt-6">
              No {selectedModuleType} modules found
            </Text>
          ) : (
            filteredModules.map((module) => (
              <View
                key={module.id}
                className="mb-3 p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <View className="flex-row justify-between items-start mb-1">
                  <View className="flex-row items-center space-x-2">
                    {/* Yellow dot for upcoming list */}
                    {filterType === "upcoming" && (
                      <View className="w-2 h-2 bg-yellow-400 rounded-full" />
                    )}
                    {/* Level chip for upcoming */}
                    {filterType === "upcoming" && (
                      <View className="px-2 py-0.5">
                        <Text className="text-xs font-medium text-yellow-300">
                          {module.level.toUpperCase()}
                        </Text>
                      </View>
                    )}
                    {/* Completed chip (green) */}
                    {filterType === "completed" && (
                      <View className="flex-row items-center space-x-1">
                        <View className="w-2 h-2 bg-green-400 rounded-full" />
                        <Text className="text-xs font-medium text-green-300">COMPLETED</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-400">{module.subtitle}</Text>
                </View>

                <Text className="text-base font-bold text-white mt-1" numberOfLines={2}>
                  {module.title}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

export default ModuleTrackingModal;
