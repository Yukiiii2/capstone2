import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  Dimensions, 
  Animated, 
  PanResponder,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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
  // Basic speaking modules
  {
    id: 's1',
    title: 'Effective Non-Verbal Communication',
    subtitle: 'Lesson 1',
    level: 'basic',
    type: 'speaking',
    completed: true,
    upcoming: false,
  },
  {
    id: 's2',
    title: 'Diaphragmatic Breathing Practice',
    subtitle: 'Lesson 2',
    level: 'basic',
    type: 'speaking',
    completed: true,
    upcoming: false,
  },
  {
    id: 's3',
    title: 'Voice Warm-up and Articulation',
    subtitle: 'Lesson 3',
    level: 'basic',
    type: 'speaking',
    completed: true,
    upcoming: false,
  },
  {
    id: 's4',
    title: 'Eye Contact and Facial Expression',
    subtitle: 'Lesson 4',
    level: 'basic',
    type: 'speaking',
    completed: true,
    upcoming: false,
  },
  {
    id: 's5',
    title: 'Basic Self-Introduction',
    subtitle: 'Lesson 5',
    level: 'basic',
    type: 'speaking',
    completed: true,
    upcoming: false,
  },
  {
    id: 's6',
    title: 'Telling a Personal Story',
    subtitle: 'Lesson 6',
    level: 'basic',
    type: 'speaking',
    completed: true,
    upcoming: false,
  },
  // Advanced speaking modules
  {
    id: 's7',
    title: 'Persuasive Speech Building',
    subtitle: 'Lesson 1',
    level: 'advanced',
    type: 'speaking',
    completed: false,
    upcoming: true,
  },
  {
    id: 's8',
    title: 'Advanced Debate Practice',
    subtitle: 'Lesson 2',
    level: 'advanced',
    type: 'speaking',
    completed: false,
    upcoming: true,
  },
  {
    id: 's9',
    title: 'Panel Interview Simulation',
    subtitle: 'Lesson 3',
    level: 'advanced',
    type: 'speaking',
    completed: false,
    upcoming: true,
  },
  {
    id: 's10',
    title: 'Panel Interview Simulation',
    subtitle: 'Lesson 4',
    level: 'advanced',
    type: 'speaking',
    completed: false,
    upcoming: true,
  },
  {
    id: 's11',
    title: 'Crisis Communication Response',
    subtitle: 'Lesson 5',
    level: 'advanced',
    type: 'speaking',
    completed: false,
    upcoming: true,
  },
  {
    id: 's12',
    title: 'Intercultural Communication',
    subtitle: 'Lesson 6',
    level: 'advanced',
    type: 'speaking',
    completed: false,
    upcoming: true,
  }
];

const readingModules: Module[] = [
  // Basic reading modules
  {
    id: 'r1',
    title: 'Reading Fundamentals',
    subtitle: 'Lesson 1',
    level: 'basic',
    type: 'reading',
    completed: true,
    upcoming: false,
  },
  {
    id: 'r2',
    title: 'Vocabulary Building Basics',
    subtitle: 'Lesson 2',
    level: 'basic',
    type: 'reading',
    completed: true,
    upcoming: false,
  },
  {
    id: 'r3',
    title: 'Sentence Structure & Grammar',
    subtitle: 'Lesson 3',
    level: 'basic',
    type: 'reading',
    completed: true,
    upcoming: false,
  },
  // Advanced reading modules
  {
    id: 'r4',
    title: 'Critical Analysis & Interpretation',
    subtitle: 'Lesson 4',
    level: 'advanced',
    type: 'reading',
    completed: false,
    upcoming: true,
  },
  {
    id: 'r5',
    title: 'Academic Research Reading',
    subtitle: 'Lesson 5',
    level: 'advanced',
    type: 'reading',
    completed: false,
    upcoming: true,
  },
  {
    id: 'r6',
    title: 'Literary Analysis Deep Dive',
    subtitle: 'Lesson 6',
    level: 'advanced',
    type: 'reading',
    completed: false,
    upcoming: true,
  }
];

