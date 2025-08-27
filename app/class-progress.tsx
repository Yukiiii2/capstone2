import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Modal,
  Animated, 
  Easing, 
  ActivityIndicator,
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Background Decorator Component
const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#0F172A"]}
        className="flex-1"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
  </View>
);


type Student = {
  id: number;
  firstName: string;
  lastName: string;
  readingProgress: number;
  speakingProgress: number;
  confidence: 'High' | 'Medium' | 'Low';
  anxiety: 'High' | 'Medium' | 'Low';
  avatar: string;
  lastActive: string;
  isTeacher?: boolean;
};

type ClassData = {
  className: string;
  teacher: string;
  teacherAvatar: string;
  students: Student[];
};

const { width, height } = Dimensions.get('window');

// Performance data type
type PerformanceData = {
  moduleProgress: number;
  confidenceLevel: number;
  anxietyLevel: string;
  skillMastery: Record<string, number>;
  recentTasks: Array<{
    id: number;
    title: string;
    date: string;
    score: number;
  }>;
  areasToImprove: string[];
  recommendations: string[];
};

// Mock performance data
const performanceData: PerformanceData = {
  moduleProgress: 75,
  confidenceLevel: 68,
  anxietyLevel: 'medium',
  skillMastery: {
    'pronunciation': 65,
    'fluency': 72,
    'vocabulary': 58,
    'grammar': 70,
    'comprehension': 80
  },
  recentTasks: [
    { id: 1, title: 'Basic Greetings', date: '2023-06-15', score: 85 },
    { id: 2, title: 'Daily Conversations', date: '2023-06-10', score: 72 },
    { id: 3, title: 'Food Ordering', date: '2023-06-05', score: 65 }
  ],
  areasToImprove: [
    'Needs to work on verb conjugations in past tense',
    'Should practice more complex sentence structures',
    'Could expand vocabulary for professional settings'
  ],
  recommendations: [
    'Practice with interactive exercises 3 times a week',
    'Join conversation practice sessions',
    'Review module 3 for grammar reinforcement'
  ]
};

// Mock data - replace with actual data from your backend
const classData: ClassData = {
  className: 'English 101',
  teacher: 'Dr. Sarah Johnson',
  teacherAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  students: [
    {
      id: 1,
      firstName: 'Alex',
      lastName: 'Chen',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      lastActive: '1h ago',
      readingProgress: 90,
      speakingProgress: 45,
      confidence: 'Medium',
      anxiety: 'Medium'
    },
    {
      id: 2,
      firstName: 'Jamal',
      lastName: 'Williams',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
      lastActive: '30m ago',
      readingProgress: 60,
      speakingProgress: 80,
      confidence: 'High',
      anxiety: 'Low'
    },
    {
      id: 3,
      firstName: 'Maria',
      lastName: 'Garcia',
      avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
      lastActive: '45m ago',
      readingProgress: 85,
      speakingProgress: 70,
      confidence: 'High',
      anxiety: 'Medium'
    },
    {
      id: 4,
      firstName: 'David',
      lastName: 'Kim',
      avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
      lastActive: '1h 15m ago',
      readingProgress: 70,
      speakingProgress: 65,
      confidence: 'Medium',
      anxiety: 'Low'
    },
    {
      id: 5,
      firstName: 'Sophia',
      lastName: 'Martinez',
      avatar: 'https://randomuser.me/api/portraits/women/6.jpg',
      lastActive: '2h ago',
      readingProgress: 55,
      speakingProgress: 75,
      confidence: 'Medium',
      anxiety: 'Medium'
    },
    {
      id: 6,
      firstName: 'Michael',
      lastName: 'Brown',
      avatar: 'https://randomuser.me/api/portraits/men/7.jpg',
      lastActive: '30m ago',
      readingProgress: 80,
      speakingProgress: 65,
      confidence: 'High',
      anxiety: 'Low'
    },
    {
      id: 7,
      firstName: 'Emma',
      lastName: 'Wilson',
      avatar: 'https://randomuser.me/api/portraits/women/8.jpg',
      lastActive: '1h ago',
      readingProgress: 70,
      speakingProgress: 75,
      confidence: 'Medium',
      anxiety: 'Medium'
    },
    {
      id: 8,
      firstName: 'James',
      lastName: 'Taylor',
      avatar: 'https://randomuser.me/api/portraits/men/9.jpg',
      lastActive: '45m ago',
      readingProgress: 65,
      speakingProgress: 70,
      confidence: 'High',
      anxiety: 'Low'
    },
    {
      id: 9,
      firstName: 'Olivia',
      lastName: 'Anderson',
      avatar: 'https://randomuser.me/api/portraits/women/10.jpg',
      lastActive: '1h 30m ago',
      readingProgress: 75,
      speakingProgress: 80,
      confidence: 'High',
      anxiety: 'Low'
    }
  ]
};

