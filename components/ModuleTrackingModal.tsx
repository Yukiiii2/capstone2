import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  Animated, 
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Module = {
  id: string;
  title: string;
  subtitle: string;
  level: 'basic' | 'advanced';
  type: 'speaking' | 'reading';
  completed: boolean;
  upcoming: boolean;
};

type ModuleTrackingModalProps = {
  visible: boolean;
  onClose: () => void;
  moduleType: 'speaking' | 'reading';
  filterType: 'completed' | 'upcoming';
};

const speakingModules: Module[] = [
  { id: 's1', title: 'Effective Non-Verbal Communication', subtitle: 'Lesson 1', level: 'basic', type: 'speaking', completed: true, upcoming: false },
  { id: 's2', title: 'Diaphragmatic Breathing Practice', subtitle: 'Lesson 2', level: 'basic', type: 'speaking', completed: true, upcoming: false },
  { id: 's3', title: 'Voice Warm-up and Articulation', subtitle: 'Lesson 3', level: 'basic', type: 'speaking', completed: true, upcoming: false },
  { id: 's4', title: 'Eye Contact and Facial Expression', subtitle: 'Lesson 4', level: 'basic', type: 'speaking', completed: true, upcoming: false },
  { id: 's5', title: 'Basic Self-Introduction', subtitle: 'Lesson 5', level: 'basic', type: 'speaking', completed: true, upcoming: false },
  { id: 's6', title: 'Telling a Personal Story', subtitle: 'Lesson 6', level: 'basic', type: 'speaking', completed: true, upcoming: false },
  { id: 's7', title: 'Persuasive Speech Building', subtitle: 'Lesson 1', level: 'advanced', type: 'speaking', completed: false, upcoming: true },
  { id: 's8', title: 'Advanced Debate Practice', subtitle: 'Lesson 2', level: 'advanced', type: 'speaking', completed: false, upcoming: true },
  { id: 's9', title: 'Panel Interview Simulation', subtitle: 'Lesson 3', level: 'advanced', type: 'speaking', completed: false, upcoming: true },
  { id: 's10', title: 'Panel Interview Simulation', subtitle: 'Lesson 4', level: 'advanced', type: 'speaking', completed: false, upcoming: true },
  { id: 's11', title: 'Crisis Communication Response', subtitle: 'Lesson 5', level: 'advanced', type: 'speaking', completed: false, upcoming: true },
  { id: 's12', title: 'Intercultural Communication', subtitle: 'Lesson 6', level: 'advanced', type: 'speaking', completed: false, upcoming: true }
];

const readingModules: Module[] = [
  { id: 'r1', title: 'Reading Fundamentals', subtitle: 'Lesson 1', level: 'basic', type: 'reading', completed: true, upcoming: false },
  { id: 'r2', title: 'Vocabulary Building Basics', subtitle: 'Lesson 2', level: 'basic', type: 'reading', completed: true, upcoming: false },
  { id: 'r3', title: 'Sentence Structure & Grammar', subtitle: 'Lesson 3', level: 'basic', type: 'reading', completed: true, upcoming: false },
  { id: 'r4', title: 'Critical Analysis & Interpretation', subtitle: 'Lesson 4', level: 'advanced', type: 'reading', completed: false, upcoming: true },
  { id: 'r5', title: 'Academic Research Reading', subtitle: 'Lesson 5', level: 'advanced', type: 'reading', completed: false, upcoming: true },
  { id: 'r6', title: 'Literary Analysis Deep Dive', subtitle: 'Lesson 6', level: 'advanced', type: 'reading', completed: false, upcoming: true }
];

const ModuleTrackingModal: React.FC<ModuleTrackingModalProps> = ({
  visible,
  onClose,
  moduleType,
  filterType,
}) => {
  const [selectedModuleType, setSelectedModuleType] = useState<'speaking' | 'reading'>(moduleType);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.85);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(onClose);
  };

  const modules = selectedModuleType === 'speaking' ? speakingModules : readingModules;
  const filteredModules = modules.filter(module =>
    filterType === 'completed' ? module.completed : module.upcoming
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View className="flex-1 justify-center items-center">
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View 
            className="absolute inset-0 bg-black/50"
            style={{ opacity: fadeAnim }}
          />
        </TouchableWithoutFeedback>

        <Animated.View 
          className="w-[82%] max-h-[65%] rounded-2xl bg-[#1A1F2E]/100 backdrop-blur-xs"
          style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center p-3 border-b border-white/10">
            <Text className="text-white text-lg font-semibold">
              {filterType === 'completed' ? 'Completed' : 'Upcoming'} {selectedModuleType === 'speaking' ? 'Speaking' : 'Reading'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View className="flex-row px-3 border-b border-white/10">
            <TouchableOpacity
              className={`py-2 px-3 border-b-2 ${selectedModuleType === 'speaking' ? 'border-indigo-400' : 'border-transparent'}`}
              onPress={() => setSelectedModuleType('speaking')}
            >
              <Text className={`${selectedModuleType === 'speaking' ? 'text-white font-semibold' : 'text-gray-400'} text-sm`}>
                Speaking
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`py-2 px-3 border-b-2 ${selectedModuleType === 'reading' ? 'border-indigo-400' : 'border-transparent'}`}
              onPress={() => setSelectedModuleType('reading')}
            >
              <Text className={`${selectedModuleType === 'reading' ? 'text-white font-semibold' : 'text-gray-400'} text-sm`}>
                Reading
              </Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          <ScrollView className="px-3 py-2">
            {filteredModules.length > 0 ? (
              filteredModules.map((module) => (
                <View 
                  key={module.id} 
                  className="bg-white/5 border border-white/20 rounded-lg p-2 mb-2 flex-row items-center"
                >
                  <View className="w-7 h-7 rounded-md bg-white/10 justify-center items-center mr-2">
                    <Ionicons name={selectedModuleType === 'speaking' ? "mic" : "book"} size={14} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-sm font-medium">{module.title}</Text>
                    <Text className="text-gray-400 text-[11px]">{module.subtitle}</Text>
                    <View className={`self-start px-1.5 py-0.5 rounded ${module.level === 'advanced' ? 'bg-violet-500/10' : 'bg-white/15'}`}>
                      <Text className={`text-[10px] font-semibold ${module.level === 'advanced' ? 'text-violet-400' : 'text-white'}`}>
                        {module.level.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center ml-1">
                    <View className={`w-1.5 h-1.5 rounded-full mr-1 ${filterType === 'completed' ? 'bg-green-500' : 'bg-yellow-400'}`} />
                    <Text className="text-gray-400 text-[11px]">
                      {filterType === 'completed' ? 'Done' : 'Next'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center justify-center py-10">
                <Ionicons name={filterType === 'completed' ? "checkmark-circle" : "time"} size={38} color="#4B5563" />
                <Text className="text-gray-500 mt-3 text-sm text-center">
                  {`No ${filterType} ${selectedModuleType} modules found`}
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ModuleTrackingModal;
