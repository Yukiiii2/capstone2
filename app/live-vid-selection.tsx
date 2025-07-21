import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LiveVidSelection() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0A0A1E', padding: 20 }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Fluentech</Text>
        <Ionicons name="person-circle-outline" size={28} color="#fff" />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 }}>
        {['Overview', 'Exercise Speaking', 'Exercise Reading', 'Community'].map((tab, i) => (
          <Text
            key={i}
            style={{
              color: i === 1 ? '#8A5CFF' : '#ccc',
              fontWeight: i === 1 ? 'bold' : 'normal',
              borderBottomWidth: i === 1 ? 2 : 0,
              borderBottomColor: '#8A5CFF',
              paddingBottom: 4,
            }}
          >
            {tab}
          </Text>
        ))}
      </View>

      {/* Main Title */}
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
        Ready to Go Live?
      </Text>
      <Text style={{ color: '#aaa', marginBottom: 20 }}>
        Stream live and get real-time feedback from your audience
      </Text>

      {/* Interactive Session Card */}
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Ionicons name="tv-outline" size={32} color="#8A5CFF" />
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>Interactive Live Session</Text>
          <Text style={{ textAlign: 'center', color: '#555', fontSize: 13 }}>
            Engage with live feedback to improve your speaking.
          </Text>
        </View>
        {[
          'Real-time Audience Interaction',
          'Engaging Reactions & Feedback',
          'Perfect for Students & Teachers',
        ].map((text, index) => (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 13 }}>{text}</Text>
          </View>
        ))}
      </View>

      {/* Go Live Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: '#8A5CFF',
            paddingVertical: 12,
            borderRadius: 8,
            marginRight: 10,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Go Live</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: '#fff',
            paddingVertical: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#8A5CFF',
          }}
        >
          <Text style={{ color: '#8A5CFF', fontWeight: 'bold', textAlign: 'center' }}>
            Go Live as Audience
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tips Section */}
      <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>Quick Tips 🎯</Text>
        {[
          'Maintain eye contact with the camera',
          'Speak clearly and at a steady pace',
          'Have good posture—no slouching!',
          'Use gestures to enhance delivery',
          'Choose a quiet, well-lit room',
        ].map((tip, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 13 }}>{tip}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
