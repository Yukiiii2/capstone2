import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

// Simple navigation type for basic usage
type NavigationProp = {
  goBack: () => void;
  // Add other navigation methods as needed
};

// Enhanced Background Decorator with more glassmorphism and depth
const BackgroundDecor = () => (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', zIndex: 0 }}>
    <LinearGradient
      colors={["#181C2A", "#232946", "#181C2A"]}
      style={{ flex: 1, position: 'absolute', width: '100%', height: '100%' }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
    {/* Glassy floating shapes */}
    <View style={{ position: 'absolute', top: -60, left: -50, width: 160, height: 160, backgroundColor: '#a78bfa22', borderRadius: 80, filter: 'blur(8px)' }} />
    <View style={{ position: 'absolute', top: 100, right: -40, width: 90, height: 90, backgroundColor: '#a78bfa22', borderRadius: 45, filter: 'blur(8px)' }} />
    <View style={{ position: 'absolute', bottom: 100, left: 50, width: 36, height: 36, backgroundColor: '#a78bfa22', borderRadius: 18, filter: 'blur(8px)' }} />
    <View style={{ position: 'absolute', bottom: 20, right: 40, width: 48, height: 48, backgroundColor: '#a78bfa22', borderRadius: 24, filter: 'blur(8px)' }} />
    <View style={{ position: 'absolute', top: 200, left: 90, width: 20, height: 20, backgroundColor: '#a78bfa22', borderRadius: 10, filter: 'blur(8px)' }} />
    {/* Subtle overlay for extra glass effect */}
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#23294655', borderRadius: 0 }} />
  </View>
);

type NotificationType = 'heart' | 'like' | 'wow' | 'comment';

interface Notification {
  id: string;
  user: string;
  action: string;
  time: string;
  type: NotificationType;
  profilePic: string;
  reactionIcon: keyof typeof Ionicons.glyphMap;
  color: string;
  isRead: boolean;
  role?: string;
  lesson?: string;
}

// Enhanced User Avatar with real image support
const UserAvatar = ({ imageUrl, name, role }: { imageUrl: string; name: string; role?: string }) => (
  <View style={{ position: 'relative' }}>
    <View style={{
      width: 60,
      height: 60,
      borderRadius: 30, // Fully rounded
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.1)',
      backgroundColor: '#232946',
      shadowColor: '#a78bfa',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    }}>
      <Image 
        source={{ uri: imageUrl }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        onError={(error) => console.log('Image load error:', error.nativeEvent.error)}
      />
    </View>
    {role && (
      <View style={{
        position: 'absolute',
        bottom: -8,
        right: -8,
        backgroundColor: '#a78bfa',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
      }}>
        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{role}</Text>
      </View>
    )}
  </View>
);

const NotificationScreen = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      user: 'Alex Johnson',
      action: 'liked your recent speaking exercise',
      time: '2h ago',
      type: 'like',
      profilePic: 'https://randomuser.me/api/portraits/men/32.jpg',
      reactionIcon: 'thumbs-up',
      color: '#3B82F6',
      isRead: false,
      role: 'Teacher',
      lesson: 'Lesson 2: Basic Conversations'
    },
    {
      id: '2',
      user: 'Sarah Chen',
      action: 'commented: "Excellent analysis! Your insights are very thoughtful."',
      time: '5h ago',
      type: 'comment',
      profilePic: 'https://randomuser.me/api/portraits/women/44.jpg',
      reactionIcon: 'chatbubble-ellipses',
      color: '#10B981',
      isRead: false,
      lesson: 'Advanced - Lesson 4',
      role: 'Teacher'
    },
    {
      id: '3',
      user: 'Michael Rodriguez',
      action: 'reacted with ❤️ to your speaking practice',
      time: '1d ago',
      type: 'heart',
      profilePic: 'https://randomuser.me/api/portraits/men/22.jpg',
      reactionIcon: 'heart',
      color: '#EC4899',
      isRead: true,
      role: 'Peer',
      lesson: 'Lesson 5: Speaking Practice'
    },
    {
      id: '4',
      user: 'Emma Wilson',
      action: 'reacted with 😮 to your reading',
      time: '2d ago',
      type: 'wow',
      profilePic: 'https://randomuser.me/api/portraits/women/63.jpg',
      reactionIcon: 'happy-outline',
      color: '#F59E0B',
      isRead: true,
      role: 'Teacher',
      lesson: 'Lesson 3: Advanced Vocabulary'
    },
    {
      id: '5',
      user: 'Maya Chen',
      action: 'commented: "Great content!"',
      time: '12m ago',
      type: 'comment',
      profilePic: 'https://randomuser.me/api/portraits/women/28.jpg',
      reactionIcon: 'chatbubble-ellipses',
      color: '#10B981',
      isRead: false,
      lesson: 'Lesson 2: Basic Grammar',
      role: 'Peer'
    },
    {
      id: '6',
      user: 'Taylor Smith',
      action: 'reacted with ❤️ to your exercise',
      time: '35m ago',
      type: 'heart',
      profilePic: 'https://randomuser.me/api/portraits/women/51.jpg',
      reactionIcon: 'heart',
      color: '#EC4899',
      isRead: false,
      role: 'Peer',
      lesson: 'Lesson 6: Practice Exercises'
    },
    {
      id: '7',
      user: 'Jordan Lee',
      action: 'commented: "Amazing progress! Keep it up!"',
      time: '1h ago',
      type: 'comment',
      profilePic: 'https://randomuser.me/api/portraits/men/45.jpg',
      reactionIcon: 'chatbubble-ellipses',
      color: '#10B981',
      isRead: true,
      role: 'Teacher',
      lesson: 'Lesson 4: Advanced Topics'
    },
    {
      id: '8',
      user: 'Priya Patel',
      action: 'reacted with 😮 to your story',
      time: '2h ago',
      type: 'wow',
      profilePic: 'https://randomuser.me/api/portraits/women/68.jpg',
      reactionIcon: 'happy-outline',
      color: '#F59E0B',
      isRead: false,
      role: 'Peer',
      lesson: 'Lesson 1: Introduction'
    },
    {
      id: '9',
      user: 'Carlos Mendez',
      action: 'liked your latest post',
      time: '3h ago',
      type: 'like',
      profilePic: 'https://randomuser.me/api/portraits/men/52.jpg',
      reactionIcon: 'thumbs-up',
      color: '#3B82F6',
      isRead: true,
      lesson: 'Lesson 3: Vocabulary Builder',
      role: 'Teacher'
    }
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
  };

  const renderNotificationItem = (notification: Notification) => {
    const { id, user, action, time, profilePic, reactionIcon, color, isRead, role, lesson } = notification;
    
    return (
      <TouchableOpacity 
        key={id}
        style={[styles.notificationItem, !isRead && styles.unreadNotification]}
        onPress={() => markAsRead(id)}
      >
        <UserAvatar imageUrl={profilePic} name={user} role={role} />
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>
            <Text style={styles.userName}>{user} </Text>
            {action}
          </Text>
          {lesson && (
            <View style={styles.lessonLabel}>
              <Text style={styles.lessonText}>{lesson}</Text>
            </View>
          )}
          <Text style={styles.timeText}>{time}</Text>
        </View>
        <Ionicons 
          name={reactionIcon} 
          size={24} 
          color={color} 
          style={styles.reactionIcon} 
        />
        {!isRead && <View style={styles.unreadBadge} />}
      </TouchableOpacity>
    );
  };

  if (notifications.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#181C2A' }}>
        <BackgroundDecor />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Ionicons name="notifications-off-outline" size={60} color="#64748B" style={{ opacity: 0.7 }} />
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 16 }}>No notifications yet</Text>
          <Text style={{ color: '#b0b6c3', textAlign: 'center', marginTop: 8, fontSize: 16 }}>
            When you get notifications, they'll appear here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181C2A' }}>
      <BackgroundDecor />
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40, paddingHorizontal: 8, maxWidth: 600, alignSelf: 'center', width: '100%' }}
        >
          {/* Header - Now part of the scrollable content */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, paddingTop: 20, width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ backgroundColor: 'transparent', borderRadius: 16, padding: 8, marginRight: 12 }}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginLeft: 4 }}>Notifications</Text>
            </View>
          </View>
          {notifications.map((notification) => renderNotificationItem(notification))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  notificationItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(35, 41, 70, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  unreadNotification: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#a78bfa',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 16,
  },
  lessonLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  lessonText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  notificationText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  userName: {
    fontWeight: '600' as const,
    color: '#fff',
  },
  timeText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  reactionIcon: {
    marginLeft: 12,
  },
  unreadBadge: {
    position: 'absolute' as const,
    right: 16,
    top: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
});

export default NotificationScreen;