const ModuleTrackingModal: React.FC<ModuleTrackingModalProps> = ({
  visible,
  onClose,
  moduleType,
  filterType,
}) => {
  const [selectedModuleType, setSelectedModuleType] = useState<'speaking' | 'reading'>(moduleType);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical swipes
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 3);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging downward with resistance
        if (gestureState.dy > 0) {
          const resistance = 0.5; // Higher value = more resistance
          const newY = gestureState.dy * resistance;
          pan.setValue({ x: 0, y: newY });
          // Fade out the overlay as user drags down
          fadeAnim.setValue(1 - newY / 300);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Close if dragged down more than 100px or if the velocity is high enough
        if (gestureState.dy > 100 || gestureState.vy > 0.2) {
          handleClose();
        } else {
          // Return to original position with a spring animation
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            tension: 50,
            friction: 7,
          }).start();
          // Reset fade
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset animations when modal becomes visible
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
      pan.setValue({ x: 0, y: 0 });

      // Start animations
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: false,
          bounciness: 0,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    // Animate out before dismissing with a smooth slide-down effect
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(onClose);
  };
  
  const modules = selectedModuleType === 'speaking' ? speakingModules : readingModules;
  
  const filteredModules = modules.filter(module => 
    filterType === 'completed' ? module.completed : module.upcoming
  );

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end">
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View 
            className="absolute inset-0 bg-[#1A1F2E]/80 backdrop-blur-3xl"
            style={{ opacity: fadeAnim }} 
          />
        </TouchableWithoutFeedback>
        
        <Animated.View 
          className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl max-h-[90%] pb-6"
          style={{
            transform: [
              { 
                translateY: Animated.add(
                  slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0]
                  }), 
                  pan.y
                ) 
              }
            ]
          }}
          {...panResponder.panHandlers}
        >
          <View className="flex-row justify-between items-center p-5 border-b border-gray-700">
            <View className="w-10 h-1 bg-white/30 rounded-full mb-3 self-center" />
            <View className="flex-row justify-between items-center px-5 w-full">
              <Text className="text-white text-lg font-semibold">
                {filterType === 'completed' ? 'Completed' : 'Upcoming'} {selectedModuleType === 'speaking' ? 'Speaking' : 'Reading'}
              </Text>
              <TouchableOpacity onPress={handleClose} className="p-1">
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row px-5 mt-2.5 border-b border-gray-700">
            <TouchableOpacity
              className={`py-3 px-5 border-b-2 ${
                selectedModuleType === 'speaking' 
                  ? 'border-indigo-400' 
                  : 'border-transparent'
              }`}
              onPress={() => setSelectedModuleType('speaking')}
            >
              <Text className={`${
                selectedModuleType === 'speaking' 
                  ? 'text-white font-semibold' 
                  : 'text-gray-400 font-medium'
              }`}>
                Speaking
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`py-3 px-5 border-b-2 ${
                selectedModuleType === 'reading' 
                  ? 'border-indigo-400' 
                  : 'border-transparent'
              }`}
              onPress={() => setSelectedModuleType('reading')}
            >
              <Text className={`${
                selectedModuleType === 'reading' 
                  ? 'text-white font-semibold' 
                  : 'text-gray-400 font-medium'
              }`}>
                Reading
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="px-4 mt-4">
            {filteredModules.length > 0 ? (
              filteredModules.map((module) => (
                <View key={module.id} className="bg-white/5 border border-white/20 rounded-xl p-4 mb-3 flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-white/10 justify-center items-center mr-3">
                    <Ionicons 
                      name={selectedModuleType === 'speaking' ? "mic" : "book"} 
                      size={20} 
                      color="#fff" 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-sm font-medium mb-0.5">{module.title}</Text>
                    <Text className="text-gray-400 text-xs mb-1.5">{module.subtitle}</Text>
                    <View className={`self-start px-2 py-0.5 rounded ${
                      module.level === 'advanced' 
                        ? 'bg-violet-500/10' 
                        : 'bg-white/20'
                    }`}>
                      <Text className={`text-xs font-semibold ${
                        module.level === 'advanced' 
                          ? 'text-violet-500' 
                          : 'text-white'
                      }`}>
                        {module.level.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center ml-2">
                    <View className={`w-2 h-2 rounded-full mr-1 ${
                      filterType === 'completed' 
                        ? 'bg-green-500' 
                        : 'bg-yellow-500'
                    }`} />
                    <Text className="text-gray-400 text-xs">
                      {filterType === 'completed' ? 'Completed' : 'Upcoming'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center justify-center py-10">
                <Ionicons 
                  name={filterType === 'completed' ? "checkmark-circle" : "time"} 
                  size={48} 
                  color="#4B5563" 
                />
                <Text className="text-gray-500 mt-3 text-center">
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