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

  return (
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
                <StudentCard 
                  key={student.id} 
                  student={student} 
                  isInactive={student.status === 'inactive'} 
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons 
                  name="people-outline" 
                  size={48} 
                  color="#6B7280" 
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyText}>
                  No {activeTab} students found
                </Text>
              </View>
            )}
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
  );
};

// Student Card Component
interface StudentCardProps {
  student: Student;
  isInactive?: boolean;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, isInactive = false }) => (
  <View style={[
    styles.studentCard,
    isInactive && styles.inactiveStudentCard
  ]}>
    <View style={styles.studentInfo}>
      <View style={[
        styles.avatar,
        isInactive && { opacity: 0.7 }
      ]}>
        <Text style={[
          styles.avatarText,
          isInactive && { opacity: 0.7 }
        ]}>
          {student.initials}
        </Text>
      </View>
      <View>
        <Text style={[
          styles.studentName,
          isInactive && styles.inactiveText
        ]}>
          {student.name}
        </Text>
        <Text style={[
          styles.studentDetails,
          isInactive && styles.inactiveText
        ]}>
          Grade {student.grade} - {student.strand}
        </Text>
      </View>
    </View>

    <View style={styles.metricsContainer}>
      <View style={styles.metricItem}>
        <View style={styles.metricHeader}>
          <Text style={[
            styles.metricLabel,
            isInactive && styles.inactiveText
          ]}>
            Progress
          </Text>
          <Text style={[
            styles.metricValue,
            isInactive && styles.inactiveText
          ]}>
            {student.progress}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${student.progress}%`,
                backgroundColor: isInactive ? '#6b7280' : '#a78bfa', // gray-500 when inactive
                opacity: isInactive ? 0.6 : 1,
              },
            ]}
          />
        </View>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#818CF8',
  },
  tabText: {
    color: '#9CA3AF',
    fontWeight: '500',
    fontSize: 16,
  },
  activeTabText: {
    color: 'white',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    height: 2,
    width: '100%',
    backgroundColor: '#818CF8',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    opacity: 0.5,
    marginBottom: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
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
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    marginTop: 8,
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
  inactiveStudentCard: {
    opacity: 0.7,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  inactiveText: {
    color: 'rgba(255, 255, 255, 0.6)',
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

export default ActiveStudentModal;
