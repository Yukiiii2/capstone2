// app/StudentScreen/SpeakingExercise/LessonAdvance/advancelesson-5.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Animated,
  Easing,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";

const { width } = Dimensions.get("window");

/* 🔹 Minimal additions for consistent param forwarding (matches lessons 2–4) */
const lessonPrompt = "List a one-sentence script for the users to read, about the topic";
const topic = "Building Credibility on Stage";
const criteria = "";
const displayDefault = "Lesson 5";

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
  taskInstructions?: string[];
  taskTitle?: string;
  taskBody: string;
  rubric: RubricItem[];
  references: { title?: string; url: string }[];
};

const LESSONS: LessonDetail[] = [
  {
    id: 5,
    title: "Building Credibility on Stage",
    subtitle: "Advanced • Lesson 5",
    intro:
      "Credibility comes from a mix of confidence, knowledge, and authenticity. It’s built through ethos (credibility), honesty, and consistent delivery.",
    importance: [
      "Believability increases influence and respect.",
      "Credibility enhances how others perceive your competence and character.",
      "This skill helps in defenses, competitions, and leadership.",
    ],
    tips: [
      "Start with a strong, confident opening.",
      "Use evidence and examples to support claims.",
      "Maintain good posture and eye contact.",
    ],
    taskInstructions: [
      "Prepare a 2-minute informative talk using at least 3 credibility techniques",
      "Start with a strong, confident opening statement",
      "Include credible evidence or research to support your points",
      "Maintain consistent eye contact and confident posture",
      "Speak clearly and avoid filler words",
      "Record your presentation and evaluate your credibility cues",
    ],
    taskBody: `Task: Deliver a 2-min informative talk using at least 3 credibility techniques.

Task Example:
Deliver a 2-minute informative talk on “Why sleep is essential for students.”

• Start with a confident opening.
• Share at least two credible sources/evidence.
• Maintain eye contact and good posture.

Example opening:

“Did you know that students who sleep less than 6 hours score 20% lower on memory tests? According to Harvard research, sleep is not optional — it’s essential for learning.”`,
    rubric: [
      {
        label: "Accuracy",
        descriptions: {
          high: "Devices used correctly",
          medium: "Some mistakes",
          low: "Misused or unclear",
        },
      },
      {
        label: "Clarity",
        descriptions: {
          high: "Message becomes clearer",
          medium: "Somewhat clearer",
          low: "No improvement",
        },
      },
      {
        label: "Style",
        descriptions: {
          high: "Devices sound natural",
          medium: "Slightly forced",
          low: "Overused or distracting",
        },
      },
    ],
    references: [
      { url: "https://owl.purdue.edu/owl/general_writing/academic_writing/rhetorical_situation.html" },
      { url: "https://www.toastmasters.org/magazine/magazine-issues/2018/nov/building-credibility" },
    ],
  },
];