// Sort students by last name
const sortedStudents = [...classData.students].sort((a, b) => 
  a.lastName.localeCompare(b.lastName)
);

// Current user data
const currentUser = {
  id: 0,
  firstName: 'You',
  lastName: '',
  readingProgress: 75,
  speakingProgress: 60,
  confidence: 'High',
  anxiety: 'Low',
  avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  lastActive: '2h ago',
  isTeacher: false
};

const allStudents = [currentUser, ...sortedStudents];

// Teacher data
const teacherData = {
  id: 999,
  firstName: classData.teacher,
  role: 'Teacher',
  avatar: classData.teacherAvatar
};

// Types for Performance Modal
interface PerformanceModalProps {
  visible: boolean;
  onClose: () => void;
  performanceData: StudentPerformanceData;
}

// Types for Student Performance Data
interface StudentPerformanceData {
  moduleProgress: number;
  confidenceLevel: number;
  anxietyLevel: number;
  skillMastery: Record<string, number>;
  recentTasks: Array<{
    id: number;
    title: string;
    score: number;
    date: string;
  }>;
  areasToImprove: string[];
  recommendations: string[];
}

// Types for Performance Type Modal
interface PerformanceTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: 'speaking' | 'reading') => void;
}

// Skill Mastery type
type SkillMastery = Record<string, number>;

