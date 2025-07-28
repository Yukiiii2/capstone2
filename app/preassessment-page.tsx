import React, { useState } from 'react';
import { View, Text, Pressable, SafeAreaView, Dimensions, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

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
    <View style={styles.background}>
      <LinearGradient
        colors={['#0A0A0F', '#1A1A2E', '#16213E']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      />
      {/* Decorative Circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />
      <View style={[styles.circle, styles.circle4]} />
      <View style={[styles.circle, styles.circle5]} />
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 16, paddingHorizontal: 20 },
  logoImage: { width: 32, height: 32 },
  logoText: { color: 'white', fontSize: 18, fontWeight: '600', marginLeft: 8 },
  background: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', zIndex: 0 },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  circle: { position: 'absolute', borderRadius: 9999, zIndex: 1 },
  circle1: { top: -40, left: -30, width: 160, height: 160, backgroundColor: 'rgba(147, 51, 234, 0.4)' },
  circle2: { top: 100, right: -20, width: 120, height: 120, backgroundColor: 'rgba(37, 99, 235, 0.3)' },
  circle3: { bottom: 100, left: 48, width: 60, height: 60, backgroundColor: 'rgba(81, 212, 230, 0.5)' },
  circle4: { bottom: 40, right: 40, width: 80, height: 80, backgroundColor: 'rgba(168, 85, 247, 0.4)' },
  circle5: { top: '20%', left: '30%', width: 40, height: 40, backgroundColor: 'rgba(117, 152, 156, 0.5)' },
});

function LogoHeader() {
  return (
    <View className="flex-row items-center pt-10 pb-4 px-4 z-10">
      <Image source={require('../assets/Speaksy.png')} className="w-16 h-16 rounded-2xl" resizeMode="cover" />
      <Text className="text-white text-2xl font-bold tracking-wider ml-0.1">Voclaria</Text>
    </View>
  );
}

export default function PreAssessmentScreen() {
  const router = useRouter(); // For navigation
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null));
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
    <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <BackgroundDecor />
      <SafeAreaView style={{ flex: 1 }}>
        <LogoHeader />
        <View className="flex-1 items-center justify-center">
          <View
            className="mt-0.1 mb-20 w-full px-5 py-6 bg-white/30 rounded-2xl items-center shadow-lg max-w-[95%] mx-auto"
            style={{ minHeight: 340 }}
          >
            <Text className="text-white text-xl font-bold mb-1 text-center">
              Here’s your Daily Pre-Assessment Questionnaire
            </Text>
            <Text className="text-white text-xs mb-4 text-center opacity-80">
              {QUESTIONS[current].subtitle}
            </Text>
            <View className="w-full bg-white/20 rounded-lg px-2 py-2 mb-4">
              <Text className="text-white text-base font-semibold text-center">{QUESTIONS[current].question}</Text>
            </View>
            <Text className="text-white/60 text-xs mb-2 text-center">
              *Rate your confidence from 1 (lowest) to 5 (highest)!*
            </Text>
            <View className="flex-row justify-center mb-2 mt-2 space-x-3">
              {[1, 2, 3, 4, 5].map((num) => (
                <Pressable
                  key={num}
                  onPress={() => handleSelect(num)}
                  className={`w-10 h-10 rounded-full items-center justify-center border-2 mx-1 ${
                    answers[current] === num
                      ? 'bg-[#5C4DFF] border-[#5C4DFF]'
                      : 'bg-white/30 border-white/30'
                  }`}
                  style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4 }}
                >
                  <Text className={`text-lg font-semibold ${answers[current] === num ? 'text-white' : 'text-white/80'}`}>
                    {num}
                  </Text>
                </Pressable>
              ))}
            </View>
            {showError && (
              <Text className="text-red-300 text-xs mb-2 text-center">
                Please select an option before continuing
              </Text>
            )}
            <View className="flex-row w-full justify-between mt-4 px-2">
              <Pressable
                onPress={goPrev}
                disabled={current === 0}
                className={`flex-1 py-3 rounded-xl items-center mr-2 ${
                  current === 0 ? 'bg-gray-400 opacity-60' : 'bg-[#5C4DFF] opacity-90'
                }`}
              >
                <Text className="text-white text-base font-semibold">Previous</Text>
              </Pressable>
              <Pressable
                onPress={goNext}
                className={`flex-1 py-3 rounded-xl items-center ml-2 bg-[#A259FF] opacity-90`}
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
