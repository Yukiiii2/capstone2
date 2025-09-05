import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StatusBar,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import NavigationBar from "../../../components/NavigationBar/nav-bar";

/** ---------- Shared chrome to match your other speaking pages ---------- */
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

const Header = ({ title }: { title: string }) => {
  const router = useRouter();
  return (
    <View className="flex-row items-center justify-between mb-4">
      <TouchableOpacity
        onPress={() => router.back()}
        className="p-2 bg-white/10 rounded-full mr-2"
      >
        <Ionicons name="arrow-back" size={20} color="#fff" />
      </TouchableOpacity>
      <Text className="text-white text-lg font-bold flex-1 text-center">
        {title}
      </Text>
      <View className="w-10" />
    </View>
  );
};

/** ---------- Data model ---------- */
type MCQ = { q: string; choices: string[]; answerIndex: number };
type LessonDetail = {
  id: number;
  title: string;
  subtitle: string;
  lesson: string;
  importance: string[];
  tips: string[];
  quiz: MCQ[];
  task: string;
  rubrics: { label: string; weight: number }[]; // weight in %
  references?: { label: string; url: string }[];
};

/** ---------- Advanced lessons (6 items, all suitable for “Advanced”) ---------- */
const ADVANCED_LESSONS: LessonDetail[] = [
  {
    id: 1,
    title: "Persuasive Speech Strategy (Monroe’s Sequence)",
    subtitle: "Advanced • Lesson 1",
    lesson:
      "Use Monroe’s Motivated Sequence (Attention → Need → Satisfaction → Visualization → Action) to structure persuasive talks that drive real decisions.",
    importance: [
      "Creates a logical & emotional arc for action",
      "Works for pitches, campaigns, and proposals",
      "Keeps complex messages easy to follow",
    ],
    tips: [
      "Open with a vivid story or startling stat",
      "Define the exact ‘Need’ the audience feels",
      "Offer a practical, believable solution",
      "Show the world ‘with’ and ‘without’ your solution",
      "End with a specific, doable call to action",
    ],
    quiz: [
      {
        q: "Which step asks the audience to imagine outcomes if your solution is adopted?",
        choices: ["Attention", "Satisfaction", "Visualization", "Action"],
        answerIndex: 2,
      },
      {
        q: "Which part presents the actual fix?",
        choices: ["Need", "Satisfaction", "Attention", "Action"],
        answerIndex: 1,
      },
    ],
    task:
      "Record a 90-second persuasive pitch using Monroe’s sequence. Include a clear Action step at the end.",
    rubrics: [
      { label: "Clear sequence (A-N-S-V-A)", weight: 30 },
      { label: "Evidence & reasoning", weight: 25 },
      { label: "Delivery & pacing", weight: 25 },
      { label: "Call-to-action clarity", weight: 20 },
    ],
    references: [
      {
        label: "Monroe’s Motivated Sequence (Overview)",
        url: "https://en.wikipedia.org/wiki/Monroe%27s_motivated_sequence",
      },
    ],
  },
  {
    id: 2,
    title: "Handling Q&A Like a Pro",
    subtitle: "Advanced • Lesson 2",
    lesson:
      "Maintain control, clarify questions, and bridge to key messages. Use the Acknowledge → Answer → Advance framework.",
    importance: [
      "Builds credibility under pressure",
      "Prevents derailing & time sinks",
      "Turns tough questions into clarity",
    ],
    tips: [
      "Repeat or reframe the question briefly",
      "If you don’t know, say what you’ll do to find out",
      "Answer concisely—then advance to your core point",
      "Set boundaries for multi-part or off-topic questions",
    ],
    quiz: [
      {
        q: "What is the best response if you don't know an answer?",
        choices: [
          "Guess confidently",
          "Admit you don't know and state your follow-up plan",
          "Ignore the question",
          "Change the topic immediately",
        ],
        answerIndex: 1,
      },
      {
        q: "Which step helps keep Q&A on track?",
        choices: ["Acknowledge", "Apologize", "Argue", "Avoid"],
        answerIndex: 0,
      },
    ],
    task:
      "Record a 60-second mock Q&A clip responding to two challenging questions. Use Acknowledge → Answer → Advance.",
    rubrics: [
      { label: "Clarity & honesty", weight: 30 },
      { label: "Bridging to key message", weight: 30 },
      { label: "Tone under pressure", weight: 20 },
      { label: "Time control", weight: 20 },
    ],
  },
  {
    id: 3,
    title: "Storytelling for Impact",
    subtitle: "Advanced • Lesson 3",
    lesson:
      "Use character, conflict, and change. Anchor your talk with a Core Message and a simple three-act arc.",
    importance: [
      "Increases memorability and emotional pull",
      "Clarifies complex topics",
      "Builds trust and relatability",
    ],
    tips: [
      "One main character + one main conflict",
      "Show change (before → after)",
      "Tie the story to your message in the last 10%",
    ],
    quiz: [
      {
        q: "Which element is essential to drive a story forward?",
        choices: ["Conflict", "Statistics", "Quotes", "Background music"],
        answerIndex: 0,
      },
      {
        q: "Where should you explicitly tie the story to your message?",
        choices: ["Opening", "Middle", "Final 10%", "Never"],
        answerIndex: 2,
      },
    ],
    task:
      "Record a 60-90s story that illustrates your core message. Highlight the ‘change’.",
    rubrics: [
      { label: "Clear arc (setup-conflict-resolution)", weight: 35 },
      { label: "Relevance to message", weight: 25 },
      { label: "Delivery & imagery", weight: 25 },
      { label: "Timing", weight: 15 },
    ],
  },
  {
    id: 4,
    title: "Impromptu Speaking & Thinking on Your Feet",
    subtitle: "Advanced • Lesson 4",
    lesson:
      "Use simple scaffolds (Problem-Cause-Solution, Past-Present-Future) to organize spontaneous answers fast.",
    importance: [
      "Useful in interviews, panels, and pitches",
      "Reduces filler words & rambling",
      "Keeps content structured",
    ],
    tips: [
      "Take 2–3 seconds to breathe & choose a scaffold",
      "Keep to 2–3 points max",
      "Close with a summary line",
    ],
    quiz: [
      {
        q: "Which structure best fits a ‘how did we get here?’ question?",
        choices: [
          "Past-Present-Future",
          "Problem-Cause-Solution",
          "Pros-Cons-Recommendation",
          "None of the above",
        ],
        answerIndex: 0,
      },
      {
        q: "What’s a good number of points for an impromptu answer?",
        choices: ["1", "2–3", "5–7", "As many as possible"],
        answerIndex: 1,
      },
    ],
    task:
      "Pick a random prompt and record a 60-second answer using a scaffold. End with a concise summary.",
    rubrics: [
      { label: "Structure under time", weight: 35 },
      { label: "Clarity & brevity", weight: 30 },
      { label: "Confidence & pace", weight: 20 },
      { label: "Summary line", weight: 15 },
    ],
  },
  {
    id: 5,
    title: "Visual Aids that Actually Help",
    subtitle: "Advanced • Lesson 5",
    lesson:
      "Design slides as visual support, not a script. Use big type, contrast, and one idea per slide.",
    importance: [
      "Improves comprehension & recall",
      "Keeps audience focused on you",
      "Avoids cognitive overload",
    ],
    tips: [
      "6–8 words per line, ~3 lines max",
      "Use visuals over text when possible",
      "High contrast; large margins; consistent style",
    ],
    quiz: [
      {
        q: "What’s a good rule for slide text?",
        choices: [
          "As much text as you need",
          "Tiny fonts to fit more",
          "One idea per slide; large fonts",
          "Copy your speaker notes onto slides",
        ],
        answerIndex: 2,
      },
      {
        q: "Preferred approach for complex data?",
        choices: ["Dense tables", "Paragraphs", "Clear charts", "Screenshots"],
        answerIndex: 2,
      },
    ],
    task:
      "Create 3 slides (one idea each) to support a key message, then record a 60-90s walkthrough of them.",
    rubrics: [
      { label: "Clarity & visual economy", weight: 35 },
      { label: "Contrast & readability", weight: 25 },
      { label: "Narration without reading", weight: 25 },
      { label: "Consistency", weight: 15 },
    ],
  },
  {
    id: 6,
    title: "Rhetorical Devices & Emphasis",
    subtitle: "Advanced • Lesson 6",
    lesson:
      "Use repetition, triads, contrasts, and strategic pauses to make key lines land and stick.",
    importance: [
      "Adds rhythm and memorability",
      "Guides audience attention",
      "Elevates otherwise simple points",
    ],
    tips: [
      "Try rule-of-three lists",
      "Use contrasts (not this, but that)",
      "Pause before and after key lines",
    ],
    quiz: [
      {
        q: "Which technique uses three related elements for rhythm?",
        choices: ["Anaphora", "Triad", "Metaphor", "Alliteration"],
        answerIndex: 1,
      },
      {
        q: "Why pause before a key sentence?",
        choices: [
          "To increase filler words",
          "To signal importance and reset attention",
          "To make the talk longer",
          "To confuse the audience",
        ],
        answerIndex: 1,
      },
    ],
    task:
      "Record a 45-60s segment using at least two rhetorical devices (e.g., triad + contrast) and 1–2 strategic pauses.",
    rubrics: [
      { label: "Device usage (variety & fit)", weight: 35 },
      { label: "Emphasis & pausing", weight: 30 },
      { label: "Clarity of message", weight: 20 },
      { label: "Delivery", weight: 15 },
    ],
  },
];

