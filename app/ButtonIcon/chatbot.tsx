import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  Alert,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'tip' | 'image';
  imageUri?: string;
};

const ChatBot = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm ANG, your AI speaking and reading assistant. I'm here to help you master public speaking techniques, improve your reading skills, and build confidence in communication. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [fadeAnim]);

  const quickSuggestions = [
    { icon: 'mic-outline', text: 'Speech anxiety', category: 'speaking' },
    { icon: 'book-outline', text: 'Reading speed', category: 'reading' },
    { icon: 'people-outline', text: 'Public speaking', category: 'speaking' },
    { icon: 'school-outline', text: 'Comprehension', category: 'reading' },
  ];

  const dummyResponses = [
    "That's a great question! Let me help you with that. 🤔",
    "I understand your concern. Here's what I recommend based on my experience coaching thousands of students... 💡",
    "Excellent point! This is actually a common challenge I see with my students. Let me share some proven techniques... 🎯",
    "You're on the right track! Building these skills takes practice, but I'm here to guide you every step of the way. 🌟",
  ];

  const getRandomDummyResponse = (): string => {
    return dummyResponses[Math.floor(Math.random() * dummyResponses.length)];
  };

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (Math.random() < 0.3) {
      return getRandomDummyResponse();
    }
    
    if (lowerMessage.includes('anxiety') || lowerMessage.includes('nervous')) {
      return "I understand speaking anxiety is common! Here are some proven techniques:\n\n• Practice deep breathing exercises before speaking 🫁\n• Start with small groups and gradually increase audience size 👥\n• Prepare thoroughly - knowing your content builds confidence 📝\n• Use positive visualization techniques 🧠\n• Remember: your audience wants you to succeed! 💪\n\nWould you like me to guide you through a breathing exercise?";
    }
    
    if (lowerMessage.includes('public speaking') || lowerMessage.includes('presentation')) {
      return "Great question! Here are my top public speaking tips:\n\n🎯 Structure: Use the Rule of 3 (intro, 3 main points, conclusion)\n🗣️ Voice: Vary your pace, tone, and volume\n👁️ Eye Contact: Connect with different sections of your audience\n✋ Gestures: Use purposeful hand movements\n⏸️ Pauses: Strategic silence is powerful\n\nWhich aspect would you like to practice first?";
    }
    
    if (lowerMessage.includes('reading speed') || lowerMessage.includes('read faster')) {
      return "Excellent! Let's boost your reading speed:\n\n📖 Techniques to try:\n• Minimize subvocalization (silent pronunciation) 🤫\n• Use a pointer or finger to guide your eyes 👆\n• Practice chunking - read groups of words 📦\n• Eliminate regression (re-reading) ↩️\n• Set reading goals and track progress 📊\n\nCurrent average: 200-300 WPM. With practice, you can reach 400-600 WPM! Want to try a speed reading exercise?";
    }
    
    if (lowerMessage.includes('comprehension') || lowerMessage.includes('understand')) {
      return "Reading comprehension is key! Here's my proven strategy:\n\n🧠 The SQ3R Method:\n• Survey: Preview the text 👀\n• Question: Ask what you want to learn ❓\n• Read: Active reading with focus 📚\n• Recite: Summarize in your own words 🗣️\n• Review: Reinforce key concepts 🔄\n\n💡 Pro tip: Take notes and connect new info to what you already know. Shall we practice with a text?";
    }
    
    if (lowerMessage.includes('image') || lowerMessage.includes('picture') || lowerMessage.includes('photo')) {
      return "Great! I can help analyze images related to speaking and reading:\n\n📸 I can help with:\n• Body language analysis in photos 🕺\n• Reading posture assessment 📖\n• Presentation slide reviews 🖼️\n• Text recognition for reading practice 📝\n\nFeel free to share any images and I'll provide personalized feedback!";
    }
    
    if (lowerMessage.includes('practice') || lowerMessage.includes('exercise')) {
      return "Perfect! I have interactive exercises for both speaking and reading:\n\n🎤 Speaking Practice:\n• Tongue twisters for articulation 👅\n• Impromptu speaking challenges ⚡\n• Voice modulation exercises 🎵\n\n📚 Reading Practice:\n• Speed reading drills ⚡\n• Comprehension quizzes 🧩\n• Vocabulary builders 📝\n\nWhat would you like to start with?";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return "I'm here to help you excel! I specialize in:\n\n🗣️ Speaking Skills:\n• Overcoming stage fright 😰➡️😎\n• Voice projection & clarity 📢\n• Persuasive communication 💬\n• Body language mastery 🕺\n\n📖 Reading Skills:\n• Speed reading techniques ⚡\n• Comprehension strategies 🧠\n• Critical thinking 🤔\n• Retention methods 🧠💾\n\nWhat specific challenge are you facing?";
    }
    
    const defaultResponses = [
      "That's an interesting point! As your speaking and reading assistant, I'm always here to help you improve. Whether it's building confidence for your next presentation or enhancing your reading skills, I've got personalized strategies for you. What specific area would you like to work on today? 🎯",
      "I love your curiosity! Communication is such a fascinating field. Tell me more about what you're working on - I might have some specific techniques that could really help you out! 💫",
      "You know, every great speaker and reader started exactly where you are now. I'm excited to help you on this journey! What's your biggest challenge right now? 🌟",
      "That's a thoughtful question! I've worked with students at all levels, and there's always something new to learn. What aspect of speaking or reading interests you most? 🤔"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    const thinkingTime = Math.random() * 2000 + 1000;
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(inputText),
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, thinkingTime);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to share images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageMessage: Message = {
          id: Date.now().toString(),
          text: '',
          isUser: true,
          timestamp: new Date(),
          type: 'image',
          imageUri: result.assets[0].uri,
        };

        setMessages(prev => [...prev, imageMessage]);
        setIsTyping(true);

        setTimeout(() => {
          const imageResponses = [
            "Great image! 📸 I can see this relates to presentation skills. Let me analyze this for you and provide some specific feedback... 🔍",
            "Interesting photo! 🖼️ This looks like it could be useful for practicing reading posture or speaking stance. Here's what I notice... 👀",
            "Thanks for sharing this image! 📷 I can help you analyze body language, reading setup, or presentation materials. Let me take a closer look... 🧐",
          ];
          
          const aiResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: imageResponses[Math.floor(Math.random() * imageResponses.length)],
            isUser: false,
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, aiResponse]);
          setIsTyping(false);
        }, 2000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const sendQuickMessage = (suggestion: string) => {
    setInputText(suggestion);
    setTimeout(() => sendMessage(), 100);
  };

  const renderMessage = useCallback((message: Message) => (
    <View
      key={message.id}
      className={`mb-3 ${message.isUser ? 'items-end' : 'items-start'}`}
    >
      <View className={`max-w-[85%] ${message.isUser ? 'bg-indigo-600' : 'bg-gray-800/90'} rounded-2xl p-4`}>
        {!message.isUser && (
          <View className="flex-row items-center mb-2">
            <View className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full items-center justify-center mr-2">
              <Text className="text-white text-xs font-bold">A</Text>
            </View>
            <Text className="text-indigo-400 text-xs font-semibold">ANG • Speaking & Reading Assistant</Text>
          </View>
        )}
        
        {message.type === 'image' && message.imageUri && (
          <View className="mb-2">
            <Image 
              source={{ uri: message.imageUri }} 
              className="w-full h-48 rounded-xl"
              resizeMode="cover"
            />
            {message.text && (
              <Text className={`${message.isUser ? 'text-white' : 'text-gray-100'} text-base leading-6 mt-2`}>
                {message.text}
              </Text>
            )}
          </View>
        )}
        
        {message.type !== 'image' && (
          <Text className={`${message.isUser ? 'text-white' : 'text-gray-100'} text-base leading-6`}>
            {message.text}
          </Text>
        )}
        
        <Text className={`${message.isUser ? 'text-indigo-200' : 'text-gray-500'} text-xs mt-2`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  ), []);

  return (
    <View className="flex-1 bg-gray-950">
      <StatusBar barStyle="light-content" backgroundColor="#4c1d95" translucent />
      
      {/* Header */}
      <LinearGradient
        colors={['#5b21b6', '#7c3aed', '#5b21b6']}
        className="px-5 pt-4 pb-3 rounded-b-2xl shadow-2xl"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-9 h-9 bg-white/10 rounded-full items-center justify-center mr-3"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text className="text-white text-xl font-bold">Speak with ANG</Text>
              <Text className="text-indigo-200 text-xs">Your AI Speaking & Reading Assistant</Text>
            </View>
          </View>
          <TouchableOpacity 
            className="w-9 h-9 bg-white/10 rounded-full items-center justify-center"
            activeOpacity={0.7}
            onPress={() => setShowInfoModal(true)}
          >
            <Ionicons name="information-circle-outline" size={20} color="#fff" />
          </TouchableOpacity>
          
          {/* Info Modal */}
          <Modal
            visible={showInfoModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowInfoModal(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowInfoModal(false)}>
              <View className="flex-1 bg-black/50 justify-center items-center p-4">
                <TouchableWithoutFeedback>
                  <View className="bg-[#1A1F2E]/95 backdrop-blur-xl rounded-2xl w-full max-w-md overflow-hidden">
                    <View className="p-6">
                      <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-2xl font-bold text-violet-500/80">Speak with ANG</Text>
                        <TouchableOpacity 
                          onPress={() => setShowInfoModal(false)}
                          className="p-1"
                        >
                          <Ionicons name="close" size={24} color="#6b7280" />
                        </TouchableOpacity>
                      </View>
                      
                      <Text className="text-white text-base mb-6 leading-6">
                        Your dedicated assistant for mastering reading and speaking skills. I'm here to help you become a more confident and effective communicator.
                      </Text>
                      
                      <View className="bg-white/10 backdrop-blur-lg border border-white/10 p-4 rounded-2xl mb-6 shadow-lg">
                        <Text className="text-white/90 font-semibold text-base mb-3">I can help with:</Text>
                        <View className="space-y-3">
                          {[
                            'Public speaking techniques & confidence',
                            'Reading comprehension & speed',
                            'Speech writing & delivery',
                            'Communication skills development'
                          ].map((item, index) => (
                            <View key={index} className="flex-row items-start">
                              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginTop: 2, marginRight: 10 }} />
                              <Text className="text-white text-base flex-1">{item}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      
                      <View className="bg-gradient-to-r from-violet-500/30 to-indigo-500/30 backdrop-blur-lg border border-white/10 p-4 rounded-2xl shadow-lg">
                        <View className="flex-row items-start">
                          <Ionicons name="information-circle" size={20} color="rgba(255,255,255,0.8)" style={{ marginRight: 10, marginTop: 2 }} />
                          <Text className="text-white/90 text-sm flex-1 leading-5">
                            For the best experience, please keep questions related to reading and speaking topics.
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View className=" px-6 py-4">
                      <TouchableOpacity 
                        onPress={() => setShowInfoModal(false)}
                        className="bg-violet-500/80 py-3 rounded-xl items-center justify-center"
                        activeOpacity={0.8}
                      >
                        <Text className="text-white font-medium text-base">Got it!</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 85 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-3"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 15 }}
        >
          {messages.map(renderMessage)}
          
          {isTyping && (
            <View className="items-start mb-4">
              <View className="bg-gray-800/90 rounded-2xl p-3 max-w-[85%] shadow-sm">
                <View className="flex-row items-center">
                  <View className="w-6 h-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full items-center justify-center mr-2 shadow">
                    <Text className="text-white text-xs font-bold">A</Text>
                  </View>
                  <Text className="text-indigo-300 text-xs font-medium">ANG is thinking...</Text>
                </View>
                <View className="flex-row space-x-1.5 mt-2 ml-8">
                  {[0, 1, 2].map((i) => (
                    <View
                      key={i}
                      className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                      style={{ opacity: 0.5 + (i * 0.2) }}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}
          
          {/* Privacy Message - Moved inside chat area */}
          <View className="items-center px-4 py-2">
            <View className="flex-row items-center bg-white/10 border border-gray-700/20 backdrop-blur-xl rounded-full px-3 py-1.5">
              <Ionicons name="shield-checkmark" size={12} color="#A78BFA" />
              <Text className="text-gray-400 text-[11px] font-medium ml-1.5">
                Your conversations with ANG are private and secure
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Quick Suggestions */}
        {messages.length === 1 && (
          <View className="px-4 py-3 bg-gray-900/80 border-t border-gray-800/50">
            <Text className="text-gray-400 text-xs font-medium mb-2 ml-1">QUICK SUGGESTIONS</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 15 }}
            >
              <View className="flex-row space-x-2">
                {quickSuggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => sendQuickMessage(suggestion.text)}
                    className="bg-gray-800/80 border border-gray-700/50 rounded-xl px-3 py-2 flex-row items-center"
                    activeOpacity={0.8}
                  >
                    <View className="w-5 h-5 bg-indigo-500/20 rounded-full items-center justify-center mr-1.5">
                      <Ionicons name={suggestion.icon as any} size={12} color="#A78BFA" />
                    </View>
                    <Text className="text-gray-200 text-xs font-medium">{suggestion.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Input Area */}
        <View className="px-4 py-3 border-t border-gray-800/70 bg-gray-900/95">
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={pickImage}
              className="w-9 h-9 bg-gray-800/80 rounded-xl items-center justify-center border border-gray-700/50"
              activeOpacity={0.8}
            >
              <Ionicons name="image-outline" size={18} color="#A78BFA" />
            </TouchableOpacity>
            
            <View className="flex-1 bg-gray-800/80 rounded-xl border border-gray-700/50 px-3 py-1 min-h-[40px] justify-center">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Please type you questions..."
                placeholderTextColor="#6B7280"
                className="text-white text-sm leading-5"
                multiline
                textAlignVertical="center"
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                style={{ maxHeight: 80 }}
              />
            </View>
            
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim()}
              className={`w-9 h-9 rounded-xl items-center justify-center ${
                inputText.trim() 
                  ? 'bg-indigo-600 active:bg-indigo-700' 
                  : 'bg-gray-800/50'
              }`}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="send" 
                size={16} 
                color={inputText.trim() ? '#fff' : '#6B7280'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatBot;