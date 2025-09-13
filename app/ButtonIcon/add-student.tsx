import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
// Using dynamic import to handle ES module compatibility
const { useNavigation } = require('@react-navigation/native');
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Student type definition
type Student = {
  id: string;
  name: string;
  grade: string;
  strand: string;
  status: string;
  progress: number;
  satisfaction: number;
  initials: string;
  color: string;
  statusColor: string;
};

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
    <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
  </View>
);

// Student Card Component
// Helper function to get strand color
const getStrandColor = (strand: string) => {
  switch(strand) {
    case 'ABM': return 'bg-yellow-500/20 border-yellow-500/30';
    case 'STEM': return 'bg-green-500/20 border-green-500/30';
    case 'HUMSS': return 'bg-red-500/20 border-red-500/30';
    case 'TVL': return 'bg-blue-500/20 border-blue-500/30';
    case 'GAS': return 'bg-orange-500/20 border-orange-500/30';
    default: return 'bg-white/10 border-white/20';
  }
};

const StudentCard = ({ 
  student, 
  onSelect, 
  isSelected = false
}: { 
  student: Student; 
  onSelect: (id: string) => void;
  isSelected: boolean;
}) => {
  // No background or border for grade level
  return (
    <TouchableOpacity 
      onPress={() => onSelect(student.id)}
      activeOpacity={0.8}
      className={`bg-white/5 backdrop-blur-xl rounded-xl p-4 mb-3 border ${isSelected ? 'border-purple-400' : 'border-white/10'} shadow-sm`}
    >
      <View className="flex-row items-center">
        {/* Selection Checkbox */}
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            onSelect(student.id);
          }}
          className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/40'} items-center justify-center mr-3`}
        >
          {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
        </TouchableOpacity>
        
        {/* Profile Section */}
        <View className="flex-row items-center flex-1">
          <View 
            className="w-12 h-12 rounded-full flex items-center justify-center mr-3 bg-white/10 border border-white/20"
          >
            <Text className="text-white font-bold text-base">{student.initials}</Text>
          </View>
          
          <View className="flex-1 flex-row items-center">
            <Text className="text-white font-medium text-base flex-1">{student.name}</Text>
            <View className="items-end space-y-1">
              <Text className="text-white text-sm font-medium mb-0.5">Grade {student.grade}</Text>
              <View className={`${getStrandColor(student.strand)} px-2.5 py-0.5 rounded-md border`}>
                <Text className="text-white text-xs font-medium">{student.strand}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Main Component
export default function StudentApprovalScreen() {
  const navigation = useNavigation();
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [students, setStudents] = useState<Student[]>([
    {
      id: "1",
      name: "Juan Dela Cruz",
      grade: "11",
      strand: "ABM",
      status: "pending",
      progress: 85,
      satisfaction: 4,
      initials: "JC",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "2",
      name: "Maria Santos",
      grade: "11",
      strand: "STEM",
      status: "pending",
      progress: 92,
      satisfaction: 5,
      initials: "MS",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "3",
      name: "Jose Reyes",
      grade: "12",
      strand: "HUMSS",
      status: "pending",
      progress: 78,
      satisfaction: 3,
      initials: "JR",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "4",
      name: "Ana Mercado",
      grade: "11",
      strand: "GAS",
      status: "pending",
      progress: 88,
      satisfaction: 4,
      initials: "AM",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "5",
      name: "Pedro Bautista",
      grade: "12",
      strand: "TVL",
      status: "pending",
      progress: 91,
      satisfaction: 5,
      initials: "PB",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "6",
      name: "Miguel Lopez",
      grade: "11",
      strand: "ABM",
      status: "pending",
      progress: 95,
      satisfaction: 5,
      initials: "ML",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "7",
      name: "Sofia Reyes",
      grade: "12",
      strand: "STEM",
      status: "pending",
      progress: 89,
      satisfaction: 4,
      initials: "SR",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "8",
      name: "Gabriel Cruz",
      grade: "11",
      strand: "HUMSS",
      status: "pending",
      progress: 93,
      satisfaction: 5,
      initials: "GC",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "9",
      name: "Isabella Santos",
      grade: "12",
      strand: "GAS",
      status: "pending",
      progress: 79,
      satisfaction: 3,
      initials: "IS",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "10",
      name: "Luis Mendoza",
      grade: "11",
      strand: "TVL",
      status: "pending",
      progress: 87,
      satisfaction: 4,
      initials: "LM",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "11",
      name: "Andres Garcia",
      grade: "12",
      strand: "ABM",
      status: "pending",
      progress: 84,
      satisfaction: 4,
      initials: "AG",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "12",
      name: "Camila Reyes",
      grade: "11",
      strand: "STEM",
      status: "pending",
      progress: 76,
      satisfaction: 3,
      initials: "CR",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "13",
      name: "Diego Santos",
      grade: "12",
      strand: "HUMSS",
      status: "pending",
      progress: 88,
      satisfaction: 4,
      initials: "DS",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "14",
      name: "Valeria Cruz",
      grade: "11",
      strand: "GAS",
      status: "pending",
      progress: 92,
      satisfaction: 5,
      initials: "VC",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "15",
      name: "Santiago Lopez",
      grade: "12",
      strand: "TVL",
      status: "pending",
      progress: 85,
      satisfaction: 4,
      initials: "SL",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "16",
      name: "Mateo Santos",
      grade: "11",
      strand: "ABM",
      status: "pending",
      progress: 89,
      satisfaction: 4,
      initials: "MS",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "17",
      name: "Renata Garcia",
      grade: "12",
      strand: "STEM",
      status: "pending",
      progress: 93,
      satisfaction: 5,
      initials: "RG",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "18",
      name: "Lucas Reyes",
      grade: "11",
      strand: "HUMSS",
      status: "pending",
      progress: 77,
      satisfaction: 3,
      initials: "LR",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "19",
      name: "Ximena Lopez",
      grade: "12",
      strand: "GAS",
      status: "pending",
      progress: 86,
      satisfaction: 4,
      initials: "XL",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
    {
      id: "20",
      name: "Emiliano Cruz",
      grade: "11",
      strand: "TVL",
      status: "pending",
      progress: 90,
      satisfaction: 5,
      initials: "EC",
      color: "#4F46E5",
      statusColor: "text-yellow-600",
    },
  ]);

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(studentId)) {
        newSelection.delete(studentId);
      } else {
        newSelection.add(studentId);
      }
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const handleApproveSelected = () => {
    // In a real app, you would make an API call here to approve the selected students
    console.log('Approving students:', Array.from(selectedStudents));
    
    // Remove approved students from the students list
    setStudents(prevStudents => 
      prevStudents.map(student => ({
        ...student,
        status: selectedStudents.has(student.id) ? 'approved' : student.status
      }))
    );
    
    // Clear selection after approval
    setSelectedStudents(new Set());
  };

  const handleApprove = (id: string) => {
    // Handle single student approval
    console.log('Approving student:', id);
    // Update your state or API call here
  };

  const handleDecline = (id: string) => {
    // Handle single student decline
    console.log('Declining student:', id);
    // Update your state or API call here
  };

  const pendingStudents = students.filter(student => student.status === "pending");
  console.log('Pending students:', pendingStudents);
  console.log('All students:', students);

  return (
    <View className="flex-1 bg-[#0F172A]">
      <BackgroundDecor />
      
      {/* Header */}
      <View className="pt-10 pb-4 px-6">
        <View className="flex-row items-center justify-between mb-1">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#E2E8F0" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Add Students</Text>
          <View className="w-8" />
        </View>
        <Text className="text-white/60 text-sm mb-3 text-center">
          {pendingStudents.length} pending student{pendingStudents.length !== 1 ? 's' : ''}
        </Text>

        {/* Selection Actions */}
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity 
            onPress={toggleSelectAll}
            className="flex-row items-center"
          >
            <View className={`w-5 h-5 rounded border-2 ${selectedStudents.size === students.length && students.length > 0 ? 'bg-purple-500 border-purple-500' : 'border-white/40'} items-center justify-center mr-2`}>
              {selectedStudents.size === students.length && students.length > 0 && (
                <Ionicons name="checkmark" size={14} color="white" />
              )}
            </View>
            <Text className="text-white/80 text-sm">Select All</Text>
          </TouchableOpacity>
          
          {selectedStudents.size > 0 && (
            <TouchableOpacity 
              onPress={handleApproveSelected}
              className="bg-purple-600 px-4 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="person-add" size={16} color="white" />
              <Text className="text-white font-medium ml-2">
                Add Selected ({selectedStudents.size})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Student List */}
      <ScrollView 
        className="flex-1 px-4" 
        testID="student-list"
        indicatorStyle="black"
      >
        {pendingStudents.length === 0 ? (
          <View className="bg-white/5 rounded-lg p-4 my-4 items-center justify-center">
            <Ionicons name="people-outline" size={32} color="#64748B" />
            <Text className="text-white/60 text-center mt-2">No pending students to display</Text>
          </View>
        ) : (
          pendingStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              isSelected={selectedStudents.has(student.id)}
              onSelect={toggleStudentSelection}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}