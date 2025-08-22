import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type LessonType = {
  id: number;
  title: string;
  lesson: string;
  level: 'Basic' | 'Advanced';
  category: 'Speaking' | 'Reading';
  isCompleted: boolean;
  desc: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  lessons: LessonType[];
  type: 'completed' | 'upcoming';
};

const CompletedLessonsModal: React.FC<Props> = ({ visible, onClose, lessons, type }) => {
  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'flex-end',
    },
    contentContainer: {
      backgroundColor: '#1F2937',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      color: 'white',
      fontSize: 20,
      fontWeight: 'bold',
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    lessonCard: {
      backgroundColor: 'rgba(31, 41, 55, 0.6)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(55, 65, 81, 0.5)',
    },
    lessonHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    lessonTitle: {
      color: 'white',
      fontWeight: '600',
      fontSize: 16,
      flex: 1,
      marginLeft: 8,
    },
    lessonType: {
      color: 'white',
      fontSize: 12,
      fontWeight: '500',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      overflow: 'hidden',
    },
    lessonInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    levelTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
    },
    levelText: {
      fontSize: 10,
      fontWeight: '600',
    },
    timeText: {
      color: '#9CA3AF',
      fontSize: 10,
      marginLeft: 4,
    },
    description: {
      color: '#9CA3AF',
      fontSize: 12,
      marginTop: 8,
      lineHeight: 18,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      alignSelf: 'flex-end',
      marginTop: 12,
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
  });

  const getTypeColor = (category: string) => {
    return category === 'Speaking' ? '#60A5FA' : '#A78BFA';
  };

  const getLevelColor = (level: string) => {
    return level === 'Basic' ? 'rgba(96, 165, 250, 0.2)' : 'rgba(167, 139, 250, 0.2)';
  };

  const getLevelTextColor = (level: string) => {
    return level === 'Basic' ? '#60A5FA' : '#A78BFA';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {type === 'completed' ? 'Completed Lessons' : 'Upcoming Lessons'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {lessons.map((lesson) => {
              const typeColor = getTypeColor(lesson.category);
              const levelColor = getLevelColor(lesson.level);
              const levelTextColor = getLevelTextColor(lesson.level);

              return (
                <View key={lesson.id} style={styles.lessonCard}>
                  <View style={styles.lessonHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[
                        { 
                          width: 28, 
                          height: 28, 
                          borderRadius: 8, 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          backgroundColor: `${typeColor}20`
                        }
                      ]}>
                        <Ionicons 
                          name={lesson.category === 'Speaking' ? 'mic-outline' : 'book-outline'} 
                          size={16} 
                          color={typeColor} 
                        />
                      </View>
                      <Text style={styles.lessonTitle} numberOfLines={1}>
                        {lesson.title}
                      </Text>
                    </View>
                    <View style={[styles.lessonType, { backgroundColor: `${typeColor}20` }]}>
                      <Text style={{ color: typeColor, fontSize: 10, fontWeight: '600' }}>
                        {lesson.category}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.description} numberOfLines={2}>
                    {lesson.desc}
                  </Text>

                  <View style={styles.lessonInfo}>
                    <View style={[styles.levelTag, { backgroundColor: levelColor }]}>
                      <Text style={[styles.levelText, { color: levelTextColor }]}>
                        {lesson.level}
                      </Text>
                    </View>
                    <Text style={{ color: '#6B7280', fontSize: 10, marginRight: 8 }}>•</Text>
                    <Text style={{ color: '#6B7280', fontSize: 10 }}>{lesson.lesson}</Text>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>
                      <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                      <Text style={styles.timeText}>
                        {Math.floor(Math.random() * 15) + 5} min
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: `${typeColor}20` }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.actionButtonText, { color: typeColor }]}>
                      {type === 'completed' ? 'Review' : 'Start'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default CompletedLessonsModal;
