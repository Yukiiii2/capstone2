import React, { useEffect, useRef, useState, useCallback } from "react";
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Alert,
  PanResponder,
  TouchableWithoutFeedback,
} from "react-native";

/* ⬇️ Supabase client (logic added) */
import { supabase } from "@/lib/supabaseClient";

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
  const slideAnim = useRef(new Animated.Value(height)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const lastGestureDy = useRef(0);

  /* ⬇️ Live data state (added) */
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);
  const renderStudents: Student[] = liveStudents.length > 0 ? liveStudents : students;

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
        // Only respond to vertical swipes
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 3);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow swiping down
        if (gestureState.dy > 0) {
          pan.setValue({ x: 0, y: gestureState.dy });
        }
        lastGestureDy.current = gestureState.dy;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // If swiped down enough or fast enough, close the modal
          onClose();
        } else {
          // Otherwise, reset position
          resetPosition();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset pan position when modal becomes visible
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

  /* ⬇️ Auth (added) */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setTeacherId(data?.user?.id ?? null);
    })();
    return () => { mounted = false; };
  }, []);

  /* ⬇️ Mapper (added) */
  const mapRowsToStudents = useCallback(
    (tsRows: any[], profRows: any[], progRows: any[]): Student[] => {
      const byProf: Record<string, any> = {};
      const byProg: Record<string, any> = {};
      (profRows || []).forEach((p) => { byProf[p.id] = p; });
      (progRows || []).forEach((p) => { byProg[p.student_id] = p; });

      return (tsRows || []).map((r) => {
        const prof = byProf[r.student_id];
        const name = (prof?.name || "Unknown Student").trim();
        const parts = name.split(/\s+/).filter(Boolean);
        const initials =
          (parts[0]?.[0] || "?") + (parts[1]?.[0] || "?");
        const pv = byProg[r.student_id] || {};

        return {
          id: r.student_id,
          name,
          grade: r.grade_level || "",
          strand: r.strand || "",
          status: (r.status as "active" | "inactive") || "active",
          progress: typeof pv.progress === "number" ? pv.progress : 0,
          satisfaction: typeof pv.satisfaction === "number" ? pv.satisfaction : 0,
          confidence: typeof pv.confidence === "number" ? pv.confidence : undefined,
          anxiety: typeof pv.anxiety === "number" ? pv.anxiety : undefined,
          initials,
          color: "#4F46E5",
          statusColor: r.status === "active" ? "text-green-400" : "text-gray-400",
        } as Student;
      });
    },
    []
  );

  /* ⬇️ Fetch (added) */
  const fetchLive = useCallback(async () => {
    if (!teacherId) return;

    const { data: ts, error: tsErr } = await supabase
      .from("teacher_students")
      .select("student_id, grade_level, strand, status")
      .eq("teacher_id", teacherId);

    if (tsErr || !ts?.length) {
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
      .select("student_id, progress, satisfaction, confidence, anxiety")
      .in("student_id", ids);

    setLiveStudents(mapRowsToStudents(ts, profs || [], prog || []));
  }, [teacherId, mapRowsToStudents]);

  /* ⬇️ Realtime subscriptions (added) */
  useEffect(() => {
    if (!teacherId || !visible) return;

    fetchLive();

    const chA = supabase
      .channel(`teacher_students:${teacherId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teacher_students", filter: `teacher_id=eq.${teacherId}` },
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
      try { supabase.removeChannel(chA); } catch {}
      try { supabase.removeChannel(chB); } catch {}
    };
  }, [teacherId, visible, fetchLive]);

  const handleRemoveStudent = (student: Student) => {
    setStudentToRemove(student);
  };

  /* ⬇️ Confirm removal: call prop if provided; else soft-inactivate in Supabase (added) */
  const confirmRemoveStudent = async () => {
    try {
      if (studentToRemove && onRemoveStudent) {
        onRemoveStudent(studentToRemove.id);
      } else if (studentToRemove && teacherId) {
        await supabase
          .from("teacher_students")
          .update({ status: "inactive" })
          .eq("teacher_id", teacherId)
          .eq("student_id", studentToRemove.id);
        await fetchLive();
      }
    } catch (e: any) {
      Alert.alert("Unable to remove", e?.message || "Please try again.");
    } finally {
      setStudentToRemove(null);
    }
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
        <View style={styles.modalContainer}>
          <View style={styles.overlay} />
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.modalContent,
              {
                height: height * 0.85,
                transform: [
                  { translateY: Animated.add(slideAnim, pan.y) },
                ],
              },
            ]}
          >
          <View style={styles.header}>
            <Text style={styles.headerText}>
              All Students ({renderStudents.length})
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {renderStudents.map((student) => (
              <View
                key={student.id}
                style={styles.studentCard}
              >
                <View style={styles.studentInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {student.initials}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentDetails}>
                      Grade {student.grade} - {student.strand}
                    </Text>
                  </View>
                </View>

                <View style={styles.studentActions}>
                  <TouchableOpacity 
                    onPress={() => handleRemoveStudent(student)}
                    style={styles.modalRemoveButton}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                    <Ionicons 
                      name="trash-outline" 
                      size={16} 
                      color="#EF4444" 
                      style={styles.removeIcon}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.metricsContainer}>
                  <View style={styles.metricItem}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricLabel}>
                        Confidence Level
                      </Text>
                      <Text style={styles.metricValue}>
                        {(student.confidence ?? 0)}%
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${student.confidence ?? 0}%`,
                            backgroundColor: '#a78bfa', // violet-400
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.metricItem}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricLabel}>Anxiety Level</Text>
                      <Text style={styles.metricValue}>
                        {(student.anxiety ?? 100)}%
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${student.anxiety ?? 100}%`,
                            backgroundColor: '#a78bfa', // violet-400
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButtonLarge}
          >
            <Text style={styles.closeButtonTextLarge}>Close</Text>
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
      <View style={styles.confirmationOverlay}>
        <View style={styles.confirmationDialog}>
          <View style={styles.dialogHeader}>
            <Text style={styles.confirmationTitle}>Remove Student</Text>
            <Text style={styles.confirmationMessage}>
              Are you sure you want to remove <Text style={styles.studentNameHighlight}>{studentToRemove?.name}</Text> from your class? This action cannot be undone.
            </Text>
          </View>
          
          <View style={styles.confirmationButtons}>
            <TouchableOpacity 
              style={styles.popupCancelButton}
              onPress={cancelRemoveStudent}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.popupRemoveButton}
              onPress={confirmRemoveStudent}
              activeOpacity={0.8}
            >
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmationDialog: {
    backgroundColor: 'rgba(26, 31, 46, 0.95)',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  dialogHeader: {
    padding: 24,
    paddingBottom: 20,
  },
  confirmationTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  studentNameHighlight: {
    color: '#fff',
    fontWeight: '600',
  },
  confirmationMessage: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 8,
  },
  confirmationButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 24,
  },
  // Popup buttons (for confirmation dialog)
  confirmButton: {
    flex: 1,
    maxWidth: 140,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  popupCancelButton: {
    flex: 1,
    maxWidth: 140,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupRemoveButton: {
    flex: 1,
    maxWidth: 140,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Modal buttons (in the student list)
  modalCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 100,
  },
  modalRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 100,
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  removeButtonText: {
    color: '#FF6B6B',
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  studentActions: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  removeIcon: {
    marginLeft: 4,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
  },
  removeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1F2E',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  studentCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
  },
  studentName: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
  },
  studentDetails: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
  metricsContainer: {
    marginTop: 8,
  },
  metricItem: {
    marginBottom: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricLabel: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
  metricValue: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  closeButtonLarge: {
    backgroundColor: '#7c3aed', // violet-600
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  closeButtonTextLarge: {
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default TotalStudentModal;