/** ---------- View layer ---------- */
export default function AdvancedLessonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Number(params?.id || "1");
  const lesson = useMemo(
    () => ADVANCED_LESSONS.find((l) => l.id === id) ?? ADVANCED_LESSONS[0],
    [id]
  );

  // simple local quiz state (no persistence yet)
  const [answers, setAnswers] = useState<number[]>(
    Array(lesson.quiz.length).fill(-1)
  );
  const [checked, setChecked] = useState(false);

  const correctCount = answers.reduce((acc, a, i) => {
    if (a === lesson.quiz[i].answerIndex) return acc + 1;
    return acc;
  }, 0);

  const allAnswered = answers.every((a) => a !== -1);

  return (
    <View className="flex-1 bg-[#0F172A]">
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
      <BackgroundDecor />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 36, paddingHorizontal: 16, paddingTop: (StatusBar.currentHeight || 0) + 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[420px] self-center">
          <Header title={lesson.subtitle} />

          <Text className="text-white text-2xl font-bold mb-1">{lesson.title}</Text>
          <Text className="text-white/70 mb-4">
            Read the lesson, check the tips, answer a quick quiz, and complete a short video task.
          </Text>

          {/* Lesson */}
          <View className="bg-white/10 rounded-2xl border border-white/15 p-4 mb-4">
            <Text className="text-white font-semibold text-base mb-2">Lesson</Text>
            <Text className="text-white/90 leading-6 text-[13px]">{lesson.lesson}</Text>
          </View>

          {/* Importance */}
          <View className="bg-white/10 rounded-2xl border border-white/15 p-4 mb-4">
            <Text className="text-white font-semibold text-base mb-2">Importance</Text>
            {lesson.importance.map((item, idx) => (
              <View key={idx} className="flex-row items-start mb-1.5">
                <Text className="text-[#a78bfa] mr-2">•</Text>
                <Text className="text-white/90 text-[13px] flex-1">{item}</Text>
              </View>
            ))}
          </View>

          {/* Tips */}
          <View className="bg-white/10 rounded-2xl border border-white/15 p-4 mb-4">
            <Text className="text-white font-semibold text-base mb-2">Tips</Text>
            {lesson.tips.map((item, idx) => (
              <View key={idx} className="flex-row items-start mb-1.5">
                <Text className="text-[#a78bfa] mr-2">•</Text>
                <Text className="text-white/90 text-[13px] flex-1">{item}</Text>
              </View>
            ))}
          </View>

          {/* Quiz */}
          <View className="bg-white/10 rounded-2xl border border-white/15 p-4 mb-4">
            <Text className="text-white font-semibold text-base">Quiz (Multiple Choice)</Text>

            {lesson.quiz.map((mcq, qi) => (
              <View key={qi} className="mt-3">
                <Text className="text-white/90 font-medium mb-2">{qi + 1}. {mcq.q}</Text>
                {mcq.choices.map((choice, ci) => {
                  const selected = answers[qi] === ci;
                  const isCorrect = checked && ci === mcq.answerIndex;
                  const isWrong = checked && selected && !isCorrect;
                  return (
                    <Pressable
                      key={ci}
                      onPress={() => {
                        if (!checked) {
                          const next = [...answers];
                          next[qi] = ci;
                          setAnswers(next);
                        }
                      }}
                      className={`flex-row items-center mb-2 rounded-lg border px-3 py-2 ${
                        isCorrect
                          ? "border-green-400/60 bg-green-500/10"
                          : isWrong
                          ? "border-red-400/60 bg-red-500/10"
                          : selected
                          ? "border-[#a78bfa]/60 bg-[#a78bfa]/10"
                          : "border-white/15 bg-white/5"
                      }`}
                    >
                      <View
                        className={`w-4 h-4 mr-2 rounded-full ${
                          selected ? "bg-[#a78bfa]" : "bg-white/20"
                        }`}
                      />
                      <Text className="text-white/90 text-[13px] flex-1">{choice}</Text>
                      {checked && isCorrect && (
                        <Ionicons name="checkmark" size={16} color="#22c55e" />
                      )}
                      {checked && isWrong && (
                        <Ionicons name="close" size={16} color="#ef4444" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}

            <TouchableOpacity
              disabled={!allAnswered}
              onPress={() => setChecked(true)}
              className={`mt-3 py-2.5 rounded-xl items-center ${
                allAnswered ? "bg-[#a78bfa]" : "bg-gray-600"
              }`}
            >
              <Text className="text-white font-semibold">
                {checked ? `Score: ${correctCount}/${lesson.quiz.length}` : "Check Answers"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Video Recording Task */}
          <View className="bg-white/10 rounded-2xl border border-white/15 p-4 mb-4">
            <Text className="text-white font-semibold text-base mb-2">Video Recording Task</Text>
            <Text className="text-white/90 text-[13px]">{lesson.task}</Text>
          </View>

          {/* Rubrics */}
          <View className="bg-white/10 rounded-2xl border border-white/15 p-4 mb-4">
            <Text className="text-white font-semibold text-base mb-2">Rubrics / Criteria</Text>
            {lesson.rubrics.map((r, i) => (
              <View key={i} className="flex-row items-center justify-between mb-1.5">
                <Text className="text-white/90 text-[13px]">{r.label}</Text>
                <Text className="text-white/70 text-[13px]">{r.weight}%</Text>
              </View>
            ))}
          </View>

          {/* References */}
          {!!lesson.references?.length && (
            <View className="bg-white/10 rounded-2xl border border-white/15 p-4 mb-6">
              <Text className="text-white font-semibold text-base mb-2">References</Text>
              {lesson.references!.map((ref, i) => (
                <Pressable key={i} onPress={() => Linking.openURL(ref.url)} className="mb-1">
                  <Text className="text-[#a78bfa] underline text-[13px]">{ref.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Footer buttons */}
          <View className="flex-row gap-2 mb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 items-center"
            >
              <Text className="text-white font-semibold">Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/StudentScreen/SpeakingExercise/advanced-contents")}
              className="flex-1 py-3 rounded-xl bg-[#a78bfa] items-center"
            >
              <Text className="text-white font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <NavigationBar defaultActiveTab="Speaking" />
    </View>
  );
}
