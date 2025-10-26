import React from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';

const STRANDS = ["STEM", "HUMSS", "ABM", "GAS", "TVL"];

interface StrandGradeModalProps {
  visible: boolean;
  onClose: () => void;
  selectedGrade11Strand: string | null;
  selectedGrade12Strand: string | null;
  onSelectStrand: (grade: '11' | '12', strand: string) => void;
}

const StrandGradeModal: React.FC<StrandGradeModalProps> = ({
  visible,
  onClose,
  selectedGrade11Strand,
  selectedGrade12Strand,
  onSelectStrand,
}) => {
  const renderStrandButton = (strand: string, isSelected: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={strand}
      onPress={onPress}
      activeOpacity={0.7}
      className="w-[90%] py-3 bg-[#2A2A3A] rounded-xl mb-2.5 items-center justify-center border border-[#3A3A4A]"
    >
      <Text className="text-[#E0E0E0] text-sm font-medium">
        {strand}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/70 justify-center items-center p-5">
        <View className="w-[90%] bg-[#1E1E2D] rounded-2xl p-6 items-center">
          <Text className="text-white text-2xl font-bold mb-7">Select Class</Text>
          
          <View className="flex-row w-full mb-2">
            {/* Grade 11 Section */}
            <View className="flex-1 items-center">
              <Text className="text-white text-lg font-semibold mb-4">Grade 11</Text>
              <View className="w-full items-center">
                {STRANDS.map((strand) =>
                  renderStrandButton(
                    strand,
                    selectedGrade11Strand === strand,
                    () => onSelectStrand('11', strand)
                  )
                )}
              </View>
            </View>

            {/* Vertical Divider */}
            <View className="w-px bg-[#3A3A4A] mx-2.5" />

            {/* Grade 12 Section */}
            <View className="flex-1 items-center">
              <Text className="text-white text-lg font-semibold mb-4">Grade 12</Text>
              <View className="w-full items-center">
                {STRANDS.map((strand) =>
                  renderStrandButton(
                    strand,
                    selectedGrade12Strand === strand,
                    () => onSelectStrand('12', strand)
                  )
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity 
            onPress={onClose}
            className="w-[90%] py-3 bg-[#3A3A4A] rounded-xl items-center justify-center border border-[#4A4A5A] mt-2.5 mb-1"
          >
            <Text className="text-white text-sm font-medium">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default StrandGradeModal;