import React, { useState } from 'react';
<<<<<<< HEAD
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';

const roles = ['STUDENT', 'TEACHER'];

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  circle1: {
    top: -64,
    left: -48,
    width: 160,
    height: 160,
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
  },
  circle2: {
    top: 96,
    right: -40,
    width: 96,
    height: 96,
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
  },
  circle3: {
    bottom: 96,
    left: 48,
    width: 36,
    height: 36,
    backgroundColor: 'rgba(103, 232, 249, 0.3)',
  },
  circle4: {
    bottom: 20,
    right: 40,
    width: 60,
    height: 60,
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
  },
  circle5: {
    top: 208,
    left: 96,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(103, 232, 249, 0.3)',
  },
});

export default function CreateAccount() {
  const router = useRouter();
  const params = useLocalSearchParams() || {};
  const [role, setRole] = useState(params.role ? String(params.role).toUpperCase() : '');
=======
import { View, Text, TextInput, TouchableOpacity, Pressable, KeyboardAvoidingView, Platform, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const roles = ['STUDENT', 'TEACHER'];

export default function CreateAccount() {
  const [role, setRole] = useState('STUDENT');
>>>>>>> e003ae521e62be56bc4db83fba4b5f6f7b4c85eb
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
<<<<<<< HEAD
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const allFieldsFilled = Boolean(
    role &&
      firstName.trim() &&
      lastName.trim() &&
      email.trim() &&
      idNumber.trim() &&
      password &&
      confirmPassword
  );
  const passwordsMatch = password === confirmPassword;
  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const hasError = (field: string, value: string): boolean => {
    if (!hasTriedSubmit) return false;
    if (field === 'email' && value.trim()) return !isEmailValid(value);
    if (field === 'confirmPassword' && value) return !passwordsMatch;
    return !value.trim();
  };

  const handleAgreementPress = () => {
    if (allFieldsFilled && passwordsMatch) {
      setAgreed(!agreed);
    } else {
      setHasTriedSubmit(true);
      setTouchedFields({
        role: true,
        firstName: true,
        lastName: true,
        email: true,
        idNumber: true,
        password: true,
        confirmPassword: true,
      });
    }
  };

  const isFormValid = allFieldsFilled && passwordsMatch && agreed;
  const isAgreementEnabled = allFieldsFilled && passwordsMatch;

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      {/* Background */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <LinearGradient
          colors={['#0A0A0F', '#1A1A2E', '#16213E']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
        <View style={[styles.circle, styles.circle4]} />
        <View style={[styles.circle, styles.circle5]} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, zIndex: 1 }} className="px-4 py-8">
          <View className="w-full max-w-xl mx-auto">
            {/* Header */}
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-2xl items-center justify-center mr-2 overflow-hidden">
                <Image source={require('../assets/Speaksy.png')} style={{ width: 52, height: 95, resizeMode: 'contain' }} />
              </View>
              <Text className="text-white text-2xl font-bold">Voclaria</Text>
            </View>
            <Text className="text-white text-2xl font-bold mb-6">Create Account</Text>

            {/* Form */}
            <View className="bg-white/20 rounded-2xl p-5">
              {/* Role Dropdown */}
              <View className="mb-4 relative">
                <Text className="text-gray-300 text-xs mb-1">Role</Text>
                <Pressable
                  onPress={() => setDropdownVisible((v) => !v)}
                  className={`flex-row items-center px-4 py-2 ${hasError('role', role) ? 'border border-red-500' : 'border border-transparent'} bg-white/30 rounded-lg`}
                >
                  <Text className={`flex-1 ${role ? 'text-white' : 'text-white/50'}`}>{role || 'Select your role'}</Text>
                  <Ionicons name={dropdownVisible ? 'chevron-up' : 'chevron-down'} size={20} color={hasError('role', role) ? '#ef4444' : '#fff'} />
                </Pressable>
                {dropdownVisible && (
                  <View className="absolute top-12 left-0 right-0 z-20 bg-[#1e1e3e]/95 rounded-lg shadow-md border border-white/10">
                    {roles.map((item) => (
                      <Pressable
                        key={item}
                        onPress={() => {
                          setRole(item);
                          setDropdownVisible(false);
                          setTouchedFields((prev) => ({ ...prev, role: true }));
                        }}
                        className={`px-4 py-3 ${role === item ? 'bg-violet-600/30' : 'bg-transparent'}`}
                      >
                        <Text className="text-white text-base">{item}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {hasError('role', role) && <Text className="text-red-500 text-xs mt-1">Please select a role</Text>}
              </View>

              {/* First & Last Name */}
              <View className="flex-row gap-2 mb-3">
                {[{ label: 'First Name', val: firstName, set: setFirstName, field: 'firstName' },
                  { label: 'Last Name', val: lastName, set: setLastName, field: 'lastName' }].map((f, i) => (
                  <View className="flex-1" key={i}>
                    <Text className="text-gray-300 text-xs mb-1">{f.label}</Text>
                    <TextInput
                      placeholder={`Enter ${f.label.toLowerCase()}`}
                      placeholderTextColor="#bbb"
                      className={`bg-white/30 text-white px-3 py-2 rounded-lg text-sm ${hasError(f.field, f.val) ? 'border border-red-500' : ''}`}
                      value={f.val}
                      onChangeText={(text) => {
                        f.set(text);
                        if (hasTriedSubmit) setTouchedFields((prev) => ({ ...prev, [f.field]: true }));
                      }}
                      onBlur={() => setTouchedFields((prev) => ({ ...prev, [f.field]: true }))}
                    />
                    {hasError(f.field, f.val) && <Text className="text-red-500 text-xs mt-1">Fill out first</Text>}
                  </View>
                ))}
              </View>

              {/* Email */}
              <Text className="text-gray-300 text-xs mb-1">School Email</Text>
              <View className="flex-row items-center bg-white/30 rounded-lg mb-3 pr-3">
                <View className="flex-1">
                  <TextInput
                    placeholder="Enter your school email"
                    placeholderTextColor="#bbb"
                    className={`w-full text-white px-3 py-2 text-sm ${hasError('email', email) ? 'border border-red-500' : ''}`}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (hasTriedSubmit) setTouchedFields((prev) => ({ ...prev, email: true }));
                    }}
                    onBlur={() => setTouchedFields((prev) => ({ ...prev, email: true }))}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {hasError('email', email) && <Text className="text-red-500 text-xs mt-1 ml-3">{!email.trim() ? 'Fill out first' : 'Please enter a valid email'}</Text>}
                </View>
                <Ionicons name="mail-outline" size={18} color="#bbb" />
              </View>

              {/* ID Number */}
              <Text className="text-gray-300 text-xs mb-1">ID Number</Text>
              <TextInput
                placeholder="Enter your ID number"
                placeholderTextColor="#bbb"
                className={`bg-white/30 text-white px-3 py-2 rounded-lg text-sm mb-1 ${hasError('idNumber', idNumber) ? 'border border-red-500' : ''}`}
                value={idNumber}
                onChangeText={(text) => {
                  setIdNumber(text);
                  if (hasTriedSubmit) setTouchedFields((prev) => ({ ...prev, idNumber: true }));
                }}
                onBlur={() => setTouchedFields((prev) => ({ ...prev, idNumber: true }))}
              />
              {hasError('idNumber', idNumber) && <Text className="text-red-500 text-xs mb-3">Fill out first</Text>}

              {/* Password & Confirm */}
              {[{ label: 'Password', value: password, setter: setPassword, show: showPassword, toggle: () => setShowPassword(!showPassword) },
                { label: 'Confirm Password', value: confirmPassword, setter: setConfirmPassword, show: showConfirmPassword, toggle: () => setShowConfirmPassword(!showConfirmPassword) }]
                .map((f, i) => (
                <View key={i}>
                  <Text className="text-gray-300 text-xs mb-1">{f.label}</Text>
                  <View className="flex-row items-center bg-white/30 rounded-lg mb-3">
                    <TextInput
                      placeholder={f.label === 'Password' ? 'Create a strong password' : 'Confirm your password'}
                      placeholderTextColor="#bbb"
                      className={`flex-1 text-white px-3 py-2 text-sm ${hasError(f.label.toLowerCase().includes('confirm') ? 'confirmPassword' : 'password', f.value) ? 'border border-red-500' : ''}`}
                      value={f.value}
                      onChangeText={(text) => {
                        f.setter(text);
                        if (hasTriedSubmit) setTouchedFields((prev) => ({ ...prev, password: true, confirmPassword: true }));
                      }}
                      onBlur={() => setTouchedFields((prev) => ({ ...prev, password: true, confirmPassword: true }))}
                      secureTextEntry={!f.show}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={f.toggle} className="pr-3">
                      <Ionicons name={f.show ? 'eye-off' : 'eye'} size={18} color="#bbb" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Agreement */}
              <View className="flex-row items-start mb-3">
                <Pressable onPress={handleAgreementPress} className="mr-2 mt-0.5" disabled={!isAgreementEnabled}>
                  <View className={`w-4 h-4 rounded border flex items-center justify-center ${!isAgreementEnabled ? 'border-white bg-white-500' : agreed ? 'border-violet-600 bg-violet-600' : 'border-gray-400 bg-transparent'}`}>
                    {agreed && <Ionicons name="checkmark" size={13} color="#fff" />}
                  </View>
                </Pressable>
                <Text className="text-white text-xs flex-1 mt-0.5">
                  I agree to the <Text className="text-violet-500 underline">Terms</Text> & <Text className="text-violet-500 underline">Privacy</Text>
                  {hasTriedSubmit && !isAgreementEnabled && <Text className="block text-red-500 text-xs mt-1">Please fill in all fields correctly first</Text>}
                </Text>
              </View>

              {/* Submit */}
              <TouchableOpacity disabled={!isFormValid} className={`bg-violet-600 rounded-lg py-3 flex-row justify-center items-center ${!isFormValid ? 'opacity-60' : 'opacity-100'}`}>
                <Text className="text-white font-bold text-base mr-2">Create Account</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>

              {/* Alt Login */}
              <Text className="text-gray-400 text-center my-4 text-sm">or continue with</Text>
              <TouchableOpacity className="flex-row items-center justify-center bg-white/10 rounded-lg py-2 mb-3" onPress={() => console.log('Google Sign In pressed')}>
                <Image source={require('../assets/Google.png')} style={{ width: 18, height: 18, resizeMode: 'contain', marginRight: 8 }} />
                <Text className="text-white text-base">Google</Text>
              </TouchableOpacity>

              {/* Footer */}
              <Text className="text-gray-400 text-center text-sm">
                Already have an account?{' '}
                <Text className="text-violet-500 underline" onPress={() => router.push('/role-selection')}>
                  Sign in
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Gradient Background with Decorative Circles */}
      <LinearGradient
        colors={['#0A0A0F', '#1A1A2E', '#16213E']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ ...StyleSheet.absoluteFillObject }}
        pointerEvents="none"
      >
        {/* Decorative Circles - mix of big and small, all transparent, no border */}
        <View style={{ position: 'absolute', top: -60, left: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: '#7c3aed', opacity: 0.13 }} />
        <View style={{ position: 'absolute', top: 100, right: -40, width: 90, height: 90, borderRadius: 45, backgroundColor: '#2563eb', opacity: 0.10 }} />
        <View style={{ position: 'absolute', bottom: 100, left: 50, width: 36, height: 36, borderRadius: 18, backgroundColor: '#43e6ff', opacity: 0.09 }} />
        <View style={{ position: 'absolute', bottom: 20, right: 40, width: 60, height: 60, borderRadius: 30, backgroundColor: '#a259ff', opacity: 0.09 }} />
        <View style={{ position: 'absolute', top: 200, left: 90, width: 22, height: 22, borderRadius: 11, backgroundColor: '#43e6ff', opacity: 0.10 }} />
      </LinearGradient>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: 400 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <Ionicons name="cube" size={24} color="#fff" />
            </View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>Speaksy</Text>
          </View>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Create Account</Text>

          {/* Card Container */}
          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 18, marginBottom: 18 }}>
            {/* Dropdown */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 8, position: 'relative' }}>
                <Pressable
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 }}
                  onPress={() => setDropdownVisible((v) => !v)}
                >
                  <Text style={{ color: 'white', flex: 1 }}>{role}</Text>
                  <Ionicons name={dropdownVisible ? 'chevron-up' : 'chevron-down'} size={20} color="#fff" />
                </Pressable>
                {/* Overlayed dropdown, does NOT change card layout */}
                {dropdownVisible && (
                  <View style={{
                    position: 'absolute',
                    top: 48,
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    backgroundColor: 'rgba(30,30,60,0.0)', // fully transparent
                    borderRadius: 8,
                    marginHorizontal: 4,
                    overflow: 'visible',
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.10,
                    shadowRadius: 6,
                  }}>
                    <View style={{ backgroundColor: 'rgba(30,30,60,0.97)', borderRadius: 8, overflow: 'hidden' }}>
                      {roles.map((item) => (
                        <Pressable
                          key={item}
                          onPress={() => { setRole(item); setDropdownVisible(false); }}
                          style={{ paddingVertical: 10, paddingHorizontal: 14, backgroundColor: role === item ? '#7c3aed22' : 'transparent' }}
                        >
                          <Text style={{ color: 'white', fontSize: 16 }}>{item}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )} 
              </View>
            </View>

            {/* First/Last Name */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#ccc', fontSize: 13, marginBottom: 2 }}>First Name</Text>
                <TextInput
                  placeholder="Enter your first name"
                  placeholderTextColor="#bbb"
                  style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 8, color: 'white', paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 }}
                  value={firstName}
                  onChangeText={setFirstName}
                  // @ts-ignore
                  placeholderStyle={{ fontSize: 12 }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#ccc', fontSize: 13, marginBottom: 2 }}>Last Name</Text>
                <TextInput
                  placeholder="Enter your last name"
                  placeholderTextColor="#bbb"
                  style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 8, color: 'white', paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 }}
                  value={lastName}
                  onChangeText={setLastName}
                  // @ts-ignore
                  placeholderStyle={{ fontSize: 12 }}
                />
              </View>
            </View>

            {/* Email */}
            <Text style={{ color: '#ccc', fontSize: 13, marginBottom: 2, marginTop: 4 }}>School Email</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 8, marginBottom: 10 }}>
              <TextInput
                placeholder="Enter your school email"
                placeholderTextColor="#bbb"
                style={{ flex: 1, color: 'white', paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 }}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                // @ts-ignore
                placeholderStyle={{ fontSize: 12 }}
              />
              <Ionicons name="mail-outline" size={18} color="#bbb" style={{ marginRight: 10 }} />
            </View>
            {/* ID Number */}
            <Text style={{ color: '#ccc', fontSize: 13, marginBottom: 2 }}>ID Number</Text>
            <TextInput
              placeholder="Enter your ID number"
              placeholderTextColor="#bbb"
              style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 8, color: 'white', paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 10 }}
              value={idNumber}
              onChangeText={setIdNumber}
              // @ts-ignore
              placeholderStyle={{ fontSize: 12 }}
            />
            {/* Password */}
            <Text style={{ color: '#ccc', fontSize: 13, marginBottom: 2 }}>Password</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 8, marginBottom: 10 }}>
              <TextInput
                placeholder="Create a strong password"
                placeholderTextColor="#bbb"
                style={{ flex: 1, color: 'white', paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 }}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                // @ts-ignore
                placeholderStyle={{ fontSize: 12 }}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color="#bbb" style={{ marginRight: 10 }} />
              </TouchableOpacity>
            </View>
            {/* Confirm Password */}
            <Text style={{ color: '#ccc', fontSize: 13, marginBottom: 2 }}>Confirm Password</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 8, marginBottom: 10 }}>
              <TextInput
                placeholder="Confirm your password"
                placeholderTextColor="#bbb"
                style={{ flex: 1, color: 'white', paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 }}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                // @ts-ignore
                placeholderStyle={{ fontSize: 12 }}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)}>
                <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color="#bbb" style={{ marginRight: 10 }} />
              </TouchableOpacity>
            </View>
            {/* Checkbox */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginTop: 2 }}>
              <Pressable onPress={() => setAgreed(!agreed)} style={{ marginRight: 8 }}>
                <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: agreed ? '#7c3aed' : '#bbb', backgroundColor: agreed ? '#7c3aed' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {agreed && <Ionicons name="checkmark" size={13} color="#fff" />}
                </View>
              </Pressable>
              <Text style={{ color: 'white', fontSize: 12 }}>
                I agree to the <Text style={{ color: '#7c3aed', textDecorationLine: 'underline' }}>Terms of Service</Text> and <Text style={{ color: '#7c3aed', textDecorationLine: 'underline' }}>Privacy Policy</Text>
              </Text>
            </View>
            {/* Create Account Button */}
            <TouchableOpacity
              style={{ backgroundColor: '#7c3aed', borderRadius: 8, paddingVertical: 13, alignItems: 'center', marginTop: 8, opacity: agreed ? 1 : 0.6, flexDirection: 'row', justifyContent: 'center' }}
              disabled={!agreed}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, marginRight: 8 }}>Create Account</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ alignSelf: 'center' }} />
            </TouchableOpacity>
            {/* OR Google */}
            <Text style={{ color: '#bbb', textAlign: 'center', marginVertical: 12, fontSize: 13 }}>or continue with</Text>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 8, paddingVertical: 10, marginBottom: 6 }}>
              <Ionicons name="logo-google" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontSize: 15 }}>Google</Text>
            </TouchableOpacity>
            {/* Bottom link */}
            <View style={{ paddingTop: 18 }}>
              <Text style={{ color: '#bbb', textAlign: 'center', fontSize: 13 }}>
                Don’t have an account? <Text style={{ color: '#7c3aed', textDecorationLine: 'underline' }}>Sign up now</Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
>>>>>>> e003ae521e62be56bc4db83fba4b5f6f7b4c85eb
  );
}
