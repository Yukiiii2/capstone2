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

// ---------- helpers ----------
const showCustomAlert = (title: string, message: string) => {
  Alert.alert(title, message, [{ text: "OK", style: "cancel" }], {
    cancelable: true,
    userInterfaceStyle: "dark",
  });
};

const { width } = Dimensions.get("window");

// Teacher-specific verification options
const VERIFICATION_OPTIONS = [
  {
    id: "teacherId",
    icon: "card-account-details",
    iconType: "material-community",
    label: "Teacher ID Card",
  },
  {
    id: "schoolId",
    icon: "card-account-details",
    iconType: "material-community",
    label: "School ID Card",
  },
  {
    id: "prcIdCard",
    icon: "card-account-details",
    iconType: "material-community",
    label: "PRC ID Card",
  },
  {
    id: "appointmentPaper",
    icon: "file-document",
    iconType: "material-community",
    label: "Appointment Paper",
  },
  {
    id: "other",
    icon: "file-document-edit",
    iconType: "material-community",
    label: "Other Document",
  },
];

// Use your storage bucket (we're not uploading now)
const BUCKET = "verify-docs";

// ⚙️ If your table/column names differ, adjust here
const ASSIGNED_TABLE = "assigned";
const ASSIGNED_TEACHER_ID_COL = "teacher_id";
const ASSIGNED_CLASS_CODE_COL = "class_code";

// Types
type FormData = {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  schoolUniversity: string;
};

