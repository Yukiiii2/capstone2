import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  PanResponder,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

interface Student {
  id: string;
  name: string;
  grade: string;
  strand: string;
  status: "active" | "inactive";
  progress: number;
  satisfaction: number;
  confidence?: number;
  anxiety?: number;
  initials: string;
  color: string;
  statusColor: string;
}

interface ActiveStudentModalProps {
  visible: boolean;
  onClose: () => void;
  students: Student[];
}

const ActiveStudentModal: React.FC<ActiveStudentModalProps> = ({
  visible,
  onClose,
  students,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  
  const filteredStudents = students.filter(student => 
    activeTab === 'active' 
      ? student.status === 'active' 
      : student.status === 'inactive'
  );
  
  const slideAnim = useRef(new Animated.Value(height)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const lastGestureDy = useRef(0);

  const resetPosition = useCallback(() => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  }, [pan]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 3);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          pan.setValue({ x: 0, y: gestureState.dy });
        }
        lastGestureDy.current = gestureState.dy;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          onClose();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      pan.setValue({ x: 0, y: 0 });
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, pan, slideAnim]);

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1">
          <View className="absolute inset-0 bg-black/50" />
          <Animated.View
            {...panResponder.panHandlers}
            className="absolute bottom-0 left-0 right-0 bg-[#1A1F2E] rounded-t-3xl p-6"
            style={[
              {
                height: height * 0.85,
                transform: [
                  { translateY: Animated.add(slideAnim, pan.y) },
                ],
              },
            ]}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-2xl font-bold">
                {activeTab === 'active' ? 'Active' : 'Inactive'} Students ({filteredStudents.length})
              </Text>
              <TouchableOpacity onPress={onClose} className="p-2">
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Tab Selector */}
            <View className="flex-row border-b border-white/10 mb-4 px-4">
              <TouchableOpacity
                className={`flex-1 py-3 items-center ${activeTab === 'active' ? 'border-b-2 border-indigo-400' : ''}`}
                onPress={() => setActiveTab('active')}
              >
                <Text className={`font-medium text-base ${activeTab === 'active' ? 'text-white' : 'text-gray-400'}`}>
                  Active
                </Text>
                {activeTab === 'active' && <View className="absolute bottom-0 h-0.5 w-full bg-indigo-400" />}
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 items-center ${activeTab === 'inactive' ? 'border-b-2 border-indigo-400' : ''}`}
                onPress={() => setActiveTab('inactive')}
              >
                <Text className={`font-medium text-base ${activeTab === 'inactive' ? 'text-white' : 'text-gray-400'}`}>
                  Inactive
                </Text>
                {activeTab === 'inactive' && <View className="absolute bottom-0 h-0.5 w-full bg-indigo-400" />}
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <StudentCard 
                    key={student.id} 
                    student={student} 
                    isInactive={student.status === 'inactive'} 
                  />
                ))
              ) : (
                <View className="items-center justify-center py-10">
                  <Ionicons 
                    name="people-outline" 
                    size={48} 
                    color="#6B7280" 
                    className="opacity-50 mb-3"
                  />
                  <Text className="text-gray-400 text-base text-center">
                    No {activeTab} students found
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={onClose}
              className="bg-purple-600 py-3 rounded-xl mt-4"
            >
              <Text className="text-white font-medium text-center">Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Student Card Component
interface StudentCardProps {
  student: Student;
  isInactive?: boolean;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, isInactive = false }) => (
  <View className={`p-4 mb-3 rounded-xl border ${
    isInactive 
      ? 'bg-white/5 border-white/20 opacity-70' 
      : 'bg-white/10 border-white/50'
  }`}>
    <View className="flex-row items-center mb-3">
      <View className={`w-10 h-10 rounded-full bg-white/10 border border-white/30 items-center justify-center mr-3 ${
        isInactive ? 'opacity-70' : ''
      }`}>
        <Text className={`text-white font-bold ${isInactive ? 'opacity-70' : ''}`}>
          {student.initials}
        </Text>
      </View>
      <View>
        <Text className={`font-bold text-base ${isInactive ? 'text-white/60' : 'text-white'}`}>
          {student.name}
        </Text>
        <Text className={`text-xs ${isInactive ? 'text-white/60' : 'text-white opacity-80'}`}>
          Grade {student.grade} - {student.strand}
        </Text>
      </View>
    </View>

    <View className="mt-2">
      <View className="mb-2">
        <View className="flex-row justify-between mb-1">
          <Text className={`text-xs ${isInactive ? 'text-white/60' : 'text-white opacity-80'}`}>
            Progress
          </Text>
          <Text className={`text-xs font-medium ${isInactive ? 'text-white/60' : 'text-white'}`}>
            {student.progress}%
          </Text>
        </View>
        <View className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${student.progress}%`,
              backgroundColor: isInactive ? '#6b7280' : '#a78bfa',
              opacity: isInactive ? 0.6 : 1,
            }}
          />
        </View>
      </View>
    </View>
  </View>
);

export default ActiveStudentModal;