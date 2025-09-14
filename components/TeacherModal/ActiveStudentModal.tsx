import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/* supabase */
import { supabase } from "@/lib/supabaseClient";

/* types (same as yours) */
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

  /* animation (original) */
  const slideAnim = useRef(new Animated.Value(height)).current;
  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: height, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  /* realtime (added) */
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);
  const sourceStudents = liveStudents.length > 0 ? liveStudents : students;

  const filteredStudents = sourceStudents.filter((student) =>
    activeTab === 'active' ? student.status === 'active' : student.status === 'inactive'
  );

  /* auth */
  useEffect(() => {
    let ok = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (ok) setTeacherId(data?.user?.id ?? null);
    })();
    return () => { ok = false; };
  }, []);

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
      .in("id", ids);

    const { data: prog } = await supabase
      .from("student_progress")
      .select("student_id, progress")
      .in("student_id", ids);

    const byProf: Record<string, any> = {};
    const byProg: Record<string, any> = {};
    (profs || []).forEach((p) => (byProf[p.id] = p));
    (prog || []).forEach((p) => (byProg[p.student_id] = p));

    const mapped: Student[] = (ts || []).map((r) => {
      const prof = byProf[r.student_id];
      const name = (prof?.name || "Unknown Student").trim();
      const parts = name.split(/\s+/).filter(Boolean);
      const initials = (parts[0]?.[0] || "?") + (parts[1]?.[0] || "?");
      const pv = byProg[r.student_id] || {};
      return {
        id: r.student_id,
        name,
        grade: r.grade_level || "",
        strand: r.strand || "",
        status: (r.status as "active" | "inactive") || "active",
        progress: typeof pv.progress === "number" ? pv.progress : 0,
        satisfaction: 0,
        initials,
        color: "#4F46E5",
        statusColor: r.status === "active" ? "text-green-400" : "text-gray-400",
      };
    });

    setLiveStudents(mapped);
  }, [teacherId]);

  useEffect(() => {
    if (!teacherId || !visible) return;
    fetchLive();

    const chA = supabase
      .channel(`teacher_students:${teacherId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teacher_students", filter: `teacher_id=eq.${teacherId}` },
        fetchLive
      ).subscribe();

    const chB = supabase
      .channel(`student_progress:${teacherId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_progress" },
        fetchLive
      ).subscribe();

    return () => {
      try { supabase.removeChannel(chA); } catch {}
      try { supabase.removeChannel(chB); } catch {}
    };
  }, [teacherId, visible, fetchLive]);

  /* UI (unchanged) */
  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.modalContent,
            { height: height * 0.85, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerText}>
              {activeTab === 'active' ? 'Active' : 'Inactive'} Students ({filteredStudents.length})
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'active' && styles.activeTab]}
              onPress={() => setActiveTab('active')}
            >
              <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
                Active
              </Text>
              {activeTab === 'active' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'inactive' && styles.activeTab]}
              onPress={() => setActiveTab('inactive')}
            >
              <Text style={[styles.tabText, activeTab === 'inactive' && styles.activeTabText]}>
                Inactive
              </Text>
              {activeTab === 'inactive' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <StudentCard key={student.id} student={student} isInactive={student.status === 'inactive'} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#6B7280" style={styles.emptyIcon} />
                <Text style={styles.emptyText}>No {activeTab} students found</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.closeButtonLarge}>
            <Text style={styles.closeButtonTextLarge}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

/* card (unchanged) */
interface StudentCardProps { student: Student; isInactive?: boolean; }
const StudentCard: React.FC<StudentCardProps> = ({ student, isInactive = false }) => (
  <View style={[styles.studentCard, isInactive && styles.inactiveStudentCard]}>
    <View style={styles.studentInfo}>
      <View style={[styles.avatar, isInactive && { opacity: 0.7 }]}>
        <Text style={[styles.avatarText, isInactive && { opacity: 0.7 }]}>
          {student.initials}
        </Text>
      </View>
      <View>
        <Text style={[styles.studentName, isInactive && styles.inactiveText]}>{student.name}</Text>
        <Text style={[styles.studentDetails, isInactive && styles.inactiveText]}>
          Grade {student.grade} - {student.strand}
        </Text>
      </View>
    </View>

    <View style={styles.metricsContainer}>
      <View style={styles.metricItem}>
        <View style={styles.metricHeader}>
          <Text style={[styles.metricLabel, isInactive && styles.inactiveText]}>Progress</Text>
          <Text style={[styles.metricValue, isInactive && styles.inactiveText]}>
          {(student.progress ?? 0)}%
          </Text>
        <View
           style={[
            styles.progressFill,
          {
            width: `${student.progress ?? 0}%`,
            backgroundColor: isInactive ? '#6b7280' : '#a78bfa',
            opacity: isInactive ? 0.6 : 1,
           },
          ]}
          />
        </View>
      </View>
    </View>
  </View>
);

/* styles (unchanged) */
const styles = StyleSheet.create({
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 16, paddingHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#818CF8' },
  tabText: { color: '#9CA3AF', fontWeight: '500', fontSize: 16 },
  activeTabText: { color: 'white' },
  tabIndicator: { position: 'absolute', bottom: -1, height: 2, width: '100%', backgroundColor: '#818CF8' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyIcon: { opacity: 0.5, marginBottom: 12 },
  emptyText: { color: '#9CA3AF', fontSize: 16, textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(42, 49, 66, 0.8)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerText: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  sectionHeader: { fontSize: 16, fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: 12, marginTop: 8 },
  closeButton: { padding: 8 },
  closeButtonText: { color: 'white', fontSize: 18 },
  scrollView: { flex: 1 },
  studentCard: { padding: 16, marginBottom: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)' },
  inactiveStudentCard: { opacity: 0.7, borderColor: 'rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  inactiveText: { color: 'rgba(255, 255, 255, 0.6)' },
  studentInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)' },
  avatarText: { color: 'white', fontWeight: 'bold' },
  studentName: { fontWeight: 'bold', color: 'white', fontSize: 16 },
  studentDetails: { color: 'white', fontSize: 12, opacity: 0.8 },
  metricsContainer: { marginTop: 8 },
  metricItem: { marginBottom: 8 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metricLabel: { color: 'white', fontSize: 12, opacity: 0.8 },
  metricValue: { color: 'white', fontSize: 12, fontWeight: '500' },
  progressBar: { height: 6, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  closeButtonLarge: { backgroundColor: '#7c3aed', paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  closeButtonTextLarge: { color: 'white', fontWeight: '500', textAlign: 'center' },
});

export default ActiveStudentModal;
