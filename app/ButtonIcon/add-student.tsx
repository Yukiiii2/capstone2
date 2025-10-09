// app/ButtonIcon/add-student.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
// keep your dynamic import pattern
const { useNavigation } = require('@react-navigation/native');
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabaseClient';

/* ──────────────────────────────────────────────────────────────────────────
   Types (close to your originals)
   ────────────────────────────────────────────────────────────────────────── */
type Student = {
  id: string;                // join_request id (NOT profile id)
  name: string;
  grade: string;
  strand: string;
  status: string;            // "pending" | "approved" | "rejected"
  progress: number;          // 0 to match dashboard parity
  satisfaction: number;      // 0 to match dashboard parity
  initials: string;
  color: string;
  statusColor: string;
};

type JoinRequestRow = {
  id: string;
  teacher_id: string;
  student_id: string;
  grade_level: string | null;
  strand: string | null;
  code_entered: string | null;
  status: string;            // pending | approved | rejected
  requested_at: string | null;
};

type ProfileRow = {
  id: string;
  name: string | null;
  // NOTE: no email column in your `profiles` table
};

/* ──────────────────────────────────────────────────────────────────────────
   Helpers / UI bits (unchanged visuals)
   ────────────────────────────────────────────────────────────────────────── */
const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient colors={['#0F172A', '#1E293B', '#0F172A']} className="flex-1" start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
  </View>
);

// Student Card Component
const StudentCard = ({ 
  student, 
  onApprove, 
  onDecline 
}: { 
  student: Student; 
  onApprove: (id: string) => void; 
  onDecline: (id: string) => void; 
}) => {
  // No background or border for grade level
  return (
    <View className="bg-white/5 backdrop-blur-xl rounded-xl p-4 mb-3 border border-white/10 shadow-sm">
      <View className="flex-row items-center justify-between">
        {/* Profile Section */}
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 rounded-full flex items-center justify-center mr-3 bg-white/10 border border-white/20">
            <Text className="text-white font-bold text-base">{student.initials}</Text>
          </View>
          
          <View className="flex-1">
            <Text className="text-white font-medium text-sm mb-1">{student.name}</Text>
            <View className="flex-row items-center">
              <View className="bg-white/10 px-2 py-1 rounded-sm mr-2">
                <Text className="text-white text-xs font-medium">Grade {student.grade}</Text>
              </View>
              <View className="bg-white/10 px-2 py-1 rounded-sm">
                <Text className="text-white text-xs font-medium">{student.strand}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   Main screen
   ────────────────────────────────────────────────────────────────────────── */
export default function StudentApprovalScreen() {
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

  const handleApprove = (id: string) => {
    setStudents(students.map(student => 
      student.id === id ? { ...student, status: "approved" } : student
    ));
  };

  const handleDecline = (id: string) => {
    setStudents(students.map(student => 
      student.id === id ? { ...student, status: "declined" } : student
    ));
  };

  const navigation = useNavigation();
  const pendingStudents = students.filter(student => student.status === "pending");

  /* render */
  return (
    <View className="flex-1 bg-[#0F172A]">
      <BackgroundDecor />
      
      <ScrollView 
        className="flex-1 z-10 bottom-3 p-5" 
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingBottom: 5 // Add extra padding at the bottom
        }}
      >
        {/* Header with Back Button and Title */}
        <View className="mb-2">
          <View className="flex-row items-center top-6 mb-6">
            <TouchableOpacity 
              className="p-1 left-1.5 -ml-2 mr-3"
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={30} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-semibold">Approval for the Class</Text>
          </View>
        </View>

        {/* Description */}
        <Text className="text-white top text-xs mb-5">
          Approve students to monitor their progress and performance
        </Text>

        {/* Stats Card */}
        <View className="bg-white/5 backdrop-blur-xl rounded-xl p-4 mb-5 border border-white/10">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-white font-medium text-sm mb-1">Pending Approvals</Text>
              <Text className="text-gray-400 text-xs">
                {pendingStudents.length} students awaiting confirmation
              </Text>
            </View>
            <View className="px-3 py-2 rounded-lg">
              <Text className="text-white font-semibold text-2xl">{pendingStudents.length}</Text>
            </View>
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
