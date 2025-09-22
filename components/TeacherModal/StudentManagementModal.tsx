import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Student, PerformanceData, defaultPerformanceData } from "../../types";

/* ✅ Supabase logic (added, UI untouched) */
import { supabase } from "@/lib/supabaseClient";

type PerformanceType = "speaking" | "reading";

interface StudentManagementModalProps {
  visible: boolean;
  onClose: () => void;
  students: Student[];
  initialFilter?: {
    grade?: string;
    strand?: string;
  };
}

const StudentManagementModal: React.FC<StudentManagementModalProps> = ({
  visible,
  onClose,
  students,
  initialFilter = {},
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showPerformanceTypeModal, setShowPerformanceTypeModal] =
    useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedPerformanceType, setSelectedPerformanceType] =
    useState<PerformanceType>("speaking");

  /* ✅ match previous logic: initialize from initialFilter */
  const [selectedGrade, setSelectedGrade] = useState<string | null>(
    initialFilter.grade ?? null
  );
  const [selectedStrand, setSelectedStrand] = useState<string | null>(
    initialFilter.strand ?? null
  );
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showStrandDropdown, setShowStrandDropdown] = useState(false);

  /* ✅ live data logic (auth + fetch + realtime), UI stays the same */
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);
  const allStudents: Student[] = liveStudents.length > 0 ? liveStudents : students;

  const filteredStudents = useMemo(() => {
    return allStudents.filter((student) => {
      const matchesSearch = student.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesGrade = !selectedGrade || student.grade === selectedGrade;
      const matchesStrand =
        !selectedStrand || student.strand === selectedStrand;
      return matchesSearch && matchesGrade && matchesStrand;
    });
  }, [allStudents, searchQuery, selectedGrade, selectedStrand]);

  /* ✅ auth bootstrap */
  useEffect(() => {
    let ok = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (ok) setTeacherId(data?.user?.id ?? null);
    })();
    return () => {
      ok = false;
    };
  }, []);

  /* ✅ live fetch + map (same as your earlier version; progress stays 0 here) */
  const fetchLive = useCallback(async () => {
    if (!teacherId) return;

    const { data: ts } = await supabase
      .from("teacher_students")
      .select("student_id, grade_level, strand, status")
      .eq("teacher_id", teacherId);

    if (!ts?.length) {
      setLiveStudents([]);
      return;
    }

    const ids = Array.from(new Set(ts.map((r) => r.student_id))).filter(Boolean);

    const { data: profs } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", ids as string[]);

    const byProf: Record<string, any> = {};
    (profs || []).forEach((p) => (byProf[p.id] = p));

    const mapped: Student[] = (ts || []).map((r) => {
      const name = (byProf[r.student_id]?.name || "Unknown Student").trim();
      const parts = name.split(/\s+/).filter(Boolean);
      const initials =
        (parts[0]?.[0] || "?") + (parts[1]?.[0] || "?");
      return {
        id: r.student_id,
        name,
        grade: r.grade_level || "",
        strand: r.strand || "",
        status: (r.status as "active" | "inactive") || "active",
        progress: 0,          // stays 0 here to mirror your provided logic
        satisfaction: 0,      // stays 0 here
        initials,
        color: "#4F46E5",
        statusColor: r.status === "active" ? "text-green-400" : "text-gray-400",
      } as Student;
    });

    setLiveStudents(mapped);
  }, [teacherId]);

  /* ✅ realtime subscriptions (same behavior as the logic you gave) */
  useEffect(() => {
    if (!teacherId || !visible) return;
    fetchLive();

    const chA = supabase
      .channel(`teacher_students:${teacherId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teacher_students",
          filter: `teacher_id=eq.${teacherId}`,
        },
        fetchLive
      )
      .subscribe();

    const chB = supabase
      .channel(`student_progress:${teacherId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_progress" },
        fetchLive
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(chA);
      } catch {}
      try {
        supabase.removeChannel(chB);
      } catch {}
    };
  }, [teacherId, visible, fetchLive]);

  const handleStudentPress = (student: Student) => {
    setSelectedStudent(student);
    setShowPerformanceTypeModal(true);
  };

  const handlePerformanceTypeSelect = (type: PerformanceType) => {
    setSelectedPerformanceType(type);
    setShowPerformanceTypeModal(false);
    setShowPerformanceModal(true);
  };

  const clearFilters = () => {
    setSelectedGrade(null);
    setSelectedStrand(null);
    setSearchQuery("");
  };

  const renderPerformanceModal = () => {
    if (!selectedStudent || !showPerformanceModal) return null;

    const data = defaultPerformanceData[selectedPerformanceType];
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

    const currentAnxiety = anxietyColors[data.anxietyLevel];

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

    const renderInsightSection = (
      title: string,
      items: string[],
      color: string
    ) => (
      <View
        className={`bg-${color}-900/20 border-l-4 border-${color}-400 p-3 rounded-r-lg`}
      >
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

    return (
      <Modal
        transparent
        visible={showPerformanceModal}
        animationType="fade"
        onRequestClose={() => setShowPerformanceModal(false)}
      >
        <View className="flex-1 bg-black/30 justify-center items-center p-3">
          <View className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <BlurView intensity={30} tint="dark" className="w-full">
              <View className="p-6 bg-[#1A1F2E]/95 border border-white/10 backdrop-blur-2xl rounded-3xl">
                {/* Header */}
                <View className="flex-row justify-between items-start mb-6">
                  <View className="flex-1 pr-4">
                    <Text className="text-2xl font-bold text-white mb-2">
                      {selectedStudent.name}'s Performance
                    </Text>
                    <View className="flex-row items-center">
                      <View className="px-3 py-1 rounded-full bg-white/10 mr-2 border border-white/10">
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
                          Overall completion of {selectedPerformanceType}{" "}
                          modules
                        </Text>
                      </View>
                      <View className="bg-white/10 border border-white/20 rounded-full px-2 py-0.5 min-w-[40px] items-center justify-center">
                        <Text className="text-white font-semibold text-xs">
                          {data.moduleProgress}%
                        </Text>
                      </View>
                    </View>
                    <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600"
                        style={{ width: `${data.moduleProgress}%` }}
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
                            data.confidenceLevel >= 80
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {data.confidenceLevel}%
                        </Text>
                      </View>
                      <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                          style={{ width: `${data.confidenceLevel}%` }}
                        />
                      </View>
                    </View>

                    {/* Anxiety Level Card */}
                    <View className="bg-white/10 border border-white/30 rounded-2xl p-5 shadow-lg flex-1 backdrop-blur-md">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-sm font-medium text-white/80">
                          Anxiety Level
                        </Text>
                        <View
                          className={`w-2 h-2 rounded-full ${currentAnxiety.dot}`}
                        ></View>
                      </View>
                      <View className="mb-3">
                        <Text
                          className={`text-2xl font-bold ${currentAnxiety.text}`}
                        >
                          {data.anxietyLevel.charAt(0).toUpperCase() +
                            data.anxietyLevel.slice(1)}
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
                      {Object.entries(data.skillMastery).map(
                        ([skill, value]) => {
                          const getSkillColor = (value: number) => {
                            if (value >= 80)
                              return "from-emerald-500 to-green-400";
                            if (value >= 60)
                              return "from-amber-500 to-yellow-400";
                            return "from-rose-500 to-pink-400";
                          };

                          return (
                            <View key={skill} className="space-y-2">
                              <View className="flex-row justify-between items-center">
                                <Text className="text-sm font-medium text-white/90 capitalize">
                                  {skill}
                                </Text>
                                <Text className="text-sm font-semibold text-white">
                                  {value}%
                                </Text>
                              </View>
                              <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <View
                                  className={`h-full rounded-full bg-gradient-to-r ${getSkillColor(
                                    value as number
                                  )}`}
                                  style={{ width: `${value}%` }}
                                />
                              </View>
                            </View>
                          );
                        }
                      )}
                    </View>
                  </View>

                  {/* Recent Tasks */}
                  <View className="bg-white/10 border border-white/30 rounded-2xl p-5 shadow-lg mb-6 overflow-hidden backdrop-blur-md">
                    <View className="flex-row justify-between items-center mb-6">
                      <View>
                        <Text className="text-lg font-bold text-white">
                          Recent Tasks
                        </Text>
                        <Text className="text-sm text-white/60 mt-0.5">
                          Student's latest activities
                        </Text>
                      </View>
                      <View className="px-4 bottom-2 py-1.5">
                        <Text className="text-white text-sm font-medium">
                          {data.recentTasks.length} completed
                        </Text>
                      </View>
                    </View>
                    <View className="space-y-3">
                      {data.recentTasks.map((task) => {
                        const scoreColor =
                          task.score >= 80
                            ? "text-green-400"
                            : task.score >= 70
                            ? "text-yellow-400"
                            : "text-red-400";

                        return (
                          <View
                            key={task.id}
                            className="bg-white/5 border border-white/30 rounded-xl p-4 mb-3 transition-all duration-200 active:scale-[0.98] backdrop-blur-sm"
                          >
                            <View className="flex-row justify-between items-start">
                              <View className="flex-1 pr-3">
                                <Text className="font-semibold text-white mb-2">
                                  {task.title}
                                </Text>
                                <View className="flex-row items-center">
                                  <Ionicons
                                    name="calendar-outline"
                                    size={12}
                                    color="rgba(255,255,255,0.5)"
                                  />
                                  <Text className="text-xs text-white/60 ml-1.5">
                                    {new Date(task.date).toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      }
                                    )}
                                  </Text>
                                </View>
                              </View>
                              <View className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full min-w-[70px] items-center">
                                <Text
                                  className={`text-sm font-bold ${scoreColor}`}
                                >
                                  {task.score}%
                                </Text>
                              </View>
                            </View>
                            <View className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                              <View
                                className="h-full rounded-full"
                                style={{
                                  width: `${task.score}%`,
                                  backgroundColor:
                                    task.score >= 80
                                      ? "linear-gradient(90deg, #10b981, #34d399)"
                                      : task.score >= 70
                                      ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                                      : "linear-gradient(90deg, #ef4444, #f87171)",
                                }}
                              />
                            </View>
                          </View>
                        );
                      })}
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

                    {data.areasToImprove.length > 0 && (
                      <View className="bg-white/10 border border-white/30 rounded-xl p-4 backdrop-blur-sm">
                        <View className="flex-row items-center mb-3">
                          <View className="w-2 h-2 rounded-full bg-amber-400 mr-3"></View>
                          <Text className="text-sm font-medium text-amber-400">
                            Areas to Improve
                          </Text>
                        </View>
                        <View className="space-y-3 pl-0">
                          {data.areasToImprove.map(
                            (item: string, index: number) => (
                              <View
                                key={index}
                                className="flex-row items-start"
                              >
                                <Text className="text-white/90 text-sm leading-relaxed">
                                  {item}
                                </Text>
                              </View>
                            )
                          )}
                        </View>
                      </View>
                    )}

                    {data.recommendations.length > 0 && (
                      <View className="bg-white/10 border border-white/30 rounded-xl p-4 backdrop-blur-sm">
                        <View className="flex-row items-center mb-3">
                          <View className="w-2 h-2 rounded-full bg-blue-400 mr-3"></View>
                          <Text className="text-sm font-medium text-blue-400">
                            Recommendations
                          </Text>
                        </View>
                        <View className="space-y-3 pl-0">
                          {data.recommendations.map(
                            (item: string, index: number) => (
                              <View
                                key={index}
                                className="flex-row items-start"
                              >
                                <Text className="text-white/90 text-sm leading-relaxed">
                                  {item}
                                </Text>
                              </View>
                            )
                          )}
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

  const renderDropdownItem = (
    value: string,
    currentValue: string | null,
    setValue: (val: string | null) => void,
    onSelect: () => void
  ) => (
    <TouchableOpacity
      className={`px-4 py-2 ${currentValue === value ? "bg-white/20" : ""}`}
      onPress={() => {
        setValue(currentValue === value ? null : value);
        onSelect();
      }}
    >
      <Text
        className={`text-white ${currentValue === value ? "font-medium" : ""}`}
      >
        {value}
      </Text>
    </TouchableOpacity>
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
        <View className="flex-1 mt-20 bg-[#1A1F2E]/95 backdrop-blur-3xl rounded-t-3xl p-4">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold text-white">
              Student Management
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Text className="text-gray-500 text-lg">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="relative mb-4">
            <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
              <Ionicons name="search" size={18} color="#6B7280" />
            </View>
            <TextInput
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2 text-base text-white"
              placeholder="Search students..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filters */}
          <View className="flex-row gap-3 mb-4">
            {/* Grade Dropdown */}
            <View className="flex-1 relative">
              <TouchableOpacity
                className={`flex-row items-center justify-between p-1.5 rounded-lg border ${selectedGrade ? "border-white bg-white/10" : "border-white/20 bg-white/5"}`}
                onPress={() => setShowGradeDropdown(!showGradeDropdown)}
              >
                <Text className="text-white text-sm">
                  {selectedGrade ? `Grade ${selectedGrade}` : "Select Grade"}
                </Text>
                <Text className="text-white/50 text-lg">
                  {showGradeDropdown ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>
              {showGradeDropdown && (
                <View className="absolute z-10 w-full mt-1 bg-[#2A3142] border border-white/10 rounded-lg shadow-lg">
                  {["11", "12"].map((grade) => (
                    <View key={`grade-${grade}`}>
                      {renderDropdownItem(
                        grade,
                        selectedGrade,
                        setSelectedGrade,
                        () => setShowGradeDropdown(false)
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Strand Dropdown */}
            <View className="flex-1 relative">
              <TouchableOpacity
                className={`flex-row items-center justify-between p-1.5 rounded-lg border ${selectedStrand ? "border-white bg-white/10" : "border-white/20 bg-white/5"}`}
                onPress={() => setShowStrandDropdown(!showStrandDropdown)}
              >
                <Text className="text-white text-sm">
                  {selectedStrand || "Select Strand"}
                </Text>
                <Text className="text-white/50 text-lg">
                  {showStrandDropdown ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>
              {showStrandDropdown && (
                <View className="absolute z-10 w-full mt-1 bg-[#2A3142] border border-white/10 rounded-lg shadow-lg">
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
          <TouchableOpacity
            className="w-full bg-violet-500 rounded-lg py-2.5 px-4 items-center mb-4"
            onPress={clearFilters}
          >
            <Text className="text-sm font-medium text-white">
              Clear All Filters
            </Text>
          </TouchableOpacity>

          {/* Student List */}
          <ScrollView className="flex-1">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TouchableOpacity
                  key={student.id}
                  className="flex-row items-center mb-3 p-3 rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.07)",
                    borderWidth: 2,
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                  }}
                  onPress={() => handleStudentPress(student)}
                >
                  <View
                    className="w-12 h-12 items-center justify-center mr-4"
                    style={{
                      backgroundColor: student.color,
                      borderRadius: 9999,
                      width: 48,
                      height: 48,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      elevation: 3,
                      overflow: "hidden",
                    }}
                  >
                    <Text className="text-white font-bold text-base">
                      {student.initials}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-baseline">
                      <Text
                        className="font-semibold text-white text-base flex-shrink pr-2"
                        numberOfLines={1}
                      >
                        {student.name}
                      </Text>
                      <View className="flex-row items-center">
                        <View
                          className={`w-2.5 h-2.5 rounded-full mx-1 ${student.status === "active" ? "bg-green-400" : "bg-gray-400"}`}
                          style={{
                            shadowColor:
                              student.status === "active"
                                ? "#10B981"
                                : "#9CA3AF",
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.8,
                            shadowRadius: 3,
                            elevation: 2,
                          }}
                        />
                        <Text
                          className={`text-xs font-medium ${student.status === "active" ? "text-green-300" : "text-gray-400"}`}
                        >
                          {student.status.charAt(0).toUpperCase() +
                            student.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-white/80 mt-1">
                      Grade {student.grade} • {student.strand}
                    </Text>
                  </View>

                  <View className="w-8 h-8 items-center justify-center">
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="rgba(255, 255, 255, 0.5)"
                    />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="py-8 items-center justify-center">
                <Text className="text-gray-500 text-center mb-3">
                  No students found matching your criteria
                </Text>
                <TouchableOpacity
                  onPress={clearFilters}
                  className="mt-2 px-4 py-2 bg-purple-100 rounded-lg"
                >
                  <Text className="text-purple-700 font-medium">
                    Clear filters
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Performance Type Selection Modal */}
      <Modal
        transparent
        visible={showPerformanceTypeModal}
        animationType="fade"
        onRequestClose={() => setShowPerformanceTypeModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center p-4">
          <BlurView
            intensity={30}
            tint="dark"
            className="w-full max-w-md rounded-2xl overflow-hidden"
          >
            <View className="p-6 bg-[#1A1F2E] backdrop-blur-3xl rounded-2xl">
              <Text className="text-2xl font-bold text-white mb-6 text-center">
                Select Performance Type
              </Text>

              <View className="space-y-4 mb-6">
                {(["speaking", "reading"] as PerformanceType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    className="p-2 bg-white/10 rounded-xl active:bg-white/10 transition-colors"
                    onPress={() => handlePerformanceTypeSelect(type)}
                    activeOpacity={0.8}
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full items-center justify-center mr-4">
                        <Ionicons
                          name={
                            type === "speaking" ? "mic-outline" : "book-outline"
                          }
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
                className="mt-2 p-4 bg-white/5 border border-white/10 rounded-xl items-center active:bg-white/10 transition-colors"
                onPress={() => setShowPerformanceTypeModal(false)}
                activeOpacity={0.8}
              >
                <Text className="text-gray-300 font-medium">Cancel</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* Performance Modal */}
      {renderPerformanceModal()}
    </Modal>
  );
};

export default StudentManagementModal;
