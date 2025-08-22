import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
// Navigation hook
const { useNavigation } = require('@react-navigation/native');

// Simple navigation type for basic usage
type NavigationProp = {
  goBack: () => void;
  // Add other navigation methods as needed
};

// Background Decorator Component
const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#0F172A"]}
        className="flex-1"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
  </View>
);

type NotificationType = 'like' | 'comment' | 'wow' | 'heart';

interface Notification {
  id: number;
  type: NotificationType;
  user: string;
  action: string;
  time: string;
  profilePic: keyof typeof Ionicons.glyphMap;
  reactionIcon?: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  isRead: boolean;
}

// Custom avatar component with better styling
const UserAvatar = ({ icon, color }: { icon: keyof typeof Ionicons.glyphMap; color: string }) => (
  <View className="relative">
    <View className="w-16 h-16 rounded-2xl bg-gray-800/50 items-center justify-center border-2 border-white/10">
      <Ionicons name={icon} size={28} color="#FFFFFF" />
    </View>
  </View>
);

const NotificationScreen = () => {
  const navigation: NavigationProp = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'wow',
      user: 'Xan',
      action: 'wow your video',
      time: '2 minutes ago',
      profilePic: 'person-outline',
      reactionIcon: 'happy-outline',
      color: '#F59E0B',
      isRead: false
    },
    {
      id: 2,
      type: 'heart',
      user: 'Ash',
      action: 'heart your video',
      time: '5 minutes ago',
      profilePic: 'person-outline',
      reactionIcon: 'heart',
      color: '#EF4444',
      isRead: false
    },
    {
      id: 3,
      type: 'like',
      user: 'Jay',
      action: 'liked your video',
      time: '8 minutes ago',
      profilePic: 'person-outline',
      reactionIcon: 'thumbs-up',
      color: '#3B82F6',
      isRead: true
    },
    {
      id: 4,
      type: 'comment',
      user: 'Maya',
      action: 'commented: "Great content!"',
      time: '12 minutes ago',
      profilePic: 'person-outline',
      reactionIcon: 'chatbubble-ellipses',
      color: '#10B981',
      isRead: false
    },
    {
      id: 5,
      type: 'like',
      user: 'Sarah',
      action: 'liked your post',
      time: '15 minutes ago',
      profilePic: 'person-outline',
      reactionIcon: 'thumbs-up',
      color: '#3B82F6',
      isRead: true
    },
    {
      id: 6,
      type: 'wow',
      user: 'Alex',
      action: 'wow your story',
      time: '25 minutes ago',
      profilePic: 'person-outline',
      reactionIcon: 'happy-outline',
      color: '#F59E0B',
      isRead: false
    },
    {
      id: 7,
      type: 'heart',
      user: 'Taylor',
      action: 'loved your post',
      time: '35 minutes ago',
      profilePic: 'person-outline',
      reactionIcon: 'heart',
      color: '#EF4444',
      isRead: false
    },
    {
      id: 8,
      type: 'like',
      user: 'Jordan',
      action: 'liked your comment',
      time: '45 minutes ago',
      profilePic: 'person-outline',
      reactionIcon: 'thumbs-up',
      color: '#3B82F6',
      isRead: true
    },
    {
      id: 9,
      type: 'comment',
      user: 'Riley',
      action: 'replied: "Amazing work!"',
      time: '55 minutes ago',
      profilePic: 'person-outline',
      reactionIcon: 'chatbubble-ellipses',
      color: '#10B981',
      isRead: false
    },
    {
      id: 10,
      type: 'like',
      user: 'Casey',
      action: 'liked your photo',
      time: '1 hour ago',
      profilePic: 'person-outline',
      reactionIcon: 'thumbs-up',
      color: '#3B82F6',
      isRead: true
    }
  ]);

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  if (notifications.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#0F172A]">
        <BackgroundDecor />
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="notifications-off-outline" size={60} color="#64748B" />
          <Text className="text-xl font-bold text-white mt-4">No notifications yet</Text>
          <Text className="text-gray-400 text-center mt-2">
            When you get notifications, they'll appear here
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0F172A]">
      <BackgroundDecor />
      
      <View className="flex-1 px-4 pt-4">
        {/* Back Button */}
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          className="p-2 top-4 left mb-4 bg-white/10 rounded-full w-12 h-12 items-center justify-center ml-2"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View className="w-full max-w-2xl mx-auto">
          {/* Notification Container */}
          <View className="bg-white/10 top-6 backdrop-blur-2xl rounded-3xl p-6 h-[85vh] w-full border border-white/20 shadow-2xl shadow-black/40">
            <Text className="text-3xl font-bold text-white mb-6">Notifications</Text>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                onPress={() => markAsRead(notification.id)}
                activeOpacity={0.8}
                className="mb-3 last:mb-0"
              >
                <View 
                  className={`bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-5 border-l-4 ${
                    notification.isRead 
                      ? 'border-l-transparent' 
                      : 'border-l-violet-500/80'
                  } shadow-lg shadow-black/30`}
                >
                  <View className="flex-row items-start">
                    <View className="relative">
                      <UserAvatar icon={notification.profilePic} color={notification.color} />
                      <View 
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full items-center justify-center border-2 border-gray-900"
                        style={{ backgroundColor: notification.color }}
                      >
                        <Ionicons 
                          name={notification.reactionIcon} 
                          size={12} 
                          color="#FFF"
                          style={{
                            textShadowColor: 'rgba(0,0,0,0.2)',
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 2,
                          }}
                        />
                      </View>
                    </View>
                    <View className="flex-1 ml-4">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <Text className="text-white text-base font-semibold">
                            <Text className="font-bold text-white">{notification.user} </Text>
                            <Text className="text-gray-300 font-normal">{notification.action}</Text>
                          </Text>
                          <View className="flex-row items-center mt-1 space-x-2">
                            <Text className="text-xs text-gray-400">{notification.time}</Text>
                            {!notification.isRead && (
                              <View className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            )}
                          </View>
                        </View>
                        <View className="p-2 -mt-2 -mr-2">
                          <Ionicons 
                            name="ellipsis-vertical" 
                            size={16} 
                            color="#6B7280"
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NotificationScreen;