import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
  PanResponder,
  TouchableWithoutFeedback,
} from "react-native";

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

interface TotalStudentModalProps {
  visible: boolean;
  onClose: () => void;
  students: Student[];
  onRemoveStudent?: (studentId: string) => void;
}

const TotalStudentModal: React.FC<TotalStudentModalProps> = ({
  visible,
  onClose,
  students,
  onRemoveStudent,
}) => {
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedStrand, setSelectedStrand] = useState<string | null>(null);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showStrandDropdown, setShowStrandDropdown] = useState(false);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesGrade = !selectedGrade || student.grade === selectedGrade;
      const matchesStrand = !selectedStrand || student.strand === selectedStrand;
      return matchesGrade && matchesStrand;
    });
  }, [students, selectedGrade, selectedStrand]);

  const clearFilters = useCallback(() => {
    setSelectedGrade(null);
    setSelectedStrand(null);
  }, []);

  const renderDropdownItem = (
    value: string,
    selectedValue: string | null,
    onSelect: (value: string | null) => void,
    onClose: () => void
  ) => {
    const isSelected = value === selectedValue;
    return (
      <TouchableOpacity
        key={value}
        className={`p-3 flex-row justify-between items-center ${isSelected ? 'bg-white/20' : ''}`}
        onPress={() => {
          onSelect(isSelected ? null : value);
          onClose();
        }}
      >
        <Text className={`text-white text-sm ${isSelected ? 'font-medium' : ''}`}>
          {value.startsWith('Grade') ? value : value}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={16} color="#ffffff" />
        )}
      </TouchableOpacity>
    );
  };

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
      setSelectedGrade(null);
      setSelectedStrand(null);
      setShowGradeDropdown(false);
      setShowStrandDropdown(false);
    }
  }, [visible, pan, slideAnim]);

  const handleRemoveStudent = (student: Student) => {
    setStudentToRemove(student);
  };

  const confirmRemoveStudent = () => {
    if (studentToRemove && onRemoveStudent) {
      onRemoveStudent(studentToRemove.id);
    }
    setStudentToRemove(null);
  };

  const cancelRemoveStudent = () => {
    setStudentToRemove(null);
  };

  return (
    <>
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
                  All Students ({filteredStudents.length})
                </Text>
                <TouchableOpacity onPress={onClose} className="p-2">
                  <Text className="text-white text-lg">✕</Text>
                </TouchableOpacity>
              </View>

              {/* Filter Controls */}
              <View className="mb-4">
                <View className="flex-row justify-between mb-2.5">
                  {/* Grade Filter */}
                  <View className="flex-1 mx-1.5 relative">
                    <TouchableOpacity
                      className={`flex-row items-center justify-between bg-white/5 rounded-xl py-2.5 px-4 border ${
                        selectedGrade ? 'bg-white/10 border-white/30' : 'border-white/20'
                      }`}
                      onPress={() => {
                        setShowGradeDropdown(!showGradeDropdown);
                        setShowStrandDropdown(false);
                      }}
                    >
                      <Text className={`text-sm ${
                        selectedGrade ? 'text-white font-medium' : 'text-white/70'
                      }`}>
                        {selectedGrade ? `Grade ${selectedGrade}` : "Select Grade"}
                      </Text>
                      <Text className="text-white/50 text-xs ml-2">
                        {showGradeDropdown ? "▲" : "▼"}
                      </Text>
                    </TouchableOpacity>
                    {showGradeDropdown && (
                      <View className="absolute top-full left-0 right-0 bg-[#2A3142] rounded-xl border border-white/10 mt-1.5 z-50 shadow-lg shadow-black/25">
                        {["11", "12"].map((grade) => (
                          <View key={`grade-${grade}`}>
                            {renderDropdownItem(
                              `Grade ${grade}`,
                              selectedGrade,
                              (value) => setSelectedGrade(value?.replace('Grade ', '') || null),
                              () => setShowGradeDropdown(false)
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Strand Filter */}
                  <View className="flex-1 mx-1.5 relative">
                    <TouchableOpacity
                      className={`flex-row items-center justify-between bg-white/5 rounded-xl py-2.5 px-4 border ${
                        selectedStrand ? 'bg-white/10 border-white/30' : 'border-white/20'
                      }`}
                      onPress={() => {
                        setShowStrandDropdown(!showStrandDropdown);
                        setShowGradeDropdown(false);
                      }}
                    >
                      <Text className={`text-sm ${
                        selectedStrand ? 'text-white font-medium' : 'text-white/70'
                      }`}>
                        {selectedStrand || "Select Strand"}
                      </Text>
                      <Text className="text-white/50 text-xs ml-2">
                        {showStrandDropdown ? "▲" : "▼"}
                      </Text>
                    </TouchableOpacity>
                    {showStrandDropdown && (
                      <View className="absolute top-full left-0 right-0 bg-[#2A3142] rounded-xl border border-white/10 mt-1.5 z-50 shadow-lg shadow-black/25">
                        {["STEM", "HUMSS", "ABM", "GAS", "TVL"].map((strand) => (
                          <View key={`strand-${strand}`}>
                            {renderDropdownItem(
                              strand,
                              selectedStrand,
                              setSelectedStrand,
                              () => setShowStrandDropdown(false)
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Clear Filters Button */}
                {(selectedGrade || selectedStrand) && (
                  <TouchableOpacity
                    className="bg-purple-500 rounded-xl py-2.5 items-center mt-2.5"
                    onPress={clearFilters}
                  >
                    <Text className="text-white font-medium text-sm">
                      Clear All Filters
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView className="flex-1">
                {filteredStudents.map((student) => (
                  <View
                    key={student.id}
                    className="p-4 mb-3 bg-white/10 rounded-xl border border-white/20"
                  >
                    <View className="flex-row items-center mb-3">
                      <View className="w-10 h-10 rounded-full bg-white/10 border border-white/30 items-center justify-center mr-3">
                        <Text className="text-white font-bold">
                          {student.initials}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-white font-bold text-base">{student.name}</Text>
                        <Text className="text-white text-xs opacity-80">
                          Grade {student.grade} - {student.strand}
                        </Text>
                      </View>
                    </View>

                    <View className="absolute top-4 right-4">
                      <TouchableOpacity 
                        onPress={() => handleRemoveStudent(student)}
                        className="flex-row items-center justify-center py-2 px-4 rounded-lg bg-white/5 border border-white/10 min-w-[100px]"
                      >
                        <Text className="text-white/90 text-sm font-medium">Remove</Text>
                        <Ionicons 
                          name="trash-outline" 
                          size={16} 
                          color="#FFFFFF" 
                          className="ml-1"
                        />
                      </TouchableOpacity>
                    </View>

                    <View className="mt-2">
                      <View className="mb-2">
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-white text-xs opacity-80">
                            Confidence Level
                          </Text>
                          <Text className="text-white text-xs font-medium">
                            {student.confidence ?? Math.floor(Math.random() * 30) + 70}%
                          </Text>
                        </View>
                        <View className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${student.confidence ?? Math.floor(Math.random() * 30) + 70}%`,
                              backgroundColor: '#a78bfa',
                            }}
                          />
                        </View>
                      </View>

                      <View>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-white text-xs opacity-80">Anxiety Level</Text>
                          <Text className="text-white text-xs font-medium">
                            {student.anxiety ?? Math.floor(Math.random() * 30) + 10}%
                          </Text>
                        </View>
                        <View className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${student.anxiety ?? Math.floor(Math.random() * 30) + 10}%`,
                              backgroundColor: '#a78bfa',
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
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

      {/* Confirmation Dialog */}
      <Modal
        transparent
        visible={!!studentToRemove}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={cancelRemoveStudent}
      >
        <View className="flex-1 bg-black/60 justify-center items-center p-6">
          <View className="bg-[#1A1F2E]/95 rounded-2xl w-full max-w-[380px] border border-white/10 shadow-xl shadow-black/30 overflow-hidden">
            <View className="p-6 pb-5">
              <Text className="text-white text-xl font-bold mb-3 text-center tracking-wide">
                Remove Student
              </Text>
              <Text className="text-white/80 text-base leading-6 text-center mt-2">
                Are you sure you want to remove <Text className="text-white font-semibold">{studentToRemove?.name}</Text> from your class? This action cannot be undone.
              </Text>
            </View>
            
            <View className="flex-row border-t border-white/5 p-5 bg-black/20 justify-between items-center gap-6">
              <TouchableOpacity 
                className="flex-1 max-w-[140px] py-3 rounded-lg bg-white/5 border border-white/10 items-center justify-center"
                onPress={cancelRemoveStudent}
                activeOpacity={0.8}
              >
                <Text className="text-white/95 font-semibold text-base tracking-wide">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 max-w-[140px] py-3 rounded-lg bg-red-500/20 border border-red-500/30 items-center justify-center"
                onPress={confirmRemoveStudent}
                activeOpacity={0.8}
              >
                <Text className="text-red-400 font-semibold text-base tracking-wide">Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default TotalStudentModal;