// Section Indicator
const SectionIndicator = ({ currentSection }: { currentSection: number }) => {
  if (currentSection === 2) return null;
  return (
    <View className="flex-row justify-center gap-6 mt-1 mb">
      {[0, 1, 2].map((sectionIndex) => {
        const isActive = sectionIndex === currentSection;
        const isCompleted = sectionIndex < currentSection;
        return (
          <View key={sectionIndex} className="items-center">
            <View
              className={`w-2 h-2 rounded-full ${
                isActive ? "bg-violet-500" : isCompleted ? "bg-violet-400" : "bg-white/20"
              }`}
            />
            <Text className={`text-xs mt-1 ${isActive ? "text-violet-400" : "text-white/40"}`}>
              {sectionIndex === 0 ? "Lesson" : sectionIndex === 1 ? "Task" : "Record"}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// Lesson Section
const LessonSection = ({
  data,
  onNext,
  onBack,
}: {
  data: LessonDetail;
  onNext: () => void;
  onBack: () => void;
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }} className="flex-1">
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
                <View className="w-5 h-5 bg-white/5 rounded-full items-center justify-center mr-3 mt-0.5">
                  <Ionicons name="star" size={10} color="#ffffff" />
                </View>
                <Text className="text-white/90 text-xs flex-1">{imp}</Text>
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
                <View className="w-5 h-5 bg-white/5 rounded-full items-center justify-center mr-3 mt-0.5">
                  <Ionicons name="bulb" size={10} color="#ffffff" />
                </View>
                <Text className="text-white/90 text-xs flex-1">{t}</Text>
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
                  <Ionicons name="link" size={18} color="#a78bfa" />
                  <Text className="text-violet-300 text-xs left-2 underline">{ref.title || ref.url}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="flex-row justify-between mt mb-4 px-4">
            <TouchableOpacity
              onPress={onBack}
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

// Task Section
const TaskSection = ({
  data,
  onBack,
  onNext,
}: {
  data: LessonDetail;
  onBack: () => void;
  onNext: () => void;
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }} className="flex-1">
      <View className="flex-1 p-6">
        <TouchableOpacity onPress={onBack} className="flex-row items-center mb-6">
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-white ml-2">Back to Lesson</Text>
        </TouchableOpacity>

        <View className="bg-white/5 p-6 rounded-xl mb-6">
          <Text className="text-white text-xl font-bold mb-4">Your Task</Text>
          <Text className="text-white text-base mb-6 whitespace-pre-line">{data.taskBody}</Text>

          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">Instructions:</Text>
            <View className="space-y-2">
              {data.taskInstructions?.map((instruction, index) => (
                <View key={index} className="flex-row items-start">
                  <Text className="text-violet-400 mr-2">▪</Text>
                  <Text className="text-white/90 flex-1">{instruction}</Text>
                </View>
              ))}
            </View>
          </View>

        <View className="bg-white/10 p-4 rounded-lg mb-6">
            <Text className="text-white/90 text-sm font-medium mb-2">Tips for Success:</Text>
            <View className="space-y-2">
              <View className="flex-row items-start">
                <Text className="text-violet-400 mr-2">🚀</Text>
                <Text className="text-white/80 text-sm">Start with a strong, confident opening statement</Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-violet-400 mr-2">📚</Text>
                <Text className="text-white/80 text-sm">Use credible evidence and examples to support claims</Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-violet-400 mr-2">👁️</Text>
                <Text className="text-white/80 text-sm">Maintain consistent eye contact with your audience</Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-violet-400 mr-2">🧍</Text>
                <Text className="text-white/80 text-sm">Keep confident posture - stand tall and grounded</Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-violet-400 mr-2">🎯</Text>
                <Text className="text-white/80 text-sm">Speak with conviction and avoid filler words</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity className="bg-violet-600 py-4 rounded-lg items-center" onPress={onNext}>
            <Text className="text-white font-bold text-base">Continue to Recording</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// Recording Section
const RecordingSection = ({ onBack }: { onBack: () => void }) => {
  // We read any incoming params (module_id, module_title, level, display) and ensure defaults.
  const params = useLocalSearchParams<{ module_id?: string; module_title?: string; level?: string; display?: string }>();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStart = () => {
    // 🔗 Forward consistent context to live-vid-selection (no progress change here).
    router.push({
      pathname: "/StudentScreen/SpeakingExercise/live-vid-selection",
      params: {
        module_id: params.module_id ?? "",
        module_title: params.module_title ?? encodeURIComponent("Building Credibility on Stage"),
        level: params.level ?? "advanced",
        display: params.display ?? displayDefault,
        lessonPrompt,
        topic,
        criteria,
      },
    });
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }} className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="bg-gradient-to-b from-white/5 to-white/10 rounded-2xl p-4 border border-white/10 mt-10 mb-4 mx-4">
          <View className="items-center">
            <Text className="text-white text-2xl font-bold">Recording Task</Text>
          </View>

          <View className="mb-10">
            <Text className="text-white text-sm top-4 leading-5">
              Task: Deliver a 2-min informative talk using at least 3 credibility techniques.
            </Text>
            <Text className="text-white/60 text-xs mt-3">
              Advanced progress will be updated to 100% on the full-results page.
            </Text>
          </View>

          <View className="mb-5">
            <View className="flex-row items-center mb-3">
              <Ionicons name="list-outline" size={18} color="#ffffff" />
              <Text className="text-white text-base font-semibold ml-2">Evaluation Rubric</Text>
            </View>

            <View className="border-2 border-white/20 rounded-lg overflow-hidden">
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

              {[
                {
                  label: "Accuracy",
                  high: "Devices used correctly",
                  medium: "Some mistakes",
                  low: "Misused or unclear",
                },
                {
                  label: "Clarity",
                  high: "Message becomes clearer",
                  medium: "Somewhat clearer",
                  low: "No improvement",
                },
                {
                  label: "Style",
                  high: "Devices sound natural",
                  medium: "Slightly forced",
                  low: "Overused or distracting",
                },
              ].map((r, i) => (
                <View key={i} className="border-t-2 border-white/10">
                  <View className="flex-row min-h-[100px]">
                    <View className="w-1/4 p-2 border-r-2 border-white/10">
                      <Text className="text-white text-xs font-medium">{r.label}</Text>
                    </View>
                    <View className="w-1/4 p-2 border-r-2 border-white/10">
                      <Text className="text-white/90 text-[11px] leading-4">{r.high}</Text>
                    </View>
                    <View className="w-1/4 p-2 border-r-2 border-white/10">
                      <Text className="text-white/90 text-[11px] leading-4">{r.medium}</Text>
                    </View>
                    <View className="w-1/4 p-2">
                      <Text className="text-white/90 text-[11px] leading-4">{r.low}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View className="mt-4 bg-white/5 p-3 rounded-lg">
              <Text className="text-white font-medium mb-2">Score Guide:</Text>
              <View className="space-y-2">
                <Text className="text-white/90 text-xs">
                  16–20 = <Text className="text-green-400">Excellent</Text>
                </Text>
                <Text className="text-white/90 text-xs mt-2">
                  11–15 = <Text className="text-blue-400">Good</Text>
                </Text>
                <Text className="text-white/90 text-xs mt-2">
                  6–10 = <Text className="text-yellow-400">Needs Work</Text>
                </Text>
                <Text className="text-white/90 text-xs mt-2">
                  1–5 = <Text className="text-red-400">Poor</Text>
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row justify-between mt-2 space-x-3">
            <TouchableOpacity
              onPress={onBack}
              className="py-3 px-4 rounded-xl bg-white/10 border border-white/20 flex-1 items-center justify-center active:opacity-70"
              activeOpacity={0.7}
            >
              <Text className="text-white font-medium text-sm">Back to Task</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleStart}
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
  const params = useLocalSearchParams<{ id?: string }>();
  const lessonId = parseInt((params.id as string) || "5", 10) || 5;
  const lesson = LESSONS.find((l) => l.id === lessonId) || LESSONS[0];
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
      onBack={() => router.push("/StudentScreen/SpeakingExercise/advanced-contents")}
    />,
    <TaskSection key="task" data={lesson} onBack={() => setCurrentSection(0)} onNext={() => setCurrentSection(2)} />,
    <RecordingSection key="recording" onBack={() => setCurrentSection(1)} />,
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

        <View className="flex-1">{sections[currentSection]}</View>
      </ScrollView>
    </View>
  );
}
