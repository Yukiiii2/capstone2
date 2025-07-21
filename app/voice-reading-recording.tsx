import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VoiceReadingRecording() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0A0A1E', padding: 20 }}>
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Reading Confidence Assessment</Text>
        <Text style={{ color: '#ccc', fontSize: 14, marginTop: 4 }}>
          Read the following passage aloud to help us evaluate your reading confidence level
        </Text>
      </View>

      {/* Assessment Card */}
      <View
        style={{
          backgroundColor: '#1C1C3A',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>
          Reading Assessment
        </Text>
        <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 12 }}>
          Please read the following passage aloud:
        </Text>

        <View
          style={{
            backgroundColor: '#2E2E4D',
            padding: 14,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#8A5CFF55',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 15, lineHeight: 22 }}>
            AI is changing many areas, like health care and driving. It helps doctors, guides cars, and
            suggests things online. As AI becomes more part of our lives, we need to think about its
            advantages and problems.
          </Text>
        </View>

        <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 10 }}>
          Click the microphone button and read the passage clearly. You have up to 60 seconds to complete the reading.
        </Text>

        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
          {[0, 1, 2, 3, 4].map((dot) => (
            <View
              key={dot}
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                backgroundColor: dot === 0 ? '#8A5CFF' : '#555',
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>

        {/* Mic Button */}
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#8A5CFF',
              padding: 16,
              borderRadius: 99,
            }}
          >
            <Ionicons name="mic-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#5E5CE6',
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            marginRight: 8,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: '#8A5CFF',
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            marginLeft: 8,
          }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>See Results</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
