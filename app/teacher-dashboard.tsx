import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const modules = [
  {
    level: 'BASIC',
    title: 'Reading Fundamentals',
    description: 'Master the basics of effective reading with foundational techniques and comprehension strategies.',
    progress: '75% Complete',
  },
  {
    level: 'ADVANCE',
    title: 'Vocabulary Building Basics',
    description: 'Build your vocabulary foundation with essential words and context clues for better comprehension.',
    progress: '40% Complete',
  },
  {
    level: 'ADVANCE',
    title: 'Sentence Structure & Grammar',
    description: 'Understand basic sentence patterns and grammar rules to improve reading comprehension.',
    progress: '40% Complete',
  },
];

const recentSessions = [
  {
    title: 'Reading Fundamentals - Chapter 2',
    detail: 'Completed with 85% comprehension rate',
  },
  {
    title: 'Vocabulary Quiz – Basic Level',
    detail: 'Perfect score on 20 vocabulary items',
  },
  {
    title: 'Audience Engagement Basics – Next',
    detail: 'Completed sentence structure exercises',
  },
];

export default function ExerciseReading() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0A0A1E', padding: 20 }}>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 }}>Basic Reading Practice Modules</Text>
      <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 16 }}>
        Start your reading journey with foundational skills and techniques
      </Text>

      <TouchableOpacity
        style={{ backgroundColor: '#8A5CFF', padding: 12, borderRadius: 10, marginBottom: 20 }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Start Learning</Text>
      </TouchableOpacity>

      {modules.map((mod, i) => (
        <View
          key={i}
          style={{ backgroundColor: '#1C1C3A', borderRadius: 12, padding: 14, marginBottom: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="book-outline" size={20} color="#8A5CFF" style={{ marginRight: 8 }} />
            <Text style={{ color: '#8A5CFF', fontWeight: 'bold', fontSize: 13 }}>{mod.level}</Text>
          </View>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{mod.title}</Text>
          <Text style={{ color: '#ccc', fontSize: 13, marginVertical: 8 }}>{mod.description}</Text>
          <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 6 }}>{mod.progress}</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#8A5CFF', paddingVertical: 10, borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Select Module</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginVertical: 12 }}>Recent Training Sessions</Text>

      {recentSessions.map((session, idx) => (
        <View
          key={idx}
          style={{ backgroundColor: '#1C1C3A', borderRadius: 12, padding: 14, marginBottom: 12 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#8A5CFF" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{session.title}</Text>
          </View>
          <Text style={{ color: '#ccc', fontSize: 13 }}>{session.detail}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
