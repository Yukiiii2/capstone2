import React, { useMemo, useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Linking, Animated, Easing, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams, router } from "expo-router";

const { width } = Dimensions.get('window');

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
  importance: string[];
  tips: string[];
  quiz: QuizQ[];
  taskTitle: string;
  taskBody: string;
  rubric: { label: string; weight: number }[];
  references: { title: string; url: string }[];
};

const LESSONS: LessonDetail[] = [
  {
    id: 1,
    title: "Handling Q&A and Objections",
    subtitle: "Basic • Lesson 1",
    intro:
      "Master the art of handling questions and objections during presentations. This essential skill will help you maintain control, demonstrate expertise, and build credibility with your audience.",
    bullets: [
      "Listen carefully to the entire question before responding",
      "Repeat or rephrase the question for clarity and to ensure everyone hears it",
      "Stay connected to your main message and key points",
      "Maintain a professional and confident demeanor throughout"
    ],
    importance: [
      "Builds credibility and trust with your audience",
      "Demonstrates your expertise on the subject matter",
      "Helps clarify misunderstandings and reinforce your message",
      "Turns potential challenges into opportunities to strengthen your position"
    ],
    tips: [
      "Practice active listening skills - focus completely on the questioner",
      "Prepare answers for common questions in advance",
      "Stay calm and composed, even when faced with difficult questions",
      "Use positive body language and maintain eye contact"
    ],
    quiz: [
      {
        id: 1,
        question: "What should you do first when someone asks a question?",
        options: ["Answer immediately", "Listen completely", "Ask them to repeat", "Change the subject"],
        correct: 1,
      },
      {
        id: 2,
        question: "Why is it important to repeat the question?",
        options: [
          "To gain time to think",
          "To ensure everyone heard it",
          "To show you're listening",
          "All of the above"
        ],
        correct: 3,
      },
    ],
    taskTitle: "Q&A Practice Session",
    taskBody:
      "Record a 1-minute video where you answer three different questions. Demonstrate good listening skills and clear responses.",
    rubric: [
      { label: "Listening skills", weight: 30 },
      { label: "Clarity of response", weight: 30 },
      { label: "Professional demeanor", weight: 20 },
      { label: "Connection to main message", weight: 20 },
    ],
    references: [
      { title: "Effective Communication Skills Guide", url: "https://example.com/communication" },
      { title: "Public Speaking Mastery", url: "https://example.com/public-speaking" },
      { title: "Handling Difficult Questions", url: "https://example.com/difficult-questions" }
    ],
  },
];

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
  // Don't show progress in recording section (section 2)
  if (currentSection === 2) return null;
  
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
      style={{ 
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }} 
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
          <Text className="text-white/90 leading-6 text-base mb-6">{data.intro}</Text>

          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="list-outline" size={20} color="#ffffff" />
              <Text className="text-white text-lg font-semibold ml-2">Key Points</Text>
            </View>
            {data.bullets.map((b, i) => (
              <View key={i} className="flex-row items-start mt-3 bg-white/10 p-3 rounded-lg">
                <View className="w-6 h-6 bg-white/5 rounded-full items-center justify-center mr-3 mt-0.5">
                  <Text className="text-white font-bold">{i+1}</Text>
                </View>
                <Text className="text-white/90 text-base flex-1">{b}</Text>
              </View>
            ))}
          </View>

          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="alert-circle-outline" size={20} color="#ffffff" />
              <Text className="text-white text-lg font-semibold ml-2">Importance</Text>
            </View>
            {data.importance.map((imp, i) => (
              <View key={i} className="flex-row items-start mt-3 bg-white/10 p-3 rounded-lg">
                <View className="w-6 h-6 bg-white/5 rounded-full items-center justify-center mr-3 mt-0.5">
                  <Ionicons name="star" size={14} color="#ffffff" />
                </View>
                <Text className="text-white/90 text-base flex-1">{imp}</Text>
              </View>
            ))}
          </View>

          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="bulb-outline" size={20} color="#ffffff" />
              <Text className="text-white text-lg font-semibold ml-2">Tips & Strategies</Text>
            </View>
            {data.tips.map((t, i) => (
              <View key={i} className="flex-row items-start mt-3 bg-white/10 p-3 rounded-lg">
                <View className="w-6 h-6 bg-white/5 rounded-full items-center justify-center mr-3 mt-0.5">
                  <Ionicons name="bulb" size={14} color="#ffffff" />
                </View>
                <Text className="text-white/90 text-base flex-1">{t}</Text>
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
                  <Ionicons name="document-text-outline" size={18} color="#ffffff" className="mr-3" />
                  <Text className="text-violet-300 text-base underline">
                    {ref.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="flex-row justify-between mt mb-4 px-4">
            <TouchableOpacity 
              onPress={() => {}}
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

// Quiz Section Component
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

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <Animated.View 
      style={{ 
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }} 
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
          
          {data.quiz.map((q, qi) => (
            <View key={q.id} className="mb-6 bg-white/5 p-4 rounded-lg border border-white/10">
              <Text className="text-white font-medium text-base mb-3">{qi + 1}. {q.question}</Text>
              {q.options.map((opt, idx) => {
                const sel = answers[q.id] === idx;
                const ok = submitted && idx === data.quiz[qi].correct;
                const bad = submitted && sel && !ok;
                
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
                      {opt}
                    </Text>
                    {ok && <Ionicons name="checkmark-circle" size={20} color="#22c55e" />}
                    {bad && <Ionicons name="close-circle" size={20} color="#ef4444" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

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
                disabled={Object.values(answers).some(a => a === null)}
                style={{ 
                  opacity: Object.values(answers).some(a => a === null) ? 0.6 : 1,
                }}
              >
                <Text className="text-white font-semibold text-base">Submit Quiz</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mt mb-2">
              <Text className="text-white/80 text-center mb-4">
                Your score: {Math.round((data.quiz.filter((q, i) => answers[q.id] === q.correct).length / data.quiz.length) * 100)}%
                {'\n'}
                {data.quiz.filter((q, i) => answers[q.id] === q.correct).length / data.quiz.length >= 0.7 
                  ? "Great job! You're ready to proceed." 
                  : "Review the lesson and try again."}
              </Text>
              <View className="flex-row justify-between">
                <TouchableOpacity 
                  onPress={() => {
                    setSubmitted(false);
                    setAnswers(Object.fromEntries(data.quiz.map((q) => [q.id, null])));
                  }}
                  className="py-3 px-6 rounded-xl bg-white/10 border border-white/20 items-center justify-center active:opacity-70 flex-1 mr-2"
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-medium text-base">Retake Quiz</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={onNext}
                  className="py-3 px-6 rounded-xl bg-violet-600 items-center justify-center active:bg-violet-700 flex-1 ml-2"
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-semibold text-base">Done</Text>
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
      style={{ 
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }} 
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="bg-gradient-to-b from-white/5 to-white/10 rounded-2xl p-4 border border-white/10 mt-10 mb-4 mx-4">
          <View className="items-center mb-6">
            <Text className="text-white text-2xl font-bold">Recording Task</Text>
          </View>

          <View className="mb-4">
            <Text className="text-white text-lg font-semibold mb-2">{data.taskTitle}</Text>
            <Text className="text-white/80 text-sm leading-5">{data.taskBody}</Text>
          </View>

          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="list-outline" size={18} color="#ffffff" />
              <Text className="text-white text-base font-semibold ml-2">Evaluation Rubric</Text>
            </View>
            {data.rubric.map((item, i) => (
              <View key={i} className="flex-row justify-between items-center py-2 border-b border-white/10 last:border-b-0">
                <Text className="text-white text-sm flex-1">{item.label}</Text>
                <Text className="text-white font-semibold text-sm">{item.weight}%</Text>
              </View>
            ))}
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
              onPress={() => router.push("/StudentScreen/SpeakingExercise/live-vid-selection")}
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
  const lessonId = parseInt(params.id as string) || 1;
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
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
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