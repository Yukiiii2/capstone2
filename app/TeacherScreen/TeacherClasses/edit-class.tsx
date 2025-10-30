import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabaseClient";
import NavigationBar from "@/components/NavigationBar/nav-bar-teacher";

/* ────────────────────────────────────────────────────────────────────
   Background Decor (same as create-class)
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
   Helpers (same behavior as create-class)
   ──────────────────────────────────────────────────────────────────── */
const normalizeStrand = (s: string) => (s === "HUMMS" ? "HUMSS" : s);

/** read class name from whatever column exists */
function readClassName(row: any) {
  return row?.class_name ?? row?.name ?? row?.title ?? "";
}
/** write class name to whichever column your table actually has */
function writeClassName(base: any, value: string) {
  if ("class_name" in base) base.class_name = value;
  else if ("name" in base) base.name = value;
  else if ("title" in base) base.title = value;
  else base.name = value; // default
}

/* ────────────────────────────────────────────────────────────────────
   Simple Dropdown Modal (same as create-class)
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
type Params = { id?: string };

export default function EditClass() {
  const router = useRouter();
  const { id } = useLocalSearchParams<Params>();
  const { width } = Dimensions.get("window");

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [className, setClassName] = useState<string>("");
  const [grade, setGrade] = useState<"11" | "12" | "">("");
  const [strand, setStrand] = useState<string>("");

  // read-only, displayed only in chips (no editor)
  const [classCode, setClassCode] = useState<string>("");

  const [gradeModal, setGradeModal] = useState(false);
  const [strandModal, setStrandModal] = useState(false);

  const gradeLabel = useMemo(() => (grade ? `Grade ${grade}` : "Select Grade"), [grade]);
  const strandLabel = useMemo(
    () => (strand ? (strand === "ALL" ? "All Strands" : normalizeStrand(strand)) : "Select Strand"),
    [strand]
  );

  /** Load existing class and prefill form */
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from("classes").select("*").eq("id", id).maybeSingle();
    if (error) {
      console.warn("[edit-class] load error:", error);
      Alert.alert("Error", "Failed to load class.");
      setLoading(false);
      return;
    }
    if (!data) {
      Alert.alert("Not found", "Class no longer exists.");
      setLoading(false);
      return;
    }

    setClassName(readClassName(data) || "");
    setGrade((data?.grade_level ?? data?.grade ?? "") as any);
    setStrand((data?.strand ?? "ALL") || "ALL");
    setClassCode((data?.class_code ?? data?.code ?? "").toString());

    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

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
    return true;
  };

  const confirmAndSave = async () => {
    if (!validate()) return;

    const displayStrand = strand === "ALL" ? "All Strands" : normalizeStrand(strand);
    Alert.alert(
      "Save Changes?",
      `Name: ${className}\nGrade: ${grade}\nStrand: ${displayStrand}\nCode: ${classCode || "—"}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          style: "default",
          onPress: async () => {
            await doSave();
          },
        },
      ]
    );
  };

  const doSave = async () => {
    if (isSubmitting || !id) return;

    try {
      setIsSubmitting(true);

      // Build update payload safely (don’t touch class_code here)
      const base: any = {
        grade_level: grade || null,
        strand: strand === "ALL" ? null : normalizeStrand(strand),
        updated_at: new Date().toISOString(),
      };
      writeClassName(base, className.trim());

      const { error } = await supabase.from("classes").update(base).eq("id", id);
      if (error) throw error;

      Alert.alert("Saved", "Class updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            router.replace("/TeacherScreen/TeacherClasses/teacher-classes");
          },
        },
      ]);
    } catch (e: any) {
      console.warn("[edit-class] update error:", e);
      Alert.alert("Error", "We couldn't save your changes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0F172A]">
      <BackgroundDecor />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header (same structure, different title) */}
        <View className="px-6 pt-10 pb-5">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-3xl font-bold text-white">Edit Class</Text>
              <Text className="text-slate-400 text-lg">Update your class details</Text>
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

            {/* Summary chip row (no class-code editor; just show it here) */}
            <View className="mt-2 flex-row flex-wrap -mx-1">
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

            {/* Save Button */}
            <TouchableOpacity
              className={`mt-8 py-4 rounded-xl ${isSubmitting ? "bg-violet-600/60" : "bg-violet-600"}`}
              onPress={confirmAndSave}
              disabled={isSubmitting || loading}
              activeOpacity={0.9}
            >
              <Text className="text-white text-center font-bold text-lg">
                {isSubmitting ? "Saving..." : "Save Changes"}
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
