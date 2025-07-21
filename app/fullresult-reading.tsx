import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ExerciseReading() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* Top Nav */}
      <View style={styles.topNav}>
        <Text style={styles.brand}>Fluentech</Text>
        <View style={styles.topNavIcons}>
          <Ionicons name="notifications-outline" size={20} color="#fff" />
          <Ionicons name="person-circle-outline" size={24} color="#fff" />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Text style={styles.tabInactive}>Exercise Speaking</Text>
        <Text style={styles.tabActive}>Exercise Reading</Text>
        <Text style={styles.tabInactive}>Community</Text>
      </View>

      {/* Section Title */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Reading Practice Modules</Text>
        <Text style={styles.sectionSubtitle}>
          Start your reading journey with foundational skills and techniques
        </Text>
        <TouchableOpacity style={styles.startLearningBtn}>
          <Text style={styles.startLearningText}>Start Learning</Text>
        </TouchableOpacity>
      </View>

      {/* Modules */}
      <View style={styles.modules}>
        {/* Module 1 */}
        <View style={styles.moduleCard}>
          <Text style={styles.moduleLevelBasic}>BASIC</Text>
          <Text style={styles.moduleTitle}>Reading Fundamentals</Text>
          <Text style={styles.moduleDesc}>
            Master the basics of effective reading with foundational techniques and comprehension strategies.
          </Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '75%' }]} />
          </View>
          <TouchableOpacity style={styles.selectModuleBtn}>
            <Text style={styles.selectModuleText}>Select Module</Text>
          </TouchableOpacity>
        </View>

        {/* Module 2 */}
        <View style={styles.moduleCard}>
          <Text style={styles.moduleLevelAdvance}>ADVANCE</Text>
          <Text style={styles.moduleTitle}>Vocabulary Building Basics</Text>
          <Text style={styles.moduleDesc}>
            Build your vocabulary foundation with essential words and context clues for better comprehension.
          </Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '40%' }]} />
          </View>
          <TouchableOpacity style={styles.selectModuleBtn}>
            <Text style={styles.selectModuleText}>Select Module</Text>
          </TouchableOpacity>
        </View>

        {/* Module 3 */}
        <View style={styles.moduleCard}>
          <Text style={styles.moduleLevelAdvance}>ADVANCE</Text>
          <Text style={styles.moduleTitle}>Sentence Structure & Grammar</Text>
          <Text style={styles.moduleDesc}>
            Understand basic sentence patterns and grammar rules to improve reading comprehension.
          </Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '40%' }]} />
          </View>
          <TouchableOpacity style={styles.selectModuleBtn}>
            <Text style={styles.selectModuleText}>Select Module</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Training Sessions</Text>

        <View style={styles.moduleCard}>
          <Text style={styles.moduleTitle}>Reading Fundamentals - Chapter 2</Text>
          <Text style={styles.moduleDesc}>Completed with 85% comprehension rate</Text>
        </View>

        <View style={styles.moduleCard}>
          <Text style={styles.moduleTitle}>Vocabulary Quiz – Basic Level</Text>
          <Text style={styles.moduleDesc}>Perfect score on 20 vocabulary items</Text>
        </View>

        <View style={styles.moduleCard}>
          <Text style={styles.moduleTitle}>Audience Engagement Basics – Next</Text>
          <Text style={styles.moduleDesc}>Completed sentence structure exercises</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1E',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  brand: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  topNavIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tabActive: {
    color: '#fff',
    fontWeight: '600',
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
    paddingBottom: 4,
  },
  tabInactive: {
    color: '#6B7280',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 12,
  },
  startLearningBtn: {
    backgroundColor: '#8A5CFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  startLearningText: {
    color: '#fff',
    fontWeight: '600',
  },
  modules: {
    gap: 24,
  },
  moduleCard: {
    backgroundColor: '#1C1C3A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  moduleLevelBasic: {
    color: '#D1B3FF',
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 4,
  },
  moduleLevelAdvance: {
    color: '#D1B3FF',
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 4,
  },
  moduleTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  moduleDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#4B5563',
    borderRadius: 999,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#8A5CFF',
    borderRadius: 999,
  },
  selectModuleBtn: {
    backgroundColor: '#8A5CFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 4,
  },
  selectModuleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
