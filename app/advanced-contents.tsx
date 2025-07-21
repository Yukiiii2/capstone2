// app/advanced-procedure.tsx
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const sessions = [
  'New Vocalization Techniques',
  'Advanced Debate Techniques',
  'Q&A Handling Techniques',
  'Storytelling and Hook',
  'Engaging Speech Opening',
  'Closing Impactfully',
  'Audience Response Mastery',
  'Pacing and Pauses',
  'Intonation & Emphasis',
  'Audience Types Handling',
  'Professional Gesture Use',
  'Rebuttal and Conflict Control',
];

export default function AdvancedProcedure() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0A0A1E', padding: 20 }}>
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Fluentech</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <Text style={{ color: '#ccc', fontSize: 16 }}>Advanced Public Speaking Mastery</Text>
          <Text style={{ color: '#8A5CFF', fontWeight: 'bold' }}>Progress 25%</Text>
        </View>
      </View>

      {/* Search & Filter */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <TextInput
          placeholder="Search"
          placeholderTextColor="#888"
          style={{
            flex: 1,
            backgroundColor: '#1C1C3A',
            color: '#fff',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        />
        <TouchableOpacity style={{ paddingHorizontal: 16, backgroundColor: '#8A5CFF', borderRadius: 8, justifyContent: 'center' }}>
          <Ionicons name="filter-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Session Cards */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {sessions.map((title, index) => (
          <View
            key={index}
            style={{
              width: '48%',
              backgroundColor: index % 2 === 0 ? '#1C1C3A' : '#2D2D44',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Ionicons name="mic-outline" size={24} color="#8A5CFF" style={{ marginBottom: 8 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 8 }}>{title}</Text>
            <TouchableOpacity
              style={{
                backgroundColor: '#8A5CFF',
                paddingVertical: 6,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: '#fff', textAlign: 'center', fontSize: 12 }}>Start</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Recent Training Sessions */}
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginVertical: 16 }}>Recent Training Sessions</Text>
      {[
        'New Vocalizer Techniques',
        'Advanced Debate Techniques',
        'Audience Engagement Basics – Next',
      ].map((item, i) => (
        <View
          key={i}
          style={{
            backgroundColor: '#1C1C3A',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="videocam-outline" size={20} color="#8A5CFF" style={{ marginRight: 12 }} />
          <View>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item}</Text>
            <Text style={{ color: '#aaa', fontSize: 12 }}>Watch the latest session recording</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
