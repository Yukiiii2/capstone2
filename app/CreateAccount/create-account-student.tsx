import React, { useState, useRef, useEffect } from "react";
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
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system";
import { supabase } from "@/lib/supabaseClient";
import { title } from "process";

// ---------- helpers ----------
const showCustomAlert = (title: string, message: string) => {
  Alert.alert(title, message, [{ text: "OK", style: "cancel" }], {
    cancelable: true,
    userInterfaceStyle: "dark",
  });
};

const { width } = Dimensions.get("window");

// Keep your original student options
// Add near the top with other constants
const TERMS_AND_CONDITIONS = [
  {
    title: "User Agreement",
    content: "By using Voclaria, you agree to use the app properly and for learning purposes only. This app helps you improve your public speaking skills. Please use it respectfully and responsibly."
  },
  {
    title: "Privacy Policy", 
    content: "Voclaria may collect your voice, video, and facial expressions during speaking sessions. This information helps the AI give feedback on your performance. Your data will not be shared with anyone outside the development team and will be stored safely and securely."
  },
  {
    title: "Code of Conduct",
    content: "Use the app with respect. Do not record or say anything inappropriate or harmful. Voclaria is a space to learn confidently and positively."
  },
  {
    title: "Data Usage",
    content: "The app uses your camera and microphone to analyze your tone, expressions, and delivery. This helps the AI assess your speaking skills. All recordings are kept private and used only for educational purposes. You may disable the camera anytime, but some features may not work."
  },
  {
    title: "Data Protection & Security",
    content: "Voclaria follows the Republic Act No. 10173 – Data Privacy Act of 2012 of the Philippines. This means your personal data is protected by law. All information collected is encrypted, stored safely, and processed according to strict privacy standards to prevent misuse or unauthorized access."
  }

];
const VERIFICATION_OPTIONS = [
  {
    id: "studentCard",
    icon: "card-account-details",
    iconType: "material-community",
    label: "Student ID Card",
  },
  {
    id: "portalScreenshot",
    icon: "monitor-screenshot",
    iconType: "material-community",
    label: "Portal Enrollment Screenshot",
  },
  {
    id: "enrollmentForm",
    icon: "file-document",
    iconType: "material-community",
    label: "Enrollment Form",
  },
  {
    id: "registrationForm",
    icon: "file-document-edit",
    iconType: "material-community",
    label: "Registration Form",
  },
];

// Use your storage bucket
const BUCKET = "verify-docs";

// Types
type FormData = {
  firstName: string;
  lastName: string;
  mobileNumber: string; // expects 10 or 11 digits UI flow; we convert to +63
  email: string;
  password: string;
  confirmPassword: string;
};

