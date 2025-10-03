import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";

const API_BASE_URL = "https://unbalanceable-lyman-microstomatous.ngrok-free.dev"; // Replace with your FastAPI server URL

const PracticeScreen: React.FC = () => {
  const [studentId, setStudentId] = useState<string>(""); // Student ID input
  const [attemptId, setAttemptId] = useState<string>(""); // Attempt ID input
  const [file, setFile] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null); // Selected file
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const [transcription, setTranscription] = useState<string | null>(null); // Transcription result
  const [feedback, setFeedback] = useState<any | null>(null); // Feedback result

  // Function to pick an audio file
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*", // Accept audio files only
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0]; // Get the first selected file
        setFile({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || "audio/wav", // Use mimeType if available, fallback to "audio/wav"
        });
        Alert.alert("File Selected", `You selected: ${file.name}`);
      } else {
        Alert.alert("No File Selected", "You canceled the file selection.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick a file.");
    }
  };

  // Function to start analyzing the audio file
  const startAnalyzing = async () => {
    if (!studentId || !attemptId || !file) {
      Alert.alert("Error", "Please fill in all fields and select a file.");
      return;
    }

    setLoading(true);
    setTranscription(null);
    setFeedback(null);

    try {
      // Step 1: Call /process-audio
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
      formData.append("expected_text", "I Scream You Scream We all Scream For Ice Cream");

      const processAudioResponse = await axios.post(
        `${API_BASE_URL}/process-audio`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const { transcription, spacy_stats } = processAudioResponse.data;

      // Step 2: Call /analyze-feedback
      const analyzeFeedbackResponse = await axios.post(
        `${API_BASE_URL}/analyze-feedback`,
        {
          student_id: studentId,
          attempt_id: attemptId,
          speech_text: transcription,
          spacy_stats: spacy_stats,
        }
      );

      setTranscription(transcription);
      setFeedback(analyzeFeedbackResponse.data.feedback);
    } catch (error: any) {
      console.error("Error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to analyze the audio file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Practice Speech</Text>

      {/* Input fields for Student ID and Attempt ID */}
      <TextInput
        style={styles.input}
        placeholder="Enter Student ID"
        value={studentId}
        onChangeText={setStudentId}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter Attempt ID"
        value={attemptId}
        onChangeText={setAttemptId}
      />

      {/* File picker button */}
      <Button title="Select Audio File" onPress={pickFile} />
      {file && <Text style={styles.fileName}>Selected File: {file.name}</Text>}

      {/* Start analyzing button */}
      <Button title="Start Analyzing" onPress={startAnalyzing} />

      {/* Loading indicator */}
      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {/* Display transcription result */}
      {transcription && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Transcription:</Text>
          <Text>{transcription}</Text>
        </View>
      )}

      {/* Display feedback result */}
      {feedback && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Feedback:</Text>
          <Text>{feedback.summary}</Text>
          <Text style={styles.resultTitle}>Recommendations:</Text>
          {feedback.recommendations.map((rec: string, index: number) => (
            <Text key={index}>- {rec}</Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  fileName: {
    marginTop: 10,
    fontStyle: "italic",
  },
  result: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#f9f9f9",
  },
  resultTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
});

export default PracticeScreen;