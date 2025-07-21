import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomePage() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Fluentech</Text>
        <View style={styles.headerIcons}>
          <Ionicons name="notifications-outline" size={20} color="#fff" />
          <View style={styles.avatar} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {['Overview', 'Exercise Speaking', 'Exercise Reading', 'Community'].map((label, idx) => (
          <Text
            key={idx}
            style={[
              styles.tabText,
              idx === 0 ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      {/* Welcome Message */}
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>Welcome back, Sarah!</Text>
        <Text style={styles.welcomeSubtitle}>
          Track your progress and continue improving your communication skills.
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>2</Text>
            <Text style={styles.statsLabel}>Upcoming Sessions</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>8</Text>
            <Text style={styles.statsLabel}>Completed Modules</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsScoreLabel}>Overall Score</Text>
            <Text style={styles.statsScore}>78%</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.quickActionsTitle}>Quick Actions</Text>
      <View style={styles.quickActionsRow}>
        <View style={styles.quickActionCard}>
          <Text style={styles.quickActionLabel}>SPEAKING EXERCISE</Text>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionButtonText}>START</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.quickActionCard}>
          <Text style={styles.quickActionLabel}>READING EXERCISES</Text>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionButtonText}>START</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.quickActionsRowBottom}>
        <View style={styles.quickActionCard}>
          <Text style={styles.quickActionLabel}>PEER REVIEW</Text>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionButtonText}>Proceed</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.quickActionCard}>
          <Text style={styles.quickActionLabel}>Live Session</Text>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionButtonText}>Proceed</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Cards */}
      <View style={styles.progressCards}>
        {[
          { title: 'Public Speaking Fundamentals', progress: 75 },
          { title: 'Voice Modulation', progress: 60 },
          { title: 'Voice Modulation', progress: 90 },
        ].map((item, index) => (
          <View key={index} style={styles.progressCard}>
            <Text style={styles.progressCardTitle}>{item.title}</Text>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${item.progress}%` },
                ]}
              />
            </View>
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
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    backgroundColor: '#D1D5DB',
    borderRadius: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    textDecorationLine: 'underline',
  },
  tabTextInactive: {
    color: '#8A8A9E',
  },
  welcomeCard: {
    backgroundColor: '#1C1C3A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: '#8A8A9E',
    fontSize: 12,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsItem: {
    alignItems: 'center',
  },
  statsNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsLabel: {
    color: '#8A8A9E',
    fontSize: 12,
  },
  statsScoreLabel: {
    color: '#fff',
    fontSize: 14,
  },
  statsScore: {
    color: '#7F9CFF',
    fontWeight: '600',
  },
  quickActionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickActionsRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionCard: {
    backgroundColor: '#1C1C3A',
    borderRadius: 16,
    padding: 12,
    width: '48%',
  },
  quickActionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  quickActionButton: {
    backgroundColor: '#8A5CFF',
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickActionButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  progressCards: {
    marginBottom: 24,
  },
  progressCard: {
    marginBottom: 16,
  },
  progressCardTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#2A2A4D',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    backgroundColor: '#8A5CFF',
    height: 8,
    borderRadius: 8,
  },
});
