import React, { useMemo, useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Easing, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Pressable, 
  Alert, 
  Dimensions,
  StatusBar,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams, router } from "expo-router";
import { supabase } from "@/lib/supabaseClient";

const { width } = Dimensions.get('window');

const lessonPrompt = "Tell the student to prepare a short speech outline with introduction, body, and conclusion";
const topic = "Structuring a Speech";
const criteria = "Provide feedback for (Introduction, Body, Conclusion), Logical Flow of ideas, Transition Markers";

const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient colors={["#0F172A", "#1E293B", "#0F172A"]} className="flex-1" />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
  </View>
);

type QuizQ = { id: number; question: string; options: string[]; correct: number };
type RubricItem = {
  label: string;
  rating?: string;
  descriptions: {
    high: string;
    medium: string;
    low: string;
  };
};

type LessonDetail = {
  id: number;
  title: string;
  subtitle: string;
  intro: string;
  bullets?: string[];
  importance: string[];
  tips: string[];
  quiz: QuizQ[];
  taskTitle?: string;
  taskBody: string;
  rubric: RubricItem[];
  references: { title?: string; url: string }[];
};

const LESSONS: LessonDetail[] = [
  {
    id: 3,
    title: "Structuring a Speech",
    subtitle: "Basic • Lesson 3",
    intro:
      "A good speech has a clear structure: introduction, body, and conclusion. It helps organize ideas and makes the message easy to follow.",
    importance: [
      "Keeps audience focused",
      "Improves speech flow",
      "Strengthens message delivery",
    ],
    tips: [
      "Start with a hook (quote, story, question)",
      "Organize points logically",
      "End with a strong conclusion",
    ],
    quiz: [
      {
        id: 1,
        question: "What are the three main parts of a speech?",
        options: ["Hook, body, summary", "Introduction, body, conclusion", "Start, middle, end", "Greeting, facts, goodbye"],
        correct: 1,
      },
      {
        id: 2,
        question: "Why is structure important in a speech?",
        options: ["To confuse the audience", "To make jokes", "To keep ideas organized", "To make it longer"],
        correct: 2,
      },
    ],
    taskBody: `Task: Record a 1–2 minute mini-speech on one topic from the list below. Speak naturally, clearly, and follow the structure.

    Before recording:

1.  Choose a simple topic (see list below).
2.  Plan your mini-speech using this outline:
• Introduction: Start with a hook (quote, question, or short story).
• Body: Explain your main points (2–3 ideas).
• Conclusion: End with a clear summary or message.
3.  Practice saying your speech before recording to make it smooth.

    Topic List:

1.  “Why reading helps me become more confident.”
2.  “How I can improve my English speaking skills.”
3.  “My experience in speaking in front of the class.”
4.  “Why good communication is important for students.”
5.  “How technology helps me practice English.”`,
    rubric: [
      { 
        label: "Introduction, Body, Conclusion", 
        descriptions: {
          high: "All parts are complete and clearly stated",
          medium: "Missing 1 part or not clear",
          low: "Missing 2 or more parts"
        }
      },
      { 
        label: "Logical Flow of Ideas", 
        descriptions: {
          high: "Ideas follow a smooth, logical order",
          medium: "Some ideas are out of order or unclear",
          low: "Ideas are jumbled, hard to follow"
        }
      },
      { 
        label: "Transition Markers", 
        descriptions: {
          high: "Uses clear connectors (first, next, finally, in conclusion)",
          medium: "Uses a few transitions but not consistent",
          low: "No transitions, speech feels choppy"
        }
      },
      { 
        label: "Completeness", 
        descriptions: {
          high: "Covers the topic fully with enough details",
          medium: "Some details missing, somewhat incomplete",
          low: "Very brief, missing key points"
        }
      }
    ],
    references: [
      { url: "https://owl.purdue.edu/owl/general_writing/speeches/speech_organization.html"},
      { url: "https://www.toastmasters.org/education/pathways/pathways-level-1/speech-organization"},
      { url: "https://www.carminegallo.com/books/talk-like-ted/"}
    ]
  }
];

// ===== helpers for progress write (50%) =====
const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const QUIZ_PROGRESS_PCT = 50;                  // store 50% after quiz
const BASIC_ORDER_INDEX_FOR_THIS = 3;          // this is Basic Lesson #3

