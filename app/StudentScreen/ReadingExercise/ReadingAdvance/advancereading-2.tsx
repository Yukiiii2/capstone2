import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Linking,
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient 
        colors={["#0F172A", "#1E293B", "#0F172A"]} 
        className="flex-1" 
      />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
  </View>
);

const WordList = () => (
  <View className="mb-6">
    <Text className="text-white text-lg font-bold mb-2">Passage:</Text>
    <View className="bg-white/5 p-4 rounded-lg">
      <Text className="text-white text-center text-sm font-semibold mb-4">The Bridge at Sunrise</Text>
      <Text className="text-white text-justify leading-relaxed">
      As the first light touched the bridge, Maya took a deep breath and smiled. The city was quiet, the river calm, and the world seemed full of possibilities. Every morning, she crossed that bridge to chase her dreams, believing that each sunrise was a promise of hope and new beginnings.
      </Text>
    </View>
  </View>
);

const Instructions = () => (
  <View className="mb-6">
    <Text className="text-white text-lg font-bold mb-2">Instructions:</Text>
    <View className="bg-white/5 p-4 rounded-lg">
      <Text className="text-white mb-2">1. Read with emotional tone and expressive pauses.</Text>
      <Text className="text-white mb-2">2. Use voice variation to convey mood and imagery.</Text>
      <Text className="text-white">3. AI evaluates tone variety, fluency, and expressiveness.</Text>
    </View>
  </View>
);

const FocusArea = () => (
  <View className="mb-6">
    <Text className="text-white text-lg font-bold mb-2">Focus:</Text>
    <View className="bg-purple-500/20 p-4 rounded-lg border-l-4 border-purple-500">
      <Text className="text-white">Expression, tone control, and emotional fluency.
      </Text>
    </View>
  </View>
);

