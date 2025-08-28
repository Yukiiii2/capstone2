import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

type Module = {
  id: string;
  title: string;
  subtitle: string;
  level: "basic" | "advanced";
  type: "speaking" | "reading";
  completed: boolean;
  upcoming: boolean;
};

type ModuleTrackingModalProps = {
  visible: boolean;
  onClose: () => void;
  filterType: "completed" | "upcoming";
};

const speakingModules: Module[] = [
  { id: "s1", title: "Effective Non-Verbal Communication", subtitle: "Lesson 1", level: "basic", type: "speaking", completed: true, upcoming: false },
  { id: "s2", title: "Diaphragmatic Breathing Practice", subtitle: "Lesson 2", level: "basic", type: "speaking", completed: true, upcoming: false },
  { id: "s3", title: "Voice Warm-up and Articulation", subtitle: "Lesson 3", level: "basic", type: "speaking", completed: true, upcoming: false },
  { id: "s4", title: "Eye Contact and Facial Expression", subtitle: "Lesson 4", level: "basic", type: "speaking", completed: true, upcoming: false },
  { id: "s5", title: "Basic Self-Introduction", subtitle: "Lesson 5", level: "basic", type: "speaking", completed: true, upcoming: false },
  { id: "s6", title: "Telling a Personal Story", subtitle: "Lesson 6", level: "basic", type: "speaking", completed: true, upcoming: false },
  { id: "s7", title: "Persuasive Speech Building", subtitle: "Lesson 1", level: "advanced", type: "speaking", completed: false, upcoming: true },
  { id: "s8", title: "Advanced Debate Practice", subtitle: "Lesson 2", level: "advanced", type: "speaking", completed: false, upcoming: true },
  { id: "s9", title: "Panel Interview Simulation", subtitle: "Lesson 3", level: "advanced", type: "speaking", completed: false, upcoming: true },
  { id: "s10", title: "Crisis Communication Response", subtitle: "Lesson 4", level: "advanced", type: "speaking", completed: false, upcoming: true },
  { id: "s11", title: "Intercultural Communication", subtitle: "Lesson 5", level: "advanced", type: "speaking", completed: false, upcoming: true },
];

const readingModules: Module[] = [
  { id: "r1", title: "Reading Fundamentals", subtitle: "Lesson 1", level: "basic", type: "reading", completed: true, upcoming: false },
  { id: "r2", title: "Vocabulary Building Basics", subtitle: "Lesson 2", level: "basic", type: "reading", completed: true, upcoming: false },
  { id: "r3", title: "Sentence Structure & Grammar", subtitle: "Lesson 3", level: "basic", type: "reading", completed: true, upcoming: false },
  { id: "r4", title: "Critical Analysis & Interpretation", subtitle: "Lesson 4", level: "advanced", type: "reading", completed: false, upcoming: true },
  { id: "r5", title: "Academic Research Reading", subtitle: "Lesson 5", level: "advanced", type: "reading", completed: false, upcoming: true },
  { id: "r6", title: "Literary Analysis Deep Dive", subtitle: "Lesson 6", level: "advanced", type: "reading", completed: false, upcoming: true },
];

const ModuleTrackingModal: React.FC<ModuleTrackingModalProps> = ({
  visible,
  onClose,
  filterType,
}) => {
  const [selectedModuleType, setSelectedModuleType] = useState<"speaking" | "reading">("speaking");

  const translateY = useSharedValue(500);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 120 });
    } else {
      translateY.value = withTiming(500);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const modules =
    selectedModuleType === "speaking" ? speakingModules : readingModules;

  const filteredModules = modules.filter((m) =>
    filterType === "completed" ? m.completed : m.upcoming
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/40" />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[animatedStyle, { maxHeight: '85%' }]}
        className="absolute bottom-0 left-0 right-0 h-[85%] bg-[#1A1F2E]/95 backdrop-blur-xl rounded-t-2xl shadow-lg"
      >
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-white/10">
          <Text className="text-lg font-semibold text-white">
            {filterType === "completed" ? "Completed Modules" : "Upcoming Modules"}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Tab Selector (Speaking / Reading) */}
        <View className="flex-row space-x-6 px-4 mt-3">
          {["speaking", "reading"].map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedModuleType(type as "speaking" | "reading")}
              className="flex items-start"
            >
              <Text
                className={`text-base font-medium ${
                  selectedModuleType === type ? "text-white" : "text-gray-400"
                }`}
              >
                {type === "speaking" ? "Speaking" : "Reading"}
              </Text>
              {selectedModuleType === type && (
                <View className="h-0.5 w-full bg-blue-500 mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Modules List */}
        <ScrollView 
          className="p-4" 
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={true}
        >
          {filteredModules.length === 0 ? (
            <Text className="text-center text-gray-400 mt-6">
              No {selectedModuleType} modules found
            </Text>
          ) : (
            filteredModules.map((module) => (
              <View
                key={module.id}
                className="mb-3 p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <View className="flex-row justify-between items-start mb-1">
                  <View className="flex-row items-center space-x-2">
                    {module.upcoming && (
                      <View className="w-2 h-2 bg-yellow-400 rounded-full" />
                    )}
                    {module.level === 'advanced' && (
                      <View className="px-2 py-0.5">
                        <Text className="text-xs font-medium text-yellow-300">
                          ADVANCED
                        </Text>
                      </View>
                    )}
                    {module.completed && (
                      <View className="flex-row items-center space-x-1">
                        <View className="w-2 h-2 bg-green-400 rounded-full" />
                        <Text className="text-xs font-medium text-green-300">
                          COMPLETED
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs text-gray-400">{module.subtitle}</Text>
                </View>
                <Text className="text-base font-bold text-white mt-1">
                  {module.title}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

export default ModuleTrackingModal;