// Performance Modal Component
const PerformanceModal: React.FC<PerformanceModalProps> = ({ visible, onClose, performanceData }) => {
  if (!visible) return null;

  const anxietyColors = {
    low: {
      bg: "bg-white/5",
      text: "text-green-400",
      border: "border-white/20",
      dot: "bg-green-400",
      progress: 30,
      progressColor: "#10b981",
    },
    medium: {
      bg: "bg-white/5",
      text: "text-yellow-400",
      border: "border-white/20",
      dot: "bg-yellow-400",
      progress: 60,
      progressColor: "#f59e0b",
    },
    high: {
      bg: "bg-white/5",
      text: "text-red-400",
      border: "border-white/20",
      dot: "bg-red-400",
      progress: 90,
      progressColor: "#ef4444",
    },
  };

  const currentAnxiety = anxietyColors.medium;
  const performanceType = performanceData.confidenceLevel > 60 ? 'speaking' : 'reading';

  const renderProgressBar = (progress: number, color: string) => (
    <View className="h-2 bg-white/20 rounded-full overflow-hidden">
      <View
        className="h-full rounded-full"
        style={{
          width: `${progress}%`,
          backgroundColor: color,
        }}
      />
    </View>
  );

  const renderInsightSection = (title: string, items: string[], color: string) => (
    <View className={`bg-${color}-900/20 border-l-4 border-${color}-400 p-3 rounded-r-lg`}>
      <Text className={`text-sm font-medium text-${color}-400 mb-2`}>
        {title}
      </Text>
      <View className="space-y-2">
        {items.map((item, index) => (
          <View key={index} className="flex-row items-start">
            <Text className={`text-${color}-400 mr-2 mt-0.5`}>•</Text>
            <Text className="text-white/90 text-sm flex-1">{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const getSkillColor = (value: number) => {
    if (value >= 80) return "from-emerald-500 to-green-400";
    if (value >= 60) return "from-amber-500 to-yellow-400";
    return "from-rose-500 to-pink-400";
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/30 justify-center items-center p-3">
        <View className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
          <BlurView intensity={30} tint="dark" className="w-full">
            <View className="p-6 bg-[#1A1F2E]/95 border border-white/10 backdrop-blur-2xl rounded-3xl">
              {/* Header */}
              <View className="flex-row justify-between items-start mb-6">
                <View className="flex-1 pr-4">
                  <Text className="text-2xl font-bold text-white mb-2">
                    Performance Details
                  </Text>
                  <View className="flex-row items-center">
                    <View className="px-3 py-1 rounded-full bg-white/10 mr-2 border border-white/10">
                      <Text className="text-white text-xs font-medium capitalize">
                        {performanceType}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="p-2 bg-white/20 rounded-full w-10 h-10 items-center justify-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-3xl bottom-2">×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                className="pr-2"
                style={{ maxHeight: Dimensions.get("window").height * 0.7 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Module Progress */}
                <View className="bg-white/10 border border-white/30 rounded-2xl p-4 shadow-lg mb-6 backdrop-blur-md">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 pr-2">
                      <Text className="text-base font-semibold text-white mb-1">
                        Module Progress
                      </Text>
                      <Text className="text-white/60 text-sm">
                        Overall completion of {performanceType} modules
                      </Text>
                    </View>
                    <View className="bg-white/10 border border-white/20 rounded-full px-2 py-0.5 min-w-[40px] items-center justify-center">
                      <Text className="text-white font-semibold text-xs">
                        {performanceData.moduleProgress}%
                      </Text>
                    </View>
                  </View>
                  <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600"
                      style={{ width: `${performanceData.moduleProgress}%` }}
                    />
                  </View>
                </View>

                {/* Confidence and Anxiety */}
                <View className="flex-row justify-between mb-6 space-x-4">
                  {/* Confidence Card */}
                  <View className="bg-white/10 border border-white/30 rounded-2xl p-5 shadow-lg flex-1 backdrop-blur-md">
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-sm font-medium text-white/80">
                        Confidence
                      </Text>
                      <View className="w-2 h-2 rounded-full bg-green-400"></View>
                    </View>
                    <View className="mb-3">
                      <Text
                        className={`text-3xl font-bold ${
                          performanceData.confidenceLevel >= 60 ? "text-green-400" : "text-amber-400"
                        }`}
                      >
                        {performanceData.confidenceLevel}%
                      </Text>
                    </View>
                    <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                        style={{ width: `${performanceData.confidenceLevel}%` }}
                      />
                    </View>
                  </View>

                  {/* Anxiety Level Card */}
                  <View className="bg-white/10 border border-white/30 rounded-2xl p-5 shadow-lg flex-1 backdrop-blur-md">
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-sm font-medium text-white/80">
                        Anxiety Level
                      </Text>
                      <View className={`w-2 h-2 rounded-full ${currentAnxiety.dot}`}></View>
                    </View>
                    <View className="mb-3">
                      <Text className={`text-2xl font-bold ${currentAnxiety.text}`}>
                        Medium
                      </Text>
                    </View>
                    <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${currentAnxiety.progress}%`,
                          backgroundColor: currentAnxiety.progressColor,
                        }}
                      />
                    </View>
                  </View>
                </View>

                {/* Skill Mastery */}
                <View className="bg-white/10 border border-white/30 rounded-2xl p-5 shadow-lg mb-6 backdrop-blur-md">
                  <View className="flex-row justify-between items-center mb-5">
                    <Text className="text-base font-semibold text-white">
                      Skill Mastery
                    </Text>
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-violet-500 mr-1"></View>
                      <Text className="text-xs text-white/60">Progress</Text>
                    </View>
                  </View>
                  <View className="space-y-5">
                    {Object.entries(performanceData.skillMastery).map(([skill, value]) => (
                      <View key={skill} className="space-y-2">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-sm font-medium text-white/90 capitalize">
                            {skill}
                          </Text>
                          <Text className="text-sm font-semibold text-white">
                            {value}%
                          </Text>
                        </View>
                        <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <View
                            className={`h-full rounded-full bg-gradient-to-r ${getSkillColor(value as number)}`}
                            style={{ width: `${value}%` }}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Recent Tasks */}
                <View className="bg-white/10 border border-white/30 rounded-2xl p-5 shadow-lg mb-6 backdrop-blur-md">
                  <Text className="text-base font-semibold text-white mb-4">
                    Recent Tasks
                  </Text>
                  <View className="space-y-3">
                    {performanceData.recentTasks.map((task) => (
                      <View 
                        key={task.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-3"
                      >
                        <View className="flex-row justify-between items-center mb-1">
                          <Text className="text-white font-medium">{task.title}</Text>
                          <View className="flex-row items-center">
                            <Text className="text-white font-semibold mr-1">{task.score}%</Text>
                            <View className="w-2 h-2 rounded-full bg-green-400"></View>
                          </View>
                        </View>
                        <Text className="text-white/50 text-xs">{task.date}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Insights */}
                <View className="space-y-4">
                  <View className="pb-2 border-b border-white/10 mb-2">
                    <Text className="text-base font-semibold text-white">
                      Performance Insights
                    </Text>
                    <Text className="text-white/60 text-xs mt-1">
                      Key observations and suggestions
                    </Text>
                  </View>

                  {performanceData.areasToImprove.length > 0 && (
                    <View className="bg-white/10 border border-white/30 rounded-xl p-4 backdrop-blur-sm">
                      <View className="flex-row items-center mb-3">
                        <View className="w-2 h-2 rounded-full bg-amber-400 mr-3"></View>
                        <Text className="text-sm font-medium text-amber-400">
                          Areas to Improve
                        </Text>
                      </View>
                      <View className="space-y-3 pl-0">
                        {performanceData.areasToImprove.map((item, index) => (
                          <View key={index} className="flex-row items-start">
                            <Text className="text-white/90 text-sm leading-relaxed">
                              {item}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {performanceData.recommendations.length > 0 && (
                    <View className="bg-white/10 border border-white/30 rounded-xl p-4 backdrop-blur-sm">
                      <View className="flex-row items-center mb-3">
                        <View className="w-2 h-2 rounded-full bg-blue-400 mr-3"></View>
                        <Text className="text-sm font-medium text-blue-400">
                          Recommendations
                        </Text>
                      </View>
                      <View className="space-y-3 pl-0">
                        {performanceData.recommendations.map((item, index) => (
                          <View key={index} className="flex-row items-start">
                            <Text className="text-white/90 text-sm leading-relaxed">
                              {item}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
};

// Performance Type Selection Modal
const PerformanceTypeModal: React.FC<PerformanceTypeModalProps> = ({ visible, onClose, onSelect }) => {
  if (!visible) return null;

  const renderOption = (type: 'speaking' | 'reading', icon: string, label: string) => (
    <TouchableOpacity 
      className="flex-row items-center p-5 mb-4 bg-white/5 border border-white/10 rounded-2xl"
      onPress={() => onSelect(type)}
      activeOpacity={0.8}
    >
      <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mr-4">
        <Ionicons name={icon as any} size={24} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <Text className="text-white text-base font-semibold">{label}</Text>
        <Text className="text-white/60 text-sm mt-1">
          View detailed {type} performance metrics
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/30 justify-center items-center p-3">
        <View className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
          <BlurView intensity={30} tint="dark" className="w-full">
            <View className="p-6 bg-[#1A1F2E]/95 border border-white/10 backdrop-blur-2xl rounded-3xl">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-white">Performance Type</Text>
                <TouchableOpacity
                  onPress={onClose}
                  className="p-2 -m-2"
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              
              <View className="mb-4">
                {renderOption('speaking', 'mic', 'Speaking Performance')}
                {renderOption('reading', 'book', 'Reading Performance')}
              </View>
              
              <TouchableOpacity
                onPress={onClose}
                className="mt-2 py-3 rounded-xl items-center border border-white/10"
                activeOpacity={0.8}
              >
                <Text className="text-white/80 font-medium">Cancel</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
};

const ClassProgress = () => {
  const router = useRouter();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showPerformanceTypeModal, setShowPerformanceTypeModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedPerformanceType, setSelectedPerformanceType] = useState<'speaking' | 'reading'>('speaking');
  const [performanceData, setPerformanceData] = useState<StudentPerformanceData>({
    moduleProgress: 0,
    confidenceLevel: 0,
    anxietyLevel: 0,
    skillMastery: {
      pronunciation: 0,
      fluency: 0,
      vocabulary: 0,
      grammar: 0,
      comprehension: 0
    },
    recentTasks: [],
    areasToImprove: [],
    recommendations: []
  });
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  const fadeIn = () => {
    setShowLeaveModal(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      })
    ]).start();
  };

  const fadeOut = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => setShowLeaveModal(false));
  };

  const handleViewDetailedStats = () => {
    // Mock data for demonstration
    const mockData: StudentPerformanceData = {
      moduleProgress: selectedPerformanceType === 'speaking' ? 75 : 60,
      confidenceLevel: selectedPerformanceType === 'speaking' ? 70 : 65,
      anxietyLevel: selectedPerformanceType === 'speaking' ? 30 : 40,
      skillMastery: {
        pronunciation: selectedPerformanceType === 'speaking' ? 75 : 60,
        fluency: selectedPerformanceType === 'speaking' ? 70 : 65,
        vocabulary: selectedPerformanceType === 'speaking' ? 80 : 70,
        grammar: selectedPerformanceType === 'speaking' ? 65 : 75,
        comprehension: selectedPerformanceType === 'speaking' ? 70 : 80
      },
      recentTasks: [
        { id: 1, title: 'Conversation Practice', score: 78, date: '2023-06-15' },
        { id: 2, title: 'Reading Comprehension', score: 85, date: '2023-06-10' },
        { id: 3, title: 'Vocabulary Quiz', score: 90, date: '2023-06-05' }
      ],
      areasToImprove: [
        'Pronunciation of certain vowel sounds',
        'Using correct verb tenses in conversation',
        'Expanding vocabulary for academic discussions'
      ],
      recommendations: [
        'Practice with tongue twisters to improve pronunciation',
        'Read aloud for 10 minutes daily',
        'Join conversation groups to practice speaking'
      ]
    };
    
    setPerformanceData(mockData);
    setShowPerformanceTypeModal(true);
  };

  const handlePerformanceTypeSelect = (type: 'speaking' | 'reading') => {
    setSelectedPerformanceType(type);
    setShowPerformanceTypeModal(false);
    
    // Update performance data based on selected type
    const updatedData = {
      ...performanceData,
      moduleProgress: type === 'speaking' ? 75 : 60,
      confidenceLevel: type === 'speaking' ? 70 : 65,
      anxietyLevel: type === 'speaking' ? 30 : 40,
      skillMastery: {
        pronunciation: type === 'speaking' ? 75 : 60,
        fluency: type === 'speaking' ? 70 : 65,
        vocabulary: type === 'speaking' ? 80 : 70,
        grammar: type === 'speaking' ? 65 : 75,
        comprehension: type === 'speaking' ? 70 : 80
      }
    };
    
    setPerformanceData(updatedData);
    setShowPerformanceModal(true);
  };

  const handleLeaveClass = () => {
    setIsLeaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsLeaving(false);
      // Close the leave class modal
      fadeOut();
      // Navigate to the landing page after a short delay
      setTimeout(() => {
        router.replace('/home-page');
      }, 300);
    }, 1000);
  };

  const getConfidenceColor = (level: string) => {
    switch(level.toLowerCase()) {
      case 'high': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'low': return '#EF4444';
      default: return '#9CA3AF';
    }
  };

  const getAnxietyColor = (level: string) => {
    switch(level.toLowerCase()) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#9CA3AF';
    }
  };

  const renderProgressBar = (progress: number, color: string, label: string) => (
    <View className="mb-4 w-full">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-gray-200 text-sm font-medium">{label}</Text>
        <Text className="text-white text-sm font-semibold">{progress}%</Text>
      </View>
      <View className="h-2 bg-white/10 rounded-full w-full overflow-hidden">
        <View 
          className="h-full rounded-full"
          style={{ 
            width: `${progress}%`,
            backgroundColor: color,
            minWidth: progress > 0 ? 6 : 0
          }}
        />
      </View>
    </View>
  );

  return (
    <View className="flex-1">
      <BackgroundDecor />
      <View className="flex-1">
          {/* Header */}
          <View className="px-5 pt-8 pb-2">
            <View className="flex-row items-center top-2 justify-between mb-3">
              <View className="flex-row items-center">
                <TouchableOpacity 
                  onPress={() => router.back()}
                  className="p-2 -ml-2"
                >
                  <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-semibold ml-2">Class Progress</Text>
              </View>
              <TouchableOpacity 
                onPress={fadeIn}
                className="flex-row items-center bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg"
              >
                <Ionicons name="exit-outline" size={14} color="#EF4444" />
                <Text className="text-red-400 text-xs font-medium ml-1">Leave</Text>
              </TouchableOpacity>
            </View>
            
            {/* Teacher & Strand Info - Compact */}
            <View className="bg-white/5 top-4 rounded-2xl p-3 mb-4">
              <View className="flex-row items-center">
                <Image 
                  source={{ uri: teacherData.avatar }} 
                  className="w-12 h-12 rounded-full mr-3 border-2 border-indigo-400/30"
                />
                <View className="flex-1">
                  <Text className="text-white text-sm font-medium">{classData.teacher}</Text>
                  <Text className="text-indigo-300 text-xs font-medium">Instructor of STEM - Grade 11</Text>
                  <View className="flex-row items-center mt-1">
                    <View className="flex-row items-center">
                      <Ionicons name="people" size={12} color="#9CA3AF" />
                      <Text className="text-gray-300 text-xs ml-1">{classData.students.length + 1} Students</Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <View className=" px-3 py-2 items-center flex-row">
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text className="text-white text-base font-bold ml-1">4.8</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Your Progress Section */}
          <View className="px-5 top-3 mb-6">
            <View className="bg-white/5 rounded-2xl p-4 border border-white/20">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-white text-xl font-semibold">My Progress</Text>
                <View className="flex-row items-center bg-white/5 rounded-full px-3 py-1">
                  <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></View>
                  <Text className="text-xs text-white/80">Active</Text>
                </View>
              </View>
              
              <View className="space-y-3">
                {renderProgressBar(currentUser.readingProgress, '#8A5CFF', 'Reading')}
                {renderProgressBar(currentUser.speakingProgress, '#8A5CFF', 'Speaking')}
              </View>
              
              <View className="flex-row justify-between mt-4 space-x-3">
                <View className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                  <View className="flex-row items-center mb-1">
                    <View 
                      className="w-2 h-2 rounded-full mr-2" 
                      style={{ backgroundColor: getConfidenceColor(currentUser.confidence) }}
                    ></View>
                    <Text className="text-xs text-gray-400">Confidence</Text>
                  </View>
                  <Text 
                    className="text-base font-semibold" 
                    style={{ color: getConfidenceColor(currentUser.confidence) }}
                  >
                    {currentUser.confidence}
                  </Text>
                </View>
                
                <View className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                  <View className="flex-row items-center mb-1">
                    <View 
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: getAnxietyColor(currentUser.anxiety) }}
                    ></View>
                    <Text className="text-xs text-gray-400">Anxiety</Text>
                  </View>
                  <Text 
                    className="text-base font-semibold"
                    style={{ color: getAnxietyColor(currentUser.anxiety) }}
                  >
                    {currentUser.anxiety}
                  </Text>
                </View>
              </View>
              
              <View className="mt-4 w-full">
                <TouchableOpacity 
                  className="flex-row items-center justify-center bg-white/10 border border-white/10 px-4 py-3 rounded-lg w-full"
                  onPress={handleViewDetailedStats}
                >
                  <Ionicons name="stats-chart" size={16} color="#818CF8" />
                  <Text className="text-sm text-white font-medium ml-2">View Detailed Stats</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Classmates Section */}
          <View className="mb-4 top-2 px-5">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <Text className="text-white text-lg font-bold mr-2">Classmates</Text>
                <View className="bg-white/20 px-1.5 py-0.5 rounded-full">
                  <Text className="text-white text-[11px] font-medium">{classData.students.length} Students</Text>
                </View>
              </View>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingRight: 0,
                paddingBottom: 10,
                paddingLeft: 20
              }}
              className="-ml-5"
              style={{
                marginRight: -20, // Pull to align with My Progress container
              }}
            >
              {classData.students
                .filter(student => student.id !== 0)
                .map((student) => (
                <View 
                  key={student.id} 
                  className="rounded-2xl mr-4 relative"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255,)',
                    borderWidth: 0.5,
                    borderColor: 'rgba(223, 212, 212, 0.92)',
                    width: 240,
                  }}
                >
                  <View className="p-2.5">
                    {/* Student Header */}
                    <View className="flex-row items-start mb-2">
                      <View className="relative mr-3">
                        <Image 
                          source={{ uri: student.avatar }} 
                          className="w-10 h-10 rounded-xl border-2 border-white/10"
                        />
                        <View className="absolute -bottom-0.5 -right-0.5 bg-indigo-500 rounded-full p-0.5 border border-gray-900">
                          <Ionicons name="school" size={8} color="white" />
                        </View>
                      </View>
                      <View className="flex-1 min-w-0">
                        <View className="flex-row items-center">
                          <Text 
                            className="text-white text-sm font-semibold truncate"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {student.firstName} {student.lastName}
                          </Text>
                        </View>
                        <View className="flex-row items-center mt-0.5">
                          <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></View>
                          <Text className="text-gray-400 text-[11px] truncate">
                            Active {student.lastActive}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* Progress Section */}
                    <View className="mb-2">
                      <View className="mb-2">
                        <View className="flex-row justify-between items-center mb-1.5">
                          <View className="flex-row items-center flex-1 min-w-0">
                            <View className="w-1.5 h-1.5 rounded-full bg-[#8A5CFF] mr-1.5"></View>
                            <Text className="text-gray-300 text-[11px] font-medium truncate">Reading</Text>
                          </View>
                          <Text className="text-white text-[11px] font-semibold ml-2">{student.readingProgress}%</Text>
                        </View>
                        <View className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <LinearGradient
                            colors={['#8A5CFF', '#8A5CFF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="h-full rounded-full"
                            style={{ 
                              width: `${student.readingProgress}%`,
                              minWidth: student.readingProgress > 0 ? 8 : 0,
                            }}
                          />
                        </View>
                      </View>
                      
                      <View>
                        <View className="flex-row justify-between items-center mb-1.5">
                          <View className="flex-row items-center flex-1 min-w-0">
                            <View className="w-1.5 h-1.5 rounded-full bg-[#8A5CFF] mr-1.5"></View>
                            <Text className="text-gray-300 text-[11px] font-medium truncate">Speaking</Text>
                          </View>
                          <Text className="text-white text-[11px] font-semibold ml-2">{student.speakingProgress}%</Text>
                        </View>
                        <View className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <LinearGradient
                            colors={['#8A5CFF', '#8A5CFF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="h-full rounded-full"
                            style={{ 
                              width: `${student.speakingProgress}%`,
                              minWidth: student.speakingProgress > 0 ? 8 : 0,
                            }}
                          />
                        </View>
                      </View>
                    </View>
                    
                    {/* Stats */}
                    <View className="flex-row justify-between space-x-1.5 mt-1.5">
                      <View className="flex-1 min-w-0">
                        <View className="bg-white/2 rounded-lg p-1.5">
                          <View className="flex-row items-center">
                            <View 
                              className="w-1.5 h-1.5 rounded-full mr-1" 
                              style={{ backgroundColor: getConfidenceColor(student.confidence) }}
                            ></View>
                            <Text className="text-gray-400 text-[9px] font-medium truncate">CONFIDENCE</Text>
                          </View>
                          <Text 
                            className="text-[11px] font-semibold mt-0.5 truncate"
                            style={{ color: getConfidenceColor(student.confidence) }}
                          >
                            {student.confidence}
                          </Text>
                        </View>
                      </View>
                      
                      <View className="flex-1 min-w-0">
                        <View className="bg-white/2 rounded-lg p-1.5">
                          <View className="flex-row items-center">
                            <View 
                              className="w-1.5 h-1.5 rounded-full mr-1"
                              style={{ backgroundColor: getAnxietyColor(student.anxiety) }}
                            ></View>
                            <Text className="text-gray-400 text-[9px] font-medium truncate">ANXIETY</Text>
                          </View>
                          <Text 
                            className="text-[11px] font-semibold mt-0.5 truncate"
                            style={{ color: getAnxietyColor(student.anxiety) }}
                          >
                            {student.anxiety}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                </View>
              ))}
            </ScrollView>
          </View>
        
        {/* Leave Class Confirmation Modal */}
        <Modal
          visible={showLeaveModal}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={fadeOut}
        >
          <View className="flex-1 justify-center items-center bg-black/70">
            <Animated.View 
              className="bg-slate-800 rounded-2xl p-6 w-11/12 max-w-md border border-white/10"
              style={{ 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 5
              }}
            >
              <View className="items-center mb-6">
                <Ionicons name="warning" size={32} color="#FFFFFF" />
                <Text className="text-white text-xl font-bold mt-3 mb-2">Leave Class?</Text>
                <Text className="text-gray-400 text-sm text-center">
                  Are you sure you want to leave this class? You'll lose access to class progress and materials.
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <TouchableOpacity 
                  className="flex-1 bg-white/10 py-4 rounded-xl mr-2 items-center"
                  onPress={fadeOut}
                  disabled={isLeaving}
                >
                  <Text className="text-gray-200 text-base font-semibold">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="flex-1 bg-violet-600/80 py-4 rounded-xl ml-2 items-center"
                  onPress={handleLeaveClass}
                  disabled={isLeaving}
                >
                  {isLeaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white text-base font-semibold">
                      Yes, Leave Class
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </View>

      {/* Performance Type Selection Modal */}
      <PerformanceTypeModal 
        visible={showPerformanceTypeModal}
        onClose={() => setShowPerformanceTypeModal(false)}
        onSelect={handlePerformanceTypeSelect}
      />

      {/* Performance Details Modal */}
      <PerformanceModal 
        visible={showPerformanceModal}
        onClose={() => setShowPerformanceModal(false)}
        performanceData={performanceData}
      />
    </View>
  );
};

export default ClassProgress;