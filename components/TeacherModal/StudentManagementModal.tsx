import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Student, defaultPerformanceData } from '../../types';

type PerformanceType = 'speaking' | 'reading';
type AnxietyLevel = 'low' | 'medium' | 'high';

interface AnxietyColorProps {
  bg: string;
  text: string;
  border: string;
  dot: string;
  progress: number;
  progressColor: string;
}

interface StudentManagementModalProps {
  visible: boolean;
  onClose: () => void;
  students: Student[];
  grade: string | null;
  strand: string | null;
  initialFilter?: {
    grade?: string;
    strand?: string;
  };
  onStudentsUpdate?: (students: Student[]) => void;
}

const StudentManagementModal: React.FC<StudentManagementModalProps> = ({
  visible,
  onClose,
  students,
  grade,
  strand,
  initialFilter = {},
  onStudentsUpdate,
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showPerformanceTypeModal, setShowPerformanceTypeModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedPerformanceType, setSelectedPerformanceType] = useState<PerformanceType>('speaking');

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    return students.filter(student => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.grade && student.grade.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (student.strand && student.strand.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [students, searchQuery]);

  // Handle student selection
  const handleStudentPress = (student: Student) => {
    setSelectedStudent(student);
    setShowPerformanceTypeModal(true);
  };

  // Handle performance type selection
  const handlePerformanceTypeSelect = (type: PerformanceType) => {
    setSelectedPerformanceType(type);
    setShowPerformanceTypeModal(false);
    setShowPerformanceModal(true);
  };

  // Render progress bar component
  const renderProgressBar = (progress: number, color: string) => (
    <View className="h-2 bg-white/10 rounded-full overflow-hidden">
      <View 
        className="h-full rounded-full"
        style={{ width: `${progress}%`, backgroundColor: color }}
      />
    </View>
  );

  // Render performance modal
  const renderPerformanceModal = () => {
    if (!selectedStudent || !showPerformanceModal) return null;

    const data = defaultPerformanceData[selectedPerformanceType];
    const anxietyColors: Record<AnxietyLevel, AnxietyColorProps> = {
      low: {
        bg: 'bg-white/5',
        text: 'text-green-400',
        border: 'border-white/20',
        dot: 'bg-green-400',
        progress: 30,
        progressColor: '#10b981',
      },
      medium: {
        bg: 'bg-white/5',
        text: 'text-yellow-400',
        border: 'border-white/20',
        dot: 'bg-yellow-400',
        progress: 60,
        progressColor: '#f59e0b',
      },
      high: {
        bg: 'bg-white/5',
        text: 'text-red-400',
        border: 'border-white/20',
        dot: 'bg-red-400',
        progress: 90,
        progressColor: '#ef4444',
      },
    };

    const currentAnxiety = anxietyColors[data.anxietyLevel as AnxietyLevel];

    return (
      <Modal
        transparent
        visible={showPerformanceModal}
        animationType="fade"
        onRequestClose={() => setShowPerformanceModal(false)}
      >
        <View className="flex-1 bg-black/30 justify-center items-center p-3">
          <View className="w-full max-w-[400px] rounded-2xl overflow-hidden">
            <BlurView intensity={30} className="w-full" tint="dark">
              <View className="p-6 bg-[#1A1F2E] border border-white/10 rounded-2xl">
                {/* Header */}
                <View className="flex-row justify-between items-start mb-6">
                  <View className="flex-1 pr-4">
                    <Text className="text-2xl font-bold text-white mb-2">
                      {selectedStudent.name}'s Performance
                    </Text>
                    <View className="flex-row items-center">
                      <View className="px-3 py-1 rounded-full bg-white/10 border border-white/10 mr-2">
                        <Text className="text-white text-xs font-medium capitalize">
                          {selectedPerformanceType}
                        </Text>
                      </View>
                      <Text className="text-white/70 text-sm">
                        {selectedStudent.grade} • {selectedStudent.strand}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowPerformanceModal(false)}
                    className="p-2 bg-white/20 rounded-full w-10 h-10 items-center justify-center"
                    activeOpacity={0.8}
                  >
                    <Text className="text-white text-2xl">×</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  className="pr-2"
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: Dimensions.get('window').height * 0.7 }}
                >
                  {/* Module Progress */}
                  <View className="bg-white/10 border border-white/30 rounded-2xl p-4 mb-6">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1 pr-2">
                        <Text className="text-base font-semibold text-white mb-1">
                          Module Progress
                        </Text>
                        <Text className="text-white/60 text-sm">
                          Overall completion of {selectedPerformanceType} modules
                        </Text>
                      </View>
                      <View className="bg-white/10 border border-white/20 rounded-full px-2 py-1 min-w-10 items-center justify-center">
                        <Text className="text-white font-semibold text-xs">
                          {data.moduleProgress}%
                        </Text>
                      </View>
                    </View>
                    <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <View 
                        className="h-full rounded-full bg-purple-500"
                        style={{ width: `${data.moduleProgress}%` }}
                      />
                    </View>
                  </View>

                  {/* Confidence and Anxiety */}
                  <View className="flex-row justify-between mb-6 gap-4">
                    {/* Confidence Card */}
                    <View className="bg-white/10 border border-white/30 rounded-2xl p-5 flex-1">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-sm font-medium text-white/80">
                          Confidence
                        </Text>
                        <View className="w-2 h-2 rounded-full bg-green-500" />
                      </View>
                      <View className="mb-3">
                        <Text className={`text-2xl font-bold ${data.confidenceLevel >= 80 ? 'text-green-500' : 'text-red-500'}`}>
                          {data.confidenceLevel}%
                        </Text>
                      </View>
                      {renderProgressBar(data.confidenceLevel, '#10b981')}
                    </View>

                    {/* Anxiety Level Card */}
                    <View className="bg-white/10 border border-white/30 rounded-2xl p-5 flex-1">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-sm font-medium text-white/80">
                          Anxiety Level
                        </Text>
                        <View 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: currentAnxiety.progressColor }}
                        />
                      </View>
                      <View className="mb-3">
                        <Text 
                          className="text-xl font-bold"
                          style={{ color: currentAnxiety.progressColor }}
                        >
                          {data.anxietyLevel.charAt(0).toUpperCase() + data.anxietyLevel.slice(1)}
                        </Text>
                      </View>
                      {renderProgressBar(currentAnxiety.progress, currentAnxiety.progressColor)}
                    </View>
                  </View>

                  {/* Recent AI Full Results */}
                  <View className="bg-white/10 border border-white/30 rounded-2xl p-5 mb-6">
                    <View className="mb-5">
                      <Text className="text-lg font-bold text-white mb-1">
                        Recent AI Full Results
                      </Text>
                      <Text className="text-white/60 text-sm">
                        View detailed AI analysis for each module
                      </Text>
                    </View>

                    {/* Speaking Modules */}
                    <View className="mb-6">
                      <View className="flex-row items-center mb-3">
                        <Ionicons name="mic" size={16} color="#a78bfa" />
                        <Text className="text-sm font-semibold text-white/90 ml-2">
                          Speaking Modules
                        </Text>
                      </View>
                      <View className="gap-2">
                        {['Module 1', 'Module 2', 'Module 3', 'Module 4'].map((module, index) => (
                          <TouchableOpacity
                            key={`speaking-${index}`}
                            className="bg-white/5 border border-white/20 rounded-xl p-4"
                            activeOpacity={0.7}
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-1">
                                <Text className="text-white font-medium mb-1">
                                  Speaking AI Results - {module}
                                </Text>
                                <Text className="text-white/50 text-xs">
                                  Tap to view full analysis
                                </Text>
                              </View>
                              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Reading Modules */}
                    <View>
                      <View className="flex-row items-center mb-3">
                        <Ionicons name="book" size={16} color="#a78bfa" />
                        <Text className="text-sm font-semibold text-white/90 ml-2">
                          Reading Modules
                        </Text>
                      </View>
                      <View className="gap-2">
                        {['Module 1', 'Module 2', 'Module 3', 'Module 4'].map((module, index) => (
                          <TouchableOpacity
                            key={`reading-${index}`}
                            className="bg-white/5 border border-white/20 rounded-xl p-4"
                            activeOpacity={0.7}
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-1">
                                <Text className="text-white font-medium mb-1">
                                  Reading AI Results - {module}
                                </Text>
                                <Text className="text-white/50 text-xs">
                                  Tap to view full analysis
                                </Text>
                              </View>
                              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </BlurView>
          </View>
        </View>
      </Modal>
    );
  };

  // Render performance type selection modal
  const renderPerformanceTypeModal = () => (
    <Modal
      transparent
      visible={showPerformanceTypeModal}
      animationType="fade"
      onRequestClose={() => setShowPerformanceTypeModal(false)}
    >
      <View className="flex-1 bg-black/60 justify-center items-center p-4">
        <BlurView intensity={30} tint="dark" className="w-full max-w-[400px] rounded-2xl overflow-hidden">
          <View className="p-6 bg-[#1A1F2E] rounded-2xl">
            <Text className="text-2xl font-bold text-white mb-6 text-center">
              Select Performance Type
            </Text>

            <View className="gap-4 mb-6">
              {(['speaking', 'reading'] as PerformanceType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  className="p-2 bg-white/10 rounded-xl"
                  onPress={() => handlePerformanceTypeSelect(type)}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-4">
                      <Ionicons
                        name={type === 'speaking' ? 'mic-outline' : 'book-outline'}
                        size={20}
                        color="#ffffff"
                      />
                    </View>
                    <Text className="text-white text-lg font-medium capitalize">
                      {type}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              className="mt-2 p-4 bg-white/5 border border-white/10 rounded-xl items-center"
              onPress={() => setShowPerformanceTypeModal(false)}
              activeOpacity={0.8}
            >
              <Text className="text-gray-300 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </Modal>
  );

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 mt-[100px] bg-gray-800 rounded-t-2xl p-5">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-white text-xl font-semibold">
              {grade && strand ? `GRADE ${grade} - ${strand}` : 'Select a Class'}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-gray-400 text-xl font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-700 rounded-xl px-3 mb-4">
            <View className="mr-2">
              <Ionicons name="search" size={18} color="#6B7280" />
            </View>
            <TextInput
              className="flex-1 text-white h-10"
              placeholder="Search students..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Student List */}
          <ScrollView className="flex-1">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TouchableOpacity
                  key={student.id}
                  className="flex-row items-center p-3 rounded-xl bg-gray-700 mb-2.5"
                  onPress={() => handleStudentPress(student)}
                >
                  <View 
                    className="w-12 h-12 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: student.color }}
                  >
                    <Text className="text-white text-base font-semibold">
                      {student.initials}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text
                        className="text-white text-base font-semibold flex-1 mr-2"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {student.name}
                      </Text>
                      <View className="flex-row items-center">
                        <View
                          className={`w-2.5 h-2.5 rounded-full mx-1 ${
                            student.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        <Text
                          className={`text-xs font-medium ${
                            student.status === 'active' ? 'text-green-300' : 'text-gray-300'
                          }`}
                        >
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-400 text-sm">
                      Grade {student.grade} • {student.strand}
                    </Text>
                  </View>

                  <View className="ml-2">
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="rgba(255, 255, 255, 0.5)"
                    />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="items-center justify-center py-10">
                <Text className="text-gray-400 text-base text-center mb-4">
                  No students found matching your criteria
                </Text>
                <Text className="text-gray-400 text-base text-center">
                  No students found in this class
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Performance Type Selection Modal */}
        {renderPerformanceTypeModal()}

        {/* Performance Modal */}
        {renderPerformanceModal()}
      </View>
    </Modal>
  );
};

export default StudentManagementModal;