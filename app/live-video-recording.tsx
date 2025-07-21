import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LiveVideoRecording() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0A0A1E', padding: 20 }}>
      {/* Header */}
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
        Live Video Recording
      </Text>
      <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 16 }}>
        Record yourself and get AI-powered feedback to improve your presentation skills
      </Text>

      {/* Video Frame */}
      <View
        style={{
          backgroundColor: '#1C1C3A',
          borderRadius: 14,
          marginBottom: 14,
          overflow: 'hidden',
        }}
      >
        {/* Top Status */}
        <View
          style={{
            backgroundColor: '#0A0A1E',
            padding: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#ccc', fontSize: 12 }}>👥 Audience: 25 people</Text>
          <Text style={{ color: '#48D597', fontSize: 12 }}>🎧 Audio: Active</Text>
        </View>

        {/* Image Frame with Button */}
        <View style={{ position: 'relative' }}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1601933470928-c5d8f308b2ee',
            }}
            style={{ width: '100%', height: 240 }}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: '40%',
              left: '40%',
              backgroundColor: '#8A5CFF',
              width: 60,
              height: 60,
              borderRadius: 30,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: 0.95,
            }}
          >
            <Ionicons name="videocam" size={28} color="#fff" />
          </TouchableOpacity>
          <Text
            style={{
              position: 'absolute',
              bottom: 16,
              alignSelf: 'center',
              color: '#ccc',
              fontSize: 13,
              backgroundColor: '#00000090',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            Click to start live session
          </Text>
        </View>
      </View>

      {/* End Live Button */}
      <TouchableOpacity
        style={{
          backgroundColor: '#FF4F4F',
          borderRadius: 8,
          paddingVertical: 10,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>End Live</Text>
      </TouchableOpacity>

      {/* Reactions */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginBottom: 24,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="heart" size={20} color="#FF4F4F" />
          <Text style={{ color: '#fff', marginLeft: 6, fontSize: 14 }}>24</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="happy" size={20} color="#FACC15" />
          <Text style={{ color: '#fff', marginLeft: 6, fontSize: 14 }}>12</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="thumbs-up" size={20} color="#3B82F6" />
          <Text style={{ color: '#fff', marginLeft: 6, fontSize: 14 }}>89</Text>
        </View>
      </View>

      {/* AI Feedback Section */}
      <View style={{ marginBottom: 30 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>
          AI Speech Analysis
        </Text>

        {[
          '“Pronunciation is good, keep it up!”',
          '“Try slowing down slightly for better clarity.”',
          '“Pace is a bit fast, consider pausing slightly.”',
          '“Focus on reducing hesitation.”',
        ].map((tip, idx) => (
          <View
            key={idx}
            style={{
              backgroundColor: '#1C1C3A',
              borderRadius: 10,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: '#ccc', fontSize: 13 }}>{tip}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
