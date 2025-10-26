import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface RubricItem {
  label: string;
  descriptions: {
    high: string;
    medium: string;
    low: string;
  };
}

interface Reference {
  url: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface ModuleData {
  // Module Info
  grade: number | null;
  title: string;
  description: string;
  
  // Key Points
  lessons: string[];
  importance: string[];
  tips: string[];
  
  // Task & Rubric
  taskBody: string;
  taskInstructions: string[];
  rubric: RubricItem[];
  
  // Quiz
  quiz: QuizQuestion[];
  
  // References
  references: Reference[];
}

// Enhanced Background decoration
const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient 
        colors={["#0F172A", "#1E293B", "#0F172A"]} 
        className="flex-1"
      />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
  </View>
);

export default function PostModule() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { width } = Dimensions.get('window');
  
  // Enhanced step indicator style
  const getStepIndicatorStyle = (currentStep: number, step: number) => 
    `w-10 h-10 rounded-full items-center justify-center border-2 transition-all ${
      currentStep === step 
        ? 'bg-white/90 border-white' 
        : currentStep > step
        ? 'bg-white/20 border-white/40'
        : 'bg-white/5 border-white/20'
    }`;

  const [moduleData, setModuleData] = useState<ModuleData>({
    // Module Info
    grade: null,
    title: '',
    description: '',
    
    // Key Points
    lessons: [''],
    importance: [''],
    tips: [''],
    
    // Task & Rubric
    taskBody: '',
    taskInstructions: [''],
    rubric: [],
    
    // Quiz
    quiz: [
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      },
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      }
    ],
    
    // References
    references: [{ url: '' }],
  });

  const handleInputChange = (field: keyof ModuleData, value: any) => {
    setModuleData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'lessons' | 'importance' | 'tips' | 'taskInstructions' | 'references', index: number, value: string) => {
    setModuleData(prev => {
      if (field === 'references') {
        const newRefs = [...prev.references];
        newRefs[index] = { ...newRefs[index], url: value };
        return { ...prev, references: newRefs };
      }
      return {
        ...prev,
        [field]: prev[field].map((item, i) => (i === index ? value : item))
      };
    });
  };

  const handleQuizChange = (questionIndex: number, field: 'question' | 'options' | 'correctAnswer', value: any, optionIndex?: number) => {
    setModuleData(prev => {
      const newQuiz = [...prev.quiz];
      if (field === 'options' && optionIndex !== undefined) {
        const newOptions = [...newQuiz[questionIndex].options];
        newOptions[optionIndex] = value;
        newQuiz[questionIndex] = {
          ...newQuiz[questionIndex],
          options: newOptions
        };
      } else {
        newQuiz[questionIndex] = {
          ...newQuiz[questionIndex],
          [field]: value
        };
      }
      return { ...prev, quiz: newQuiz };
    });
  };

  const handleAddItem = (field: 'lessons' | 'importance' | 'tips' | 'taskInstructions' | 'references') => {
    setModuleData(prev => {
      if (field === 'references') {
        return {
          ...prev,
          references: [...prev.references, { url: '' }]
        };
      }
      return {
        ...prev,
        [field]: [...prev[field], '']
      };
    });
  };

  const handleRemoveItem = (field: 'lessons' | 'importance' | 'tips' | 'taskInstructions' | 'references', index: number) => {
    setModuleData(prev => {
      const newArray = [...prev[field]];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray };
    });
  };

  const handleRubricChange = (
    index: number, 
    field: 'label' | keyof RubricItem['descriptions'], 
    value: string
  ) => {
    const newRubric = [...moduleData.rubric];
    if (field === 'label') {
      newRubric[index] = { ...newRubric[index], label: value };
    } else if (field === 'high' || field === 'medium' || field === 'low') {
      newRubric[index] = {
        ...newRubric[index],
        descriptions: {
          ...newRubric[index].descriptions,
          [field]: value
        }
      };
    }
    handleInputChange('rubric', newRubric);
  };

  const handleAddRubric = () => {
    handleInputChange('rubric', [
      ...moduleData.rubric,
      { label: '', descriptions: { high: '', medium: '', low: '' } }
    ]);
  };

  const handleReferenceChange = (index: number, value: string) => {
    const newReferences = [...moduleData.references];
    newReferences[index] = { url: value };
    handleInputChange('references', newReferences);
  };

  const handleAddReference = () => {
    handleInputChange('references', [...moduleData.references, { url: '' }]);
  };

  const validateStep = () => {
    if (step === 1 && !moduleData.grade) {
      Alert.alert('Selection Required', 'Please select a grade level to continue');
      return false;
    }
    if (step === 2 && (!moduleData.title || !moduleData.description)) {
      Alert.alert('Required Fields', 'Please fill in all required fields');
      return false;
    }
    if (step === 3) { // Key Points step
      if (!moduleData.lessons[0]) {
        Alert.alert('Required Field', 'Please enter the lesson content');
        return false;
      }
      if (moduleData.importance.some(i => !i)) {
        Alert.alert('Required Field', 'Please fill in all key points or remove empty ones');
        return false;
      }
      if (moduleData.tips.some(t => !t)) {
        Alert.alert('Required Field', 'Please fill in all learning tips or remove empty ones');
        return false;
      }
    }
    if (step === 4) { // Quiz step
      if (moduleData.quiz.some(q => !q.question || q.options.some(o => !o) || q.correctAnswer === null)) {
        Alert.alert('Incomplete Quiz', 'Please complete all quiz questions and select correct answers');
        return false;
      }
    }
    if (step === 5) { // Task step
      if (!moduleData.taskBody) {
        Alert.alert('Required Field', 'Please enter the task description');
        return false;
      }
      if (moduleData.taskInstructions.some(i => !i)) {
        Alert.alert('Required Field', 'Please fill in all task instructions or remove empty ones');
        return false;
      }
      if (moduleData.rubric.length === 0) {
        Alert.alert('Required Field', 'Please add at least one rubric item');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    console.log('Module Data:', moduleData);
    Alert.alert('Success', 'Module created successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const renderStep = () => {
    switch (step) {
      case 1: // Grade Selection
        return (
          <View className="space-y-6">
            <View className="items-center mb-2">
              <Text className="text-3xl font-bold text-white mb-2">Grade Level</Text>
              <Text className="text-slate-300 text-center">Select the appropriate grade level for this module</Text>
            </View>
            
            <View className="space-y-4">
              <TouchableOpacity
                className={`p-6 rounded-2xl border-2 transition-all ${
                  moduleData.grade === 11 
                    ? 'bg-violet-600 border-white' 
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
                onPress={() => handleInputChange('grade', 11)}
              >
                <Text className={`text-xl font-semibold text-center ${
                  moduleData.grade === 11 ? 'text-violet-300' : 'text-white'
                }`}>
                  Grade 11
                </Text>
                <Text className={`text-center mt-2 ${
                  moduleData.grade === 11 ? 'text-violet-200/80' : 'text-slate-400'
                }`}>
                  Intermediate level modules
                </Text>
                {moduleData.grade === 11 && (
                  <View className="absolute top-4 right-4 w-7 h-7 bg-violet-500 rounded-full items-center justify-center">
                    <Ionicons name="checkmark" size={18} color="white" />
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                className={`p-6 rounded-2xl border-2 transition-all ${
                  moduleData.grade === 12 
                    ? 'bg-violet-600 border-white' 
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
                onPress={() => handleInputChange('grade', 12)}
              >
                <Text className={`text-xl font-semibold text-center ${
                  moduleData.grade === 12 ? 'text-violet-300' : 'text-white'
                }`}>
                  Grade 12
                </Text>
                <Text className={`text-center mt-2 ${
                  moduleData.grade === 12 ? 'text-violet-200/80' : 'text-slate-400'
                }`}>
                  Advanced level modules
                </Text>
                {moduleData.grade === 12 && (
                  <View className="absolute top-4 right-4 w-7 h-7 bg-violet-500 rounded-full items-center justify-center">
                    <Ionicons name="checkmark" size={18} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2: // Module Info
        return (
          <View className="space-y-6">
            <View className="items-center mb-2">
              <Text className="text-3xl font-bold text-white mb-2">Module Information</Text>
              <Text className="text-slate-300 text-center">Enter the basic details of your module</Text>
            </View>
            
            <View className="space-y-5">
              <View>
                <Text className="text-slate-200 mb-3 font-semibold text-lg">Module Title *</Text>
                <TextInput
                  className="bg-white/10 rounded-xl px-5 py-4 text-white border-2 border-white/10 focus:border-violet-500/50"
                  placeholder="Enter module title"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={moduleData.title}
                  onChangeText={(text) => handleInputChange('title', text)}
                />
              </View>
              
              <View>
                <Text className="text-slate-200 mb-3 font-semibold text-lg">Description *</Text>
                <TextInput
                  className="bg-white/10 rounded-xl px-5 py-4 text-white border-2 border-white/10 focus:border-violet-500/50 h-40"
                  placeholder="Write a compelling description of the module..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                  textAlignVertical="top"
                  value={moduleData.description}
                  onChangeText={(text) => handleInputChange('description', text)}
                />
              </View>
            </View>
          </View>
        );
      case 3: // Key Points
        return (
          <View className="space-y-6">
            <View className="items-center mb-6">
              <Text className="text-3xl font-bold text-white mb-2">Key Learning Points</Text>
              <Text className="text-slate-300 text-center">Add the essential learning components for this module</Text>
            </View>
            
            {/* Lesson Content */}
            <View className="space-y-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="book-outline" size={22} color="white" className="mr-3" />
                  <Text className="left-2 text-xl font-semibold text-white">Lesson Content</Text>
                </View>
              </View>
              
              <Text className="text-slate-400 text-sm mb-2">
                Outline the main lesson content and key concepts students will learn.
              </Text>
              
              <View className="mb-3">
                <TextInput
                  className="bg-white/10 rounded-xl px-4 py-4 text-white border-2 border-white/10 text-base w-full h-32"
                  value={moduleData.lessons[0] || ''}
                  onChangeText={(text) => handleArrayChange('lessons', 0, text)}
                  placeholder="Enter the main lesson content"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
            
            {/* Key Points */}
            <View className="space-y-4 mt-8">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="star-outline" size={22} color="white" className="mr-4" />
                  <Text className="left-2 text-xl font-semibold text-white">Importance</Text>
                </View>
              </View>
              
              <Text className="text-slate-400 text-sm mb-2">
                Highlight the most important concepts or facts students must remember.
              </Text>
              
              {moduleData.importance.map((point, index) => (
                <View key={`importance-${index}`} className="mb-3">
                  <TextInput
                    className="bg-white/10 rounded-xl px-4 py-3 text-white border-2 border-white/10 text-base w-full"
                    value={point}
                    onChangeText={(text) => handleArrayChange('importance', index, text)}
                    placeholder={`Key point ${index + 1} (e.g., Main concept to remember...)`}
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    multiline
                  />
                  {moduleData.importance.length > 1 && (
                    <TouchableOpacity 
                      className="absolute -right-10 top-3 p-1"
                      onPress={() => handleRemoveItem('importance', index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              <TouchableOpacity 
                className="flex-row items-center justify-center bg-white/5 rounded-xl py-3 border-2 border-dashed border-white/20"
                onPress={() => handleAddItem('importance')}
              >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text className="text-white font-medium ml-2">Add Importance</Text>
              </TouchableOpacity>
            </View>
            
            {/* Learning Tips */}
            <View className="space-y-4 mt-8">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="bulb-outline" size={22} color="white" className="mr-4" />
                  <Text className="left-2 text-xl font-semibold text-white">Learning Tips</Text>
                </View>
              </View>
              
              <Text className="text-slate-400 text-sm mb-2">
                Share study tips or strategies to help students master the material.
              </Text>
              
              {moduleData.tips.map((tip: string, index: number) => (
                <View key={`tip-${index}`} className="mb-3">
                  <TextInput
                    className="bg-white/10 rounded-xl px-4 py-3 text-white border-2 border-white/10 text-base w-full"
                    value={tip}
                    onChangeText={(text: string) => handleArrayChange('tips', index, text)}
                    placeholder={`Tip ${index + 1} (e.g., Best way to remember this is...)`}
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    multiline
                  />
                  {moduleData.tips.length > 1 && (
                    <TouchableOpacity 
                      className="absolute -right-10 top-3 p-1"
                      onPress={() => handleRemoveItem('tips', index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              <TouchableOpacity 
                className="flex-row items-center justify-center bg-white/5 rounded-xl py-3 border-2 border-dashed border-white/20"
                onPress={() => handleAddItem('tips')}
              >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text className="text-white font-medium ml-2">Add Learning Tip</Text>
              </TouchableOpacity>
            </View>
            
            {/* References */}
            <View className="space-y-4 mt-8">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-semibold text-white">References</Text>
                <Ionicons name="link-outline" size={20} color="white" />
              </View>
              {moduleData.references.map((ref, index) => (
                <View key={`ref-${index}`} className="flex-row items-center">
                  <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="link-outline" size={14} color="white" />
                  </View>
                  <TextInput
                    className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-white border-2 border-white/10"
                    placeholder="https://example.com/resource"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={ref.url}
                    onChangeText={(text: string) => handleArrayChange('references', index, text)}
                  />
                  {moduleData.references.length > 1 && (
                    <TouchableOpacity 
                      className="ml-3 p-2"
                      onPress={() => {
                        const newRefs = [...moduleData.references];
                        newRefs.splice(index, 1);
                        handleInputChange('references', newRefs);
                      }}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity 
                className="flex-row items-center justify-center bg-white/5 rounded-xl py-4 border-2 border-white/20"
                onPress={() => handleInputChange('references', [...moduleData.references, { url: '' }])}
              >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Add Reference</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
        return (
          <View className="space-y-6">
            <View className="items-center mb-2">
              <Text className="text-3xl font-bold text-white mb-2">Module Details</Text>
              <Text className="text-gray-300 text-center">Provide basic information about your module</Text>
            </View>
            
            <View className="space-y-5">
              <View>
                <Text className="text-gray-200 mb-3 font-semibold text-lg">Module Title *</Text>
                <TextInput
                  className="bg-white/10 rounded-xl px-5 py-4 text-white border-2 border-white/10 focus:border-white/50"
                  placeholder="Enter module title"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={moduleData.title}
                  onChangeText={(text) => handleInputChange('title', text)}
                />
              </View>
              
              <View>
                <Text className="text-gray-200 mb-3 font-semibold text-lg">Description</Text>
                <TextInput
                  className="bg-white/10 rounded-xl px-5 py-4 text-white border-2 border-white/10 focus:border-white/50 h-40"
                  placeholder="Write a compelling description of the module"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                  textAlignVertical="top"
                  value={moduleData.description}
                  onChangeText={(text) => handleInputChange('description', text)}
                />
              </View>
            </View>
          </View>
        );
      case 3: // Quiz Section
        return (
          <View className="space-y-6">
            <View className="items-center mb-6">
              <Text className="text-3xl font-bold text-white mb-2">Quiz Section</Text>
              <Text className="text-gray-300 text-center">Add quiz questions to test student understanding</Text>
            </View>

            {moduleData.quiz.map((question, qIndex) => (
              <View key={`quiz-${qIndex}`} className="bg-white/5 rounded-2xl p-5 mb-6 border border-white/10">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-semibold text-white">
                    Question {qIndex + 1}
                  </Text>
                </View>

                <TextInput
                  className="bg-white/10 rounded-xl px-4 py-3 text-white border-2 border-white/10 mb-4 text-lg"
                  placeholder="Enter the question..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={question.question}
                  onChangeText={(text) => handleQuizChange(qIndex, 'question', text)}
                />

                <View className="space-y-3 mb-4">
                  {question.options.map((option, oIndex) => (
                    <View key={`option-${qIndex}-${oIndex}`} className="flex-row items-center">
                      <TouchableOpacity 
                        className={`w-6 h-6 rounded-full border-2 ${question.correctAnswer === oIndex ? 'border-white' : 'border-white/10'} mr-3 items-center justify-center`}
                        onPress={() => handleQuizChange(qIndex, 'correctAnswer', oIndex)}
                      >
                        {question.correctAnswer === oIndex && (
                          <View className="w-3 h-3 bg-white rounded-full" />
                        )}
                      </TouchableOpacity>
                      <TextInput
                        className={`flex-1 bg-white/10 rounded-xl px-4 py-3 text-white border-2 ${question.correctAnswer === oIndex ? 'border-white/50' : 'border-white/10'}`}
                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        value={option}
                        onChangeText={(text) => handleQuizChange(qIndex, 'options', text, oIndex)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Fixed to 2 questions */}
          </View>
        );
        return (
          <View className="space-y-8">
            <View className="items-center mb-2">
              <Text className="text-3xl font-bold text-white mb-2">Key Learning Points</Text>
              <Text className="text-gray-300 text-center">Define what makes this module valuable</Text>
            </View>
            
            <View className="space-y-6">
              <View>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-semibold text-white">Why is this important?</Text>
                  <Ionicons name="help-circle-outline" size={20} color="white" />
                </View>
                {moduleData.importance.map((item, index) => (
                  <View key={`importance-${index}`} className="flex-row items-center mb-3">
                    <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mr-3">
                      <Text className="text-white font-bold text-xs">{index + 1}</Text>
                    </View>
                    <TextInput
                      className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-white border-2 border-white/10"
                      value={item}
                      onChangeText={(text) => handleArrayChange('importance', index, text)}
                      placeholder={`Important point ${index + 1}...`}
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    />
                    {moduleData.importance.length > 1 && (
                      <TouchableOpacity 
                        className="ml-3 p-2"
                        onPress={() => handleRemoveItem('importance', index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity 
                  className="flex-row items-center justify-center bg-white/5 rounded-xl py-4 mt-2 border-2 border-white/10"
                  onPress={() => handleAddItem('importance')}
                >
                  <Ionicons name="add-circle-outline" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Add Importance Point</Text>
                </TouchableOpacity>
              </View>

              <View>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-semibold text-white">Learning Tips</Text>
                  <Ionicons name="bulb-outline" size={20} color="white" />
                </View>
                {moduleData.tips.map((tip, index) => (
                  <View key={`tip-${index}`} className="flex-row items-center mb-3">
                    <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mr-3">
                      <Ionicons name="star-outline" size={14} color="white" />
                    </View>
                    <TextInput
                      className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-white border-2 border-white/10"
                      value={tip}
                      onChangeText={(text) => handleArrayChange('tips', index, text)}
                      placeholder={`Helpful tip ${index + 1}...`}
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    />
                    {moduleData.tips.length > 1 && (
                      <TouchableOpacity 
                        className="ml-3 p-2"
                        onPress={() => handleRemoveItem('tips', index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity 
                  className="flex-row items-center justify-center bg-white/5 rounded-xl py-4 mt-2 border-2 border-white/10"
                  onPress={() => handleAddItem('tips')}
                >
                  <Ionicons name="add-circle-outline" size={20} color="white" />
                  <Text className="text-white font-semibold ml-2">Add Learning Tip</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      case 4: // Quiz
        return (
          <View className="space-y-6">
            <View className="items-center mb-6">
              <Text className="text-3xl font-bold text-white mb-2">Module Quiz</Text>
              <Text className="text-gray-300 text-center">Add quiz questions to test student understanding</Text>
            </View>

            {moduleData.quiz.map((question, qIndex) => (
              <View key={`quiz-${qIndex}`} className="bg-white/5 rounded-2xl p-5 mb-6 border border-white/10">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-semibold text-white">
                    Question {qIndex + 1}
                  </Text>
                </View>

                <TextInput
                  className="bg-white/10 rounded-xl px-4 py-3 text-white border-2 border-white/10 mb-4 text-lg"
                  placeholder="Enter the question..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={question.question}
                  onChangeText={(text) => handleQuizChange(qIndex, 'question', text)}
                />

                <View className="space-y-3 mb-4">
                  {question.options.map((option, oIndex) => (
                    <View key={`option-${qIndex}-${oIndex}`} className="flex-row items-center">
                      <TouchableOpacity 
                        className={`w-6 h-6 rounded-full border-2 ${question.correctAnswer === oIndex ? 'border-white' : 'border-white/10'} mr-3 items-center justify-center`}
                        onPress={() => handleQuizChange(qIndex, 'correctAnswer', oIndex)}
                      >
                        {question.correctAnswer === oIndex && (
                          <View className="w-3 h-3 bg-white rounded-full" />
                        )}
                      </TouchableOpacity>
                      <TextInput
                        className={`flex-1 bg-white/10 rounded-xl px-4 py-3 text-white border-2 ${question.correctAnswer === oIndex ? 'border-white/50' : 'border-white/10'}`}
                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        value={option}
                        onChangeText={(text) => handleQuizChange(qIndex, 'options', text, oIndex)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Fixed to 2 questions */}
          </View>
        );

      case 5: // Task & Rubric
        return (
          <View className="space-y-6">
            <View className="items-center mb-4">
              <Text className="text-3xl font-bold text-white mb-2">Task & Assessment</Text>
              <Text className="text-gray-300 text-center">Define the learning task and assessment criteria</Text>
            </View>
            
            {/* Task */}
            <View className="space-y-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-semibold text-white">Learning Task</Text>
                <Ionicons name="create-outline" size={20} color="white" />
              </View>
              <TextInput
                className="bg-white/10 rounded-xl px-5 py-4 text-white border-2 border-white/10 h-40"
                placeholder="Describe the learning task in detail..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline
                textAlignVertical="top"
                value={moduleData.taskBody}
                onChangeText={(text) => handleInputChange('taskBody', text)}
              />
              
              <Text className="text-gray-200 mt-6 mb-3 font-semibold text-lg">Task Instructions</Text>
              {moduleData.taskInstructions.map((instruction, index) => (
                <View key={`instruction-${index}`} className="flex-row items-center mb-3">
                  <View className="w-7 h-7 bg-white/10 rounded-full items-center justify-center mr-3">
                    <Text className="text-white font-bold text-sm">{index + 1}</Text>
                  </View>
                  <TextInput
                    className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-white border-2 border-white/10"
                    value={instruction}
                    onChangeText={(text) => handleArrayChange('taskInstructions', index, text)}
                    placeholder={`Step ${index + 1}...`}
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  />
                  {moduleData.taskInstructions.length > 1 && (
                    <TouchableOpacity 
                      className="ml-3 p-2"
                      onPress={() => handleRemoveItem('taskInstructions', index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity 
                className="flex-row items-center justify-center bg-white/5 rounded-xl py-4 border-2 border-white/10"
                onPress={() => handleAddItem('taskInstructions')}
              >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Add Instruction</Text>
              </TouchableOpacity>
            </View>
            
            {/* Rubric */}
            <View className="mt-8 space-y-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-semibold text-white">Assessment Rubric</Text>
                <Ionicons name="ribbon-outline" size={20} color="white" />
              </View>
              
              {moduleData.rubric.map((item, index) => (
                <View key={`rubric-${index}`} className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <View className="flex-row justify-between items-center mb-4">
                    <TextInput
                      className="text-lg font-semibold text-white bg-transparent flex-1 mr-2"
                      value={item.label}
                      onChangeText={(text) => handleRubricChange(index, 'label', text)}
                      placeholder="Criterion name"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    />
                    {moduleData.rubric.length > 1 && (
                      <TouchableOpacity 
                        onPress={() => {
                          const newRubric = [...moduleData.rubric];
                          newRubric.splice(index, 1);
                          handleInputChange('rubric', newRubric);
                        }}
                        className="p-1"
                      >
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View className="space-y-3">
                    <View>
                      <Text className="text-gray-400 text-sm font-medium mb-1">Excellent (4-5 pts)</Text>
                      <TextInput
                        className="bg-white/5 rounded-lg px-3 py-2 text-white text-sm border border-white/10"
                        value={item.descriptions.high}
                        onChangeText={(text) => handleRubricChange(index, 'high', text)}
                        placeholder="Description for excellent performance"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        multiline
                      />
                    </View>
                    
                    <View>
                      <Text className="text-gray-400 text-sm font-medium mb-1">Good (2-3 pts)</Text>
                      <TextInput
                        className="bg-white/5 rounded-lg px-3 py-2 text-white text-sm border border-white/10"
                        value={item.descriptions.medium}
                        onChangeText={(text) => handleRubricChange(index, 'medium', text)}
                        placeholder="Description for good performance"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        multiline
                      />
                    </View>
                    
                    <View>
                      <Text className="text-gray-400 text-sm font-medium mb-1">Needs Improvement (0-1 pts)</Text>
                      <TextInput
                        className="bg-white/5 rounded-lg px-3 py-2 text-white text-sm border border-white/10"
                        value={item.descriptions.low}
                        onChangeText={(text) => handleRubricChange(index, 'low', text)}
                        placeholder="Description for needs improvement"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        multiline
                      />
                    </View>
                  </View>
                </View>
              ))}
              
              <TouchableOpacity 
                className="flex-row items-center justify-center bg-white/10 rounded-xl py-4 border-2 border-white/30 mt-4"
                onPress={() => {
                  handleInputChange('rubric', [
                    ...moduleData.rubric,
                    {
                      label: 'Content Mastery',
                      descriptions: {
                        high: 'Exceeds all expectations with exceptional understanding',
                        medium: 'Meets expectations with solid understanding',
                        low: 'Needs improvement in understanding key concepts'
                      }
                    }
                  ]);
                }}
              >
                <Ionicons name="add-circle-outline" size={22} color="white" />
                <Text className="text-white font-semibold text-lg ml-3">Add Criterion</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
        return (
          <View className="space-y-6">
            <View className="items-center mb-2">
              <Text className="text-3xl font-bold text-white mb-2">Task & Instructions</Text>
              <Text className="text-gray-300 text-center">Define the learning activities and tasks</Text>
            </View>
            
            <View>
              <Text className="text-xl font-semibold text-white mb-4">Task Description</Text>
              <TextInput
                className="bg-white/10 rounded-xl px-5 py-4 text-white border-2 border-white/10 h-40"
                placeholder="Provide detailed task description, objectives, and expected outcomes..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline
                textAlignVertical="top"
                value={moduleData.taskBody}
                onChangeText={(text) => handleInputChange('taskBody', text)}
              />
            </View>
            
            <View>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-white">Step-by-Step Instructions</Text>
                <Ionicons name="list-outline" size={20} color="white" />
              </View>
              {moduleData.taskInstructions.map((instruction, index) => (
                <View key={`instruction-${index}`} className="flex-row items-center mb-3">
                  <View className="w-7 h-7 bg-white/10 rounded-full items-center justify-center mr-3">
                    <Text className="text-white font-bold text-sm">{index + 1}</Text>
                  </View>
                  <TextInput
                    className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-white border-2 border-white/10"
                    value={instruction}
                    onChangeText={(text) => handleArrayChange('taskInstructions', index, text)}
                    placeholder={`Step ${index + 1}...`}
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  />
                  {moduleData.taskInstructions.length > 1 && (
                    <TouchableOpacity 
                      className="ml-3 p-2"
                      onPress={() => handleRemoveItem('taskInstructions', index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity 
                className="flex-row items-center justify-center bg-white/10 rounded-xl py-4 border-2 border-white/30 mt-4"
                onPress={() => handleAddItem('taskInstructions')}
              >
                <Ionicons name="add-circle-outline" size={22} color="white" />
                <Text className="text-white font-semibold text-lg ml-3">Add Instruction Step</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 6: // Review
        return (
          <View className="space-y-6">
            <View className="items-center mb-6">
              <Text className="text-3xl font-bold text-white mb-2">Review Your Module</Text>
              <Text className="text-gray-300 text-center">Please review all the information before publishing</Text>
            </View>

            {/* Module Info Card */}
            <View className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-white">Module Information</Text>
                <Ionicons name="information-circle-outline" size={24} color="white" />
              </View>
              
              <View className="space-y-4">
                <View>
                  <Text className="text-gray-400 text-sm mb-1">Grade Level</Text>
                  <Text className="text-white font-medium">
                    {moduleData.grade ? `Grade ${moduleData.grade}` : 'Not specified'}
                  </Text>
                </View>
                
                <View>
                  <Text className="text-gray-400 text-sm mb-1">Module Title</Text>
                  <Text className="text-white font-medium">
                    {moduleData.title || 'No title provided'}
                  </Text>
                </View>
                
                <View>
                  <Text className="text-gray-400 text-sm mb-1">Module Description</Text>
                  <Text className="text-white font-medium">
                    {moduleData.description || 'No description provided'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Lesson Content */}
            <View className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-white">Lesson Content</Text>
                <Ionicons name="book-outline" size={22} color="white" />
              </View>
              <View className="bg-white/5 p-4 rounded-lg">
                <Text className="text-white">
                  {moduleData.lessons[0] || 'No lesson content provided'}
                </Text>
              </View>
            </View>

            {/* Key Points */}
            <View className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-white">Key Points</Text>
                <Ionicons name="key-outline" size={22} color="white" />
              </View>
              <View className="space-y-3">
                {moduleData.importance.length > 0 ? (
                  moduleData.importance.map((point, index) => (
                    <View key={`review-importance-${index}`} className="flex-row items-start">
                      <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mt-1 mr-3">
                        <Text className="text-white font-bold text-xs">{index + 1}</Text>
                      </View>
                      <Text className="text-white flex-1">{point}</Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-400">No key points added</Text>
                )}
              </View>
            </View>

            {/* Learning Tips */}
            <View className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-white">Learning Tips</Text>
                <Ionicons name="bulb-outline" size={22} color="white" />
              </View>
              <View className="space-y-3">
                {moduleData.tips.length > 0 ? (
                  moduleData.tips.map((tip, index) => (
                    <View key={`review-tip-${index}`} className="flex-row items-start">
                      <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mt-1 mr-3">
                        <Ionicons name="star-outline" size={14} color="white" />
                      </View>
                      <Text className="text-white flex-1">{tip}</Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-400">No learning tips added</Text>
                )}
              </View>
            </View>

            {/* Quiz Summary */}
            {moduleData.quiz.filter(q => q.question.trim() !== '').length > 0 && (
              <View className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-semibold text-white">Quiz Questions</Text>
                  <Ionicons name="help-circle-outline" size={24} color="white" />
                </View>
                <View className="space-y-6">
                  {moduleData.quiz.filter(q => q.question.trim() !== '').map((question, qIndex) => (
                    <View key={`review-quiz-${qIndex}`} className="space-y-3">
                      <View className="flex-row items-start">
                        <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mt-1 mr-3">
                          <Text className="text-white font-bold text-xs">{qIndex + 1}</Text>
                        </View>
                        <Text className="text-white font-medium flex-1">{question.question}</Text>
                      </View>
                      
                      <View className="ml-9 space-y-2">
                        {question.options.map((option, oIndex) => (
                          <View key={`option-${qIndex}-${oIndex}`} className="flex-row items-start">
                            <View className={`w-5 h-5 rounded-full border-2 ${question.correctAnswer === oIndex ? 'border-white' : 'border-white/30'} mr-3 mt-0.5 items-center justify-center`}>
                              {question.correctAnswer === oIndex && (
                                <View className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </View>
                            <Text className={`text-white ${question.correctAnswer === oIndex ? 'font-medium' : 'opacity-80'}`}>
                              {option || `Option ${String.fromCharCode(65 + oIndex)}`}
                            </Text>
                          </View>
                        ))}
                      </View>
                      
                      {qIndex < moduleData.quiz.length - 1 && (
                        <View className="h-px bg-white/10 my-4" />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Task Summary */}
            {(moduleData.taskBody || moduleData.taskInstructions.length > 0) && (
              <View className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-semibold text-white">Task Details</Text>
                  <Ionicons name="checkmark-circle-outline" size={24} color="white" />
                </View>
                
                {moduleData.taskBody && (
                  <View className="mb-6">
                    <Text className="text-white font-medium mb-2">Task Description:</Text>
                    <View className="bg-white/5 p-4 rounded-lg">
                      <Text className="text-white">{moduleData.taskBody}</Text>
                    </View>
                  </View>
                )}
                
                {moduleData.taskInstructions.length > 0 && (
                  <View>
                    <Text className="text-white font-medium mb-3">Instructions:</Text>
                    <View className="space-y-3">
                      {moduleData.taskInstructions.map((instruction, index) => (
                        <View key={`instruction-${index}`} className="flex-row items-start">
                          <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mt-0.5 mr-3">
                            <Text className="text-white text-xs font-bold">{index + 1}</Text>
                          </View>
                          <Text className="text-white flex-1">{instruction}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
            
            {/* References */}
            {moduleData.references.length > 0 && (
              <View className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-semibold text-white">References</Text>
                  <Ionicons name="link-outline" size={24} color="white" />
                </View>
                <View className="space-y-3">
                  {moduleData.references.map((ref, index) => (
                    <View key={`ref-${index}`} className="flex-row items-start">
                      <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mt-0.5 mr-3">
                        <Ionicons name="link-outline" size={14} color="white" />
                      </View>
                      <Text className="text-white flex-1" selectable>{ref.url}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Rubric */}
            {moduleData.rubric.length > 0 && (
              <View className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-semibold text-white">Assessment Rubric</Text>
                  <Ionicons name="ribbon-outline" size={24} color="white" />
                </View>
                <View className="space-y-6">
                  {moduleData.rubric.map((item, index) => (
                    <View key={`rubric-${index}`} className="space-y-4">
                      <View className="flex-row items-start">
                        <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mt-0.5 mr-3">
                          <Text className="text-white text-xs font-bold">{index + 1}</Text>
                        </View>
                        <Text className="text-white font-medium flex-1">{item.label || `Criterion ${index + 1}`}</Text>
                      </View>
                      
                      <View className="ml-9 space-y-3">
                        {item.descriptions.high && (
                          <View>
                            <View className="flex-row items-center mb-1">
                              <Text className="text-white font-medium text-sm">Excellent (4-5 points):</Text>
                            </View>
                            <Text className="text-white/90 ml-2">{item.descriptions.high}</Text>
                          </View>
                        )}
                        
                        {item.descriptions.medium && (
                          <View>
                            <View className="flex-row items-center mb-1">
                              <Text className="text-white font-medium text-sm">Good (2-3 points):</Text>
                            </View>
                            <Text className="text-white/90 ml-2">{item.descriptions.medium}</Text>
                          </View>
                        )}
                        
                        {item.descriptions.low && (
                          <View>
                            <View className="flex-row items-center mb-1">
                              <Text className="text-white font-medium text-sm">Needs Improvement (0-1 point):</Text>
                            </View>
                            <Text className="text-white/90 ml-2">{item.descriptions.low}</Text>
                          </View>
                        )}
                      </View>
                      
                      {index < moduleData.rubric.length - 1 && (
                        <View className="h-px bg-white/10 my-2" />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        );

      case 7: // Finish
        return (
          <View className="space-y-6">
            <View className="items-center mb-6">
              <Text className="text-3xl font-bold text-white mb-2">Finish</Text>
              <Text className="text-gray-300 text-center">You're all set!</Text>
            </View>
            
            {/* Final Review Section */}
            <View className="bg-white/10 rounded-2xl border border-white/20 p-6 mt-8">
              <View className="flex-row items-center mb-4">
                <Ionicons name="checkmark-done-circle-outline" size={24} color="white" />
                <Text className="text-white font-bold text-xl ml-3">Ready to Create!</Text>
              </View>
              <Text className="text-white text-lg leading-6">
                Review your module details. Once created, you'll be able to edit and manage it from your dashboard.
              </Text>
            </View>

            <TouchableOpacity 
              className="bg-white/10 rounded-xl py-5 mt-4"
              onPress={handleSubmit}
            >
              <Text className="text-white font-bold text-xl text-center">Create Learning Module</Text>
              <Text className="text-white text-center mt-1">All set! Let's get started</Text>
            </TouchableOpacity>
          </View>
        );
        return (
          <View className="space-y-6">
            <View className="items-center mb-2">
              <Text className="text-3xl font-bold text-white mb-2">Assessment Rubric</Text>
              <Text className="text-gray-300 text-center">Define evaluation criteria for student work</Text>
            </View>
            
            {moduleData.rubric.map((item, index) => (
              <View key={`rubric-${index}`} className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <TextInput
                    className="flex-1 text-xl font-bold text-white bg-transparent"
                    placeholder="Criterion (e.g., Clarity, Content, Delivery)"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    value={item.label}
                    onChangeText={(text) => handleRubricChange(index, 'label', text)}
                  />
                  <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center">
                    <Text className="text-white font-bold text-xs">{index + 1}</Text>
                  </View>
                </View>
                
                <View className="space-y-4">
                  <View className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="trophy-outline" size={18} color="white" />
                      <Text className="text-white font-semibold ml-2 text-lg">Excellent</Text>
                    </View>
                    <TextInput
                      className="text-white bg-transparent min-h-[80px]"
                      placeholder="Description for excellent performance (4-5 points)..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      multiline
                      value={item.descriptions.high}
                      onChangeText={(text) => handleRubricChange(index, 'high', text)}
                    />
                  </View>
                  
                  <View className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                      <Text className="text-white font-semibold ml-2 text-lg">Good</Text>
                    </View>
                    <TextInput
                      className="text-white bg-transparent min-h-[80px]"
                      placeholder="Description for good performance (2-3 points)..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      multiline
                      value={item.descriptions.medium}
                      onChangeText={(text) => handleRubricChange(index, 'medium', text)}
                    />
                  </View>
                  
                  <View className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="alert-circle-outline" size={18} color="white" />
                      <Text className="text-white font-semibold ml-2 text-lg">Needs Improvement</Text>
                    </View>
                    <TextInput
                      className="text-white bg-transparent min-h-[80px]"
                      placeholder="Description for needs improvement (0-1 points)..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      multiline
                      value={item.descriptions.low}
                      onChangeText={(text) => handleRubricChange(index, 'low', text)}
                    />
                  </View>
                </View>
              </View>
            ))}
            
            <TouchableOpacity 
              className="flex-row items-center justify-center bg-white/10 rounded-xl py-4 border-2 border-white/30"
              onPress={handleAddRubric}
            >
              <Ionicons name="add-circle-outline" size={22} color="white" />
              <Text className="text-white font-semibold text-lg ml-3">Add Rubric Criterion</Text>
            </TouchableOpacity>
          </View>
        );
      // Removed case 8 as we now have 7 steps
        return (
          <View className="space-y-6">
            <View className="items-center mb-2">
              <Text className="text-3xl font-bold text-white mb-2">References & Resources</Text>
              <Text className="text-gray-300 text-center">Add supporting materials and references</Text>
            </View>
            
            <View className="space-y-4">
              {moduleData.references.map((ref, index) => (
                <View key={`ref-${index}`} className="flex-row items-center">
                  <View className="w-8 h-8 bg-white/10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="link-outline" size={16} color="white" />
                  </View>
                  <TextInput
                    className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-white border-2 border-white/10"
                    placeholder="https://example.com/resource"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={ref.url}
                    onChangeText={(text) => handleReferenceChange(index, text)}
                    keyboardType="url"
                  />
                  {moduleData.references.length > 1 && (
                    <TouchableOpacity 
                      className="ml-3 p-2"
                      onPress={() => {
                        const newRefs = [...moduleData.references];
                        newRefs.splice(index, 1);
                        handleInputChange('references', newRefs);
                      }}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              <TouchableOpacity 
                className="flex-row items-center justify-center bg-white/10 rounded-xl py-4 border-2 border-white/30"
                onPress={handleAddReference}
              >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Add Reference</Text>
              </TouchableOpacity>
            </View>

            {/* Final Review Section */}
            <View className="bg-white/10 rounded-2xl border border-white/20 p-6 mt-8">
              <View className="flex-row items-center mb-4">
                <Ionicons name="checkmark-done-circle-outline" size={24} color="white" />
                <Text className="text-white font-bold text-xl ml-3">Ready to Create!</Text>
              </View>
              <Text className="text-white text-lg leading-6">
                Review your module details. Once created, you'll be able to edit and manage it from your dashboard.
              </Text>
            </View>

            <TouchableOpacity 
              className="bg-white/10 rounded-xl py-5 mt-4"
              onPress={handleSubmit}
            >
              <Text className="text-white font-bold text-xl text-center">Create Learning Module</Text>
              <Text className="text-white text-center mt-1">All set! Let's get started</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-gray-900">
      <BackgroundDecor />
      
      {/* Main ScrollView */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="px-6 pt-10 pb-5">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-3xl font-bold text-white">Create Module</Text>
              <Text className="text-gray-400 text-lg">Step {step} of 7</Text>
            </View>
            <TouchableOpacity 
              className="bottom-3 w-10 h-10 bg-white/10 rounded-full items-center justify-center"
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Enhanced Progress Bar */}
          <View className="h-2 bg-white/10 rounded-full mb-6 overflow-hidden">
            <View 
              className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full"
              style={{
                width: `${(step / 7) * 100}%`,
              }}
            />
          </View>
          
          {/* Enhanced Step Indicators */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="pb-6 -mx-2"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <View key={i} className="items-center mx-3 w-16">
                <TouchableOpacity 
                  onPress={() => step > i && setStep(i)}
                  className={getStepIndicatorStyle(step, i)}
                  disabled={step < i}
                >
                  {step > i ? (
                    <Ionicons name="checkmark" size={16} color="white" />
                  ) : (
                    <Text className={`font-bold ${step === i ? 'text-white' : 'text-gray-400'}`}>
                      {i}
                    </Text>
                  )}
                </TouchableOpacity>
                <Text className={`text-xs mt-2 text-center font-medium ${
                  step === i ? 'text-white' : step > i ? 'text-violet-300' : 'text-gray-400'
                }`}>
                  {['Grade', 'Details', 'Key Points', 'Quiz', 'Task', 'Review', 'Finish'][i - 1]}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <View className="px-6 pb-6">
          <View className="bg-white/5 rounded-3xl border border-white/10 p-7 backdrop-blur">
            {renderStep()}
          </View>
        </View>

        {/* Extra padding at the bottom to account for fixed navigation */}
        <View className="h-24" />
      </ScrollView>

      {/* Fixed Navigation Buttons */}
      <View className="absolute bottom-0 left-0 right-0 flex-row justify-between p-6 bg-slate-900/90 border-t border-white/10 backdrop-blur-lg">
        {step < 7 ? (
          <View className="flex-1 flex-row">
            {step > 1 ? (
              <TouchableOpacity 
                className="flex-row items-center justify-center bg-white/10 rounded-xl py-4 flex-1 mr-3"
                onPress={handlePrevious}
              >
                <Text className="text-slate-300 text-lg font-semibold">Previous</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-1 mr-3" />
            )}
            
            <TouchableOpacity 
              className={`flex-row items-center justify-center rounded-xl py-4 flex-1 ${step > 1 ? 'ml-3' : 'ml-auto'}
                bg-violet-600`}
              onPress={handleNext}
            >
              <Text className="text-white font-bold text-lg">
                {step === 6 ? 'Submit' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1 flex-row">
            <TouchableOpacity 
              className="flex-row items-center justify-center bg-white/10 rounded-xl py-4 flex-1 mr-3"
              onPress={handlePrevious}
            >
              <Text className="text-slate-300 font-semibold">Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-1 flex-row items-center justify-center bg-violet-600 rounded-xl py-4 ml-3"
              onPress={handleSubmit}
            >
              <Text className="text-white font-bold text-lg">Submit Module</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}