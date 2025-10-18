import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  Animated, 
  Easing, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  StatusBar,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams, router } from "expo-router";

const { width } = Dimensions.get('window');

/* 🔹 Minimal additions for param passing (same as Lesson 1) */
const lessonPrompt = "List a one-sentence script for the users to read, about the topic";
const topic = "Advanced Persuasion Strategies";
const criteria = "";
const display = "Lesson 2"; // shown in live-vid-selection

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
    id: 2,
    title: "Advanced Persuasion Strategies",
    subtitle: "Advanced • Lesson 2",
    intro: `Persuasive speaking means using smart and respectful ways to convince people — not by forcing, but by using facts, emotion, and trust.`,
    importance: [
      "Guides the audience toward a conclusion.",
      "Organizes arguments with evidence.",
      "Informs and respects different viewpoints"
    ],
    tips: [
      "Use two persuasion principles (like Social Proof – 'others are doing it,' or Reciprocity – 'do good, get good').",
      "Respect others' opinions.",
      "Support your ideas with facts or examples."
    ],
    taskInstructions: [
      "Prepare a 60-second persuasive speech using 2 persuasion principles",
      "Address 1 potential objection in your speech",
      "Practice your delivery with clear vocal variety",
      "Record yourself and review your performance"
    ],
    taskBody: `Task: Deliver a 60-sec persuasive pitch using 2 persuasion principles and answer 1 objection.

Task Example – Advanced Persuasion Strategies

Scenario: You are convincing your classmates to join a campus clean-up program.

60-Second Persuasive Pitch (with principles + objection handling):

"Many students are already volunteering every Saturday to keep our campus clean (→ Social Proof). If you join, we'll also give you a certificate of participation that can strengthen your resume (→ Reciprocity). You might say you're too busy, but the activity only takes one hour — and that small time can make a big difference to our environment (→ Objection Handling). Together, we can show pride in our school community (→ Audience Fit)."`,
    rubric: [
      {
        label: "Use of Principles",
        descriptions: {
          high: "Uses 2 or more clearly",
          medium: "Uses 1 principle",
          low: "No clear persuasion"
        }
      },
      {
        label: "Evidence",
        descriptions: {
          high: "Strong, relevant support",
          medium: "Some support",
          low: "No evidence"
        }
      },
      {
        label: "Objection Handling",
        descriptions: {
          high: "Addresses respectfully",
          medium: "Somewhat defensive",
          low: "Ignores objection"
        }
      },
      {
        label: "Audience Fit",
        descriptions: {
          high: "Tailors message to audience",
          medium: "Some adaptation",
          low: "No adaptation"
        }
      }
    ],
    references: [
      { url: "https://www.influenceatwork.com/books/influence-the-psychology-of-persuasion/" },
      { url: "https://owl.purdue.edu/owl/general_writing/speeches/persuasive_speeches.html" }
    ]
  }
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

// Section Indicator Component
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
              className={`w-2 h-2 rounded-full ${isActive ? 'bg-violet-500' : isCompleted ? 'bg-violet-400' : 'bg-white/20'}`}
            />
            <Text className={`text-xs mt-1 ${isActive ? 'text-violet-400' : 'text-white/40'}`}>
              {sectionIndex === 0 ? 'Lesson' : sectionIndex === 1 ? 'Task' : 'Record'}
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

// Task Section Component
const TaskSection = ({ data, onBack, onNext }: { data: LessonDetail; onBack: () => void; onNext: () => void; }) => {
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
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }} className="flex-1">
      <View className="flex-1 p-6">
        <TouchableOpacity onPress={onBack} className="flex-row items-center mb-6">
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-white ml-2">Back to Lesson</Text>
        </TouchableOpacity>
        
        <View className="bg-white/5 p-6 rounded-xl mb-6">
          <Text className="text-white text-xl font-bold mb-4">Your Task</Text>
          <Text className="text-white text-base mb-6 whitespace-pre-line">
            {data.taskBody}
          </Text>
          
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
                <Text className="text-violet-400 mr-2">👥</Text>
                <Text className="text-white/80 text-sm">Use Social Proof: Show others are already participating</Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-violet-400 mr-2">🤝</Text>
                <Text className="text-white/80 text-sm">Apply Reciprocity: Offer value in return for action</Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-violet-400 mr-2">🎯</Text>
                <Text className="text-white/80 text-sm">Anticipate objections and address them respectfully</Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-violet-400 mr-2">📊</Text>
                <Text className="text-white/80 text-sm">Support claims with facts, examples, or data</Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-violet-400 mr-2">🎭</Text>
                <Text className="text-white/80 text-sm">Tailor your message to your specific audience</Text>
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

// Recording Section Component (UNCHANGED UI)
const RecordingSection = ({ data, onBack, moduleId }: { data: LessonDetail; onBack: () => void; moduleId: string }) => {
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
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }} className="flex-1">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 30 }}>
        <View className="bg-gradient-to-b from-white/5 to-white/10 rounded-2xl p-4 border border-white/10 mt-10 mb-4 mx-4">
          <View className="items-center">
            <Text className="text-white text-2xl font-bold">Recording Task</Text>
          </View>

          <View className="mb-10">
            <Text className="text-white text-sm top-4 leading-5">
              Task: Deliver a 60-sec persuasive pitch using 2 persuasion principles and answer 1 objection.
            </Text>
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
              
              {/* Table Rows */}
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
              <Text className="text-white font-medium text-sm">Back to Task</Text>
            </TouchableOpacity>

            {/* 🔗 Start Recording → pass same params as Lesson 1; NOTHING ELSE CHANGED */}
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: "/StudentScreen/SpeakingExercise/live-vid-selection",
                params: { 
                  module_id: moduleId,
                  module_title: encodeURIComponent(data.title), // safe title
                  level: "advanced",
                  display,
                  lessonPrompt,
                  topic,
                  criteria,
                },
              })}
              className="py-3 px-4 rounded-xl bg-violet-600 flex-1 items-center justify-center active:bg-violet-700 active:scale-95 transition-all"
              activeOpacity={0.7}
            >
              <Text className="text-white font-semibold text-sm">Start Recording</Text>
            </TouchableOpacity>
          </View>

          {/* NOTE:
              Inside your live-vid-selection / recording flow for advanced,
              after successful submission, navigate to:
              router.push({
                pathname: "/StudentScreen/SpeakingExercise/full-result-advanced",
                params: { module_id }
              });
              full-result-advanced will then set progress to 100% for that module.
          */}
        </View>
      </ScrollView>
    </Animated.View>
  );
};

export default function LessonScreen() {
  const [currentSection, setCurrentSection] = useState(0);
  const params = useLocalSearchParams();
  const lessonId = parseInt(params.id as string) || 2;          // defaults to 2 for this file
  const moduleId = (params.module_id as string) || "";          // 🔗 read module_id
  const lesson = LESSONS.find(l => l.id === lessonId) || LESSONS[0];
  const scrollViewRef = useRef<ScrollView>(null);

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
      onBack={() => router.push('/StudentScreen/SpeakingExercise/advanced-contents')}
    />,
    <TaskSection 
      key="task" 
      data={lesson} 
      onBack={() => setCurrentSection(0)} 
      onNext={() => setCurrentSection(2)} 
    />,
    <RecordingSection 
      key="recording" 
      data={lesson} 
      onBack={() => setCurrentSection(1)} 
      moduleId={moduleId}
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
