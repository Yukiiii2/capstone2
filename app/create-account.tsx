import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, KeyboardAvoidingView, Platform, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const roles = ['STUDENT', 'TEACHER'];

export default function CreateAccount() {
  const [role, setRole] = useState('STUDENT');
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
  );
}
