import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LiveVideoRecording() {
  return (
    <View className="flex-1 bg-[#0A0A1E]">
      {/* Decorative Circles */}
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 rounded-full bg-violet-600 opacity-15" />
      <View className="absolute top-[100px] right-[-40px] w-24 h-24 rounded-full bg-blue-600 opacity-10" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 rounded-full bg-cyan-300 opacity-10" />
      <View className="absolute bottom-5 right-10 w-15 h-15 rounded-full bg-purple-400 opacity-10" />
      <View className="absolute top-[200px] left-[90px] w-6 h-6 rounded-full bg-cyan-300 opacity-10" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-8 pb-3">
          <View className="flex-row items-center">
            <View className="w-7 h-7 rounded-full bg-purple-500 mr-2" />
            <Text className="text-white text-xl font-bold">Fluentech</Text>
          </View>
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity className="bg-[#231942] px-2 py-1 rounded-xl">
              <Ionicons name="search" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#231942] px-2 py-1 rounded-xl">
              <Ionicons name="notifications-outline" size={18} color="#fff" />
            </TouchableOpacity>
            <View className="w-8 h-8 rounded-full ml-1 bg-white/20 border border-white/10 items-center justify-center">
              <Image
                source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                className="w-7 h-7 rounded-full"
              />
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row px-4 mb-5">
          <View className="px-3 py-1 rounded-lg mr-2 bg-[#231942]">
            <Text className="text-purple-400 font-bold">Overview</Text>
          </View>
          <View className="px-3 py-1 rounded-lg mr-2 bg-[#18182A]">
            <Text className="text-white/80 font-semibold">Exercise Speaking</Text>
          </View>
          <View className="px-3 py-1 rounded-lg mr-2 bg-[#18182A]">
            <Text className="text-white/80 font-semibold">Exercise Reading</Text>
          </View>
          <View className="px-3 py-1 rounded-lg bg-[#18182A]">
            <Text className="text-white/80 font-semibold">Community</Text>
          </View>
        </View>

        {/* Main Title & Subtitle */}
        <Text className="text-white text-2xl font-bold px-4 mb-1">Live Video Recording</Text>
        <Text className="text-gray-300 px-4 mb-4">
          Record yourself and get AI-powered feedback to improve your presentation skills
        </Text>

        {/* Video Card */}
        <View className="mx-4 bg-white rounded-2xl shadow-lg mb-6">
          {/* Top status bar */}
          <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={15} color="#6366F1" />
              <Text className="text-xs text-gray-700 ml-1 mr-4">Audience: 25 people</Text>
              <Ionicons name="mic" size={13} color="#22c55e" />
              <Text className="text-xs text-gray-700 ml-1">Audio: Active</Text>
            </View>
          </View>
          {/* Video Image Frame */}
          <View className="w-full h-52 bg-gray-200 relative items-center justify-center overflow-hidden">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1601933470928-c5d8f308b2ee' }}
              className="w-full h-52"
              resizeMode="cover"
            />
            <TouchableOpacity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-violet-500 w-14 h-14 rounded-full items-center justify-center opacity-95 border-4 border-white">
              <Ionicons name="videocam" size={32} color="#fff" />
            </TouchableOpacity>
            <Text className="absolute bottom-3 self-center text-white text-xs bg-black/50 px-4 py-1 rounded-lg">
              Click to start live session
            </Text>
          </View>
          {/* End Live Button & Reactions */}
          <View className="flex-row items-center justify-between px-4 py-2">
            <TouchableOpacity className="bg-red-500 px-5 py-2 rounded-lg">
              <Text className="text-white font-bold text-sm">End Live</Text>
            </TouchableOpacity>
            <View className="flex-row items-center space-x-5">
              <View className="flex-row items-center">
                <Ionicons name="heart" size={16} color="#FF4F4F" />
                <Text className="ml-1 text-gray-800 font-bold text-xs">24</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="eye" size={16} color="#6366F1" />
                <Text className="ml-1 text-gray-800 font-bold text-xs">12</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="thumbs-up" size={16} color="#22c55e" />
                <Text className="ml-1 text-gray-800 font-bold text-xs">89</Text>
              </View>
            </View>
          </View>
        </View>

        {/* AI Speech Analysis Section */}
        <View className="mx-4 bg-white rounded-2xl p-5 mb-10">
          <Text className="text-gray-900 font-bold text-base mb-3">AI Speech Analysis</Text>
          <View className="space-y-2">
            {[
              '“Pronunciation is good, keep it up!”',
              '“Try slowing down slightly for better clarity.”',
              '“Pace is a bit fast, consider pausing slightly.”',
              '“Focus on reducing hesitation.”',
            ].map((tip, idx) => (
              <View key={idx} className="bg-gray-100 rounded-xl px-4 py-3">
                <Text className="text-gray-700 text-xs">{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
