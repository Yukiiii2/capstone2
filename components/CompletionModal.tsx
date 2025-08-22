import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StatusBar,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface CompletionModalProps {
  visible: boolean;
  showResultsPrompt: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onLater: () => void;
  onSeeResults: () => void;
}

/**
 * CompletionModal - Displays a modal with different states for completion and results
 * Handles both processing state and results prompt state
 */
const CompletionModal: React.FC<CompletionModalProps> = ({
  visible,
  showResultsPrompt,
  isProcessing,
  onClose,
  onLater,
  onSeeResults,
}) => {
  // Decorative circle positions and size  

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      {/* Status bar with translucent background */}
      <StatusBar translucent backgroundColor="transparent" />
      
      <View className="flex-1 bg-gray-900 pt-6">
        {/* Gradient Background */}
        <View className="absolute inset-0">
          <LinearGradient
            colors={["#0F172A", "#1E293B", "#0F172A"]}
            className="flex-1"
          />
        </View>

        <View className="flex-1 justify-center items-center p-1 py-4">
          <View className="bg-[#1A1F2E]/95 border border-white/10 backdrop-blur-xl rounded-2xl p-10 items-center w-[95%] h-70 max-w-[400px]">
            {!showResultsPrompt ? (
              // Processing State UI
              <>
                <Ionicons name="checkmark-circle" size={60} color="#FFFFFF" />
                <Text className="text-xl font-bold mt-4 mb-1 text-center text-white">
                  Congrats you're done!
                </Text>
                <Text className="text-base text-white text-center mb-5">
                  Please wait for the AI calculation
                </Text>
                {isProcessing && (
                  <View className="my-5">
                    <ActivityIndicator size="large" color="#8F00FF" />
                  </View>
                )}
              </>
            ) : (
            
              <>
                <View className="w-6 h-6 items-center justify-center">
                            <Image
                              source={require("../assets/ai.png")}
                              className="w-10 h-10 bottom-2"
                              resizeMode="contain"
                              tintColor="white"
                            />
                          </View>
                <Text className="text-xl font-bold mt-4 mb-1 text-center text-white">
                  Analysis Complete!
                </Text>
                <Text className="text-base text-white text-center mb-6">
                  Wish to see the full results?
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="bg-gray-500/40 py-3 px-6 rounded-xl min-w-[120px]"
                    onPress={onLater}
                  >
                    <Text className="text-white text-base font-semibold text-center">
                      Later
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-violet-500/80 py-3 px-6 rounded-xl min-w-[120px]"
                    onPress={onSeeResults}
                  >
                    <Text className="text-white text-base font-semibold text-center">
                      See Results
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CompletionModal;