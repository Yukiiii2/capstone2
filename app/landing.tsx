import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router'; // ✅ import Link from expo-router

export default function Landing() {
  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: '#0A0A1E',
        paddingHorizontal: 20,
        paddingVertical: 32,
      }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
            Fluen<Text style={{ color: '#8A5CFF' }}>Tech</Text>
          </Text>
        </View>

        {/* ✅ Navigation Button */}
        <Link href="/create-account" asChild>
          <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 4, backgroundColor: '#8A5CFF', borderRadius: 999 }}>
            <Text style={{ color: '#fff', fontSize: 14 }}>Get Started</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Hero */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>
          Master{'\n'}Communication &{'\n'}
          <Text style={{ color: '#8A5CFF' }}>Reading Skills</Text>
        </Text>
        <Text style={{ color: '#8A8A9E', fontSize: 14, marginBottom: 16, lineHeight: 20 }}>
          Transform your communication abilities with our AI powered learning tools and real-time guidance
        </Text>
        <TouchableOpacity style={{ backgroundColor: '#8A5CFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, width: 180 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Start Learning</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 }}>
        {[
          ['50K+', 'Students'],
          ['95%', 'Success Rate'],
          ['4.8/5', 'Rating'],
          ['100+', 'Exercises'],
        ].map(([num, label], idx) => (
          <View key={idx} style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{num}</Text>
            <Text style={{ color: '#8A8A9E', fontSize: 12 }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Communication Dashboard Preview */}
      <View style={{ backgroundColor: '#1C1C3A', borderRadius: 16, height: 180, marginBottom: 32 }}>
        <Text style={{ color: '#fff', fontSize: 20, padding: 16 }}>Communication Dashboard</Text>
      </View>

      {/* Features */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
          Everything You Need to Excel
        </Text>
        <View style={{ flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
          {[
            ['Reading Comprehension', 'book'],
            ['Speech Training', 'mic'],
            ['Word Confidence', 'star'],
            ['Critical Training', 'bulb'],
            ['Conversation Practice', 'chatbubbles'],
            ['Speed Reading', 'flash'],
          ].map(([label, icon], idx) => (
            <View key={idx} style={{ backgroundColor: '#1C1C3A', borderRadius: 16, width: '47%', padding: 16, height: 100 }}>
              <Ionicons name={icon as any} size={24} color="#8A5CFF" style={{ marginBottom: 8 }} />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Testimonials */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
          What Our Learners Say
        </Text>
        <View style={{ backgroundColor: '#1C1C3A', padding: 16, borderRadius: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/100' }}
              style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
            />
            <Text style={{ color: '#fff', fontWeight: '600' }}>John Doe</Text>
          </View>
          <Text style={{ color: '#8A8A9E', fontSize: 14, fontStyle: 'italic' }}>
            "Very useful tool to enhance my communication skills"
          </Text>
        </View>
      </View>

      {/* Pricing */}
      <View>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
          Choose Your Plan
        </Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {[
            {
              title: 'FREE',
              price: '$0',
              features: ['3 Basic Lessons', 'Limited Feedback', 'Basic Tools', 'Reading Tests'],
            },
            {
              title: 'PREMIUM',
              price: '$29',
              features: ['Unlimited Lessons', 'Detailed Feedback', 'All Premium Tools', 'AI Analysis', 'Speech Recognition', 'Progress Tracking', 'Priority Support', '24/7 Support'],
            },
          ].map((plan, idx) => (
            <View
              key={idx}
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 16,
                backgroundColor: plan.title === 'FREE' ? '#1C1C3A' : '#8A5CFF',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>{plan.title}</Text>
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>{plan.price}</Text>
              {plan.features.map((feature, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fff', fontSize: 14 }}>{feature}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={{
                  backgroundColor: plan.title === 'FREE' ? '#8A5CFF' : '#fff',
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 16,
                }}
              >
                <Text
                  style={{
                    color: plan.title === 'FREE' ? '#fff' : '#1C1C3A',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  {plan.title === 'FREE' ? 'Get Started' : 'Upgrade Now'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