export default function CreateAccountStudent() {
  // ---------- state ----------
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    mobileNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [selectedVerificationType, setSelectedVerificationType] =
    useState<string>("");
  const [verificationFile, setVerificationFile] = useState<string | null>(null);
  const [showVerificationDropdown, setShowVerificationDropdown] =
    useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  // Add with other state declarations
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // 👇 visibility toggles
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ---------- animation ----------
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, activeStep]);

  // ---------- pick images (unchanged UI) ----------
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        exif: false,
        base64: false,
        videoMaxDuration: 0,
        selectionLimit: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVerificationFile(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showCustomAlert("Error", "Failed to pick image. Please try again.");
    }
  };

  const pickVerificationDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        exif: false,
        base64: false,
        videoMaxDuration: 0,
        selectionLimit: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVerificationFile(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showCustomAlert("Error", "Failed to pick image. Please try again.");
    }
  };

  // ---------- validation (unchanged UX) ----------
  const validateStep = (step: number) => {
    if (step === 0) {
      const requiredFields: (keyof FormData)[] = [
        "firstName",
        "lastName",
        "mobileNumber",
        "email",
        "password",
        "confirmPassword",
      ];
      const emptyFields = requiredFields.filter((f) => !formData[f]?.trim());
      if (emptyFields.length > 0) {
        showCustomAlert(
          "Missing Information",
          "Please fill out all required fields before continuing."
        );
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        showCustomAlert(
          "Validation Error",
          "Passwords do not match. Please make sure both passwords are the same."
        );
        return false;
      }
      if (formData.password.length < 8) {
        showCustomAlert(
          "Weak Password",
          "Password must be at least 8 characters long."
        );
        return false;
      }
      const cleaned = formData.mobileNumber.replace(/\D/g, "");
      if (!/^9\d{9}$/.test(cleaned) && !/^09\d{9}$/.test(cleaned)) {
        showCustomAlert(
          "Invalid Mobile Number",
          "Please enter a valid PH mobile (e.g., 9xxxxxxxxx or 09xxxxxxxxx)."
        );
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showCustomAlert("Invalid Email", "Please enter a valid email address.");
        return false;
      }
    }
    return true;
  };

  const isFormValid = () =>
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.mobileNumber.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword &&
    selectedVerificationType !== "" &&
    verificationFile !== null;

  const isFormComplete = () => {
  const requiredFields: (keyof FormData)[] = [
    "firstName",
    "lastName",
    "mobileNumber", 
    "email",
    "password",
    "confirmPassword"
  ];
  const isBasicInfoValid = requiredFields.every((f) => formData[f]?.trim());
  const isPasswordValid = 
    formData.password === formData.confirmPassword && 
    formData.password.length >= 8;
  const isVerificationValid = 
    activeStep !== 1 || (!!selectedVerificationType && !!verificationFile);
  const isTermsValid =
    activeStep !== 2 || termsAgreed;
  return isBasicInfoValid && isPasswordValid && isVerificationValid && isTermsValid;
};
const handleScroll = (event: any) => {
  const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
  const paddingToBottom = 20; // Adjust this value as needed
  const isScrolledToBottom = 
    layoutMeasurement.height + contentOffset.y >= 
    contentSize.height - paddingToBottom;
  
  if (isScrolledToBottom) {
    setHasScrolledToBottom(true);
  }
};

  const handleNext = () => {
  if (activeStep === 0 && !validateStep(0)) return;
  
  if (activeStep === 1) {
    setHasSubmitted(true);
    if (!isFormValid()) return;
  }

  if (activeStep === 2) {
    if (!termsAgreed) {
      showCustomAlert(
        "Terms Required",
        "Please accept the terms and conditions to continue"
      );
      return;
    }
  }

  if (activeStep < 3) {
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

  // ---------- upload verification doc (unchanged, bucket-aware) ----------
  const uploadVerificationIfAny = async (
    userId: string
  ): Promise<string | null> => {
    if (!verificationFile) return null;

    try {
      let uploadUri = verificationFile;
      if (uploadUri.startsWith("content://")) {
        // copy to a temp file:// path for Android
        const tmpDest = `${FileSystem.cacheDirectory}verify_${Date.now()}.jpg`;
        await FileSystem.copyAsync({ from: uploadUri, to: tmpDest });
        uploadUri = tmpDest;
      }

      const ext = (
        uploadUri.split("?")[0].split(".").pop() || "jpg"
      ).toLowerCase();
      const contentType = `image/${ext === "jpg" ? "jpeg" : ext}`;
      const objectPath = `verifications/students/${userId}/${Date.now()}.${ext}`;

      const { data: sess } = await supabase.auth.getSession();
      const token =
        sess?.session?.access_token ||
        (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string);
      if (!token) throw new Error("Not authenticated");

      const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
      if (!SUPABASE_URL) throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL");

      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(objectPath)}`;
      const res = await FileSystem.uploadAsync(uploadUrl, uploadUri, {
        httpMethod: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: token,
          "Content-Type": contentType,
          "x-upsert": "false",
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });

      if (res.status !== 200 && res.status !== 201) {
        throw new Error(
          `Upload failed (${res.status}): ${res.body?.slice(0, 160)}`
        );
      }
      return objectPath; // store this in DB (private bucket -> use signed URLs later)
    } catch (e: any) {
      console.log("Upload verification error:", e?.message || e);
      return null;
    }
  };

  // ---------- SIGN UP with Supabase (tweaked to avoid "Email not confirmed") ----------
  // Update the handleSignUp function to handle the terms step correctly
const handleSignUp = async () => {
  // If not at terms step or terms not agreed, don't proceed
  if (activeStep !== 2 || !termsAgreed) {
    return;
  }

  if (!isFormComplete()) {
    showCustomAlert(
      "Missing Information",
      "Please fill out all required fields and upload the required document"
    );
    return;
  }

  setLoading(true);
  try {
    const full_name = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

    // Normalize phone to E.164 +63xxxxxxxxxx
    const cleaned = formData.mobileNumber.replace(/\D/g, "");
    const noZero = cleaned.replace(/^0+/, "");
    const phoneE164 = `+63${noZero.startsWith("63") ? noZero.slice(2) : noZero}`;

    // 1) create auth user with email+password and put phone in user_metadata
    const { data: sign, error: signErr } = await supabase.auth.signUp({
      email: formData.email.trim(),
      password: formData.password,
      options: {
        data: {
          full_name,
          phone_number: phoneE164,
          role: "student",
          verification_type: selectedVerificationType,
        },
      },
    });
    if (signErr) {
      showCustomAlert("Sign up failed", signErr.message);
      return;
    }

    // If email confirmations are ON, there will be NO session yet.
    if (!sign.session) {
      setActiveStep(3); // Move to completion step
      return;
    }

    // 2) we DO have a session (email confirmations OFF) → continue as before
    const userId = sign.session.user.id;

    // 3) TEMP: skip uploading to Supabase Storage (still proceed normally)
    const verification_path = null;

    // 4) upsert into profiles (RLS expects id = auth.uid())
    const { error: profErr } = await supabase.from("profiles").upsert({
      id: userId,
      name: full_name,
      phone: phoneE164,
      role: "student",
      verification_type: selectedVerificationType,
      verification_path: verification_path ?? null,
      avatar_url: null,
    });
    if (profErr) {
      showCustomAlert("Profile save failed", profErr.message);
      return;
    }

    // 5) create verification_requests row
    const { error: vrErr } = await supabase
      .from("verification_requests")
      .insert({
        user_id: userId,
        role: "student",
        doc_type: selectedVerificationType,
        doc_url: verification_path,
        status: "pending",
        notes: null,
      });
    if (vrErr) {
      showCustomAlert("Verification save failed", vrErr.message);
      return;
    }

    // success — go to complete step
    setActiveStep(3);
  } catch (err: any) {
    showCustomAlert("Error", err.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
};

  // resend confirmation email (wired to your "Resend Email" button)
  const handleResendEmail = async () => {
    try {
      const email = formData.email.trim();
      if (!email) {
        showCustomAlert("Missing email", "Please enter your email first.");
        return;
      }
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) return showCustomAlert("Resend failed", error.message);
      showCustomAlert("Email Resent", `Verification link sent to: ${email}`);
    } catch (e: any) {
      showCustomAlert("Error", e?.message || "Could not resend email.");
    }
  };

  // ---------- UI (unchanged) ----------
  const renderProgressBar = () => (
  <View className="flex-row justify-center items-center mb-8">
    <View className="flex-row items-center">
      <View
        className={`h-1 w-20 ${activeStep >= 0 ? "bg-violet-600" : "bg-white/20"}`}
      />
      <View 
        className={`h-1 w-20 ${activeStep >= 1 ? "bg-violet-600" : "bg-white/20"}`}
      />
      <View
        className={`h-1 w-20 ${activeStep >= 2 ? "bg-violet-600" : "bg-white/20"}`}
      />
      <View
        className={`h-1 w-20 ${activeStep >= 3 ? "bg-violet-600" : "bg-white/20"}`}
      />
    </View>
    <View className="absolute flex-row justify-between w-full px-2">
      <View className="items-center w-20">
        <Text
          className={`text-xs top-3 mt-2 ${activeStep >= 0 ? "text-violet-400 font-medium" : "text-gray-400"}`}
        >
          ACCOUNT
        </Text>
      </View>
      <View className="items-center w-20">
        <Text
          className={`text-xs top-3 mt-2 ${activeStep >= 1 ? "text-violet-400 font-medium" : "text-gray-400"}`}
        >
          VERIFY
        </Text>
      </View>
      <View className="items-center w-20">
        <Text
          className={`text-xs top-3 mt-2 ${activeStep >= 2 ? "text-violet-400 font-medium" : "text-gray-400"}`}
        >
          TERMS
        </Text>
      </View>
      <View className="items-center w-20">
        <Text
          className={`text-xs top-3 mt-2 ${activeStep >= 3 ? "text-violet-400 font-medium" : "text-gray-400"}`}
        >
          COMPLETE
        </Text>
      </View>
    </View>
  </View>
);

  const renderFormStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <Animated.View
            style={[
              {
                opacity: fadeAnim,
                backgroundColor: "rgba(30, 41, 59, 0.7)",
                borderRadius: 20,
                padding: 14,
                marginBottom: 30,
                marginTop: 10,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)",
              },
            ]}
            className="space-y-4"
          >
            <View className="items-center mb-2">
              <Text className="text-white text-2xl font-bold mb-1">
                Student Registration
              </Text>
              <Text className="text-gray-400 text-center text-sm mb-4">
                Step 1 of 2: Enter your account details
              </Text>
              {renderProgressBar()}
            </View>

            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="text-white text-sm font-medium pl-1">
                  First Name
                </Text>
                <View className="flex-row items-center bg-white/10 border border-white/10 rounded-lg px-3 py-0.1 mt-1">
                  <MaterialIcons
                    name="person-outline"
                    size={18}
                    color="white"
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    className="flex-1 text-white text-[15px]"
                    placeholder="First name"
                    placeholderTextColor="#9CA3AF"
                    value={formData.firstName}
                    onChangeText={(text) =>
                      setFormData({ ...formData, firstName: text })
                    }
                    autoCapitalize="words"
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-white text-sm font-medium pl-1">
                  Last Name
                </Text>
                <View className="flex-row items-center bg-white/10 border border-white/10 rounded-lg px-3 py-0.1 mt-1">
                  <MaterialIcons
                    name="person-outline"
                    size={18}
                    color="white"
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    className="flex-1 text-white text-[15px]"
                    placeholder="Last name"
                    placeholderTextColor="#9CA3AF"
                    value={formData.lastName}
                    onChangeText={(text) =>
                      setFormData({ ...formData, lastName: text })
                    }
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            {[
              {
                icon: "phone-iphone",
                label: "Mobile Number",
                value: formData.mobileNumber,
                key: "mobileNumber",
                type: "tel" as const,
              },
              {
                icon: "mail-outline",
                label: "Email Address",
                value: formData.email,
                key: "email" as const,
                type: "email" as const,
              },
              {
                icon: "lock-outline",
                label: "Password",
                value: formData.password,
                key: "password" as const,
                type: "password" as const,
              },
              {
                icon: "lock-outline",
                label: "Confirm Password",
                value: formData.confirmPassword,
                key: "confirmPassword" as const,
                type: "password" as const,
              },
            ].map((field) => (
              <View key={field.key} className="bottom-2 space-y-0.5">
                <View className="flex-row items-center">
                  <Text className="text-white text-sm font-medium pl-1">
                    {field.label}
                  </Text>
                  {field.key === "mobileNumber" && (
                    <Image
                      source={require("@/assets/philippines.png")}
                      style={{
                        width: 18,
                        height: 12,
                        marginLeft: 5,
                        marginTop: 1,
                        resizeMode: "contain",
                      }}
                    />
                  )}
                </View>
                <View className="flex-row items-center bg-white/10 border border-white/10 rounded-lg px-3 py-0.1">
                  <MaterialIcons
                    name={field.icon as any}
                    size={18}
                    color="white"
                    style={{ marginRight: 10 }}
                  />
                  {field.key === "mobileNumber" ? (
                    <View className="flex-row items-center flex-1">
                      <Text className="text-white/70 mr-1">(+63)</Text>
                      <TextInput
                        className="flex-1 text-white text-[15px]"
                        placeholder=""
                        placeholderTextColor="#9CA3AF"
                        value={field.value.replace(/^\+?63/, "")}
                        onChangeText={(text) => {
                          const cleaned = text
                            .replace(/\D/g, "")
                            .replace(/^0+/, "");
                          setFormData({ ...formData, mobileNumber: cleaned });
                        }}
                        keyboardType="phone-pad"
                        maxLength={13}
                        autoCapitalize="none"
                      />
                    </View>
                  ) : (
                    <TextInput
                      // 👇 force remount on visibility change (Android secureTextEntry fix)
                      key={
                        field.key === "password"
                          ? `pw-${passwordVisible}`
                          : field.key === "confirmPassword"
                          ? `cpw-${confirmPasswordVisible}`
                          : String(field.key)
                      }
                      className="flex-1 text-white text-[15px]"
                      placeholder={`Enter your ${field.label.toLowerCase()}`}
                      placeholderTextColor="#9CA3AF"
                      value={field.value}
                      onChangeText={(text) =>
                        setFormData({ ...formData, [field.key]: text } as any)
                      }
                      secureTextEntry={
                        field.key === "password"
                          ? !passwordVisible
                          : field.key === "confirmPassword"
                          ? !confirmPasswordVisible
                          : false
                      }
                      keyboardType={
                        field.type === "email" ? "email-address" : "default"
                      }
                      autoCapitalize={
                        field.key === "email" ? "none" : "words"
                      }
                      // 👇 make password masking reliable across Android OEM keyboards
                      autoCorrect={false}
                      autoComplete={
                        field.key === "password" || field.key === "confirmPassword"
                          ? (Platform.OS === "android" ? "password" : "off")
                          : (field.key === "email" ? "email" : "off")
                      }
                      textContentType={
                        field.key === "password"
                          ? (Platform.OS === "ios" ? "newPassword" : "password")
                          : field.key === "confirmPassword"
                          ? (Platform.OS === "ios" ? "newPassword" : "password")
                          : (field.key === "email" ? "emailAddress" : "none")
                      }
                      {...(Platform.OS === "android"
                        ? { importantForAutofill: "no" as const }
                        : {})}
                    />
                  )}
                  {(field.key === "password" ||
                    field.key === "confirmPassword") && (
                    <TouchableOpacity
                      onPress={() =>
                        field.key === "password"
                          ? setPasswordVisible(!passwordVisible)
                          : setConfirmPasswordVisible(!confirmPasswordVisible)
                      }
                      className="p-2 -mr-2"
                    >
                      <Ionicons
                        name={
                          field.key === "password"
                            ? passwordVisible
                              ? "eye"
                              : "eye-off"
                            : confirmPasswordVisible
                            ? "eye"
                            : "eye-off"
                        }
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  )}
                </View>
                {field.key === "password" && (
                  <Text className="text-gray-400 text-xs pl-1">
                    Use at least 8 characters with numbers & symbols
                  </Text>
                )}
              </View>
            ))}
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View
            style={[
              {
                opacity: fadeAnim,
                backgroundColor: "rgba(30, 41, 59, 0.7)",
                borderRadius: 20,
                padding: 14,
                marginTop: -10,
                marginBottom: 15,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
              },
            ]}
            className="space-y-6"
          >
            <View className="items-center">
              <Text className="text-white text-2xl font-bold mb-1">
                Student Verification
              </Text>
              <Text className="text-gray-400 text-center text-sm mb-4">
                Step 2 of 2: Verify your student status
              </Text>
              {renderProgressBar()}
            </View>

            <View className="space-y-2 mb-4">
              <Text className="text-white text-sm font-semibold pl-1">
                Document Type
              </Text>
              <View style={{ position: "relative" }}>
                <TouchableOpacity
                  className="flex-row items-center justify-between bg-white/10 border border-white/20 rounded-lg px-4 py-2"
                  onPress={() =>
                    setShowVerificationDropdown(!showVerificationDropdown)
                  }
                >
                  <Text
                    className={`text-[15px] ${selectedVerificationType ? "text-white" : "text-gray-400"}`}
                  >
                    {selectedVerificationType
                      ? VERIFICATION_OPTIONS.find(
                          (opt) => opt.id === selectedVerificationType
                        )?.label
                      : "Select document type"}
                  </Text>
                  <Ionicons
                    name={
                      showVerificationDropdown ? "chevron-up" : "chevron-down"
                    }
                    size={18}
                    color="white"
                  />
                </TouchableOpacity>

                <Modal
                  visible={showVerificationDropdown}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowVerificationDropdown(false)}
                >
                  <TouchableWithoutFeedback
                    onPress={() => setShowVerificationDropdown(false)}
                  >
                    <View className="flex-1 bg-black/50">
                      <View
                        className="absolute top-1/2 left-4 right-4 bg-[#1e293b]/95 drop-shadow-xl border border-white/10 rounded-lg overflow-hidden"
                        style={{
                          transform: [{ translateY: -150 }],
                          maxHeight: 300,
                        }}
                      >
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
                                name={option.icon as any}
                                size={20}
                                color="#A78BFA"
                              />
                              <Text className="text-white text-sm">
                                {option.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
              </View>

              {selectedVerificationType && (
                <View className="space-y-4 mt-4">
                  <View className="space-y-2">
                    <Text className="text-white text-sm font-semibold">
                      Upload Document
                    </Text>
                    {verificationFile ? (
                      <View className="bg-violet-500/20 border border-violet-400/30 rounded-lg p-2">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <Ionicons
                              name="document-text"
                              size={16}
                              color="white"
                              style={{ marginRight: 8 }}
                            />
                            <Text
                              className="text-white text-sm"
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              Document Uploaded
                            </Text>
                          </View>
                          <View className="flex-row space-x-1">
                            <TouchableOpacity
                              className="bg-white/20 p-1 rounded"
                              onPress={() => setVerificationFile(null)}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={14}
                                color="white"
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              className="bg-white/20 p-1 rounded"
                              onPress={pickVerificationDocument}
                            >
                              <Ionicons
                                name="refresh"
                                size={14}
                                color="white"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        className="bg-violet-600/20 border border-dashed border-violet-400/30 rounded-lg p-6 items-center active:bg-violet-600/30"
                        onPress={pickVerificationDocument}
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name="cloud-upload-outline"
                            size={16}
                            color="white"
                          />
                          <Text className="text-white text-sm ml-1">
                            Tap to upload document
                          </Text>
                        </View>
                        <Text className="text-gray-400 text-[12px] mt-2">
                          JPG, PNG, PDF (Max 5MB)
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              <View className="bg-white/5 border border-white/10 rounded-lg p-4 mt-4">
                <View className="flex-row items-start">
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color="#A78BFA"
                    style={{ marginTop: 2, marginRight: 10 }}
                  />
                  <View className="flex-1">
                    <Text className="text-white font-medium mb-1">
                      Why do we need this?
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      We need to verify your student status to confirm you are a
                      student. Your documents will be kept secure and only used
                      for verification purposes.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        );
       case 2:
  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          backgroundColor: "rgba(30, 41, 59, 0.7)",
          borderRadius: 20,
          padding: 14,
          marginTop: -10,
          marginBottom: 15,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.1)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
        },
      ]}
      className="space-y-6"
    >
      <View className="items-center">
        <Text className="text-white text-2xl font-bold mb-1">
          Terms & Conditions
        </Text>
        <Text className="text-gray-400 text-center text-sm mb-4">
          Step 3 of 4: Review and accept terms
        </Text>
        {renderProgressBar()}
      </View>

      <ScrollView 
        className="bg-white/5 rounded-lg p-4"
        style={{ maxHeight: 300 }}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {TERMS_AND_CONDITIONS.map((section, index) => (
          <View key={index} className="mb-4">
            <Text className="text-white font-semibold mb-2">
              {section.title}
            </Text>
            <Text className="text-gray-300 text-sm">
              {section.content}
            </Text>
          </View>
        ))}
        
        {!hasScrolledToBottom && (
          <View className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#1e293b] to-transparent" />
        )}
      </ScrollView>

      <View className="flex-row items-center space-x-3 px-2">
        <TouchableOpacity
          onPress={() => hasScrolledToBottom && setTermsAgreed(!termsAgreed)}
          className={`p-2 -ml-2 ${!hasScrolledToBottom ? 'opacity-50' : ''}`}
          disabled={!hasScrolledToBottom}
        >
          <Ionicons
            name={termsAgreed ? "checkbox" : "square-outline"}
            size={24}
            color={termsAgreed ? "#A78BFA" : "#9CA3AF"}
          />
        </TouchableOpacity>
        <Text className={`text-gray-300 flex-1 ${!hasScrolledToBottom ? 'opacity-50' : ''}`}>
          I agree to the Terms & Conditions and Privacy Policy
        </Text>
      </View>

      {!hasScrolledToBottom && (
        <Text className="text-gray-400 text-sm text-center">
          Please scroll to the bottom to accept the terms
        </Text>
      )}

      <View className="flex-row space-x-3 mt-4">
        <TouchableOpacity
          className="flex-1 py-3 rounded-lg items-center justify-center bg-white/10 border border-white/20 active:bg-white/20"
          onPress={handleBack}
        >
          <Text className="text-white font-medium text-base">
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg items-center justify-center ${
            termsAgreed && hasScrolledToBottom
              ? "bg-violet-600/80 active:bg-violet-700/80" 
              : "bg-gray-600/50"
          }`}
          onPress={() => {
            if (termsAgreed && hasScrolledToBottom) {
              handleSignUp();
            }
          }}
          disabled={!termsAgreed || !hasScrolledToBottom || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Accept & Continue
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

      case 3:
        return (
          <Animated.View
            style={{ opacity: fadeAnim }}
            className="items-center space-y-6"
          >
            <View className="items-center">
              <View className="bg-white/10 p-5 rounded-full mb-4">
                <Ionicons name="checkmark-circle" size={44} color="#A78BFA" />
              </View>
              <Text className="text-white text-2xl font-bold mb-1 text-center">
                Successfully Submitted!
              </Text>
              <Text className="text-gray-400 text-center text-sm mb-4">
                Your application is under review
              </Text>
              {renderProgressBar()}
            </View>

            <View className="bg-white/10 border border-white/20 rounded-lg p-6 w-full mb-5">
              <View className="flex-row items-start">
                <Ionicons
                  name="information-circle"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginTop: 2, marginRight: 10 }}
                />
                <View className="flex-1">
                  <Text className="text-white font-semibold text-xl mb-2">
                    What's Next?
                  </Text>
                  {[
                    {
                      icon: "time",
                      text: "1-2 business days for verification",
                    },
                    {
                      icon: "mail",
                      text: `Verification email sent to: ${formData.email}`,
                    },
                    {
                      content: (
                        <View>
                          <View className="flex-row items-center">
                            <Ionicons
                              name="phone-portrait"
                              size={14}
                              color="#FFFFFF"
                              style={{ marginRight: 8, marginTop: 2 }}
                            />
                            <Text className="text-white text-medium">
                              SMS verification sent to:
                            </Text>
                          </View>
                          <Text className="text-white/80 text-sm ml-6">
                            +63{formData.mobileNumber || "your number"}
                          </Text>
                        </View>
                      ),
                    },
                    {
                      icon: "document-text",
                      text: "Check email and SMS for updates",
                    },
                  ].map((item, index) => (
                    <View
                      key={index}
                      className="flex-row items-center mb-2 last:mb-0"
                    >
                      {!item.content && (
                        <Ionicons
                          name={item.icon as any}
                          size={14}
                          color="#FFFFFF"
                          style={{
                            marginRight: 8,
                            marginTop: 2,
                            alignSelf: "flex-start",
                          }}
                        />
                      )}
                      {item.content || (
                        <Text className="text-white text-medium">
                          {item.text}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View className="w-full bottom-5 space-y-3">
              <TouchableOpacity
                className="bg-violet-600/80 w-full py-3 rounded-lg items-center justify-center active:bg-violet-700/80"
                onPress={() => router.push("/Auth/Login/role-selection")}
              >
                <Text className="text-white font-semibold text-base">
                  Log In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white/10 border border-white/10 w-full py-3 rounded-lg items-center justify-center active:bg-white/20"
                onPress={() => router.push("/Auth/Login/landing-page")}
              >
                <Text className="text-white font-semibold text-base">
                  Landing Page
                </Text>
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
          {/* Header */}
          <View className="flex-row justify-between top-3 items-center mb-7 w-full">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => router.push("/")}
              activeOpacity={0.7}
            >
              <Image
                source={require("../../assets/Speaksy.png")}
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

              {/* Keep THIS one */}
              <View className="bottom-6">
                <Text className="text-gray-400 text-xs text-center mt-2">
                  Already have an account?{" "}
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
            <View
              className="mt-6 top-4 space-y-3"
              style={{ position: "relative", zIndex: 1 }}
            >
              <TouchableOpacity
                className={`py-3 rounded-lg items-center justify-center -top-10 w-full max-w-[320px] mx-auto ${
                  isFormComplete()
                    ? "bg-violet-600/80 active:bg-violet-700/80"
                    : "bg-gray-600/50"
                }`}
                style={{ zIndex: 1 }}
                onPress={handleNext}
                disabled={!isFormComplete() || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Next 
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="py-3 rounded-lg items-center justify-center -top-10 w-full max-w-[320px] mx-auto bg-white/10 border border-white/20 active:bg-white/20"
                style={{ zIndex: 1 }}
                onPress={handleBack}
              >
                <Text className="text-white font-medium text-base">
                  Previous
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Removed the extra duplicate "Already have an account?" block at the very bottom */}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
