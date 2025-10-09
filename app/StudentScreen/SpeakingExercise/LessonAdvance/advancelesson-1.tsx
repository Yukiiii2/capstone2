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
    id: 1,
    title: "Mastering Vocal Variety",
    subtitle: "Advanced • Lesson 1",
    intro: `Vocal variety means changing how your voice sounds, your pitch (high/low), tone, volume, and speed so your speech sounds lively and interesting. It helps express feelings and keep people's attention.`,
    importance: [
      "Quick facts, minimal fluff.",
      "Friendly anecdotes or relatable language.",
      "Punchy statements with emphasis",
    ],
    tips: [
      "Pause before and after important lines.",
      "Be louder for emphasis.",
      "Change your speed to keep interest.",
      "Go higher for excitement, lower for serious ideas."
    ],
    taskInstructions: [
      "Read the text naturally first, then with vocal variety",
      "Pay attention to your pitch, volume, and pacing",
      "Use pauses effectively for emphasis",
      "Record yourself and listen back to your performance"
    ],
    taskBody: `Task: Record a 1–2 min speech using pitch, volume, pace, and pauses.

Task Example:
Choose this short text and read it aloud two times:

1. First, in your natural style.
2. Second, using deliberate vocal variety (↑ pitch, ↓ pitch, ▮ pause, ↗ volume up, ↘ volume down).

"Great leaders are not born great ▮ they grow through challenges. ↑ With courage, ↓ with discipline, and ↗ with hope, ↘ they inspire us all."`,
    rubric: [
      { 
        label: "Pitch Control", 
        descriptions: {
          high: "Varies pitch naturally for emotion",
          medium: "Some variation, not consistent",
          low: "Monotone voice"
        }
      },
      { 
        label: "Volume", 
        descriptions: {
          high: "Adjusts volume for emphasis",
          medium: "Some variation",
          low: "Flat, same volume"
        }
      },
      { 
        label: "Pace", 
        descriptions: {
          high: "Speaks with varied speed",
          medium: "Limited variation",
          low: "Same speed throughout"
        }
      },
      { 
        label: "Pauses", 
        descriptions: {
          high: "Pauses highlight key points",
          medium: "Some pauses, not well-placed",
          low: "Few or awkward pauses"
        }
      }
    ],
    references: [
      { url: "https://www.bbc.co.uk/academy/en/articles/art20130702112133652" },
      { url: "https://www.toastmasters.org/magazine/magazine-issues/2021/july/vocal-variety" },
    ],
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
const TaskSection = ({ data, onBack, onNext }: { 
  data: LessonDetail; 
  onBack: () => void; 
  onNext: () => void;
}) => {
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
      <View className="flex-1 p-6">
        <TouchableOpacity 
          onPress={onBack}
          className="flex-row items-center mb-6"
        >
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
                <Text className="text-violet-400 mr-2">↑</Text>
                <Text className="text-white/80 text-sm">Raise pitch for important words</Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-violet-400 mr-2">↓</Text>
                <Text className="text-white/80 text-sm">Lower pitch for emphasis</Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-violet-400 mr-2">▮</Text>
                <Text className="text-white/80 text-sm">Pause for dramatic effect</Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-violet-400 mr-2">↗</Text>
                <Text className="text-white/80 text-sm">Increase volume for excitement</Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-violet-400 mr-2">↘</Text>
                <Text className="text-white/80 text-sm">Decrease volume for emphasis</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            className="bg-violet-600 py-4 rounded-lg items-center"
            onPress={onNext}
          >
            <Text className="text-white font-bold text-base">Continue to Recording</Text>
          </TouchableOpacity>
        </View>
      </View>
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
          <View className="items-center">
            <Text className="text-white text-2xl font-bold">Recording Task</Text>
          </View>

          <View className="mb-10">
            <Text className="text-white text-sm top-4 leading-5">Task: Record a 1–2 min speech using pitch, volume, pace, and pauses.</Text>
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
              <Text className="text-white font-medium text-sm">Back to Task</Text>
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