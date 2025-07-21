import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LiveSession() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0A0A1E', padding: 20 }}>
      {/* Header */}
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 6 }}>
        Live Session
      </Text>

      {/* Status and Viewers */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <View
          style={{
            backgroundColor: '#FF4F4F',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
            marginRight: 10,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>LIVE</Text>
        </View>
        <Ionicons name="eye-outline" size={16} color="#aaa" />
        <Text style={{ color: '#aaa', fontSize: 13, marginLeft: 4 }}>127 viewers</Text>
      </View>

      {/* Live Image */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1646243425301-d733db6f5821' }}
        style={{
          width: '100%',
          height: 200,
          borderRadius: 14,
          marginBottom: 16,
        }}
        resizeMode="cover"
      />

      {/* Instructor Info Card */}
      <View
        style={{
          backgroundColor: '#1C1C3A',
          borderRadius: 12,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#34D399',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 14,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>MC</Text>
        </View>
        <View>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
            Dr. Michael Chen
          </Text>
          <Text style={{ color: '#aaa', fontSize: 13 }}>Professor of Computer Science</Text>
        </View>
      </View>

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
          <Text style={{ color: '#fff', marginLeft: 6, fontSize: 14 }}>26</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="happy" size={20} color="#FACC15" />
          <Text style={{ color: '#fff', marginLeft: 6, fontSize: 14 }}>19</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="bulb" size={20} color="#8A5CFF" />
          <Text style={{ color: '#fff', marginLeft: 6, fontSize: 14 }}>17</Text>
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={{
          backgroundColor: '#8A5CFF',
          borderRadius: 10,
          paddingVertical: 14,
          marginBottom: 30,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: 15 }}>
          More Live Sessions
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
