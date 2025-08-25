import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Modal, 
  TouchableWithoutFeedback, 
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface JoinClassModalProps {
  visible: boolean;
  onClose: () => void;
  onJoinClass: (classCode: string) => void;
}

const JoinClassModal: React.FC<JoinClassModalProps> = ({ visible, onClose, onJoinClass }) => {
  const [classCode, setClassCode] = useState('');

  const handleJoin = () => {
    if (!classCode.trim()) {
      return;
    }
    onJoinClass(classCode);
    setClassCode('');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <TouchableWithoutFeedback>
            <View className="w-full max-w-[400px] bg-slate-800 rounded-2xl p-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white text-xl font-bold">Join a Class</Text>
                <TouchableOpacity onPress={onClose} className="p-1">
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              
              <Text className="text-slate-400 text-sm mb-6">
                Ask your teacher for the class code, then enter it here.
              </Text>
              
              <TextInput
                className="bg-slate-700 text-white rounded-xl p-4 mb-6 border border-slate-600 text-base"
                placeholder="Enter class code"
                placeholderTextColor="#94A3B8"
                value={classCode}
                onChangeText={setClassCode}
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus={true}
              />
              
              <View className="flex-row gap-3">
                <TouchableOpacity 
                  className="flex-1 bg-slate-700 rounded-xl py-3 items-center justify-center"
                  onPress={onClose}
                >
                  <Text className="text-white font-semibold text-base">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="flex-1 bg-purple-600 rounded-xl py-3 items-center justify-center"
                  onPress={handleJoin}
                >
                  <Text className="text-white font-semibold text-base">Join Class</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default JoinClassModal;