const References = () => {
  const references = [
    { url: "https://lrmds.deped.gov.ph/" },
    { url: "https://www.coe.int/en/web/common-european-framework-reference-languages" },
    { url: "https://openai.com/research/whisper" },
    { url: "https://spacy.io/" }
  ];

  return (
    <View className="mb-6 bg-white/5 p-6 rounded-2xl border border-white/10">
      <View className="flex-row items-center mb-4">
        <Ionicons name="library-outline" size={20} color="#ffffff" />
        <Text className="text-white text-lg font-semibold ml-2">References</Text>
      </View>
      <View>
        {references.map((ref, i) => (
          <TouchableOpacity 
            key={i} 
            onPress={() => Linking.openURL(ref.url)}
            className="flex-row items-center py-2.5"
            activeOpacity={0.7}
          >
            <Ionicons name="link" size={16} color="#a78bfa" className="mr-4" />
            <Text className="text-violet-300 text-xs">
              {ref.url}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const RubricTable = () => {
  const criteria = [
    {
      name: "Pronunciation Accuracy",
      excellent: "Accurate and natural throughout",
      good: "Few unclear words",
      fair: "Several mispronunciations",
      needsImprovement: "Many unclear words"
    },
    {
      name: "Pace & Fluency",
      excellent: "Smooth and cohesive flow",
      good: "Slight hesitations",
      fair: "Uneven rhythm",
      needsImprovement: "Frequent pauses"
    },
    {
      name: "Expression & Tone",
      excellent: "Expressive, emotional, engaging",
      good: "Some tone variation",
      fair: "Limited tone control",
      needsImprovement: "Flat or monotone"
    },
    {
      name: "Comprehension Delivery",
      excellent: "Logical phrasing, stress on key ideas",
      good: "Minor emphasis errors",
      fair: "Missed important cues",
      needsImprovement: "No clear understanding shown"
    }
  ];

  return (
    <View className="mb-8 w-full">
      <Text className="text-white text-lg font-bold mb-3">Scoring Guide / Rubric</Text>
      <View className="border border-white/20 rounded-lg overflow-hidden w-full">
        <View className="flex-row bg-purple-600/30">
          <View className="w-1/4 p-3 border-r border-white/20">
            <Text className="text-white text-sm font-semibold">Criteria</Text>
          </View>
          <View className="w-[18.75%] py-2 px-3 border-r border-white/20 items-center justify-center">
            <Text className="text-white text-base font-bold">4</Text>
          </View>
          <View className="w-[18.75%] py-2 px-3 border-r border-white/20 items-center justify-center">
            <Text className="text-white text-base font-bold">3</Text>
          </View>
          <View className="w-[18.75%] py-2 px-3 border-r border-white/20 items-center justify-center">
            <Text className="text-white text-base font-bold">2</Text>
          </View>
          <View className="w-[18.75%] py-2 px-3 items-center justify-center">
            <Text className="text-white text-base font-bold">1</Text>
          </View>
        </View>
        
        {criteria.map((criterion, index) => (
          <View key={index} className="flex-row border-t border-white/10">
            <View className="w-1/4 py-2 px-3 border-r border-white/10 bg-white/5">
              <Text className="text-white text-xs">{criterion.name}</Text>
            </View>
            <View className="w-[18.75%] py-2 px-3 border-r border-white/10">
              <Text className="text-white/90 text-[11px]">{criterion.excellent}</Text>
            </View>
            <View className="w-[18.75%] py-2 px-3 border-r border-white/10">
              <Text className="text-white/90 text-[11px]">{criterion.good}</Text>
            </View>
            <View className="w-[18.75%] py-2 px-3 border-r border-white/10">
              <Text className="text-white/90 text-[11px]">{criterion.fair}</Text>
            </View>
            <View className="w-[18.75%] py-2 px-3">
              <Text className="text-white/90 text-[11px]">{criterion.needsImprovement}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="mt-4">
        <Text className="text-white font-bold mb-2">Performance Level:</Text>
        <View className="bg-white/5 p-3 rounded-lg">
          <Text className="text-white">13–16 → <Text className="text-green-400">Excellent</Text></Text>
          <Text className="text-white">9–12 → <Text className="text-blue-400">Good</Text></Text>
          <Text className="text-white">5–8 → <Text className="text-yellow-400">Fair</Text></Text>
          <Text className="text-white">1–4 → <Text className="text-red-400">Needs Improvement</Text></Text>
        </View>
      </View>
    </View>
  );
};

const AICriteria = () => (
  <View className="mb-8">
    <Text className="text-white text-lg font-bold mb-3">AI Feedback Metrics</Text>
    <View className="border border-white/20 rounded-lg overflow-hidden">
      <View className="flex-row bg-purple-600/30">
        <View className="w-1/3 p-2 border-r border-white/20">
          <Text className="text-white font-semibold">Criteria</Text>
        </View>
        <View className="w-2/3 p-2">
          <Text className="text-white font-semibold">Description</Text>
        </View>
      </View>
      {[
        {
          criteria: "Pronunciation Accuracy",
          description: "Measures correctness of spoken words.",
          example: "“Excellent pronunciation—98% accuracy.”"
        },
        {
          criteria: "Pace & Fluency",
          description: "Evaluates smoothness and natural rhythm.",
          example: "“Good pacing, with clear sentence transitions.”"
        },
        {
          criteria: "Expression & Tone",
          description: "Analyzes variation and emotional depth.",
          example: "“Strong tone control—great emphasis on main ideas.”"
        },
        {
          criteria: "Comprehension Delivery",
          description: "Detects logical stress and phrasing based on meaning.",
          example: "“You emphasized key ideas effectively—shows understanding.”"
        }
      ].map((item, index) => (
        <View key={index} className="flex-row border-t border-white/10">
          <View className="w-1/3 p-2 border-r border-white/10 bg-white/5">
            <Text className="text-white text-sm">{item.criteria}</Text>
          </View>
          <View className="w-2/3 p-2">
            <Text className="text-white/80 text-sm mb-1">{item.description}</Text>
            <Text className="text-purple-300 text-xs italic">Example: {item.example}</Text>
          </View>
        </View>
      ))}
    </View>
  </View>
);

const NextButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    className="py-3 px-8 rounded-xl bg-violet-600 flex-1 ml-3 items-center justify-center"
    activeOpacity={0.8}
  >
    <Text className="text-white font-semibold text-base">Next</Text>
  </TouchableOpacity>
);

const BackButton = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    className="py-3 px-4 rounded-xl bg-white/10 border border-white/20 flex-1 mr-2 items-center justify-center"
    activeOpacity={0.8}
  >
    <Text className="text-white font-semibold text-base">Back</Text>
  </TouchableOpacity>
);

export default function ReadingExercise() {
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    setCurrentPage(prev => Math.min(prev + 1, 1));
  };

  const handleBack = () => {
    if (currentPage === 0) {
      router.back();
    } else {
      setCurrentPage(prev => Math.max(prev - 1, 0));
    }
  };

  const handleStartReading = () => {
    const content = "The Bridge at Sunrise\n\nAs the first light touched the bridge, Maya took a deep breath and smiled. The city was quiet, the river calm, and the world seemed full of possibilities. Every morning, she crossed that bridge to chase her dreams, believing that each sunrise was a promise of hope and new beginnings.";
    const title = "The Bridge at Sunrise";
    
    router.push({
      pathname: "/StudentScreen/ReadingExercise/student-voice-reading-recording",
      params: { 
        content,
        title,
        module: 'advance' 
      }
    });
  };

  return (
    <View className="flex-1 bg-gray-900">
      <BackgroundDecor />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingTop: 20 }}>
        {currentPage === 0 ? (
          <View>
            <Text className="text-2xl font-bold text-white mb-2">Literary Reading (Narrative and Emotion)</Text>
            <Text className="text-purple-300 mb-6">Reading Advance Level 2</Text>
            
            <View className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
              <Text className="text-white text-lg mb-4">
              Objective:
              Show expression, tone variation, and emotional delivery when reading literary passages.
              </Text>
              
              <WordList />
              <Instructions />
              <FocusArea />
            </View>
            
            <References />
            <View className="flex-row justify-between mt-0.1">
              <TouchableOpacity
                onPress={handleBack}
                className="py-3 px-4 rounded-xl bg-white/10 border border-white/20 items-center justify-center flex-1 mr-2"
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-base">Back</Text>
              </TouchableOpacity>
              <NextButton onPress={handleNext} />
            </View>
          </View>
        ) : (
          <View>
            <Text className="text-2xl font-bold text-white mb-6">AI Feedback & Scoring</Text>
            
            <AICriteria />
            <RubricTable />
            
            <View className="flex-row justify-between mt-0.1 px-4">
              <BackButton onPress={handleBack} />
              <TouchableOpacity
                onPress={handleStartReading}
                className="py-3 px-4 rounded-xl bg-violet-600 flex-1 ml-2 items-center justify-center"
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-base">Start Recording</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}