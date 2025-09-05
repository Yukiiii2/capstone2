import NavigationBar from "../../../components/NavigationBar/nav-bar";
import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";

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
type LessonDetail = {
  id: number;
  title: string;
  subtitle: string;
  intro: string;
  bullets: string[];
  tips: string[];
  quiz: QuizQ[];
  taskTitle: string;
  taskBody: string;
  rubric: { label: string; weight: number }[];
  references: { title: string; url: string }[];
};

const ADV_LESSONS: LessonDetail[] = [
  {
    id: 1,
    title: "Handling Q&A and Objections",
    subtitle: "Advanced Lesson 1",
    intro:
      "Expert speakers anticipate questions, clarify, and reframe objections without losing momentum. This lesson focuses on structure and tone during live Q&A.",
    bullets: [
      "Listen fully before responding",
      "Repeat or reframe the question for the room",
      "Bridge back to your key message",
    ],
    tips: [
      "Use a calm, neutral tone",
      "Acknowledge valid points",
      "Offer a concrete next step",
    ],
    quiz: [
      {
        id: 1,
        question: "What should you do right after hearing a tough question?",
        options: ["Answer immediately", "Repeat/reframe the question", "Ignore it", "Make a joke"],
        correct: 1,
      },
      {
        id: 2,
        question: "What is a 'bridge' in Q&A?",
        options: [
          "Changing the topic",
          "Connecting the answer back to your main message",
          "Asking the audience to leave",
          "Apologizing profusely",
        ],
        correct: 1,
      },
    ],
    taskTitle: "Q&A Simulation",
    taskBody:
      "Record a 90-second video answering two tough audience questions. Demonstrate reframing and bridging.",
    rubric: [
      { label: "Clarity of answer", weight: 35 },
      { label: "Calm tone & control", weight: 35 },
      { label: "Bridging to key message", weight: 30 },
    ],
    references: [{ title: "Harvard: Difficult Conversations", url: "https://www.harvard.edu/" }],
  },
  {
    id: 2,
    title: "Large-Audience Storytelling",
    subtitle: "Advanced Lesson 2",
    intro:
      "Narratives must scale. Use vivid scenes, clear arcs, and strategic pauses so the back row feels included.",
    bullets: ["3-act structure", "Vivid, concrete details", "Strategic pauses & callbacks"],
    tips: ["One idea per sentence", "Let silence land", "End with a call-to-action"],
    quiz: [
      {
        id: 1,
        question: "Which helps stories scale to a large room?",
        options: ["Longer sentences", "More jargon", "Concrete details", "Reading slides verbatim"],
        correct: 2,
      },
      {
        id: 2,
        question: "What do callbacks do?",
        options: ["Confuse listeners", "Reinforce themes", "Shorten the talk", "Fill time only"],
        correct: 1,
      },
    ],
    taskTitle: "Keynote Mini-Story",
    taskBody: "Record a 60-second story with a clear arc and at least one callback.",
    rubric: [
      { label: "Structure (arc/callback)", weight: 40 },
      { label: "Delivery & pacing", weight: 30 },
      { label: "Memorability", weight: 30 },
    ],
    references: [{ title: "Nancy Duarte – Resonate", url: "https://www.duarte.com/" }],
  },
];