export default function CreateAccountTeacher() {
  // ---------- state ----------
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    mobileNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    schoolUniversity: "",
  });

  // Form state
  const [selectedVerificationType, setSelectedVerificationType] = useState<string>("");
  const [verificationFile, setVerificationFile] = useState<string | null>(null);
  const [showVerificationDropdown, setShowVerificationDropdown] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI state
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Refs and other hooks
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Keep payload so we can finalize after email confirmation (SIGNED_IN)
  const pendingFinalizeRef = useRef<null | {
    full_name: string;
    phoneE164: string;
    verification_type: string;
    school_university: string;
  }>(null);

  // Form field type for rendering form inputs
  type FormField = {
    icon: string;
    label: string;
    value: string;
    key: keyof FormData;
    type: "text" | "email" | "password";
    secure: boolean;
    maxLength?: number;
    format?: (text: string) => string;
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, activeStep]);

  // 🔔 When the user returns from email confirmation and gets signed in, finish setup
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user && pendingFinalizeRef.current) {
        await finalizeTeacherSetup(session.user.id, pendingFinalizeRef.current);
        setActiveStep(2);
        pendingFinalizeRef.current = null;
      }
    });
    return () => {
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const pickVerificationDocument = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
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
      console.error("Error picking image:", error);
      showCustomAlert("Error", "Failed to pick image. Please try again.");
    }
  };

  const validateStep = (step: number) => {
    if (step === 0) {
      // Check if all required fields are filled
      const requiredFields = [
        "firstName",
        "lastName",
        "mobileNumber",
        "email",
        "password",
        "confirmPassword",
      ] as const;
      const emptyFields = requiredFields.filter(
        (field) => !formData[field]?.trim()
      );

      if (emptyFields.length > 0) {
        showCustomAlert(
          "Missing Information",
          "Please fill out all required fields before continuing."
        );
        return false;
      }

      // Check if passwords match
      if (formData.password !== formData.confirmPassword) {
        showCustomAlert(
          "Validation Error",
          "Passwords do not match. Please make sure both passwords are the same."
        );
        return false;
      }

      // Check password strength (minimum 8 characters)
      if (formData.password.length < 8) {
        showCustomAlert(
          "Weak Password",
          "Password must be at least 8 characters long."
        );
        return false;
      }

      // PH mobiles: allow 9xxxxxxxxx or 09xxxxxxxxx
      const cleaned = formData.mobileNumber.replace(/\D/g, "");
      if (!/^9\d{9}$/.test(cleaned) && !/^09\d{9}$/.test(cleaned)) {
        showCustomAlert(
          "Invalid Mobile Number",
          "Please enter a valid PH mobile (e.g., 9xxxxxxxxx or 09xxxxxxxxx)."
        );
        return false;
      }

      // Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showCustomAlert("Invalid Email", "Please enter a valid email address.");
        return false;
      }
    }

    return true;
  };

  const isFormValid = () => {
    return (
      formData.firstName.trim() !== "" &&
      formData.lastName.trim() !== "" &&
      formData.mobileNumber.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.password.length >= 8 &&
      formData.password === formData.confirmPassword &&
      selectedVerificationType !== "" &&
      verificationFile !== null &&
      formData.schoolUniversity.trim() !== ""
    );
  };

  // Handle back navigation
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    } else {
      router.back();
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateStep(0)) {
      return; // Don't proceed if validation fails
    }

    if (activeStep === 1) {
      setHasSubmitted(true);
      if (!isFormValid()) {
        return;
      }
    }

    if (activeStep < 2) {
      setActiveStep(activeStep + 1);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  // Check if all required fields are filled
  const isFormComplete = () => {
    const requiredFields = [
      "firstName",
      "lastName",
      "mobileNumber",
      "email",
      "password",
      "confirmPassword",
      "schoolUniversity",
    ] as const;
    const isBasicInfoValid = requiredFields.every((field) =>
      formData[field]?.trim()
    );
    const isPasswordValid =
      formData.password === formData.confirmPassword &&
      formData.password.length >= 8;
    const isVerificationValid =
      activeStep !== 1 || (!!selectedVerificationType && !!verificationFile);

    return isBasicInfoValid && isPasswordValid && isVerificationValid;
  };

  // ---------- class code helpers (no UI changes) ----------
  const generateClassCode = () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
  };

  const createClassCodeIfMissing = async (teacherId: string): Promise<string | null> => {
    try {
      const { data: existing, error: findErr } = await supabase
        .from(ASSIGNED_TABLE)
        .select(`${ASSIGNED_CLASS_CODE_COL}`)
        .eq(ASSIGNED_TEACHER_ID_COL, teacherId)
        .limit(1);

      if (findErr) throw findErr;
      if (existing && existing.length > 0) {
        return existing[0][ASSIGNED_CLASS_CODE_COL] as string;
      }

      let lastErr: any = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateClassCode();
        const { error: insertErr } = await supabase.from(ASSIGNED_TABLE).insert({
          [ASSIGNED_TEACHER_ID_COL]: teacherId,
          [ASSIGNED_CLASS_CODE_COL]: code,
        });
        if (!insertErr) return code;
        lastErr = insertErr;
      }
      if (lastErr) throw lastErr;
      return null;
    } catch (e: any) {
      console.log("createClassCodeIfMissing error:", e?.message || e);
      return null;
    }
  };

  const finalizeTeacherSetup = async (
    userId: string,
    payload: {
      full_name: string;
      phoneE164: string;
      verification_type: string;
      school_university: string;
    }
  ) => {
    try {
      setLoading(true);

      // Minimal profile upsert
      const { error: profErr } = await supabase.from("profiles").upsert({
        id: userId,
        name: payload.full_name,
        phone: payload.phoneE164,
        role: "teacher",
        avatar_url: null,
      });
      if (profErr) {
        showCustomAlert("Profile save failed", profErr.message);
        return;
      }

      // Create verification request (skip Storage now)
      const { error: vrErr } = await supabase.from("verification_requests").insert({
        user_id: userId,
        role: "teacher",
        doc_type: payload.verification_type,
        doc_url: null,
        status: "pending",
        notes: payload.school_university ? `School/University: ${payload.school_university}` : null,
      });
      if (vrErr) {
        showCustomAlert("Verification save failed", vrErr.message);
        return;
      }

      // Ensure class code exists
      const code = await createClassCodeIfMissing(userId);
      if (!code) {
        showCustomAlert("Class Code", "Could not generate a class code yet. You can retry after login.");
      }
    } catch (e: any) {
      showCustomAlert("Error", e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ⬅️ replaced with Supabase sign-up flow (no Storage upload, proceed to step 3 if confirmations ON)
  const handleSignUp = async () => {
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

      // Save for post-confirmation finalize
      pendingFinalizeRef.current = {
        full_name,
        phoneE164,
        verification_type: selectedVerificationType,
        school_university: formData.schoolUniversity.trim(),
      };

      // 1) Create Auth user
      const { data: sign, error: signErr } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name,
            phone_number: phoneE164,
            role: "teacher",
            verification_type: selectedVerificationType,
            school_university: formData.schoolUniversity,
          },
          // emailRedirectTo: 'yourapp://auth-callback', // set if you wired deep links
        },
      });
      if (signErr) {
        showCustomAlert("Sign up failed", signErr.message);
        setLoading(false);
        return;
      }

      // If confirmations ON: no session yet -> show COMPLETE; finalize after SIGNED_IN
      if (!sign.session) {
        setActiveStep(2);
        setLoading(false);
        return;
      }

      // 2) With session (confirmations OFF): finish now (no Storage upload)
      const userId = sign.session.user.id;

      // Upsert profile
      const { error: profErr } = await supabase.from("profiles").upsert({
        id: userId,
        name: full_name,
        phone: phoneE164,
        role: "teacher",
        avatar_url: null,
      });
      if (profErr) {
        showCustomAlert("Profile save failed", profErr.message);
        setLoading(false);
        return;
      }

      // Create verification_request (doc_url null for now)
      const { error: vrErr } = await supabase.from("verification_requests").insert({
        user_id: userId,
        role: "teacher",
        doc_type: selectedVerificationType,
        doc_url: null,
        status: "pending",
        notes: formData.schoolUniversity ? `School/University: ${formData.schoolUniversity}` : null,
      });
      if (vrErr) {
        showCustomAlert("Verification save failed", vrErr.message);
        setLoading(false);
        return;
      }

      // Create class code in assigned table
      const code = await createClassCodeIfMissing(userId);
      if (!code) {
        showCustomAlert("Class Code", "Could not generate a class code yet. You can retry after login.");
      }

      // success — go to complete step
      setActiveStep(2);
    } catch (error: any) {
      showCustomAlert(
        "Error",
        error?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ⬅️ added — resend confirmation email
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

  const renderProgressBar = () => (
    <View className="flex-row justify-center items-center mb-8">
      <View className="flex-row items-center">
        <View
          className={`h-1 w-24 ${activeStep >= 0 ? "bg-violet-600" : "bg-white/20"}`}
        />
        <View
          className={`h-1 w-24 ${activeStep >= 1 ? "bg-violet-600" : "bg-white/20"}`}
        />
        <View
          className={`h-1 w-24 ${activeStep >= 2 ? "bg-violet-600" : "bg-white/20"}`}
        />
      </View>
      <View className="absolute flex-row justify-between w-full px-2">
        <View className="items-center w-24">
          <Text
            className={`text-xs top-3 mt-2 ${activeStep >= 0 ? "text-violet-400 font-medium" : "text-gray-400"}`}
          >
            DETAILS
          </Text>
        </View>
        <View className="items-center w-24">
          <Text
            className={`text-xs top-3 mt-2 ${activeStep >= 1 ? "text-violet-400 font-medium" : "text-gray-400"}`}
          >
            VERIFY TEACHER
          </Text>
        </View>
        <View className="items-center w-24">
          <Text
            className={`text-xs top-3 mt-2 ${activeStep >= 2 ? "text-violet-400 font-medium" : "text-gray-400"}`}
          >
            APPROVAL
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
            style={{
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
            }}
            className="space-y-4"
          >
            <View className="items-center mb-2">
              <Text className="text-white text-2xl font-bold mb-1">
                Teacher Registration
              </Text>
              <Text className="text-gray-400 text-center text-sm mb-4">
                Step 1 of 2: Enter your teaching details
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
                    onChangeText={(text) => {
                      setFormData({ ...formData, firstName: text });
                    }}
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
                    onChangeText={(text) => {
                      setFormData({ ...formData, lastName: text });
                    }}
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
                key: "mobileNumber" as const,
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
                          setFormData({ ...formData, [field.key]: cleaned });
                        }}
                        keyboardType="phone-pad"
                        maxLength={13}
                        autoCapitalize="none"
                      />
                    </View>
                  ) : (
                    <TextInput
                      className="flex-1 text-white text-[15px]"
                      placeholder={`Enter your ${field.label.toLowerCase()}`}
                      placeholderTextColor="#9CA3AF"
                      value={field.value}
                      onChangeText={(text) => {
                        setFormData({ ...formData, [field.key]: text } as any);
                      }}
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
                      autoCapitalize={field.key === "email" ? "none" : "words"}
                    />
                  )}
                  {field.key === "password" && (
                    <TouchableOpacity
                      onPress={() => setPasswordVisible(!passwordVisible)}
                      className="p-2 -mr-2"
                    >
                      <Ionicons
                        name={passwordVisible ? "eye" : "eye-off"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  )}
                  {field.key === "confirmPassword" && (
                    <TouchableOpacity
                      onPress={() =>
                        setConfirmPasswordVisible(!confirmPasswordVisible)
                      }
                      className="p-2 -mr-2"
                    >
                      <Ionicons
                        name={confirmPasswordVisible ? "eye" : "eye-off"}
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
                Teacher Verification
              </Text>
              <Text className="text-gray-400 text-center text-sm mb-4">
                Step 2 of 2: Verify your teacher status
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
                    <View>
                      <Text className="text-white text-xs mb-1">
                        School/University
                      </Text>
                      <View className="bg-white/10 border border-white/20 rounded-lg px-3 py-0.1">
                        <TextInput
                          className="text-white text-sm"
                          placeholder="Enter your school or university name"
                          placeholderTextColor="#9CA3AF"
                          value={formData.schoolUniversity}
                          onChangeText={(text) =>
                            setFormData({ ...formData, schoolUniversity: text })
                          }
                        />
                      </View>
                    </View>
                  </View>
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
                          JPG, PNG (Max 5MB)
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {hasSubmitted && !isFormValid() && (
                    <Text className="text-red-400 text-xs text-center mt-2">
                      Please complete all required fields and upload your
                      document
                    </Text>
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
                          We need to verify your teaching credentials to ensure
                          the quality of our tutoring platform. Your documents
                          will be kept secure and only used for verification
                          purposes.
                        </Text>
                      </View>
                    </View>

                    {/* Buttons removed as per request */}
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        );
      case 2:
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
                Application Submitted!
              </Text>
              <Text className="text-gray-400 text-center text-sm mb-4">
                Your teaching credentials are under review
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
                  <Text className="text-white/80 text-sm mb-3">
                    We've sent verification codes to your email and mobile
                    number for security.
                  </Text>
                  {[
                    {
                      icon: "time",
                      text: "1-2 business days for verification",
                    },
                    {
                      icon: "school",
                      text: "Our team will verify your teaching credentials",
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
                      icon: "shield-checkmark",
                      text: "Class Code will be provided upon approval",
                    },
                  ].map((item, index) => (
                    <View
                      key={index}
                      className="flex-row items-center mb-2 last:mb-0"
                    >
                      {!("content" in item) ? (
                        <>
                          {"icon" in item && (
                            <Ionicons
                              name={(item as any).icon}
                              size={14}
                              color="#FFFFFF"
                              style={{
                                marginRight: 8,
                                marginTop: 2,
                                alignSelf: "flex-start",
                              }}
                            />
                          )}
                          <Text className="text-white text-medium">
                            {(item as any).text}
                          </Text>
                        </>
                      ) : (
                        (item as any).content
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View className="w-full bottom-8 space-y-3">
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
    <View className="absolute top-0 left-0 right-0 bottom-0">
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
          keyboardShouldPersistTaps="handled"
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
                className="py-3 rounded-lg items-center justify-center w/full max-w-[320px] bottom-10 mx-auto bg-violet-600/80 active:bg-violet-700/80"
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
                onPress={handleSignUp}
                disabled={!isFormComplete() || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Submit Application
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="py-3 rounded-lg items-center justify-center -top-10 w-full max-w-[320px] mx-auto bg-white/10 border border-white/20 active:bg-white/20"
                onPress={handleBack}
                disabled={loading}
              >
                <Text className="text-white font-semibold text-base">Back</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
