import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <ScrollView style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>Fluentech</Text>
      </View>

      {/* Student Tag */}
      <View style={styles.studentTag}>
        <Text style={styles.studentTagText}>STUDENT</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>Welcome Back!</Text>

      {/* School Email */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>School Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your school email"
          placeholderTextColor="#AFAFC0"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Password */}
      <View style={styles.inputGroupPassword}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#AFAFC0"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {/* Remember Me + Forgot */}
      <View style={styles.rememberForgotRow}>
        <TouchableOpacity
          style={styles.rememberMeButton}
          onPress={() => setRememberMe(!rememberMe)}
        >
          <View
            style={[
              styles.checkbox,
              rememberMe ? styles.checkboxChecked : styles.checkboxUnchecked,
            ]}
          />
          <Text style={styles.rememberMeText}>Remember me</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Sign In Button */}
      <TouchableOpacity style={styles.signInButton}>
        <Text style={styles.signInButtonText}>Sign In</Text>
      </TouchableOpacity>

      {/* Or continue with */}
      <View style={styles.orContinueContainer}>
        <Text style={styles.orContinueText}>or continue with</Text>
        <TouchableOpacity style={styles.googleButton}>
          <FontAwesome name="google" size={18} color="#fff" />
          <Text style={styles.googleButtonText}>Google</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Up Prompt */}
      <View style={styles.signUpPrompt}>
        <Text style={styles.signUpPromptText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/create-account')}>
          <Text style={styles.signUpLink}>Sign up now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1E',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 4,
  },
  studentTag: {
    backgroundColor: '#29294d',
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  studentTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupPassword: {
    marginBottom: 8,
  },
  label: {
    color: '#fff',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#1C1C3A',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rememberForgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#8A5CFF',
    borderColor: '#8A5CFF',
  },
  checkboxUnchecked: {
    borderColor: '#AFAFC0',
    backgroundColor: 'transparent',
  },
  rememberMeText: {
    color: '#fff',
    fontSize: 14,
  },
  forgotText: {
    color: '#8A5CFF',
    fontSize: 14,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: '#8A5CFF',
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 24,
  },
  signInButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  orContinueContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  orContinueText: {
    color: '#888',
    marginBottom: 8,
  },
  googleButton: {
    backgroundColor: '#1C1C3A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    width: '100%',
  },
  googleButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  signUpPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signUpPromptText: {
    color: '#fff',
    fontSize: 14,
  },
  signUpLink: {
    color: '#8A5CFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
