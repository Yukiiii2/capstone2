import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CommunityPage() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0A0A1E', padding: 20 }}>
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>VR and Video Peer Review</Text>
        <Text style={{ color: '#ccc', fontSize: 14, marginTop: 4 }}>
          Review and provide feedback on community VR and video recordings
        </Text>
      </View>

      {/* Rating Overview */}
      <View
        style={{
          backgroundColor: '#1C1C3A',
          padding: 16,
          borderRadius: 14,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: '#ccc', fontSize: 14, marginBottom: 4 }}>Overall Rating</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 24 }}>4.2</Text>
          <Ionicons name="star" size={20} color="#FFD700" style={{ marginLeft: 8 }} />
          <Text style={{ color: '#aaa', marginLeft: 6, fontSize: 12 }}>Based on 18 reviews</Text>
        </View>
      </View>

      {/* Video Section */}
      <View
        style={{
          backgroundColor: '#1C1C3A',
          borderRadius: 14,
          marginBottom: 20,
          overflow: 'hidden',
        }}
      >
        {/* Tag */}
        <View
          style={{
            backgroundColor: '#8A5CFF',
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderBottomRightRadius: 8,
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 10,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 12 }}>VIDEO RECORDING</Text>
        </View>

        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1614064641938-3bbee52942e6',
          }}
          style={{ width: '100%', height: 180 }}
          resizeMode="cover"
        />

        <View style={{ padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/women/75.jpg' }}
              style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }}
            />
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Sarah Johnson</Text>
          </View>
          <Text style={{ color: '#ccc', fontSize: 13, marginBottom: 8 }}>
            Quarterly Sales Presentation Practice
          </Text>

          {/* Stats */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="eye-outline" size={16} color="#aaa" />
            <Text style={{ color: '#aaa', marginLeft: 4, fontSize: 12 }}>127 views</Text>
            <Text style={{ color: '#aaa', marginLeft: 12, fontSize: 12 }}>2 hours ago</Text>
            <Ionicons name="thumbs-up-outline" size={16} color="#24D18F" style={{ marginLeft: 12 }} />
            <Text style={{ color: '#24D18F', marginLeft: 4, fontSize: 12 }}>24</Text>
          </View>
        </View>
      </View>

      {/* More From Community */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>
          More from Community
        </Text>

        {[1, 2].map((item, i) => (
          <View
            key={i}
            style={{
              backgroundColor: '#1C1C3A',
              padding: 12,
              borderRadius: 12,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Image
              source={{ uri: i === 0
                ? 'https://images.unsplash.com/photo-1607746882042-944635dfe10e'
                : 'https://images.unsplash.com/photo-1584467735871-bfb7e616d6a6'
              }}
              style={{ width: 50, height: 50, borderRadius: 10, marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>
                {i === 0 ? 'Interview Practice Session' : 'Spanish Conversation Practice'}
              </Text>
              <Text style={{ color: '#aaa', fontSize: 12 }}>
                {i === 0 ? '4.5 ★ · 28 reviews' : '3.9 ★ · 16 reviews'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Comments & Reviews */}
      <View style={{ marginBottom: 30 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>
          Comments & Reviews
        </Text>

        <TextInput
          placeholder="Share your feedback and review..."
          placeholderTextColor="#888"
          style={{
            backgroundColor: '#1C1C3A',
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
            color: '#fff',
            marginBottom: 12,
          }}
        />

        {/* Star Rating Display */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: '#ccc', fontSize: 13, marginBottom: 4 }}>Rate This Recording</Text>
          <View style={{ flexDirection: 'row', marginBottom: 4 }}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name="star"
                size={18}
                color={i < 4 ? '#FFD700' : '#555'}
                style={{ marginRight: 4 }}
              />
            ))}
          </View>
          <Text style={{ color: '#aaa', fontSize: 13 }}>Overall Rating: 4 out of 5</Text>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: '#8A5CFF',
            borderRadius: 8,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Post Review</Text>
        </TouchableOpacity>
      </View>

      {/* Teacher Feedback */}
      <View
        style={{
          backgroundColor: '#1C1C3A',
          padding: 14,
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Teacher · Michael Chan</Text>
          <Text style={{ color: '#aaa', fontSize: 12 }}>1 hour ago</Text>
        </View>
        <Text style={{ color: '#aaa', fontSize: 13 }}>
          Great presentation! Your confidence shows, and the slide structure is excellent. Consider
          slowing the pace a bit when introducing key points.
        </Text>
      </View>
    </ScrollView>
  );
}
