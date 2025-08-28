import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  TouchableWithoutFeedback, 
  Keyboard,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import type { PickerProps } from '@react-native-picker/picker';

interface JoinClassModalProps {
  visible: boolean;
  onClose: () => void;
  onJoinClass: (data: { classCode: string; gradeLevel: string; strand: string }) => void;
}

type GradeLevel = '11' | '12' | '';
type Strand = 'STEM' | 'ABM' | 'GAS' | 'HUMMS' | 'TVL' | '';

const JoinClassModal: React.FC<JoinClassModalProps> = ({ visible, onClose, onJoinClass }) => {
  const [classCode, setClassCode] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('');
  const [strand, setStrand] = useState<Strand>('');
  const [showGradeError, setShowGradeError] = useState(false);
  const [showStrandError, setShowStrandError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showStrandDropdown, setShowStrandDropdown] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const gradeLevels = [
    { label: 'Grade 11', value: '11' },
    { label: 'Grade 12', value: '12' }
  ];

  const strands = [
    { label: 'STEM', value: 'STEM' },
    { label: 'ABM', value: 'ABM' },
    { label: 'GAS', value: 'GAS' },
    { label: 'HUMMS', value: 'HUMMS' },
    { label: 'TVL', value: 'TVL' }
  ];

  const toggleGradeDropdown = () => {
    if (showStrandDropdown) setShowStrandDropdown(false);
    setShowGradeDropdown(!showGradeDropdown);
  };

  const toggleStrandDropdown = () => {
    if (!gradeLevel) return;
    if (showGradeDropdown) setShowGradeDropdown(false);
    setShowStrandDropdown(!showStrandDropdown);
  };

  const selectGrade = (value: GradeLevel) => {
    setGradeLevel(value);
    setShowGradeError(false);
    setShowGradeDropdown(false);
    // Reset strand when grade changes
    setStrand('');
  };

  const selectStrand = (value: Strand) => {
    setStrand(value);
    setShowStrandError(false);
    setShowStrandDropdown(false);
  };

  const resetForm = () => {
    setClassCode('');
    setGradeLevel('');
    setStrand('');
    setShowGradeError(false);
    setShowStrandError(false);
    setShowGradeDropdown(false);
    setShowStrandDropdown(false);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const handleJoin = () => {
    let isValid = true;
    
    if (!gradeLevel) {
      setShowGradeError(true);
      isValid = false;
    }
    
    if (!strand) {
      setShowStrandError(true);
      isValid = false;
    }
    
    if (!classCode.trim()) {
      return;
    }
    
    if (isValid) {
      setIsSubmitting(true);
      onJoinClass({
        classCode: classCode.trim(),
        gradeLevel,
        strand
      });
      resetForm();
      setIsSubmitting(false);
    }
  };

  const isFormValid = classCode.trim().length > 0 && gradeLevel && strand;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableWithoutFeedback>
            <View className="bg-[#1A1F2E]/95 backdrop-blur-xl rounded-t-3xl p-6 max-h-[80%] border-t border-white/10">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-white text-2xl font-bold">Join a Class</Text>
                <TouchableOpacity onPress={onClose} className="p-1">
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-slate-400 text-base mb-6">
                  Please select your grade level and strand, then enter the class code provided by your teacher.
                </Text>
                
                {/* Grade Level Dropdown */}
                <View className="mb-4 relative">
                  <Text className="text-white text-base font-medium mb-2">Grade Level</Text>
                  <TouchableOpacity 
                    className="bg-white/5 rounded-xl p-4 border border-white/10 flex-row justify-between items-center"
                    onPress={toggleGradeDropdown}
                    activeOpacity={0.7}
                  >
                    <Text className={`${gradeLevel ? 'text-white' : 'text-gray-400'}`}>
                      {gradeLevel ? `Grade ${gradeLevel}` : 'Select Grade Level'}
                    </Text>
                    <Ionicons 
                      name={showGradeDropdown ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="#94A3B8" 
                    />
                  </TouchableOpacity>
                  {showGradeError && (
                    <Text className="text-red-400 text-xs mt-1">Please select your grade level</Text>
                  )}
                  
                  {showGradeDropdown && (
                    <View className="absolute z-10 w-full mt-1 bg-[#1A1F2E] border border-white/10 rounded-xl overflow-hidden top-full">
                      {gradeLevels.map((item) => (
                        <TouchableOpacity
                          key={item.value}
                          className={`px-4 py-3 ${gradeLevel === item.value ? 'bg-blue-500/20' : ''}`}
                          onPress={() => selectGrade(item.value as GradeLevel)}
                        >
                          <Text className="text-white">{item.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                
                {/* Strand Dropdown */}
                <View className="mb-6 relative">
                  <Text className="text-white text-base font-medium mb-2">Strand</Text>
                  <TouchableOpacity 
                    className={`${!gradeLevel ? 'opacity-50' : ''} bg-white/5 rounded-xl p-4 border ${!gradeLevel ? 'border-white/5' : 'border-white/10'} flex-row justify-between items-center`}
                    onPress={toggleStrandDropdown}
                    activeOpacity={0.7}
                    disabled={!gradeLevel}
                  >
                    <Text className={`${strand ? 'text-white' : 'text-gray-400'}`}>
                      {strand || (gradeLevel ? 'Select Strand' : 'Select Grade Level First')}
                    </Text>
                    <Ionicons 
                      name={showStrandDropdown ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color={!gradeLevel ? '#4B5563' : '#94A3B8'} 
                    />
                  </TouchableOpacity>
                  {showStrandError && (
                    <Text className="text-red-400 text-xs mt-1">Please select your strand</Text>
                  )}
                  
                  {showStrandDropdown && (
                    <View className="absolute z-10 w-full mt-1 bg-[#1A1F2E] border border-white/10 rounded-xl overflow-hidden top-full">
                      {strands.map((item) => (
                        <TouchableOpacity
                          key={item.value}
                          className={`px-4 py-3 ${strand === item.value ? 'bg-blue-500/20' : ''}`}
                          onPress={() => selectStrand(item.value as Strand)}
                        >
                          <Text className="text-white">{item.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                
                {/* Class Code Input */}
                <View className="mb-6">
                  <Text className="text-white text-base font-medium mb-2">Class Code</Text>
                  <TextInput
                    className="bg-white/5 text-white rounded-xl p-4 border border-white/10 text-base"
                    placeholder="Enter class code"
                    placeholderTextColor="#94A3B8"
                    value={classCode}
                    onChangeText={setClassCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    editable={!!gradeLevel && !!strand}
                    style={!gradeLevel || !strand ? { opacity: 0.5 } : {}}
                  />
                  {(!gradeLevel || !strand) && (
                    <Text className="text-amber-400 text-xs mt-1">
                      Please select both grade level and strand first
                    </Text>
                  )}
                </View>
                
                {/* Action Buttons */}
                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity 
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-4 items-center justify-center active:bg-white/10"
                    onPress={handleCancel}
                    disabled={isSubmitting}
                  >
                    <Text className="text-white font-semibold text-base">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className={`flex-1 rounded-xl py-4 items-center justify-center border ${
                      isFormValid ? 'bg-violet-600 border-violet-600 active:bg-violet-700' : 'bg-violet-600/50 border-violet-600/50'
                    }`}
                    onPress={handleJoin}
                    disabled={!isFormValid || isSubmitting}
                  >
                    <Text className="text-white font-semibold text-base">
                      {isSubmitting ? 'Joining...' : 'Join Class'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      {(showGradeDropdown || showStrandDropdown) && (
        <TouchableWithoutFeedback 
          onPress={() => {
            setShowGradeDropdown(false);
            setShowStrandDropdown(false);
          }}
        >
          <View className="absolute inset-0" />
        </TouchableWithoutFeedback>
      )}

    </Modal>
  );
};

const styles = StyleSheet.create({
  picker: {
    color: 'white',
    height: 50,
  },
});

export default JoinClassModal;