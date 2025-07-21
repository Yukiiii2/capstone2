import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { GraduationCap, User } from 'lucide-react-native';

export default function RoleSelection() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* App name + Tagline */}
      <View style={styles.header}>
        <Text style={styles.appName}>Fluentech</Text>
        <Text style={styles.tagline}>Choose Your Path</Text>
        <Text style={styles.description}>
          Experience the future of communication{'\n'}learning with AI-powered personalization
        </Text>
      </View>

      {/* Student Section */}
      <View style={styles.section}>
        <View style={styles.iconContainer}>
          <GraduationCap size={32} color="#8A5CFF" />
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/create-account')}
        >
          <Text style={styles.buttonText}>Select Student</Text>
        </TouchableOpacity>
        {[
          'AI-powered speech analysis',
          'Real-time progress tracking',
          'Live Video Practice and Community Feedback',
          'Neural feedback system',
        ].map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Teacher Section */}
      <View style={styles.section}>
        <View style={styles.iconContainer}>
          <User size={32} color="#8A5CFF" />
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/create-account')} // or change path if separate logic
        >
          <Text style={styles.buttonText}>Select Teacher</Text>
        </TouchableOpacity>
        {[
          'Advanced analytics dashboard',
          'Smart classroom management',
          'Live Video Practice and Community Feedback',
          'Tracking and monitoring',
        ].map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1E',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 4,
  },
  tagline: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
  },
  description: {
    color: '#AFAFC0',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#1C1C3A',
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#8A5CFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureDot: {
    width: 8,
    height: 8,
    marginTop: 8,
    marginRight: 8,
    borderRadius: 999,
    backgroundColor: '#8A5CFF',
  },
  featureText: {
    color: '#fff',
    fontSize: 14,
  },
});