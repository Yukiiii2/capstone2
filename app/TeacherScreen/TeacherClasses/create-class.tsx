import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabaseClient";
import NavigationBar from "@/components/NavigationBar/nav-bar-teacher";

/* ────────────────────────────────────────────────────────────────────
   Background Decor
   ──────────────────────────────────────────────────────────────────── */
const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient colors={["#0F172A", "#1E293B", "#0F172A"]} className="flex-1" />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
  </View>
);

/* ────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────── */
const normalizeStrand = (s: string) => (s === "HUMMS" ? "HUMSS" : s);

const genCode = (len = 6) => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
};

async function uniqueClassCode(tryLen = 6, maxTries = 5): Promise<string> {
  for (let i = 0; i < maxTries; i++) {
    const code = genCode(tryLen);
    const { data, error } = await supabase
      .from("classes")
      .select("id")
      .eq("class_code", code)
      .limit(1);
    if (error) {
      // If we can’t check, still return code—DB unique index should protect
      return code;
    }
    if (!data || data.length === 0) return code;
  }
  // Fallback—let DB unique constraint throw if duplicate sneaks through
  return genCode(tryLen);
}

/* ────────────────────────────────────────────────────────────────────
   Simple Dropdown Modal
   ──────────────────────────────────────────────────────────────────── */
