import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const sessions = [
  {
    name: 'Sarah Chen',
    topic: 'Voice Warm-Up and Articulation',
    level: 'Basic',
  },
  {
    name: 'David Kim',
    topic: 'Advanced Debate Practice',
    level: 'ADVANCED',
  },
  {
    name: 'Lisa Park',
    topic: 'Eye Contact and Facial Expression',
    level: 'Basic',
  },
];

export default function LiveSessions() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0A0A1E', padding: 20 }}>
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Join Live Sessions</Text>
        <Text style={{ color: '#ccc', fontSize: 14, marginTop: 4 }}>
          Connect with experts and learn in real-time
        </Text>
      </View>

      {/* Search and Filter */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ flex: 1, backgroundColor: '#1C1C3A', borderRadius: 8, marginRight: 10, paddingHorizontal: 10 }}>
          <TextInput
            placeholder="Search sessions or instructors..."
            placeholderTextColor="#888"
            style={{ paddingVertical: 8, color: '#fff' }}
          />
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: '#1C1C3A',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: '#ccc', fontSize: 13 }}>All Categories</Text>
        </TouchableOpacity>
      </View>

      {/* Live Banner */}
      <View
        style={{
          backgroundColor: '#183A2F',
          borderRadius: 8,
          padding: 10,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Ionicons name="wifi-outline" size={16} color="#48D597" style={{ marginRight: 8 }} />
        <Text style={{ color: '#A3FFDC', fontSize: 13 }}>Live sessions update in real-time</Text>
      </View>

      {/* Session Cards */}
      {sessions.map((session, i) => (
        <View
          key={i}
          style={{
            backgroundColor: '#1C1C3A',
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
          }}
        >
          {/* Top Bar */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ backgroundColor: '#FF4F4F', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>LIVE</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="eye-outline" size={14} color="#aaa" />
              <Text style={{ color: '#aaa', fontSize: 12, marginLeft: 4 }}>127</Text>
            </View>
          </View>

          {/* Instructor */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="person-circle-outline" size={20} color="#8A5CFF" style={{ marginRight: 6 }} />
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{session.name}</Text>
          </View>

          {/* Topic */}
          <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 6 }}>{session.topic}</Text>

          {/* Level Tag */}
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: '#4F4FFF33',
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: '#8A5CFF', fontSize: 12, fontWeight: '600' }}>
              {session.level}
            </Text>
          </View>

          {/* Join Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#8A5CFF',
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Join Session</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
