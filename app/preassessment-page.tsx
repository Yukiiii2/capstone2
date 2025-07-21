import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function PreAssessmentPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(3);

  const ratings = [1, 2, 3, 4, 5];

  return (
    <ScrollView style={styles.container}>
      {/* Header Logo */}
      <View style={styles.headerLogo}>
        <Text style={styles.logoText}>Fluentech</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>
        Here’s your Daily Pre-Assessment Questionnaire
      </Text>

      {/* Assessment Box */}
      <View style={styles.assessmentBox}>
        <Text style={styles.assessmentTitle}>Self Assessment</Text>
        <Text style={styles.assessmentDesc}>
          Please rate your confidence level in the following areas to help us customize your learning experience
        </Text>

        {/* Question */}
        <View style={styles.questionBox}>
          <Text style={styles.questionText}>
            How confident are you speaking in public?
          </Text>
        </View>

        {/* Instruction */}
        <Text style={styles.instruction}>
          "Rate your confidence from 1 (lowest) to 5 (highest)."
        </Text>

        {/* Rating Buttons */}
        <View style={styles.ratingRow}>
          {ratings.map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.ratingButton,
                selected === num ? styles.ratingButtonSelected : styles.ratingButtonUnselected,
              ]}
              onPress={() => setSelected(num)}
            >
              <Text style={selected === num ? styles.ratingTextSelected : styles.ratingTextUnselected}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.prevButton} onPress={() => router.back()}>
            <Text style={styles.prevButtonText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={() => router.push('/next-page')}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1E',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 80,
  },
  headerLogo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  assessmentBox: {
    backgroundColor: '#2c2c44',
    padding: 20,
    borderRadius: 24,
    marginTop: 16,
  },
  assessmentTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  assessmentDesc: {
    color: '#dcdced',
    fontSize: 14,
    marginBottom: 12,
  },
  questionBox: {
    backgroundColor: '#40405c',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  questionText: {
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 14,
  },
  instruction: {
    color: '#AFAFC0',
    fontStyle: 'italic',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingButtonSelected: {
    backgroundColor: '#8A5CFF',
  },
  ratingButtonUnselected: {
    backgroundColor: '#fff',
  },
  ratingTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  ratingTextUnselected: {
    color: '#0A0A1E',
    fontWeight: 'bold',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prevButton: {
    backgroundColor: '#6C5DD3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  prevButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#8A5CFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