function SelectModal({
  title,
  options,
  visible,
  onClose,
  onSelect,
}: {
  title: string;
  options: { label: string; value: string }[];
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-end">
        <View className="w-full bg-slate-900 rounded-t-3xl p-5 border-t border-white/10">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white text-lg font-semibold">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                onSelect(opt.value);
                onClose();
              }}
              className="py-3 px-3 rounded-xl mb-2 bg-white/5 border border-white/10"
            >
              <Text className="text-white text-base">{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────────── */
export default function CreateClass() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  const [teacherId, setTeacherId] = useState<string | null>(null);

  const [className, setClassName] = useState<string>("");
  const [grade, setGrade] = useState<"11" | "12" | "">("");
  const [strand, setStrand] = useState<string>("");

  // 🔒 Read-only, auto-generated
  const [classCode, setClassCode] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [gradeModal, setGradeModal] = useState(false);
  const [strandModal, setStrandModal] = useState(false);

  const gradeLabel = useMemo(() => (grade ? `Grade ${grade}` : "Select Grade"), [grade]);
  const strandLabel = useMemo(
    () => (strand ? (strand === "ALL" ? "All Strands" : normalizeStrand(strand)) : "Select Strand"),
    [strand]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setTeacherId(data?.user?.id ?? null);

      // Generate a DB-checked unique code on mount
      const first = await uniqueClassCode(6);
      if (!mounted) return;
      setClassCode(first);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const validate = () => {
    if (!className.trim()) {
      Alert.alert("Missing Class Name", "Please enter a class name.");
      return false;
    }
    if (!grade) {
      Alert.alert("Select Grade", "Please choose Grade 11 or Grade 12.");
      return false;
    }
    if (!strand) {
      Alert.alert("Select Strand", "Please choose a strand (or All Strands).");
      return false;
    }
    // No manual code validation needed; it's generated.
    return true;
  };

  const regenerateCode = async () => {
    if (isSubmitting) return;
    const fresh = await uniqueClassCode(6);
    setClassCode(fresh);
  };

  const confirmAndCreate = async () => {
    if (!validate()) return;

    const displayStrand = strand === "ALL" ? "All Strands" : normalizeStrand(strand);
    Alert.alert(
      "Create Class?",
      `Name: ${className}\nGrade: ${grade}\nStrand: ${displayStrand}\nCode: ${classCode}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create",
          style: "default",
          onPress: async () => {
            await doCreate();
          },
        },
      ]
    );
  };

  const doCreate = async () => {
    if (isSubmitting) return;
    if (!teacherId) {
      Alert.alert("Not signed in", "Please sign in again.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Save what we have; DB unique index will guard duplicates
      let codeToSave = (classCode || "").trim().toUpperCase();
      if (!codeToSave) codeToSave = await uniqueClassCode(6);

      const row = {
        teacher_id: teacherId,
        name: className.trim(),
        grade_level: grade, // "11" | "12"
        strand: strand === "ALL" ? null : normalizeStrand(strand),
        class_code: codeToSave,
      };

      const { error } = await supabase.from("classes").insert([row]);
      if (error) {
        // If duplicate code, try a single fresh one automatically
        if ((error as any)?.message?.toLowerCase?.().includes("duplicate") || (error as any)?.code === "23505") {
          const fresh = await uniqueClassCode(6);
          const { error: retryErr } = await supabase
            .from("classes")
            .insert([{ ...row, class_code: fresh }]);
          if (retryErr) throw retryErr;
          setClassCode(fresh);
        } else {
          throw error;
        }
      }

      Alert.alert("Success", "Class created successfully!", [
        {
          text: "OK",
          onPress: () => {
            router.replace("/TeacherScreen/TeacherClasses/teacher-classes");
          },
        },
      ]);
    } catch (e: any) {
      console.warn("[CreateClass] create error:", e);
      Alert.alert("Error", "We couldn't create the class. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0F172A]">
      <BackgroundDecor />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-10 pb-5">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-3xl font-bold text-white">Create Class</Text>
              <Text className="text-slate-400 text-lg">Set up your class details</Text>
            </View>
            <TouchableOpacity
              className="bottom-3 w-10 h-10 bg-white/10 rounded-full items-center justify-center"
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card */}
        <View className="px-6 pb-6">
          <View className="bg-white/5 rounded-3xl border border-white/10 p-7 backdrop-blur">
            {/* Class Name */}
            <View className="mb-6">
              <Text className="text-slate-200 mb-3 font-semibold text-lg">Class Name *</Text>
              <TextInput
                className="bg-white/10 rounded-xl px-5 py-4 text-white border-2 border-white/10 h-14"
                placeholder="e.g., STEM-11 Alpha, ABM-12 A, HUMSS-11"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={className}
                onChangeText={setClassName}
              />
            </View>

            {/* Grade Level */}
            <View className="mb-6">
              <Text className="text-slate-200 mb-3 font-semibold text-lg">Grade Level *</Text>
              <TouchableOpacity
                onPress={() => setGradeModal(true)}
                className="flex-row items-center justify-between px-4 py-4 rounded-xl bg-white/10 border-2 border-white/10"
              >
                <Text className={`text-base ${grade ? "text-white" : "text-white/60"}`}>
                  {gradeLabel}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Strand */}
            <View className="mb-6">
              <Text className="text-slate-200 mb-3 font-semibold text-lg">Strand *</Text>
              <TouchableOpacity
                onPress={() => setStrandModal(true)}
                className="flex-row items-center justify-between px-4 py-4 rounded-xl bg-white/10 border-2 border-white/10"
              >
                <Text className={`text-base ${strand ? "text-white" : "text-white/60"}`}>
                  {strandLabel}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#fff" />
              </TouchableOpacity>
              <Text className="text-slate-400 text-xs mt-2">
                Pick a specific strand or choose “All Strands”.
              </Text>
            </View>

            {/* Class Code (read-only, auto-generated) */}
            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-slate-200 font-semibold text-lg">Class Code (auto)</Text>
                <TouchableOpacity
                  onPress={regenerateCode}
                  disabled={isSubmitting}
                  className={`px-3 py-1.5 rounded-lg border ${isSubmitting ? "bg-white/5 border-white/10" : "bg-white/10 border-white/20"}`}
                >
                  <Text className="text-white text-xs font-medium">
                    {isSubmitting ? "Please wait" : "Generate"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center px-4 py-4 rounded-xl bg-white/5 border-2 border-white/10">
                <Ionicons name="lock-closed-outline" size={18} color="#fff" />
                <TextInput
                  className="flex-1 ml-3 text-white opacity-70"
                  placeholder="Generating…"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoCapitalize="characters"
                  value={classCode}
                  editable={false}              // 🔒 not typeable
                  selectTextOnFocus={false}     // do not select on focus
                />
              </View>
              <Text className="text-slate-400 text-[11px] mt-2">
                This code is auto-generated. Tap “Generate” to refresh if you prefer a different one.
              </Text>
            </View>

            {/* Summary chip row */}
            <View className="mt-6 flex-row flex-wrap -mx-1">
              {[
                { label: grade ? `Grade ${grade}` : "Grade —", value: grade },
                { label: strand ? (strand === "ALL" ? "All Strands" : normalizeStrand(strand)) : "Strand —", value: strand },
                { label: classCode ? `Code: ${classCode}` : "Code —", value: classCode },
              ].map((chip, idx) => (
                <View
                  key={idx}
                  className={`px-3 py-2 rounded-xl border m-1 ${chip.value ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10"}`}
                >
                  <Text className={`text-xs ${chip.value ? "text-white" : "text-white/60"}`}>
                    {chip.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Create Button */}
            <TouchableOpacity
              className={`mt-8 py-4 rounded-xl ${isSubmitting ? "bg-violet-600/60" : "bg-violet-600"}`}
              onPress={confirmAndCreate}
              disabled={isSubmitting}
              activeOpacity={0.9}
            >
              <Text className="text-white text-center font-bold text-lg">
                {isSubmitting ? "Creating..." : "Create Class"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>

      <NavigationBar defaultActiveTab="Classes" />

      {/* Grade Modal */}
      <SelectModal
        title="Select Grade"
        visible={gradeModal}
        onClose={() => setGradeModal(false)}
        onSelect={(val) => setGrade(val as "11" | "12")}
        options={[
          { label: "Grade 11", value: "11" },
          { label: "Grade 12", value: "12" },
        ]}
      />

      {/* Strand Modal */}
      <SelectModal
        title="Select Strand"
        visible={strandModal}
        onClose={() => setStrandModal(false)}
        onSelect={(val) => setStrand(val)}
        options={[
          { label: "All Strands", value: "ALL" },
          { label: "ABM", value: "ABM" },
          { label: "STEM", value: "STEM" },
          { label: "HUMSS", value: "HUMSS" },
          { label: "GAS", value: "GAS" },
          { label: "TVL", value: "TVL" },
        ]}
      />
    </View>
  );
}