export default function AdvancedLessonDetail() {
  const router = useRouter();
  const { lesson } = useLocalSearchParams<{ lesson?: string }>();
  const lessonId = Number(lesson) || 1;

  const data = useMemo(
    () => ADV_LESSONS.find((l) => l.id === lessonId) || ADV_LESSONS[0],
    [lessonId]
  );

  const [answers, setAnswers] = useState<Record<number, number | null>>(
    Object.fromEntries(data.quiz.map((q) => [q.id, null]))
  );
  const [submitted, setSubmitted] = useState(false);
  const correctPct = useMemo(() => {
    const correct = data.quiz.reduce((a, q) => (answers[q.id] === q.correct ? a + 1 : a), 0);
    return Math.round((correct / data.quiz.length) * 100);
  }, [answers, data.quiz]);

  return (
    <View className="flex-1 bg-[#0F172A]">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <BackgroundDecor />

      <View className="px-4 pt-14 pb-2">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2 bg-white/10 rounded-full">
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Advanced • {data.subtitle}</Text>
        </View>
        <Text className="text-white/70 text-sm mt-2">{data.title}</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
        <View className="bg-white/10 rounded-2xl p-5 border border-white/15 mb-4">
          <Text className="text-white text-lg font-semibold mb-3">Lesson</Text>
          <Text className="text-white/90 leading-6 text-[13px]">{data.intro}</Text>

          <Text className="text-white text-base font-semibold mt-4 mb-1">Key Points</Text>
          {data.bullets.map((b, i) => (
            <View key={i} className="flex-row items-start mt-1">
              <Text className="text-white mr-2">•</Text>
              <Text className="text-white/90 text-[13px] flex-1">{b}</Text>
            </View>
          ))}

          <Text className="text-white text-base font-semibold mt-4 mb-1">Tips</Text>
          {data.tips.map((t, i) => (
            <View key={i} className="flex-row items-start mt-1">
              <Text className="text-white mr-2">•</Text>
              <Text className="text-white/90 text-[13px] flex-1">{t}</Text>
            </View>
          ))}
        </View>

        <View className="bg-white/10 rounded-2xl p-5 border border-white/15 mb-4">
          <Text className="text-white text-lg font-semibold mb-3">Quiz (Multiple Choice)</Text>
          {data.quiz.map((q, qi) => (
            <View key={q.id} className="mb-4">
              <Text className="text-white/90 font-medium mb-2">{qi + 1}. {q.question}</Text>
              {q.options.map((opt, idx) => {
                const sel = answers[q.id] === idx;
                const ok = submitted && idx === data.quiz[qi].correct;
                const bad = submitted && sel && !ok;
                return (
                  <TouchableOpacity
                    key={idx}
                    className={`flex-row items-center px-3 py-2 rounded-lg mb-2 border ${
                      ok ? "border-green-500/60 bg-green-500/15" :
                      bad ? "border-red-500/60 bg-red-500/15" :
                      sel ? "border-white/15 bg-white/10" :
                      "border-white/15"
                    }`}
                    onPress={() => !submitted && setAnswers((p) => ({ ...p, [q.id]: idx }))}
                    activeOpacity={0.8}
                  >
                    <View className={`w-5 h-5 mr-3 rounded-full border ${sel ? "bg-[#a78bfa] border-[#a78bfa]" : "border-white/40"}`} />
                    <Text className="text-white/90 text-[13px] flex-1">{opt}</Text>
                    {ok && <Ionicons name="checkmark" size={16} color="#22c55e" />}
                    {bad && <Ionicons name="close" size={16} color="#ef4444" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {!submitted ? (
            <TouchableOpacity onPress={() => setSubmitted(true)} className="bg-violet-600 py-3 rounded-xl items-center mt-2">
              <Text className="text-white font-semibold">Submit Quiz</Text>
            </TouchableOpacity>
          ) : (
            <View className="mt-2 items-center">
              <Text className="text-white text-base font-semibold">Score: {correctPct}%</Text>
            </View>
          )}
        </View>

        <View className="bg-white/10 rounded-2xl p-5 border border-white/15 mb-4">
          <Text className="text-white text-lg font-semibold">{data.taskTitle}</Text>
          <Text className="text-white/90 text-[13px] mt-2">{data.taskBody}</Text>

          <Text className="text-white text-base font-semibold mt-4 mb-2">Rubrics / Criteria</Text>
          {data.rubric.map((r, i) => (
            <View key={i} className="flex-row items-center mb-1">
              <Text className="text-white mr-2">•</Text>
              <Text className="text-white/90 text-[13px] flex-1">{r.label} ({r.weight}%)</Text>
            </View>
          ))}

          <TouchableOpacity
            className="bg-violet-600/90 border border-white/20 rounded-xl py-3 items-center mt-4"
            onPress={() => router.push("StudentScreen/SpeakingExercise/live-vid-selection")}
            activeOpacity={0.85}
          >
            <Text className="text-white font-semibold">Record Practice Video</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white/10 rounded-2xl p-5 border border-white/15">
          <Text className="text-white text-lg font-semibold mb-2">References</Text>
          {data.references.map((ref, i) => (
            <TouchableOpacity key={i} onPress={() => Linking.openURL(ref.url)} className="mb-1" activeOpacity={0.8}>
              <Text className="text-violet-300 text-[13px] underline">{ref.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <NavigationBar defaultActiveTab="Speaking" />
    </View>
  );
}