const saveQuizProgress50 = async (): Promise<void> => {
  try {
    // 1) Current user
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    // 2) Find the module_id for Basic, order_index = 3
    const { data: mod, error: modErr } = await supabase
      .from("modules")
      .select("id")
      .eq("category", "speaking")
      .eq("level", "basic")
      .eq("active", true)
      .eq("order_index", BASIC_ORDER_INDEX_FOR_THIS)
      .maybeSingle();

    if (modErr || !mod?.id) return;
    const moduleId = mod.id as string;

    // 3) Check if existing progress exists
    const { data: existing, error: selErr } = await supabase
      .from("student_progress")
      .select("id, progress, completed")
      .eq("student_id", user.id)
      .eq("module_id", moduleId)
      .maybeSingle();

    if (!selErr && existing?.id) {
      const newProgress = Math.max(clampPct(existing.progress ?? 0), QUIZ_PROGRESS_PCT);
      await supabase
        .from("student_progress")
        .update({
          progress: newProgress,
          completed: !!existing.completed && newProgress >= 100,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      return;
    }

    // 4) Insert fresh row at 50%
    await supabase.from("student_progress").insert({
      student_id: user.id,
      module_id: moduleId,
      progress: QUIZ_PROGRESS_PCT,
      completed: false,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // swallow for UX
  }
};

// ===== UI bits =====

// Animated Progress Bar Component
const ProgressBar = ({ progress }: { progress: number }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View className="h-2 bg-white/10 rounded-full overflow-hidden mt-4">
      <Animated.View 
        className="h-full bg-violet-600 rounded-full" 
        style={{ width: widthAnim.interpolate({
          inputRange: [0, 100],
          outputRange: ['0%', '100%']
        }) }}
      />
    </View>
  );
};

// Floating Action Button Component
const FloatingActionButton = ({ 
  icon, 
  onPress, 
  label 
}: { 
  icon: string; 
  onPress: () => void; 
  label?: string;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="bg-violet-600 py-4 px-6 rounded-2xl flex-row items-center"
        activeOpacity={0.8}
      >
        <Text className="text-white font-bold text-base mr-2">{label}</Text>
        <Ionicons name={icon as any} size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Section Indicator Component
const SectionIndicator = ({ currentSection }: { currentSection: number }) => {
  if (currentSection === 2) return null; // hide on recording
  
  return (
    <View className="flex-row justify-center gap-6 mt-1 mb">
      {[0, 1, 2].map((sectionIndex) => {
        const isActive = sectionIndex === currentSection;
        const isCompleted = sectionIndex < currentSection;
        
        return (
          <View key={sectionIndex} className="items-center">
            <View 
              className={`w-2 h-2 rounded-full ${isActive ? 'bg-violet-500' : isCompleted ? 'bg-violet-400' : 'bg-white/20'}`}
            />
            <Text 
              className={`text-xs mt-1 ${isActive ? 'text-violet-400' : 'text-white/40'}`}
            >
              {sectionIndex === 0 ? 'Lesson' : sectionIndex === 1 ? 'Quiz' : 'Record'}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// Lesson Section Component
const LessonSection = ({ data, onNext, onBack }: { data: LessonDetail, onNext: () => void, onBack: () => void }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }} 
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="bg-gradient-to-b from-white/5 to-white/10 rounded-2xl p-4 border border-white/10 mb-4 mx-4">
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity onPress={onBack} className="p-2 bg-white/10 rounded-full">
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">Lesson Content</Text>
            <View className="w-10" />
          </View>
          <Text className="text-white leading-6 text-lg mb-6">{data.intro}</Text>

          <View className="mb-6">
            <View className="flex-row items-center mb-1">
              <Ionicons name="alert-circle-outline" size={20} color="#ffffff" />
              <Text className="text-white text-lg font-semibold ml-2">Importance</Text>
            </View>
            {data.importance.map((imp, i) => (
              <View key={i} className="flex-row items-start mt-3 bg-white/10 p-1 rounded-lg">
                <View className="w-5 h-5 bg-white/5 rounded-full items-center justify-center mr-3 mt-0.1">
                  <Ionicons name="star" size={10} color="#ffffff" />
                </View>
                <Text className="text-white/90 text-xs top-0.5 flex-1">{imp}</Text>
              </View>
            ))}
          </View>

          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="bulb-outline" size={20} color="#ffffff" />
              <Text className="text-white text-lg font-semibold ml-2">Tips & Strategies</Text>
            </View>
            {data.tips.map((t, i) => (
              <View key={i} className="flex-row items-start mt-3 bg-white/10 p-1 rounded-lg">
                <View className="w-5 h-5 bg-white/5 rounded-full items-center justify-center mr-3 mt-0.1">
                  <Ionicons name="bulb" size={10} color="#ffffff" />
                </View>
                <Text className="text-white/90 text-xs top-0.5 flex-1">{t}</Text>
              </View>
            ))}
          </View>

          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="library-outline" size={20} color="#ffffff" />
              <Text className="text-white text-lg font-semibold ml-2">References</Text>
            </View>
            <View>
              {data.references.map((ref, i) => (
                <TouchableOpacity 
                  key={i} 
                  onPress={() => Linking.openURL(ref.url)}
                  className="flex-row items-center py-2"
                  activeOpacity={0.7}
                >
                  <Ionicons name="link" size={18} color="#a78bfa" className="mr-3" />
                  <Text className="text-violet-300 text-xs left-2 underline">
                    {ref.title || ref.url}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="flex-row justify-between mt mb-4 px-4">
            <TouchableOpacity 
              onPress={() => onBack()}
              className="py-3 px-8 rounded-xl bg-white/20 border border-white/20 flex-1 mr-3 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-white font-medium text-base">Back</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={onNext}
              className="py-3 px-8 rounded-xl bg-violet-600 flex-1 ml-3 items-center"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-base">Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

// Quiz Section Component (shuffled choices + 50% progress write on Done)
const QuizSection = ({ data, onBack, onNext }: { 
  data: LessonDetail; 
  onBack: () => void; 
  onNext: () => void;
}) => {
  const [answers, setAnswers] = useState<Record<number, number | null>>(
    Object.fromEntries(data.quiz.map((q) => [q.id, null]))
  );
  const [submitted, setSubmitted] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [saving, setSaving] = useState(false);

  // Shuffled options per question: { [questionId]: Array<{ text: string, isCorrect: boolean }> }
  const [shuffled, setShuffled] = useState<Record<number, { text: string; isCorrect: boolean }[]>>({});

  // Fisher-Yates
  const shuffle = <T,>(arr: T[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const buildShuffle = React.useCallback(() => {
    const map: Record<number, { text: string; isCorrect: boolean }[]> = {};
    data.quiz.forEach((q) => {
      const opts = q.options.map((text, idx) => ({
        text,
        isCorrect: idx === q.correct,
      }));
      map[q.id] = shuffle(opts);
    });
    return map;
  }, [data.quiz]);

  useEffect(() => {
    setShuffled(buildShuffle());
  }, [buildShuffle]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleSubmit = () => setSubmitted(true);

  const totalCorrect = React.useMemo(() => {
    return data.quiz.reduce((acc, q) => {
      const picked = answers[q.id];
      if (picked == null) return acc;
      const row = shuffled[q.id];
      if (!row) return acc;
      return acc + (row[picked]?.isCorrect ? 1 : 0);
    }, 0);
  }, [answers, data.quiz, shuffled]);

  const percent = React.useMemo(() => {
    const total = data.quiz.length || 1;
    return Math.round((totalCorrect / total) * 100);
  }, [totalCorrect, data.quiz.length]);

  const allAnswered = React.useMemo(
    () => Object.values(answers).every((v) => v !== null),
    [answers]
  );

  const handleRetake = () => {
    setSubmitted(false);
    setAnswers(Object.fromEntries(data.quiz.map((q) => [q.id, null])));
    setShuffled(buildShuffle());
  };

  const handleDone = async () => {
    try {
      setSaving(true);
      await saveQuizProgress50();
    } finally {
      setSaving(false);
      onNext();
    }
  };

  return (
    <Animated.View 
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }} 
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="bg-gradient-to-b from-white/5 to-white/10 rounded-2xl p-4 border border-white/10 mb-4 mx-4">
          <View className="items-center mb-3">
            <Text className="text-white text-4xl font-bold">Quiz</Text>
          </View>

          <Text className="text-white/80 text-base mb-6 text-center">
            Test your understanding with these questions:
          </Text>
          
          {data.quiz.map((q, qi) => {
            const options = shuffled[q.id] ?? [];
            return (
              <View key={q.id} className="mb-6 bg-white/5 p-4 rounded-lg border border-white/10">
                <Text className="text-white font-medium text-base mb-3">
                  {qi + 1}. {q.question}
                </Text>

                {options.map((opt, idx) => {
                  const sel = answers[q.id] === idx;
                  const ok = submitted && opt.isCorrect;
                  const bad = submitted && sel && !opt.isCorrect;

                  return (
                    <TouchableOpacity
                      key={idx}
                      className={`flex-row items-center px-4 py-3 rounded-lg mb-2 border ${
                        ok ? "border-green-500/60 bg-green-500/10" :
                        bad ? "border-red-500/60 bg-red-500/10" :
                        sel ? "border-violet-500 bg-violet-500/10" :
                        "border-white/10 bg-white/5"
                      }`}
                      onPress={() => !submitted && setAnswers(prev => ({ ...prev, [q.id]: idx }))}
                      activeOpacity={0.8}
                    >
                      <View className={`w-6 h-6 mr-3 rounded-full border-2 flex items-center justify-center ${
                        sel ? "bg-violet-600 border-violet-600" : "border-white/40"
                      }`}>
                        {sel && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      <Text className={`text-base flex-1 ${
                        ok ? "text-green-200" : 
                        bad ? "text-red-200" : 
                        "text-white/90"
                      }`}>
                        {opt.text}
                      </Text>
                      {ok && <Ionicons name="checkmark-circle" size={20} color="#22c55e" />}
                      {bad && <Ionicons name="close-circle" size={20} color="#ef4444" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}

          {!submitted ? (
            <View className="flex-row justify-between mt">
              <TouchableOpacity 
                onPress={onBack}
                className="py-4 px-6 rounded-xl bg-white/20 border border-white/20 flex-1 mr-3 items-center justify-center active:opacity-70"
                activeOpacity={0.7}
              >
                <Text className="text-white font-medium text-base">Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSubmit} 
                className="py-4 px-6 rounded-xl bg-violet-600 flex-1 ml-3 items-center justify-center active:bg-violet-700 active:scale-95 transition-all"
                disabled={!allAnswered}
                style={{ opacity: allAnswered ? 1 : 0.6 }}
              >
                <Text className="text-white font-semibold text-base">Submit Quiz</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mt mb-2">
              <Text className="text-white/80 text-center mb-4">
                Your score: {percent}%
                {'\n'}
                {totalCorrect / (data.quiz.length || 1) >= 0.7 
                  ? "Great job! You're ready to proceed." 
                  : "Review the lesson and try again."}
              </Text>
              <View className="flex-row justify-between">
                <TouchableOpacity 
                  onPress={handleRetake}
                  className="py-3 px-6 rounded-xl bg-white/10 border border-white/20 items-center justify-center active:opacity-70 flex-1 mr-2"
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-medium text-base">Retake Quiz</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleDone}
                  className="py-3 px-6 rounded-xl bg-violet-600 items-center justify-center active:bg-violet-700 flex-1 ml-2"
                  activeOpacity={0.7}
                  disabled={saving}
                  style={{ opacity: saving ? 0.7 : 1 }}
                >
                  <Text className="text-white font-semibold text-base">
                    {saving ? "Saving…" : "Done"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

      </ScrollView>
    </Animated.View>
  );
};

// Recording Section Component
const RecordingSection = ({ data, onBack }: { data: LessonDetail; onBack: () => void }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }} 
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="bg-gradient-to-b from-white/5 to-white/10 rounded-2xl p-4 border border-white/10 mt-10 mb-4 mx-4">
          <View className="items-center">
            <Text className="text-white text-2xl font-bold">Recording Task</Text>
          </View>

          <View className="mb-10">
            <Text className="text-white text-sm top-4 leading-5">{data.taskBody}</Text>
          </View>

          <View className="mb-5">
            <View className="flex-row items-center mb-3">
              <Ionicons name="list-outline" size={18} color="#ffffff" />
              <Text className="text-white text-base font-semibold ml-2">Evaluation Rubric</Text>
            </View>
            <View className="border-2 border-white/20 rounded-lg overflow-hidden">
              {/* Table Header */}
              <View className="flex-row bg-white/10">
                <View className="w-1/4 p-2 border-r-2 border-white/20">
                  <Text className="text-white font-medium text-xs">Criteria</Text>
                </View>
                <View className="w-1/4 p-2 border-r-2 border-white/20 items-center justify-center">
                  <Text className="text-white font-bold text-sm">5</Text>
                </View>
                <View className="w-1/4 p-2 border-r-2 border-white/20 items-center justify-center">
                  <Text className="text-white font-bold text-sm">3</Text>
                </View>
                <View className="w-1/4 p-2 items-center justify-center">
                  <Text className="text-white font-bold text-sm">1</Text>
                </View>
              </View>
              
              {/* Table Rows - Only first 4 criteria */}
              {data.rubric.slice(0, 4).map((item, i) => (
                <View key={i} className="border-t-2 border-white/10">
                  <View className="flex-row min-h-[100px]">
                    <View className="w-1/4 p-2 border-r-2 border-white/10">
                      <Text className="text-white text-xs font-medium">{item.label}</Text>
                    </View>
                    <View className="w-1/4 p-2 border-r-2 border-white/10">
                      <Text className="text-white/90 text-[11px] leading-4">{item.descriptions.high}</Text>
                    </View>
                    <View className="w-1/4 p-2 border-r-2 border-white/10">
                      <Text className="text-white/90 text-[11px] leading-4">{item.descriptions.medium}</Text>
                    </View>
                    <View className="w-1/4 p-2">
                      <Text className="text-white/90 text-[11px] leading-4">{item.descriptions.low}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
            {/* Score Guide */}
            <View className="mt-4 bg-white/5 p-3 rounded-lg">
              <Text className="text-white font-medium mb-2">Score Guide:</Text>
              <View className="space-y-2">
                <Text className="text-white/90 text-xs">16–20 = <Text className="text-green-400">Excellent</Text></Text>
                <Text className="text-white/90 text-xs mt-2">11–15 = <Text className="text-blue-400">Good</Text></Text>
                <Text className="text-white/90 text-xs mt-2">6–10 = <Text className="text-yellow-400">Needs Work</Text></Text>
                <Text className="text-white/90 text-xs mt-2">1–5 = <Text className="text-red-400">Poor</Text></Text>
              </View>
            </View>
          </View>

          <View className="flex-row justify-between mt-2 space-x-3">
            <TouchableOpacity 
              onPress={onBack} 
              className="py-3 px-4 rounded-xl bg-white/10 border border-white/20 flex-1 items-center justify-center active:opacity-70"
              activeOpacity={0.7}
            >
              <Text className="text-white font-medium text-sm">Back to Quiz</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: "/StudentScreen/SpeakingExercise/live-vid-selection",
                params: { lessonPrompt, topic, criteria },
              })}
              className="py-3 px-4 rounded-xl bg-violet-600 flex-1 items-center justify-center active:bg-violet-700 active:scale-95 transition-all"
              activeOpacity={0.7}
            >
              <Text className="text-white font-semibold text-sm">Start Recording</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default function LessonScreen() {
  const [currentSection, setCurrentSection] = useState(0);
  const params = useLocalSearchParams();
  const lessonId = parseInt(params.id as string) || 3;
  const lesson = LESSONS.find(l => l.id === lessonId) || LESSONS[0];
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to top when section changes
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [currentSection]);

  const sections = [
    <LessonSection 
      key="lesson" 
      data={lesson} 
      onNext={() => setCurrentSection(1)}
      onBack={() => router.push('/StudentScreen/SpeakingExercise/basic-contents')}
    />,
    <QuizSection 
      key="quiz" 
      data={lesson} 
      onBack={() => setCurrentSection(0)} 
      onNext={() => setCurrentSection(2)} 
    />,
    <RecordingSection 
      key="recording" 
      data={lesson} 
      onBack={() => setCurrentSection(1)} 
    />
  ];

  return (
    <View className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" />
      <BackgroundDecor />
      
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 z-10"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 0 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-10 px-4 pb-4">
          <Text className="text-white text-2xl font-bold">{lesson.title}</Text>
          <Text className="text-violet-400 text-base mt-1">{lesson.subtitle}</Text>
          <SectionIndicator currentSection={currentSection} />
        </View>

        <View className="flex-1">
          {sections[currentSection]}
        </View>
      </ScrollView>
    </View>
  );
}
