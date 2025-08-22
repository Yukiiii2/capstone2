import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Image, 
  Alert,
  StatusBar,
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const VERIFICATION_OPTIONS = [
  { id: 'studentCard', icon: 'card-account-details', iconType: 'material-community', label: 'Student ID Card' },
  { id: 'portalScreenshot', icon: 'monitor-screenshot', iconType: 'material-community', label: 'Portal Enrollment Screenshot' },
  { id: 'enrollmentForm', icon: 'file-document', iconType: 'material-community', label: 'Enrollment Form' },
  { id: 'registrationForm', icon: 'file-document-edit', iconType: 'material-community', label: 'Registration Form' },
];

export default function CreateAccountStudent() {
  const [formData, setFormData] = useState({
    fullName: '',
    studentNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [selectedVerificationType, setSelectedVerificationType] = useState<string>('');
  const [verificationFile, setVerificationFile] = useState<string | null>(null);
  const [showVerificationDropdown, setShowVerificationDropdown] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, activeStep]);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        exif: false,
        base64: false,
        videoMaxDuration: 0, // No video
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVerificationFile(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleNext = () => {
    if (activeStep < 2) {
      setActiveStep(activeStep + 1);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  const handleSignUp = async () => {
    if (!termsAccepted) {
      Alert.alert('Terms and Conditions', 'Please accept the terms and conditions');
      return;
    }

    if (activeStep === 1) {
      if (!selectedVerificationType || !verificationFile) {
        Alert.alert('Missing Information', 'Please select a verification type and upload the required document');
        return;
      }
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setActiveStep(2);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View className="flex-row justify-center items-center mb-8">
      <View className="flex-row items-center">
        <View className={`h-1 w-24 ${activeStep >= 0 ? 'bg-violet-600' : 'bg-white/20'}`} />
        <View className={`h-1 w-24 ${activeStep >= 1 ? 'bg-violet-600' : 'bg-white/20'}`} />
        <View className={`h-1 w-24 ${activeStep >= 2 ? 'bg-violet-600' : 'bg-white/20'}`} />
      </View>
      <View className="absolute flex-row justify-between w-full px-2">
        <View className="items-center w-24">
          <Text className={`text-xs top-3 mt-2 ${activeStep >= 0 ? 'text-violet-400 font-medium' : 'text-gray-400'}`}>ACCOUNT</Text>
        </View>
        <View className="items-center w-24">
          <Text className={`text-xs top-3 mt-2 ${activeStep >= 1 ? 'text-violet-400 font-medium' : 'text-gray-400'}`}>VERIFY</Text>
        </View>
        <View className="items-center w-24">
          <Text className={`text-xs top-3 mt-2 ${activeStep >= 2 ? 'text-violet-400 font-medium' : 'text-gray-400'}`}>COMPLETE</Text>
        </View>
      </View>
    </View>
  );

  const renderFormStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Animated.View 
            style={[{
              opacity: fadeAnim,
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              borderRadius: 20,
              padding: 14,
              marginBottom: 30,
              marginTop: -25,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)'
            }]} 
            className="space-y-4"
          >
            <View className="items-center bottom-1 mb-2">
              <Text className="text-white text-2xl top-2 font-bold mb-1">Teacher Registration</Text>
              <Text className="text-gray-400 text-center top-1 text-sm mb-4">Join our educational community</Text>
              {renderProgressBar()}
            </View>

            {[
              { icon: 'person-outline', label: 'Full Name', value: formData.fullName, key: 'fullName', type: 'text' },
              { icon: 'confirmation-number', label: 'Student Number', value: formData.studentNumber, key: 'studentNumber', type: 'text' },
              { icon: 'mail-outline', label: 'Email Address', value: formData.email, key: 'email', type: 'email' },
              { icon: 'lock-outline', label: 'Password', value: formData.password, key: 'password', type: 'password', secure: !showPassword },
              { icon: 'lock-outline', label: 'Confirm Password', value: formData.confirmPassword, key: 'confirmPassword', type: 'password', secure: !showConfirmPassword }
            ].map((field, index) => (
              <View key={field.key} className="bottom-2 space-y-0.5">
                <Text className="text-white text-sm bottom-1 font-medium pl-1">{field.label}</Text>
                <View className="flex-row items-center bg-white/10 border border-white/10 rounded-lg px-3 py-0.1">
                  <MaterialIcons name={field.icon as any} size={18} color="white" style={{ marginRight: 10 }} />
                  <TextInput
                    className="flex-1 text-white text-[15px]"
                    placeholder={`Enter your ${field.label.toLowerCase()}`}
                    placeholderTextColor="#9CA3AF"
                    value={field.value}
                    onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                    secureTextEntry={field.secure}
                    keyboardType={field.type === 'email' ? 'email-address' : 'default'}
                    autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                  />
                  {(field.key === 'password' || field.key === 'confirmPassword') && (
                    <TouchableOpacity onPress={() => 
                      field.key === 'password' ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)
                    }>
                      <Ionicons name={field.secure ? 'eye-off-outline' : 'eye-outline'} size={18} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
                {field.key === 'password' && (
                  <Text className="text-gray-400 text-xs pl-1">Minimum 8 characters with numbers & symbols</Text>
                )}
              </View>
            ))}
          </Animated.View>
        );
      
      case 1:
        return (
          <Animated.View 
            style={[{
              opacity: fadeAnim,
              backgroundColor: 'rgba(30, 41, 59, 0.7)',
              borderRadius: 20,
              padding: 20,
              marginTop: -20,
              marginBottom: 30,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
            }]}
            className="space-y-6"
          >
            <View className="items-center">
              <Text className="text-white text-3xl font-bold mb-1">Verify Identity</Text>
              <Text className="text-gray-400 text-center text-sm mb-4">Upload a document to verify your student status</Text>
              {renderProgressBar()}
            </View>

            <View className="space-y-3 bottom-4" style={{ position: 'relative' }}>
              <Text className="text-white text-base font-semibold pl-1">Document Type</Text>
              <View style={{ position: 'relative' }}>
                <TouchableOpacity 
                  className="flex-row items-center justify-between bg-white/10 border border-white/20 rounded-lg px-4 py-2"
                  onPress={() => setShowVerificationDropdown(!showVerificationDropdown)}
                >
                  <Text className={`text-[15px] ${selectedVerificationType ? 'text-white' : 'text-gray-400'}`}>
                    {selectedVerificationType 
                      ? VERIFICATION_OPTIONS.find(opt => opt.id === selectedVerificationType)?.label 
                      : 'Select document type'}
                  </Text>
                  <Ionicons name={showVerificationDropdown ? 'chevron-up' : 'chevron-down'} size={18} color="white" />
                </TouchableOpacity>
                
                <Modal
                  visible={showVerificationDropdown}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowVerificationDropdown(false)}
                >
                  <TouchableWithoutFeedback onPress={() => setShowVerificationDropdown(false)}>
                    <View className="flex-1 bg-black/50">
                      <View className="absolute top-1/2 left-4 right-4 bg-[#1e293b]/95 drop-shadow-xl border border-white/10 rounded-lg overflow-hidden" style={{
                        transform: [{ translateY: -150 }],
                        maxHeight: 300,
                      }}>
                        <ScrollView>
                          {VERIFICATION_OPTIONS.map((option) => (
                            <TouchableOpacity
                              key={option.id}
                              className="flex-row items-center px-4 py-3 space-x-3 active:bg-white/5"
                              onPress={() => {
                                setSelectedVerificationType(option.id);
                                setShowVerificationDropdown(false);
                              }}
                            >
                              <MaterialCommunityIcons 
                                name={option.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                                size={20} 
                                color="#FFFFFF" 
                              />
                              <Text className="text-white text-sm">{option.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
              </View>

              {selectedVerificationType && (
                <View className="space-y-3 mt-4">
                  <Text className="text-white text-base font-semibold pl-1">Upload Document</Text>
                  {verificationFile ? (
                    <View className="bg-violet-500/20 border border-violet-400/30 rounded-lg p-3">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Ionicons name="document-text" size={18} color="white" style={{ marginRight: 10 }} />
                          <Text className="text-white font-medium">Document Uploaded</Text>
                        </View>
                        <View className="flex-row space-x-2">
                          <TouchableOpacity 
                            className="bg-white/20 p-1.5 rounded-md"
                            onPress={() => setVerificationFile(null)}
                          >
                            <Ionicons name="trash-outline" size={16} color="white" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            className="bg-white/20 p-1.5 rounded-md"
                            onPress={pickImage}
                          >
                            <Ionicons name="refresh" size={16} color="white" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      className="bg-violet-600/20 border-2 border-dashed border-violet-400/30 rounded-lg p-5 items-center active:bg-violet-600/30"
                      onPress={pickImage}
                    >
                      <Ionicons name="cloud-upload-outline" size={24} color="white" />
                      <Text className="text-white font-medium mt-2 text-center text-sm">Tap to upload your document</Text>
                      <Text className="text-gray-400 text-xs mt-1">JPG, PNG, PDF (Max 5MB)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View className="flex-row items-start mt-4">
                <TouchableOpacity 
                  onPress={() => setTermsAccepted(!termsAccepted)}
                  className="flex-row items-start pt-0.5"
                >
                  <View className={`w-5 h-5 left-1 top-3 rounded border-2 ${
                    termsAccepted ? 'bg-violet-600 border-violet-600' : 'border-gray-400'
                  } items-center justify-center mr-3`}>
                    {termsAccepted && <Ionicons name="checkmark" size={14} color="white" />}
                  </View>
                </TouchableOpacity>
                <Text className="text-gray-300 left-1 text-xs top-4 flex-1">
                  I agree to the <Text className="text-violet-300 font-medium">Terms of Service</Text> and{' '}
                  <Text className="text-violet-300 font-medium">Privacy Policy</Text>
                </Text>
              </View>
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View style={{ opacity: fadeAnim }} className="items-center space-y-6">
            <View className="items-center">
              <View className="bg-white/10 p-5 rounded-full mb-4">
                <Ionicons name="checkmark-circle" size={44} color="#A78BFA" />
              </View>
              <Text className="text-white text-2xl font-bold mb-1 text-center">Successfully Submitted!</Text>
              <Text className="text-gray-400 text-center text-sm mb-4">Your application is under review</Text>
              {renderProgressBar()}
            </View>

            <View className="bg-white/10 border border-white/20 rounded-lg p-6 w-full mb-5">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#FFFFFF" style={{ marginTop: 2, marginRight: 10 }} />
                <View className="flex-1">
                  <Text className="text-white font-semibold text-xl mb-2">What's Next?</Text>
                  {[
                    { icon: 'time', text: '1-2 business days for verification' },
                    { icon: 'mail', text: `Confirmation sent to ${formData.email}` },
                    { icon: 'document-text', text: 'Check email for updates' }
                  ].map((item, index) => (
                    <View key={index} className="flex-row items-center mb-2 last:mb-0">
                      <Ionicons name={item.icon as any} size={14} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text className="text-white text-medium">{item.text}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View className="w-full bottom-5 space-y-3">
              <TouchableOpacity 
                className="bg-violet-600/80 w-full py-3 rounded-lg items-center justify-center active:bg-violet-700/80"
                onPress={() => router.push('/landing-page')}
              >
                <Text className="text-white font-semibold text-base">Landing Page</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="bg-white/10 border border-white/10 w-full py-3 rounded-lg items-center justify-center active:bg-white/20"
                onPress={() => Alert.alert('Email Resent', 'Confirmation email sent again')}
              >
                <Text className="text-white font-medium">Resend Email</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  const BackgroundDecor = () => (
    <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
      <View className="absolute left-0 right-0 top-0 bottom-0">
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A"]}
          className="flex-1"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
      <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
      <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
    </View>
  );

  return (
    <View className="flex-1 bg-gray-900" style={{ zIndex: 1 }}>
      <StatusBar barStyle="light-content" />
      <BackgroundDecor />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        style={{ zIndex: 1 }}
      >
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-5 pt-6 pb-2"
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          style={{ zIndex: 1 }}
        >
          {/* Header with logo and app name */}
          <View className="flex-row justify-between bottom-0.1 items-center mb-7 w-full">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => router.push("/")}
              activeOpacity={0.7}
            >
              <Image
                source={require("../assets/Speaksy.png")}
                className="w-11 h-11 rounded-full right-2"
                resizeMode="contain"
              />
              <Text className="text-white font-bold text-2xl ml-2 -left-5">
                Voclaria
              </Text>
            </TouchableOpacity>
          </View>

          {renderFormStep()}

          {activeStep === 0 && (
            <View className="mt-6">
              <TouchableOpacity
                className="py-3 rounded-lg items-center justify-center w-full max-w-[320px] bottom-10 mx-auto bg-violet-600/80 active:bg-violet-700/80"
                onPress={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Continue
                  </Text>
                )}
              </TouchableOpacity>

              <View className="mt-6">
                <View className="flex-row items-center my-4">
                  <View className="flex-1 h-px bottom-16 bg-white/20" />
                  <Text className="text-gray-400 text-xs bottom-16 font-medium px-3">or continue with</Text>
                  <View className="flex-1 h-px bottom-16 bg-white/20" />
                </View>

                <View className="items-center">
                  <TouchableOpacity
                    className="flex-row items-center justify-center w-full max-w-[320px] bg-white/10 bottom-16 border border-white/20 rounded-lg py-3 mb-3"
                    onPress={() => console.log("Google Sign In")}
                  >
                    <Image
                      source={require("../assets/Google.png")}
                      className="w-5 h-5 mr-3"
                    />
                    <Text className="text-white font-medium">Continue with Google</Text>
                  </TouchableOpacity>
                  {showVerificationDropdown && (
                    <View className="absolute top-full left-0 right-0 mt-1 bg-[#1e293b] border border-white/20 rounded-lg overflow-hidden">
                      {VERIFICATION_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          className="flex-row items-center px-4 py-3 space-x-3 hover:bg-white/5"
                          onPress={() => {
                            setSelectedVerificationType(option.id);
                            setShowVerificationDropdown(false);
                          }}
                        >
                          <MaterialCommunityIcons 
                            name={option.icon as any} 
                            size={20} 
                            color="#94a3b8" 
                          />
                          <Text className="text-gray-200">{option.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <Text className="text-gray-400 text-xs text-center mt-2">
                  Already have an account?{' '}
                  <Text 
                    className="text-violet-300 font-medium"
                    onPress={() => router.push("/login")}
                  >
                    Sign in
                  </Text>
                </Text>
              </View>
            </View>
          )}

          {activeStep === 1 && (
            <View className="mt-6 space-y-3" style={{ position: 'relative', zIndex: 1 }}>
              <TouchableOpacity
                className={`py-3 rounded-lg items-center justify-center -top-10 w-full max-w-[320px] mx-auto ${
                  !termsAccepted ? 'bg-gray-600' : 'bg-violet-600/80'
                } active:bg-violet-700/80`}
                style={{ zIndex: 1 }}
                onPress={handleSignUp}
                disabled={!termsAccepted || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-base">Submit Application</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="py-3 rounded-lg items-center justify-center -top-10 w-full max-w-[320px] mx-auto bg-white/10 border border-white/20 active:bg-white/20"
                style={{ zIndex: 1 }}
                onPress={handleBack}
              >
                <Text className="text-white font-medium text-base">Previous</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeStep === 0 && (
                <View className="mt-6">
                  <View className="flex-row bottom-16 items-center my-4">
                    <View className="flex-1  h-px bg-white/20" />
                    <Text className="text-gray-400 text-xs font-medium px-3">Continue with</Text>
                    <View className="flex-1 h-px bg-white/20" />
                  </View>

                  <View className="items-center">
                    <TouchableOpacity
                      className="flex-row items-center justify-center w-full bg-white/10 border border-white/20 bottom-16 rounded-lg py-3 mb-3"
                      onPress={() => console.log("Google Sign In")}
                    >
                      <Image
                        source={require("../assets/Google.png")}
                        className="w-5 h-5 mr-3"
                      />
                      <Text className="text-white font-medium">Continue with Google</Text>
                    </TouchableOpacity>
                  </View>
                  <Text className="text-gray-400 text-xs text-center mt-2">
                    Already have an account?{' '}
                    <Text 
                      className="text-violet-300 font-medium"
                      onPress={() => router.push("/login")}
                    >
                      Sign in
                    </Text>
                  </Text>

                </View>
              )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}