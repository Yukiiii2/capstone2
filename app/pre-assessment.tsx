import React, { useState } from 'react';
import { View, Text, Pressable, SafeAreaView, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const QUESTIONS = [
  { question: 'How confident are you speaking in public?', subtitle: 'Please rate honestly so we can support your practice' },
  { question: 'How confident are you managing anxiety before speaking?', subtitle: 'Please rate honestly so we can support your practice' },
  { question: 'How confident are you organizing your thoughts before speaking?', subtitle: 'Please rate honestly so we can support your practice.' },
  { question: 'How confident are you reading aloud in front of others?', subtitle: 'Please rate honestly so we can support your practice.' },
  { question: 'How comfortable are you with impromptu speaking?', subtitle: 'Please rate honestly so we can support your practice.' },
  { question: 'How satisfied are you with your overall speaking and reading skills?', subtitle: 'Please rate honestly so we can support your practice.' },
];

const SCREEN_WIDTH = Dimensions.get('window').width;

function BackgroundDecor() {
  return (
    <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
      <View className="absolute left-0 right-0 top-0 bottom-0">
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#0F172A']}
          className="flex-1"
        />
      </View>
      {/* Decorative Circles */}
      <View className="absolute w-40 h-40 bg-purple-500/5 rounded-full -top-10 -left-8 z-10" />
      <View className="absolute w-32 h-32 bg-blue-500/5 rounded-full top-10 -right-5 z-10" />
      <View className="absolute w-24 h-24 bg-cyan-400/5 rounded-full bottom-20 left-12 z-10" />
      <View className="absolute w-36 h-36 bg-purple-400/5 rounded-full -bottom-8 -right-8 z-10" />
    </View>
  );
}

function LogoHeader() {
  const router = useRouter();
  
  return (
    <View className="flex-row items-center pt-10 pb-4 px-4 z-10">
      <Pressable 
        onPress={() => router.push('/')}
        className="flex-row items-center"
      >
        <Image 
          source={require('../assets/Speaksy.png')} 
          className="w-16 h-16 rounded-2xl" 
          resizeMode="contain"
        />
        <Text className="text-white text-2xl font-bold tracking-wider ml-2">Voclaria</Text>
      </Pressable>
    </View>
  );
}

export default function PreAssessmentScreen() {
  const router = useRouter(); // For navigation
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(Array(QUESTIONS.length).fill(null));
  const [showError, setShowError] = useState(false);

  const handleSelect = (val: number) => {
    const updated = [...answers];
    updated[current] = val;
    setAnswers(updated);
    if (showError) setShowError(false);
  };

  const goNext = () => {
    if (answers[current] === null) {
      setShowError(true);
      return;
    }
    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1);
    } else {
      // On completion → go to home page
      router.replace('/home-page');
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setCurrent(current - 1);
      setShowError(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0F172A]">
      <BackgroundDecor />
      <SafeAreaView className="flex-1">
        <LogoHeader />
        <View className="flex-1 items-center justify-center px-4">
          <View className="w-full max-w-md bg-white/20 backdrop-blur-3xl border border-white/20 rounded-2xl p-7 mb-20 shadow-lg shadow-black/30">
            <View className="items-center mb-6">
              <Text className="text-white text-xl font-bold mb-1 text-center">
                Here's your Daily Pre-Assessment Questionnaire
              </Text>
              <Text className="text-white/80 text-xs text-center">
                {QUESTIONS[current].subtitle}
              </Text>
            </View>
            
            <View className="w-full bg-white/40 rounded-lg p-4 mb-6"> 
              <Text className="text-white text-sm font-bold text-center">
                {QUESTIONS[current].question}
              </Text>
            </View>
            
            <Text className="text-white text-xs mb-4 text-center">
              Rate your confidence from 1 (lowest) to 5 (highest)
            </Text>
            <View className="flex-row justify-center text-white/80 space-x-3 mb-6">
              {[1, 2, 3, 4, 5].map((num) => (
                <Pressable
                  key={num}
                  onPress={() => handleSelect(num)}
                  className={`w-12 h-12 rounded-full items-center justify-center border-1 ${
                    answers[current] === num
                      ? 'bg-white/60 border-[#A259FF] shadow-lg shadow-[#A259FF]/30'
                      : 'bg-white/10 border-white/40 hover:bg-white/50'
                  } transition-colors duration-200`}
                >
                  <Text 
                    className={`text-lg font-bold ${
                      answers[current] === num ? 'text-white' : 'text-white/80'
                    }`}
                  >
                    {num}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            {showError && (
              <View className="flex-row items-center justify-center mb-4 p-2 bg-red-500/20 rounded-lg">
                <Ionicons name="warning" size={16} color="#FCA5A5" />
                <Text className="text-red-300 text-sm ml-2">
                  Please select an option before continuing
                </Text>
              </View>
            )}
            
            <View className="flex-row w-full space-x-4 mt-2">
              <Pressable
                onPress={goPrev}
                disabled={current === 0}
                className={`flex-1 py-3 rounded-xl items-center justify-center ${
                  current === 0 
                    ? 'bg-gray-600/30' 
                    : 'bg-[#5C4DFF] hover:bg-[#4B3CFF] active:opacity-80'
                } transition-colors duration-200`}
              >
                <Text className="text-white text-base font-semibold">
                  Previous
                </Text>
              </Pressable>
              
              <Pressable
                onPress={goNext}
                className={`flex-1 py-3 rounded-xl items-center justify-center ${
                  answers[current] === null 
                    ? 'bg-[#A259FF]/50' 
                    : 'bg-[#A259FF] hover:bg-[#8A4FFF] active:opacity-80'
                } transition-colors duration-200`}
                disabled={answers[current] === null}
              >
                <Text className="text-white text-base font-semibold">
                  {current === QUESTIONS.length - 1 ? 'Complete' : 'Next'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
