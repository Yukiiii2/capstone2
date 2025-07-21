import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const sessions = [
  'Effective Introduction',
  'Structuring Introduction',
  'Voice, Lips and Articulation',
  'Strong Voice Projection',
  'Speech Breaks: Pause',
  'Driving Speech Emotions',
  'Eye Contact System',
  'Posture and Gesture',
  'Speaking Anxiety Control',
  'Confidence Skills',
  'Audience Basics',
  'Verbal Pace, Pitch, Modulation',
];

export default function BasicProcedure() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0A0A1E', padding: 20 }}>
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Fluentech</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <View>
            <Text style={{ color: '#ccc', fontSize: 14, fontWeight: '600' }}>
              Foundation Speaking Skills
            </Text>
            <Text style={{ color: '#888', fontSize: 12 }}>
              Master essential techniques and manage anxiety
            </Text>
          </View>
          <Text style={{ color: '#8A5CFF', fontWeight: 'bold' }}>Module Progress 75%</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <TouchableOpacity style={{ backgroundColor: '#1C1C3A', padding: 10, borderRadius: 8, width: '48%' }}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ backgroundColor: '#8A5CFF', padding: 10, borderRadius: 8, width: '48%' }}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>All Lessons</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{ marginBottom: 20 }}>
        <TextInput
          placeholder="Search"
          placeholderTextColor="#888"
          style={{
            backgroundColor: '#1C1C3A',
            padding: 12,
            borderRadius: 8,
            color: '#fff',
            paddingLeft: 40,
          }}
        />
        <Ionicons
          name="search"
          size={20}
          color="#888"
          style={{ position: 'absolute', left: 10, top: 12 }}
        />
      </View>

      {/* Session Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {sessions.map((title, index) => {
          const isAlt = index % 2 === 1;
          return (
            <View
              key={index}
              style={{
                width: '48%',
                backgroundColor: isAlt ? '#33334D' : '#1C1C3A',
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Ionicons name="book-outline" size={24} color="#8A5CFF" style={{ marginBottom: 8 }} />
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
          );
        })}
      </View>

      {/* Recent Sessions */}
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginVertical: 16 }}>
        Recent Training Sessions
      </Text>
      {['Audience Engagement Basics – Next', 'Core Speaking Techniques – Review', 'Module 3: Closing Statements – Practice'].map((label, i) => (
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
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{label}</Text>
            <Text style={{ color: '#aaa', fontSize: 12 }}>Join or review live discussion</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
