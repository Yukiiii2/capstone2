// ...existing code...
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  Image,
  Dimensions,
  StyleSheet,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

type Question = {
  question: string;
};

const QUESTIONS: Question[] = [
  { question: "How confident are you speaking in public?" },
  { question: "How confident are you managing anxiety before speaking?" },
  {
    question: "How confident are you organizing your thoughts before speaking?",
  },
  { question: "How confident are you reading aloud in front of others?" },
  { question: "How comfortable are you with impromptu speaking?" },
  {
    question:
      "How satisfied are you with your overall speaking and reading skills?",
  },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BackgroundDecor = () => (
  <View className="absolute inset-0 w-full h-full z-0">
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#0F172A"]}
        style={StyleSheet.absoluteFill}
      />
    </View>
    <View className="absolute w-40 h-40 bg-[#a78bfa]/10 rounded-full -top-20 -left-20" />
    <View className="absolute w-24 h-24 bg-[#a78bfa]/10 rounded-full top-1/4 -right-12" />
    <View className="absolute w-32 h-32 bg-[#a78bfa]/5 rounded-full top-1/3 -left-16" />
    <View className="absolute w-48 h-48 bg-[#a78bfa]/5 rounded-full bottom-1/4 -right-24" />
    <View className="absolute w-28 h-28 bg-[#a78bfa]/5 rounded-full bottom-2 right-8" />
    <View className="absolute w-28 h-28 bg-[#a78bfa]/5 rounded-full top-15 right-12" />
    <View className="absolute w-32 h-32 bg-[#a78bfa]/5 rounded-full bottom-24 left-1/6" />
  </View>
);

const LogoHeader = () => {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-start pt-8 pb-2 px-6 z-10">
      <Pressable
        onPress={() => router.back()}
        className="flex-row items-center"
      >
        <Image
          source={require("../../../assets/Speaksy.png")}
          className="w-14 h-14 rounded-full"
          resizeMode="cover"
        />
        <Text className="text-white text-2xl right-4 font-bold tracking-tight ml-3">
          Voclaria
        </Text>
      </Pressable>
    </View>
  );
};

type RatingButtonProps = {
  num: number;
  isSelected: boolean;
  onPress: (num: number) => void;
};

const RatingButton = ({ num, isSelected, onPress }: RatingButtonProps) => (
  <Pressable
    onPress={() => onPress(num)}
    className={`w-12 h-12 rounded-full items-center justify-center border-2 ${
      isSelected ? "border-white/80 bg-white/20" : "border-white/20"
    }`}
    style={({ pressed }) => ({
      transform: [{ scale: isSelected ? 1.05 : pressed ? 0.98 : 1 }],
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isSelected ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: isSelected ? 4 : 2,
    })}
  >
    <Text
      className={`text-xl font-bold ${isSelected ? "text-white" : "text-white/80"}`}
    >
      {num}
    </Text>
  </Pressable>
);

const PreAssessmentScreen = () => {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>(
    Array(QUESTIONS.length).fill(null)
  );
  const [showError, setShowError] = useState(false);

  const handleSelect = useCallback(
    (val: number) => {
      setAnswers((prev) => {
        const updated = [...prev];
        updated[current] = val;
        return updated;
      });
      if (showError) setShowError(false);
    },
    [current, showError]
  );

  const goNext = useCallback(async () => {
    if (answers[current] === null) {
      setShowError(true);
      return;
    }

    if (current < QUESTIONS.length - 1) {
      setCurrent((prev) => prev + 1);
    } else {
      // Navigate directly to home-page.tsx
  router.push("/StudentScreen/HomePage/home-page");
    }
  }, [current, answers, router]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setCurrent((prev) => prev - 1);
      setShowError(false);
    }
  }, [current]);

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <BackgroundDecor />
      <SafeAreaView className="flex-1">
        <LogoHeader />
        <View className="flex-1 items-center justify-center px-5">
          <View className="w-full max-w-md bg-white/10 rounded-2xl border border-white/30 items-center shadow-lg py-8 px-6 mb-4">
            <Text className="text-white text-2xl text-center font-bold mb-6">
              Daily Pre-Assessment
            </Text>

            <View className="w-full mb-6">
              <View className="bg-white/10 border border-white/30 rounded-xl p-4 mb-4">
                <Text className="text-white text-base font-medium text-center">
                  {QUESTIONS[current].question}
                </Text>
              </View>

              <Text className="text-white/80 text-xs mb-4 text-center italic">
                Rate your confidence from 1 (lowest) to 5 (highest)
              </Text>

              <View className="flex-row justify-between w-full max-w-xs mx-auto mb-6">
                {[1, 2, 3, 4, 5].map((num) => (
                  <RatingButton
                    key={num}
                    num={num}
                    isSelected={answers[current] === num}
                    onPress={handleSelect}
                  />
                ))}
              </View>

              <View className="w-full h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
                <View
                  className="h-full bg-[#A259FF]"
                  style={{
                    width: `${((current + 1) / QUESTIONS.length) * 100}%`,
                    borderRadius: 8,
                  }}
                />
              </View>

              <View className="flex-row w-full space-x-3">
                <Pressable
                  onPress={goPrev}
                  disabled={current === 0}
                  className={`flex-1 py-3.5 rounded-xl items-center ${
                    current === 0
                      ? "bg-gray-600/30 opacity-60"
                      : "bg-white/10 border border-white/20"
                  }`}
                >
                  <Text className="text-white text-base font-medium">
                    Previous
                  </Text>
                </Pressable>

                <Pressable
                  onPress={goNext}
                  disabled={!answers[current]}
                  className={`flex-1 py-3.5 rounded-xl items-center ${
                    !answers[current]
                      ? "bg-gray-600/30 opacity-60"
                      : "bg-[#A259FF] border border-[#A259FF]"
                  }`}
                >
                  <Text className="text-white text-base font-medium">
                    {current === QUESTIONS.length - 1 ? "Complete" : "Next"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Text className="text-white/60 text-sm">
            Question {current + 1} of {QUESTIONS.length}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default PreAssessmentScreen;
