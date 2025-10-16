import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import Markdown from "react-native-simple-markdown";
import { LinearGradient } from "expo-linear-gradient";

interface CompletionModalProps {
  visible: boolean;
  onClose: () => void;
  onLater: () => void;
  onSeeResults: () => void;
  ai_feedback: string | null;
  isProcessing: boolean;
  showResultsPrompt: boolean;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  visible,
  onClose,
  onLater,
  onSeeResults,
  ai_feedback,
  isProcessing,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View className="flex-1 bg-gray-900 pt-6">
        <View className="absolute inset-0">
          <LinearGradient
            colors={["#0F172A", "#1E293B", "#0F172A"]}
            className="flex-1"
          />
        </View>

        <View className="flex-1 justify-center items-center p-1 py-4">
          <View className="bg-[#1A1F2E]/95 border border-white/10 backdrop-blur-xl rounded-2xl p-10 w-[95%] h-70 max-w-[400px]">
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: 20 }}>
              {isProcessing ? (
                <>
                  <ActivityIndicator size="large" color="#8F00FF" />
                  <Text className="text-xl font-bold mt-4 mb-1 text-center text-white">
                    Processing AI Feedback...
                  </Text>
                  <Text className="text-base text-white text-center mb-6">
                    Please wait while we analyze your performance.
                  </Text>
                </>
              ) : (
                <>
                  <View className="w-6 h-6 items-center justify-center">
                    <Image
                      source={require("@/assets/ai.png")}
                      className="w-10 h-10 bottom-2"
                      resizeMode="contain"
                      tintColor="white"
                    />
                  </View>
                  <Text className="text-xl font-bold mt-4 mb-1 text-center text-white">
                    Analysis Complete!
                  </Text>
                  <Markdown
                    styles={{
                      text: { color: "white", fontSize: 14, lineHeight: 22, marginBottom: 10 }, // General text style with proper spacing
                      heading1: { color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 15 }, // H1 style with spacing
                      heading2: { color: "white", fontSize: 16, fontWeight: "bold", marginBottom: 12 }, // H2 style
                      bullet: { color: "white", fontSize: 14, marginVertical: 8, paddingLeft: 15 }, // Bullet list style with spacing
                      strong: { color: "#8F00FF", fontWeight: "bold" }, // Bold text style for *word* or **word**
                      em: { color: "#8F00FF", fontStyle: "italic" }, // Italic text style for _word_
                      listItem: { marginVertical: 8 }, // Spacing between list items
                      blockQuote: {
                        color: "white",
                        fontStyle: "italic",
                        borderLeftWidth: 4,
                        borderLeftColor: "#8F00FF",
                        paddingLeft: 10,
                        marginVertical: 12,
                      }, // Blockquote style with spacing
                    }}
                  >
                    {ai_feedback || "No feedback available."}
                  </Markdown>
                  <View className="flex-row gap-3 mt-4">
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
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CompletionModal;