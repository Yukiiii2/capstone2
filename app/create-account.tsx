// app/create-account.tsx
import { View, Text, TextInput, TouchableOpacity, ScrollView, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";

export default function CreateAccount() {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Create Account</Text>

      {/* Role Selection */}
      <View style={styles.roleBox}>
        <Text style={styles.roleText}>STUDENT ▼</Text>
      </View>

      {/* First and Last Name */}
      <View style={styles.row}>
        <TextInput
          placeholder="Enter your first name"
          placeholderTextColor="#ccc"
          style={[styles.input, styles.flex1]}
        />
        <TextInput
          placeholder="Enter your last name"
          placeholderTextColor="#ccc"
          style={[styles.input, styles.flex1]}
        />
      </View>

      {/* School Email */}
      <TextInput
        placeholder="Enter your school email"
        placeholderTextColor="#ccc"
        keyboardType="email-address"
        style={[styles.input, styles.mb4]}
      />

      {/* ID Number */}
      <TextInput
        placeholder="Enter your ID number"
        placeholderTextColor="#ccc"
        keyboardType="numeric"
        style={[styles.input, styles.mb4]}
      />

      {/* Password */}
      <TextInput
        placeholder="Create a strong password"
        placeholderTextColor="#ccc"
        secureTextEntry
        style={[styles.input, styles.mb4]}
      />

      {/* Confirm Password */}
      <TextInput
        placeholder="Confirm your password"
        placeholderTextColor="#ccc"
        secureTextEntry
        style={[styles.input, styles.mb4]}
      />

      {/* Terms Agreement */}
      <Text style={styles.terms}>
        <Text style={styles.checkbox}>□ </Text>
        I agree to the <Text style={styles.link}>Terms of Service</Text> and{" "}
        <Text style={styles.link}>Privacy Policy</Text>
      </Text>

      {/* Create Account Button */}
      <TouchableOpacity style={styles.createBtn}>
        <Text style={styles.createBtnText}>Create Account →</Text>
      </TouchableOpacity>

      {/* Google Button */}
      <View style={styles.googleBox}>
        <TouchableOpacity style={styles.googleBtn}>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Link */}
      <Text style={styles.footer}>
        Don’t have an account?{" "}
        <Text style={styles.link}>Sign up now</Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B1430",
    paddingHorizontal: 24,
    paddingTop: 64,
  },
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  roleBox: {
    backgroundColor: "#2C2251",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  roleText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  flex1: {
    flex: 1,
  },
  input: {
    backgroundColor: "#2C2251",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
  },
  mb4: {
    marginBottom: 16,
  },
  terms: {
    color: "#fff",
    fontSize: 12,
    marginBottom: 24,
  },
  checkbox: {
    color: "#fff",
  },
  link: {
    color: "#60a5fa",
    textDecorationLine: "underline",
  },
  createBtn: {
    backgroundColor: "#6B26D9",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  createBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  googleBox: {
    alignItems: "center",
    marginBottom: 16,
  },
  googleBtn: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  googleBtnText: {
    color: "#000",
  },
  footer: {
    color: "#fff",
    textAlign: "center",
    fontSize: 12,
  },
});
