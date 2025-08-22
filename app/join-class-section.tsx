// app/JoinClassSection.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  TouchableHighlight,
  FlatList,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Background Decorator Component
const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0 bg-[#0F172A]" />
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
  </View>
);

const JoinClassSection = () => {
  const [showJoinClass, setShowJoinClass] = useState(false);
  const [school, setSchool] = useState("");
  const [strand, setStrand] = useState("");
  const [section, setSection] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [classApplied, setClassApplied] = useState(false);

  // Dropdown states
  const [showStrandDropdown, setShowStrandDropdown] = useState(false);
  const [showGradeLevelDropdown, setShowGradeLevelDropdown] = useState(false);

  // Options
  const strandOptions = ["STEM", "HUMSS", "ABM", "GAS", "TVL"];
  const gradeLevelOptions = ["11", "12"];

  const handleJoinClass = () => {
    if (!school || !strand || !section || !gradeLevel || !teacherEmail) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setClassApplied(true);
    Alert.alert(
      "Application Sent",
      "Your request to join the class has been sent. Please wait for teacher confirmation."
    );
  };

  const resetForm = () => {
    setShowJoinClass(false);
    setSchool("");
    setStrand("");
    setSection("");
    setGradeLevel("");
    setTeacherEmail("");
    setClassApplied(false);
  };

  return (
    <View className="flex-1 justify-center items-center px-4 bg-[#0F172A]">
      <BackgroundDecor />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="w-full max-w-md"
      >
        <ScrollView 
          contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="py-8">
            <View className="items-center mb-6">
              <View className="bg-violet-700/20 p-4 rounded-full mb-4">
                <Ionicons name="school" size={32} color="#a78bfa" />
              </View>
              <Text className="text-white text-2xl font-bold text-center">
                {classApplied ? "Application Sent" : "Join a Class"}
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                {classApplied 
                  ? "Your request is being processed" 
                  : "Enter your class information to join"
                }
              </Text>
            </View>

            {classApplied ? (
              <View className="bg-white/5 rounded-2xl p-6 border border-white/10 items-center">
                <View className="bg-violet-700/20 p-4 rounded-full mb-4">
                  <Ionicons name="time" size={32} color="#a78bfa" />
                </View>
                <Text className="text-white text-xl font-bold mb-3 text-center">
                  Waiting for Confirmation
                </Text>
                <Text className="text-gray-300 text-center mb-6">
                  Your request to join the class has been sent to your teacher. 
                  You'll be notified once they confirm your enrollment.
                </Text>
                <TouchableOpacity
                  onPress={resetForm}
                  className="bg-violet-600/80 border border-white/40 rounded-xl py-3.5 w-full items-center"
                >
                  <Text className="text-white text-base font-semibold">Back to Join Class</Text>
                </TouchableOpacity>
              </View>
            ) : showJoinClass ? (
              <View className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <View className="mb-5">
                  <Text className="text-gray-300 text-sm mb-2 font-medium">School</Text>
                  <TextInput
                    placeholder="Enter your school name"
                    placeholderTextColor="#6b7280"
                    value={school}
                    onChangeText={setSchool}
                    className="bg-black/30 rounded-xl p-4 text-white border border-white/10"
                  />
                </View>

                <View className="mb-5">
                  <Text className="text-gray-300 text-sm mb-2 font-medium">Strand</Text>
                  <TouchableOpacity
                    onPress={() => setShowStrandDropdown(true)}
                    className="bg-black/30 rounded-xl p-4 border border-white/10 flex-row justify-between items-center"
                  >
                    <Text className={`${strand ? 'text-white' : 'text-gray-500'}`}>
                      {strand || 'Select Strand'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <Modal
                  visible={showStrandDropdown}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowStrandDropdown(false)}
                >
                  <TouchableWithoutFeedback onPress={() => setShowStrandDropdown(false)}>
                    <View className="flex-1 bg-black/70 justify-center items-center p-5">
                      <View className="w-full max-w-xs bg-gray-800 rounded-xl overflow-hidden">
                        <View className="p-4 border-b border-white/10">
                          <Text className="text-white font-semibold text-center">Select Strand</Text>
                        </View>
                        <FlatList
                          data={strandOptions}
                          keyExtractor={(item) => item}
                          renderItem={({ item }) => (
                            <TouchableHighlight
                              underlayColor="rgba(167, 139, 250, 0.2)"
                              onPress={() => {
                                setStrand(item);
                                setShowStrandDropdown(false);
                              }}
                            >
                              <View className="p-4 border-b border-white/10">
                                <Text className="text-white">{item}</Text>
                              </View>
                            </TouchableHighlight>
                          )}
                        />
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>

                <View className="mb-5">
                  <Text className="text-gray-300 text-sm mb-2 font-medium">Section</Text>
                  <TextInput
                    placeholder="Enter your section"
                    placeholderTextColor="#6b7280"
                    value={section}
                    onChangeText={setSection}
                    className="bg-black/30 rounded-xl p-4 text-white border border-white/10"
                  />
                </View>

                <View className="mb-5">
                  <Text className="text-gray-300 text-sm mb-2 font-medium">Grade Level</Text>
                  <TouchableOpacity
                    onPress={() => setShowGradeLevelDropdown(true)}
                    className="bg-black/30 rounded-xl p-4 border border-white/10 flex-row justify-between items-center"
                  >
                    <Text className={`${gradeLevel ? 'text-white' : 'text-gray-500'}`}>
                      {gradeLevel ? `Grade ${gradeLevel}` : 'Select Grade Level'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                <Modal
                  visible={showGradeLevelDropdown}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowGradeLevelDropdown(false)}
                >
                  <TouchableWithoutFeedback onPress={() => setShowGradeLevelDropdown(false)}>
                    <View className="flex-1 bg-black/70 justify-center items-center p-5">
                      <View className="w-full max-w-xs bg-gray-800 rounded-xl overflow-hidden">
                        <View className="p-4 border-b border-white/10">
                          <Text className="text-white font-semibold text-center">Select Grade Level</Text>
                        </View>
                        <FlatList
                          data={gradeLevelOptions}
                          keyExtractor={(item) => item}
                          renderItem={({ item }) => (
                            <TouchableHighlight
                              underlayColor="rgba(167, 139, 250, 0.2)"
                              onPress={() => {
                                setGradeLevel(item);
                                setShowGradeLevelDropdown(false);
                              }}
                            >
                              <View className="p-4 border-b border-white/10">
                                <Text className="text-white">Grade {item}</Text>
                              </View>
                            </TouchableHighlight>
                          )}
                        />
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>

                <View className="mb-6">
                  <Text className="text-gray-300 text-sm mb-2 font-medium">Teacher Email</Text>
                  <TextInput
                    placeholder="Enter your teacher's email"
                    placeholderTextColor="#6b7280"
                    value={teacherEmail}
                    onChangeText={setTeacherEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="bg-black/30 rounded-xl p-4 text-white border border-white/10"
                  />
                </View>
                
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    onPress={resetForm}
                    className="flex-1 bg-gray-700/50 border border-white/10 rounded-xl py-3.5 items-center"
                  >
                    <Text className="text-white text-base font-semibold">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleJoinClass}
                    className="flex-1 bg-violet-600/80 border border-white/40 rounded-xl py-3.5 items-center"
                  >
                    <Text className="text-white text-base font-semibold">Apply to Join</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowJoinClass(true)}
                className="bg-white/5 rounded-2xl p-6 border border-white/10 items-center justify-center"
                style={{ minHeight: 200 }}
              >
                <View className="bg-violet-700/20 p-4 rounded-full mb-4">
                  <Ionicons name="add-circle" size={32} color="#a78bfa" />
                </View>
                <Text className="text-white text-xl font-bold text-center mb-2">
                  Join a Class
                </Text>
                <Text className="text-gray-300 text-center">
                  Click to join a class with your school information
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default JoinClassSection;