import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Modal,
  Animated,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import NavigationBar from '@/components/NavigationBar/nav-bar-teacher';
import StudentManagementModal from "@/components/TeacherModal/StudentManagementModal";
import TotalStudentModal from "@/components/TeacherModal/TotalStudentModal";
import ActiveStudentModal from "@/components/TeacherModal/ActiveStudentModal";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ProfileMenuTeacher from "@/components/ProfileModal/ProfileMenuTeacher";

const { width, height } = Dimensions.get("window");
const cardWidth = (width - 40) / 2 - 10;

type StudentStatus = "active" | "inactive";

interface Student {
  id: string;
  name: string;
  grade: string;
  strand: string;
  status: StudentStatus;
  progress: number;
  satisfaction: number;
  confidence?: number;
  anxiety?: number;
  initials: string;
  color: string;
  statusColor: string;
}

interface Stats {
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  averageSatisfaction: number;
  averageConfidence: number;
}

type DashboardStudent = Student;

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  progress?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onPress?: () => void;
}

const MetricCard = ({
  title,
  value,
  icon,
  color,
  progress,
  trend,
  onPress,
}: MetricCardProps) => {
  return (
    <View
      className="p-4 mb-4 rounded-2xl overflow-hidden"
      style={{
        width: (width - 40) / 2 - 10,
        backgroundColor: "rgba(155, 146, 146, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      }}
    >
      <View className="flex-row items-start justify-between mb-3 relative">
        <View className="rounded-xl">{icon}</View>
        {trend && (
          <View
            className={`flex-row items-center px-2 py-1 rounded-full`}
            style={{
              backgroundColor: trend.isPositive
                ? "rgba(16, 185, 129, 0.2)"
                : "rgba(239, 68, 68, 0.2)",
            }}
          >
            <Text
              className={`text-xs font-medium ${trend.isPositive ? "text-green-400" : "text-red-400"}`}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}%
            </Text>
          </View>
        )}
      </View>

      <Text className="text-gray-100 text-sm font-medium mb-1">{title}</Text>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-2xl font-bold text-white">{value}</Text>
        {onPress && (
          <TouchableOpacity
            onPress={onPress}
            className="px-2 py-1 rounded-xl"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <Text className="text-white text-xs">View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {progress !== undefined && (
        <View className="w-full">
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-gray-200">Progress</Text>
            <Text className="text-xs font-medium text-white">{progress}%</Text>
          </View>
          <View className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: "#8b5cf6", // violet-500
                // Shadow for iOS
                shadowColor: '#8b5cf6',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
                // Shadow for Android
                elevation: 5,
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const StudentCard = ({ student, rank }: { student: Student, rank?: number }) => {
  const confidence = student.confidence ?? Math.floor(Math.random() * 30) + 70;
  const anxiety = student.anxiety ?? Math.floor(Math.random() * 30) + 10;
  const progress = student.progress ?? 0;

  // Determine border color based on rank
  let borderColor = 'transparent';
  if (rank === 1) borderColor = '#FFD700'; // Gold for 1st
  else if (rank === 2) borderColor = '#C0C0C0'; // Silver for 2nd
  else if (rank === 3) borderColor = '#CD7F32'; // Bronze for 3rd
  else if (rank === 4 || rank === 5) borderColor = '#8b5cf6'; // Violet for 4th and 5th

  const ProgressBar = ({
    value,
    label,
  }: {
    value: number;
    label: string;
  }) => (
    <View className="mb-1">
      <View className="flex-row justify-between mb-0.5">
        <Text className="text-xs text-white">{label}</Text>
        <Text className="text-xs font-medium text-white">
          {value}%
        </Text>
      </View>
      <View className="h-1.5 bg-violet-500/20 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            backgroundColor: '#8b5cf6', // violet-500
          }}
        />
      </View>
    </View>
  );

  return (
    <View className="relative">
      <View className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl p-4 my-1.5"
        style={{ 
          borderTopWidth: 3, 
          borderTopColor: borderColor,
          marginRight: 0,
          position: 'relative',
          overflow: 'visible'
        }}
      >
        {rank && rank <= 5 && (
          <View className={`absolute -top-3 -right-2 w-7 h-7 rounded-full items-center justify-center z-10 ${
            rank === 1 ? 'bg-amber-400' : 
            rank === 2 ? 'bg-gray-300' : 
            rank === 3 ? 'bg-amber-700' :
            'bg-violet-500'
          }`}>
            <Ionicons 
              name={rank === 1 ? 'trophy' : rank === 2 ? 'medal' : 'ribbon'} 
              size={16} 
              color="#FFFFFF" 
            />
          </View>
        )}
        <View className="mb-3">
          <View className="flex-row flex-wrap items-baseline">
            <Text className="font-bold text-white text-base mr-2">
              {student.name}
            </Text>
            {rank && rank <= 3 && (
              <Text className="text-white text-xs">
                • Top {rank === 1 ? '1' : rank}
              </Text>
            )}
          </View>
          <Text className="text-white/70 text-xs mt-1">
            {student.strand} • Grade {student.grade}
          </Text>
        </View>

        <View className="space-y-2">
          <ProgressBar
            value={confidence}
            label="Confidence Level"
          />
          <ProgressBar value={anxiety} label="Anxiety Level" />
        </View>
      </View>
    </View>
  );
};



// Complete student data from your original code
const allStudents: Student[] = [
  // Grade 11 - 25 students (5 per strand)
  // ABM - 5 students
  {
    id: "1",
    name: "Juan Dela Cruz",
    grade: "11",
    strand: "ABM",
    status: "active",
    progress: 85,
    satisfaction: 4,
    initials: "JC",
    color: "#FF6B6B",
    statusColor: "text-green-600",
  },
  {
    id: "2",
    name: "Maria Santos",
    grade: "11",
    strand: "ABM",
    status: "active",
    progress: 92,
    satisfaction: 5,
    initials: "MS",
    color: "#4ECDC4",
    statusColor: "text-green-600",
  },
  {
    id: "3",
    name: "Jose Reyes",
    grade: "11",
    strand: "ABM",
    status: "inactive",
    progress: 78,
    satisfaction: 3,
    initials: "JR",
    color: "#45B7D1",
    statusColor: "text-gray-500",
  },
  {
    id: "4",
    name: "Ana Mercado",
    grade: "11",
    strand: "ABM",
    status: "active",
    progress: 88,
    satisfaction: 4,
    initials: "AM",
    color: "#96CEB4",
    statusColor: "text-green-600",
  },
  {
    id: "5",
    name: "Pedro Bautista",
    grade: "11",
    strand: "ABM",
    status: "active",
    progress: 91,
    satisfaction: 5,
    initials: "PB",
    color: "#FFEEAD",
    statusColor: "text-green-600",
  },

  // STEM - 5 students
  {
    id: "6",
    name: "Miguel Lopez",
    grade: "11",
    strand: "STEM",
    status: "active",
    progress: 95,
    satisfaction: 5,
    initials: "ML",
    color: "#4ECDC4",
    statusColor: "text-green-600",
  },
  {
    id: "7",
    name: "Sofia Reyes",
    grade: "11",
    strand: "STEM",
    status: "active",
    progress: 89,
    satisfaction: 4,
    initials: "SR",
    color: "#45B7D1",
    statusColor: "text-green-600",
  },
  {
    id: "8",
    name: "Gabriel Cruz",
    grade: "11",
    strand: "STEM",
    status: "active",
    progress: 93,
    satisfaction: 5,
    initials: "GC",
    color: "#96CEB4",
    statusColor: "text-green-600",
  },
  {
    id: "9",
    name: "Isabella Santos",
    grade: "11",
    strand: "STEM",
    status: "inactive",
    progress: 79,
    satisfaction: 3,
    initials: "IS",
    color: "#FFEEAD",
    statusColor: "text-gray-500",
  },
  {
    id: "10",
    name: "Luis Mendoza",
    grade: "11",
    strand: "STEM",
    status: "active",
    progress: 87,
    satisfaction: 4,
    initials: "LM",
    color: "#FF6B6B",
    statusColor: "text-green-600",
  },

  // HUMSS - 5 students
  {
    id: "11",
    name: "Andres Garcia",
    grade: "11",
    strand: "HUMSS",
    status: "active",
    progress: 84,
    satisfaction: 4,
    initials: "AG",
    color: "#45B7D1",
    statusColor: "text-green-600",
  },
  {
    id: "12",
    name: "Camila Reyes",
    grade: "11",
    strand: "HUMSS",
    status: "inactive",
    progress: 76,
    satisfaction: 3,
    initials: "CR",
    color: "#96CEB4",
    statusColor: "text-gray-500",
  },
  {
    id: "13",
    name: "Diego Santos",
    grade: "11",
    strand: "HUMSS",
    status: "active",
    progress: 88,
    satisfaction: 4,
    initials: "DS",
    color: "#FFEEAD",
    statusColor: "text-green-600",
  },
  {
    id: "14",
    name: "Valeria Cruz",
    grade: "11",
    strand: "HUMSS",
    status: "active",
    progress: 92,
    satisfaction: 5,
    initials: "VC",
    color: "#FF6B6B",
    statusColor: "text-green-600",
  },
  {
    id: "15",
    name: "Santiago Lopez",
    grade: "11",
    strand: "HUMSS",
    status: "active",
    progress: 85,
    satisfaction: 4,
    initials: "SL",
    color: "#4ECDC4",
    statusColor: "text-green-600",
  },

  // GAS - 5 students
  {
    id: "16",
    name: "Mateo Santos",
    grade: "11",
    strand: "GAS",
    status: "active",
    progress: 89,
    satisfaction: 4,
    initials: "MS",
    color: "#96CEB4",
    statusColor: "text-green-600",
  },
  {
    id: "17",
    name: "Renata Garcia",
    grade: "11",
    strand: "GAS",
    status: "active",
    progress: 93,
    satisfaction: 5,
    initials: "RG",
    color: "#FFEEAD",
    statusColor: "text-green-600",
  },
  {
    id: "18",
    name: "Lucas Reyes",
    grade: "11",
    strand: "GAS",
    status: "inactive",
    progress: 77,
    satisfaction: 3,
    initials: "LR",
    color: "#FF6B6B",
    statusColor: "text-gray-500",
  },
  {
    id: "19",
    name: "Ximena Lopez",
    grade: "11",
    strand: "GAS",
    status: "active",
    progress: 86,
    satisfaction: 4,
    initials: "XL",
    color: "#4ECDC4",
    statusColor: "text-green-600",
  },
  {
    id: "20",
    name: "Emiliano Cruz",
    grade: "11",
    strand: "GAS",
    status: "active",
    progress: 90,
    satisfaction: 5,
    initials: "EC",
    color: "#45B7D1",
    statusColor: "text-green-600",
  },

  // TVL - 5 students
  {
    id: "21",
    name: "Sebastian Reyes",
    grade: "11",
    strand: "TVL",
    status: "inactive",
    progress: 75,
    satisfaction: 3,
    initials: "SR",
    color: "#FFEEAD",
    statusColor: "text-gray-500",
  },
  {
    id: "22",
    name: "Valentina Garcia",
    grade: "11",
    strand: "TVL",
    status: "active",
    progress: 88,
    satisfaction: 4,
    initials: "VG",
    color: "#FF6B6B",
    statusColor: "text-green-600",
  },
  {
    id: "23",
    name: "Daniel Lopez",
    grade: "11",
    strand: "TVL",
    status: "active",
    progress: 91,
    satisfaction: 5,
    initials: "DL",
    color: "#4ECDC4",
    statusColor: "text-green-600",
  },
  {
    id: "24",
    name: "Sofia Cruz",
    grade: "11",
    strand: "TVL",
    status: "active",
    progress: 85,
    satisfaction: 4,
    initials: "SC",
    color: "#45B7D1",
    statusColor: "text-green-600",
  },
  {
    id: "25",
    name: "Matias Santos",
    grade: "11",
    strand: "TVL",
    status: "inactive",
    progress: 80,
    satisfaction: 3,
    initials: "MS",
    color: "#96CEB4",
    statusColor: "text-gray-500",
  },

  // Grade 12 - 25 students (5 per strand)
  // ABM - 5 students
  {
    id: "26",
    name: "Santiago Garcia",
    grade: "12",
    strand: "ABM",
    status: "active",
    progress: 90,
    satisfaction: 5,
    initials: "SG",
    color: "#FF6B6B",
    statusColor: "text-green-600",
  },
  {
    id: "27",
    name: "Valeria Lopez",
    grade: "12",
    strand: "ABM",
    status: "active",
    progress: 85,
    satisfaction: 4,
    initials: "VL",
    color: "#4ECDC4",
    statusColor: "text-green-600",
  },
  {
    id: "28",
    name: "Nicolas Cruz",
    grade: "12",
    strand: "ABM",
    status: "inactive",
    progress: 82,
    satisfaction: 3,
    initials: "NC",
    color: "#45B7D1",
    statusColor: "text-gray-500",
  },
  {
    id: "29",
    name: "Mariana Santos",
    grade: "12",
    strand: "ABM",
    status: "active",
    progress: 88,
    satisfaction: 4,
    initials: "MS",
    color: "#96CEB4",
    statusColor: "text-green-600",
  },
  {
    id: "30",
    name: "Emilia Reyes",
    grade: "12",
    strand: "ABM",
    status: "active",
    progress: 93,
    satisfaction: 5,
    initials: "ER",
    color: "#FFEEAD",
    statusColor: "text-green-600",
  },

  // STEM - 5 students
  {
    id: "31",
    name: "Joaquin Garcia",
    grade: "12",
    strand: "STEM",
    status: "active",
    progress: 89,
    satisfaction: 4,
    initials: "JG",
    color: "#FF6B6B",
    statusColor: "text-green-600",
  },
  {
    id: "32",
    name: "Antonella Lopez",
    grade: "12",
    strand: "STEM",
    status: "inactive",
    progress: 84,
    satisfaction: 3,
    initials: "AL",
    color: "#4ECDC4",
    statusColor: "text-gray-500",
  },
  {
    id: "33",
    name: "Matias Cruz",
    grade: "12",
    strand: "STEM",
    status: "active",
    progress: 91,
    satisfaction: 5,
    initials: "MC",
    color: "#45B7D1",
    statusColor: "text-green-600",
  },
  {
    id: "34",
    name: "Catalina Santos",
    grade: "12",
    strand: "STEM",
    status: "active",
    progress: 87,
    satisfaction: 4,
    initials: "CS",
    color: "#96CEB4",
    statusColor: "text-green-600",
  },
  {
    id: "35",
    name: "Felipe Reyes",
    grade: "12",
    strand: "STEM",
    status: "active",
    progress: 90,
    satisfaction: 5,
    initials: "FR",
    color: "#FFEEAD",
    statusColor: "text-green-600",
  },

  // HUMSS - 5 students
  {
    id: "36",
    name: "Julieta Garcia",
    grade: "12",
    strand: "HUMSS",
    status: "inactive",
    progress: 83,
    satisfaction: 3,
    initials: "JG",
    color: "#FF6B6B",
    statusColor: "text-gray-500",
  },
  {
    id: "37",
    name: "Benicio Lopez",
    grade: "12",
    strand: "HUMSS",
    status: "active",
    progress: 89,
    satisfaction: 4,
    initials: "BL",
    color: "#4ECDC4",
    statusColor: "text-green-600",
  },
  {
    id: "38",
    name: "Emilia Cruz",
    grade: "12",
    strand: "HUMSS",
    status: "active",
    progress: 92,
    satisfaction: 5,
    initials: "EC",
    color: "#45B7D1",
    statusColor: "text-green-600",
  },
  {
    id: "39",
    name: "Thiago Santos",
    grade: "12",
    strand: "HUMSS",
    status: "active",
    progress: 86,
    satisfaction: 4,
    initials: "TS",
    color: "#96CEB4",
    statusColor: "text-green-600",
  },
  {
    id: "40",
    name: "Isabella Reyes",
    grade: "12",
    strand: "HUMSS",
    status: "inactive",
    progress: 81,
    satisfaction: 3,
    initials: "IR",
    color: "#FFEEAD",
    statusColor: "text-gray-500",
  },

  // GAS - 5 students
  {
    id: "41",
    name: "Josefina Garcia",
    grade: "12",
    strand: "GAS",
    status: "active",
    progress: 88,
    satisfaction: 4,
    initials: "JG",
    color: "#FF6B6B",
    statusColor: "text-green-600",
  },
  {
    id: "42",
    name: "Bautista Lopez",
    grade: "12",
    strand: "GAS",
    status: "active",
    progress: 90,
    satisfaction: 5,
    initials: "BL",
    color: "#4ECDC4",
    statusColor: "text-green-600",
  },
  {
    id: "43",
    name: "Amalia Cruz",
    grade: "12",
    strand: "GAS",
    status: "active",
    progress: 85,
    satisfaction: 4,
    initials: "AC",
    color: "#45B7D1",
    statusColor: "text-green-600",
  },
  {
    id: "44",
    name: "Tomas Santos",
    grade: "12",
    strand: "GAS",
    status: "inactive",
    progress: 82,
    satisfaction: 3,
    initials: "TS",
    color: "#96CEB4",
    statusColor: "text-gray-500",
  },
  {
    id: "45",
    name: "Emma Reyes",
    grade: "12",
    strand: "GAS",
    status: "active",
    progress: 89,
    satisfaction: 4,
    initials: "ER",
    color: "#FFEEAD",
    statusColor: "text-green-600",
  },

  // TVL - 5 students
  {
    id: "46",
    name: "Santiago Lopez",
    grade: "12",
    strand: "TVL",
    status: "active",
    progress: 87,
    satisfaction: 4,
    initials: "SL",
    color: "#FF6B6B",
    statusColor: "text-green-600",
  },
  {
    id: "47",
    name: "Valentina Reyes",
    grade: "12",
    strand: "TVL",
    status: "active",
    progress: 91,
    satisfaction: 5,
    initials: "VR",
    color: "#4ECDC4",
    statusColor: "text-green-600",
  },
  {
    id: "48",
    name: "Mateo Garcia",
    grade: "12",
    strand: "TVL",
    status: "inactive",
    progress: 83,
    satisfaction: 3,
    initials: "MG",
    color: "#45B7D1",
    statusColor: "text-gray-500",
  },
  {
    id: "49",
    name: "Sofia Santos",
    grade: "12",
    strand: "TVL",
    status: "active",
    progress: 90,
    satisfaction: 4,
    initials: "SS",
    color: "#96CEB4",
    statusColor: "text-green-600",
  },
  {
    id: "50",
    name: "Emiliano Reyes",
    grade: "12",
    strand: "TVL",
    status: "active",
    progress: 88,
    satisfaction: 5,
    initials: "ER",
    color: "#FFEEAD",
    statusColor: "text-green-600",
  },
];

export default function TeacherDashboard() {
  const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
  const [isTotalStudentsModalVisible, setIsTotalStudentsModalVisible] =
    useState(false);
  const [isActiveStudentsModalVisible, setIsActiveStudentsModalVisible] =
    useState(false);
  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);

  const user = {
    name: "Teacher Name",
    email: "teacher@example.com",
    image: { uri: "https://randomuser.me/api/portraits/women/44.jpg" },
  };
  const [students, setStudents] = useState<Student[]>(allStudents);
  const activeStudents = students.filter(
    (student) => student.status === "active"
  );
  const [featuredStudents, setFeaturedStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    activeStudents: 0,
    averageProgress: 0,
    averageSatisfaction: 0,
    averageConfidence: 0,
  });

  const router = useRouter();
  const handleAddStudent = () => {
    router.push("/ButtonIcon/add-student");
  };

  // Calculate stats whenever component mounts or allStudents changes
  useEffect(() => {
    const totalStudents = allStudents.length;
    const activeStudentsList = allStudents.filter((s) => s.status === "active");
    const activeCount = activeStudentsList.length;

    const averageProgress =
      totalStudents > 0
        ? Math.round(
            allStudents.reduce((sum, student) => sum + student.progress, 0) /
              totalStudents
          )
        : 0;

    const averageSatisfaction =
      totalStudents > 0
        ? Math.round(
            (allStudents.reduce(
              (sum, student) => sum + student.satisfaction,
              0
            ) /
              totalStudents) *
              20
          )
        : 0;

    const studentsWithConfidence = allStudents.filter(
      (s) => s.confidence !== undefined
    );
    const averageConfidence =
      studentsWithConfidence.length > 0
        ? Math.round(
            studentsWithConfidence.reduce(
              (sum, student) => sum + (student.confidence || 0),
              0
            ) / studentsWithConfidence.length
          )
        : 78;

    setStats({
      totalStudents,
      activeStudents: activeCount,
      averageProgress,
      averageSatisfaction,
      averageConfidence,
    });
  }, [allStudents]);

  // Add animation effect for the stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        averageSatisfaction: Math.min(
          100,
          Math.max(0, prev.averageSatisfaction + (Math.random() > 0.5 ? 1 : -1))
        ),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleTotalStudentsPress = () => {
    setIsTotalStudentsModalVisible(true);
  };

  const handleActiveStudentsPress = () => {
    setIsActiveStudentsModalVisible(true);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const BackgroundDecor = () => (
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#0F172A"]}
        className="flex-1"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
    </View>
  );


  return (
    <View className="flex-1 bg-[#0F172A] relative">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <BackgroundDecor />

      <ScrollView
        className="flex-1 bottom-3 p-4 z-10"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 30,
          paddingTop: 10,
        }}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mt-4 mb-3 w-full">
          <View className="flex-row items-center">
            <Image
              source={require("../../../assets/Speaksy.png")}
              className="w-12 h-12 rounded-full right-2"
              resizeMode="contain"
            />
            <Text className="text-white font-bold text-2xl ml-2 -left-5">
              Voclaria
            </Text>
          </View>

          <View className="flex-row items-center right-2">
            <TouchableOpacity
              onPress={handleAddStudent}
              activeOpacity={0.7}
              className="p-2 bg-white/10 rounded-full mr-4"
            >
              <Image
                source={require("../../../assets/add-student.png")}
                className="w-5 h-5"
                resizeMode="contain"
                tintColor="white"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsProfileMenuVisible(!isProfileMenuVisible)}
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              <Image
                source={user.image}
                className="w-8 h-8 rounded-full"
                resizeMode="cover"
              />
            </TouchableOpacity>
            {isProfileMenuVisible && (
              <ProfileMenuTeacher
                user={user}
                visible={isProfileMenuVisible}
                onDismiss={() => setIsProfileMenuVisible(false)}
              />
            )}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-2xl font-bold text-white">
            {getGreeting()}, Teacher!
          </Text>
          <Text className="text-gray-400">Here's your classroom overview</Text>
        </View>

        {/* Metrics Grid */}
        <View className="flex-row flex-wrap justify-between mb-4">
          <MetricCard
            title="Total Students"
            value={stats.totalStudents.toString()}
            color="#4f46e5"
            icon={
              <Image
                source={require("../../../assets/Students.png")}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            }
            trend={{ value: 12, isPositive: true }}
            progress={Math.round((stats.totalStudents / 50) * 100)}
            onPress={handleTotalStudentsPress}
          />

          <MetricCard
            title="Active Students"
            value={stats.activeStudents.toString()}
            color="#10b981"
            icon={
              <Image
                source={require("../../../assets/active.png")}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            }
            trend={{ value: 8, isPositive: true }}
            progress={Math.round(
              (stats.activeStudents / stats.totalStudents) * 100
            )}
            onPress={handleActiveStudentsPress}
          />

          <MetricCard
            title="Avg. Progress"
            value={`${stats.averageProgress}%`}
            color="#3b82f6"
            icon={
              <Image
                source={require("../../../assets/progress.png")}
                style={{ width: 40, height: 36 }}
                resizeMode="contain"
              />
            }
            trend={{ value: 5, isPositive: true }}
            progress={stats.averageProgress}
          />

          <MetricCard
            title="Satisfaction"
            value={`${stats.averageSatisfaction}%`}
            color="#8b5cf6"
            icon={
              <Image
                source={require("../../../assets/satisfaction.png")}
                style={{ width: 40, height: 36 }}
                resizeMode="contain"
              />
            }
            trend={{ value: 2, isPositive: false }}
            progress={stats.averageSatisfaction}
          />
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-white mb-3">
            Student Management
          </Text>
          <View className="bg-white/5 border border-white/30 rounded-2xl p-6">
            <View className="items-center mb-4">
              <View className="mb-3">
                <Image
                  source={require("../../../assets/manage-student.png")}
                  style={{ 
                    width: 40, 
                    height: 36,
                    tintColor: 'white'
                  }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-lg font-semibold text-white mb-1">
                Manage Your Students
              </Text>
              <Text className="text-white/60 text-center text-xs mb-4">
                View and manage all your students in one place. Track their
                progress, check performance metrics, and provide personalized
                support.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsStudentModalVisible(true)}
              className="bg-violet-600 py-3 bottom-2 w-full rounded-xl flex-row items-center justify-center space-x-2"
              activeOpacity={0.9}
            >
              <Text className="text-white font-base">Open Student Manager</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-center text-white mb-3">
            Confidence & Anxiety Tracking
          </Text>
          <View className="bg-white/10 border border-white/20 rounded-2xl p-5">
            <View className="flex-row justify-between items-center mb-4">
              <View className="items-center flex-1">
                <Text className="text-white font-bold text-2xl">
                  {stats.averageConfidence}%
                </Text>
                <Text className="text-white/80 text-xs">Confidence Overall</Text>
              </View>
              <View className="h-10 w-px bg-white/20" />
              <View className="items-center flex-1">
                <Text className="text-white font-bold text-2xl">
                  {100 - stats.averageConfidence}%
                </Text>
                <Text className="text-white/80 text-xs">Anxiety Level</Text>
              </View>
            </View>

            <View className="mt-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-white font-medium text-sm">
                  Confidence Overall
                </Text>
                <Text className="text-white/80 text-sm">
                  {stats.averageConfidence}%
                </Text>
              </View>
              <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{ 
                    width: `${stats.averageConfidence}%`,
                    backgroundColor: '#8b5cf6', // violet-500
                    shadowColor: '#8b5cf6',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 5,
                    elevation: 5
                  }}
                />
              </View>

              <View className="flex-row justify-between mt-4 mb-2">
                <Text className="text-white font-medium text-sm">
                  Anxiety During Practice
                </Text>
                <Text className="text-white/80 text-sm">
                  {100 - stats.averageConfidence}%
                </Text>
              </View>
              <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{ 
                    width: `${100 - stats.averageConfidence}%`,
                    backgroundColor: '#8b5cf6', // violet-500
                    shadowColor: '#8b5cf6',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 5,
                    elevation: 5
                  }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Featured Students Section */}
        <View className="mb-6">
          <Text className="text-lg top-3 font-bold text-white mb-3">
            Ranking Students
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingLeft: 0, // Match Strand Performance section padding
              paddingRight: 20,
              paddingVertical: 4,
              alignItems: 'flex-start',
              gap: 6
            }}
            snapToAlignment="start"
            decelerationRate="fast"
            alwaysBounceHorizontal={false}
            snapToStart
            snapToEnd
          >
            {students.slice(0, 5).map((student, index) => (
              <View 
                key={student.id} 
                className="w-48"
                style={{ 
                  minHeight: 180,
                  marginRight: 12,
                  marginLeft: 0 // Remove left margin since we have container padding
                }}
              >
                <StudentCard student={student} rank={index + 1} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Strand Performance Section */}
        <View className="mb-6 bottom-8">
          <Text className="text-lg font-bold text-white mb-3">
            Strand Performance
          </Text>
          <View className="bg-white/10 border border-white/20 rounded-2xl p-5">
            <View className="flex-row justify-between mb-4">
              <Text className="text-white/80 text-sm">Strand</Text>
              <Text className="text-white/80 text-sm">Avg. Progress</Text>
            </View>

            {["ABM", "STEM", "HUMSS", "GAS", "TVL"]
              .map((strand) => {
                const strandStudents = students.filter(
                  (s) => s.strand === strand
                );
                const avgProgress =
                  strandStudents.length > 0
                    ? Math.round(
                        strandStudents.reduce((sum, s) => sum + s.progress, 0) /
                          strandStudents.length
                      )
                    : 0;
                return { strand, avgProgress };
              })
              .sort((a, b) => b.avgProgress - a.avgProgress)
              .map(({ strand, avgProgress }) => (
                <View key={strand} className="mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-white font-medium">{strand}</Text>
                    <Text className="text-white font-medium">
                      {avgProgress}%
                    </Text>
                  </View>
                  <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${avgProgress}%`,
                        backgroundColor: "#8b5cf6"
                      }}
                    />
                  </View>
                </View>
              ))}
          </View>
        </View>
      </ScrollView>

      <ActiveStudentModal
        visible={isActiveStudentsModalVisible}
        onClose={() => setIsActiveStudentsModalVisible(false)}
        students={activeStudents}
      />

      <StudentManagementModal
        visible={isStudentModalVisible}
        onClose={() => setIsStudentModalVisible(false)}
        students={students}
      />
      
      <TotalStudentModal
        visible={isTotalStudentsModalVisible}
        onClose={() => setIsTotalStudentsModalVisible(false)}
        students={students}
        onRemoveStudent={(studentId) => {
          setStudents(prevStudents => 
            prevStudents.filter(student => student.id !== studentId)
          );
        }}
      />
      
      <NavigationBar defaultActiveTab="Dashboard" />
    </View>
  );
}