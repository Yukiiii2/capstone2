import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define types for our notifications
type NotificationType = 'rate' | 'comment' | 'like' | 'dislike' | 'follow';

interface Notification {
  id: number;
  type: NotificationType;
  user: string;
  action: string;
  time: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}

const NotificationScreen = () => {
  const notifications: Notification[] = [
    {
      id: 1,
      type: 'rate',
      user: 'Xan',
      action: 'rated your post',
      time: '5 minutes ago',
      icon: 'star',
      color: '#F59E0B'
    },
    {
      id: 2,
      type: 'comment',
      user: 'Ashley',
      action: 'commented on your post',
      time: '5 minutes ago',
      icon: 'chatbubble-ellipses',
      color: '#3B82F6'
    },
    {
      id: 3,
      type: 'like',
      user: 'Jane',
      action: 'liked your post',
      time: '8 minutes ago',
      icon: 'heart',
      color: '#EF4444'
    },
    {
      id: 4,
      type: 'dislike',
      user: 'Mike',
      action: 'disliked your post',
      time: '12 minutes ago',
      icon: 'thumbs-down',
      color: '#6366F1'
    },
    {
      id: 5,
      type: 'follow',
      user: 'Sarah',
      action: 'started following you',
      time: '15 minutes ago',
      icon: 'person-add',
      color: '#10B981'
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white px-6 py-5 shadow-sm border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">NOTIFICATION</Text>
        <Text className="text-gray-500 mt-1">Your recent activities</Text>
      </View>

      <ScrollView className="flex-1 px-5 py-4">
        {notifications.map((notification) => (
          <View 
            key={notification.id} 
            className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
          >
            <View className="flex-row items-start">
              {/* Icon */}
              <View 
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: `${notification.color}15` }}
              >
                <Ionicons 
                  name={notification.icon} 
                  size={24} 
                  color={notification.color} 
                />
              </View>
              
              {/* Content */}
              <View className="flex-1">
                <Text className="text-gray-900 text-base font-semibold">
                  <Text className="font-bold">{notification.user} </Text>
                  {notification.action}
                </Text>
                <Text className="text-gray-400 text-sm mt-1">
                  {notification.time}
                </Text>
              </View>
              
              {/* Action indicator */}
              <View className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="bg-white border-t border-gray-200 px-6 py-3 flex-row justify-between">
        <TouchableOpacity className="items-center">
          <Ionicons name="notifications" size={24} color="#3B82F6" />
          <Text className="text-blue-500 text-xs mt-1">Notifications</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="items-center">
          <Ionicons name="home" size={24} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs mt-1">Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="items-center">
          <Ionicons name="person" size={24} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs mt-1">Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default NotificationScreen;