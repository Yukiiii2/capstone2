// app/StudentScreen/SpeakingExercise/class-module-post/PostModule.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router"; // <-- EDIT: read params
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system"; // <-- ADDED
import { supabase } from "@/lib/supabaseClient";

// ---------------- Types ----------------

interface RubricItem {
  label: string;
  descriptions: {
    high: string;
    medium: string;
    low: string;
  };
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

// one stored file entry
interface ResourceItem {
  name: string; // display filename (ex: "Lesson1.pdf")
  path: string; // storage path we uploaded to (ex: "teacher123/uuid.pdf")
}

interface ClassItem {
  id: string;
  name: string;
  section?: string | null;
  grade_level?: number | null;
  strand?: string | null;
}

interface ModuleData {
  // Targeting
  grade: number | null; // 11 or 12
  strand: string | null; // "ALL" | "ABM" | "STEM" | "HUMSS" | "GAS" | "TVL" | null
  classId: string | null; // kept for backward-compat / single-select fallback
  category: "SPEAKING" | "READING" | null; // module type

  // NEW: multi-select classes
  classIds: string[]; // selected classes (supports 1..N)

  // Module Info
  title: string;
  description: string;

  // Key Points / Lesson / Tips
  lessons: string[]; // lesson body (index 0 is main)
  importance: string[];
  tips: string[];

  // Task & Rubric
  taskBody: string;
  taskInstructions: string[];
  rubric: RubricItem[];

  // Quiz
  quiz: QuizQuestion[];

  // Materials / Attachments
  resources: ResourceItem[];
}

// ---------------- Background Decor ----------------

const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#0F172A"]}
        className="flex-1"
      />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
  </View>
);

// ---------------- Component ----------------

export default function PostModule() {
  const router = useRouter();
  const { width } = Dimensions.get("window");

  // EDIT: read params and compute edit mode
  const params = useLocalSearchParams<{ mode?: string; moduleId?: string }>();
  const isEdit = params?.mode === "edit" && !!params?.moduleId;
  const existingModuleId = params?.moduleId ? String(params.moduleId) : null;

  // wizard page step
  const [step, setStep] = useState(1);

  // teacher id (supabase auth user id)
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // submit lock
  const [isSubmitting, setIsSubmitting] = useState(false);

  // dynamic options (with fallbacks)
  const [gradeOptions, setGradeOptions] = useState<number[]>([11, 12]);
  const [strandOptions, setStrandOptions] = useState<string[]>([
    "ABM",
    "STEM",
    "HUMSS",
    "GAS",
    "TVL",
  ]);

  // teacher classes
  const [classes, setClasses] = useState<ClassItem[]>([]);

  // main form state
  const [moduleData, setModuleData] = useState<ModuleData>({
    grade: null,
    strand: null,
    classId: null,
    category: null,

    // NEW: multi-select store
    classIds: [],

    title: "",
    description: "",

    lessons: [""],
    importance: [""],
    tips: [""],

    taskBody: "",
    taskInstructions: [""],
    rubric: [],

    quiz: [
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ],

    resources: [],
  });

  // on mount: grab teacher auth user id
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!mounted) return;
      setTeacherId(auth?.user?.id ?? null);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // load dynamic grade & strand options from Supabase (safe fallback)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: grades, error: gErr } = await supabase
          .from("grade_levels")
          .select("value")
          .order("value", { ascending: true });

        if (!cancelled && !gErr && grades?.length) {
          const vals = grades
            .map((g: any) => Number(g.value))
            .filter((n: any) => !Number.isNaN(n));
          if (vals.length) setGradeOptions(vals);
        }

        const { data: strands, error: sErr } = await supabase
          .from("strands")
          .select("code, name");

        if (!cancelled && !sErr && strands?.length) {
          const codes = strands
            .map((r: any) => (r?.code ? String(r.code) : String(r?.name || "")))
            .filter((x: string) => x.trim().length > 0)
            .map(normalizeStrand);
          if (codes.length) setStrandOptions(uniqueArray(codes));
        }
      } catch {
        // ignore — we already have fallbacks
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // load teacher's classes
  useEffect(() => {
    if (!teacherId) return;
    let cancelled = false;

    (async () => {
      try {
        // Expecting a table "classes" with teacher_id FK.
        // Columns used: id, name, grade_level, strand
        const { data, error } = await supabase
          .from("classes")
          .select("id, name, grade_level, strand")
          .eq("teacher_id", teacherId)
          .order("name", { ascending: true });

        if (!cancelled && !error && data) {
          const mapped: ClassItem[] = data.map((c: any) => ({
            id: String(c.id),
            name: String(c.name ?? "Unnamed Class"),
            section: null,
            grade_level: c.grade_level != null ? Number(c.grade_level) : null,
            strand: c.strand ? normalizeStrand(String(c.strand)) : null,
          }));
          setClasses(mapped);
        }
      } catch {
        // ignore; UI will show empty state
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  // EDIT: Prefill when in edit mode
  useEffect(() => {
    if (!isEdit || !existingModuleId) return;
    let cancelled = false;

    (async () => {
      try {
        // fetch header (include module_type + class_id)
        const { data: h, error: hErr } = await supabase
          .from("class_modules")
          .select(
            "id, title, body, grade_level, strand, class_id, teacher_id, module_type, due_at"
          )
          .eq("id", existingModuleId)
          .limit(1)
          .single();

        if (hErr || !h) throw hErr || new Error("Module not found");

        // fetch details (maybeSingle)
        const { data: d, error: dErr } = await supabase
          .from("class_module_details")
          .select("*")
          .eq("module_id", existingModuleId)
          .limit(1)
          .maybeSingle();

        if (dErr) throw dErr;

        if (cancelled) return;

        setModuleData((prev) => ({
          ...prev,
          grade: h?.grade_level != null ? Number(h.grade_level) : null,
          strand: h?.strand ? normalizeStrand(String(h.strand)) : "ALL",
          classId: h?.class_id ? String(h.class_id) : null,
          classIds: h?.class_id ? [String(h.class_id)] : [],
          category: h?.module_type ? String(h.module_type).toUpperCase() as "SPEAKING" | "READING" : null,
          title: h?.title ?? "",
          description: h?.body ?? "",
          lessons: d?.lessons && Array.isArray(d.lessons) ? d.lessons : [""],
          importance: d?.importance && Array.isArray(d.importance) ? d.importance : [""],
          tips: d?.tips && Array.isArray(d.tips) ? d.tips : [""],
          taskBody: d?.task_body ?? "",
          taskInstructions:
            d?.task_instructions && Array.isArray(d.task_instructions)
              ? d.task_instructions
              : [""],
          rubric: d?.rubric && Array.isArray(d.rubric) ? d.rubric : [],
          quiz: d?.quiz && Array.isArray(d.quiz) ? d.quiz : [
            { question: "", options: ["", "", "", ""], correctAnswer: 0 },
            { question: "", options: ["", "", "", ""], correctAnswer: 0 },
          ],
          resources: d?.resources && Array.isArray(d.resources) ? d.resources : [],
        }));
      } catch (e) {
        console.warn("[PostModule] prefill error", e);
        Alert.alert("Error", "Could not load module for editing.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEdit, existingModuleId]);

  // small helper for step indicator pills
  const getStepIndicatorStyle = (currentStep: number, s: number) =>
    `w-10 h-10 rounded-full items-center justify-center border-2 transition-all ${
      currentStep === s
        ? "bg-white/90 border-white"
        : currentStep > s
        ? "bg-white/20 border-white/40"
        : "bg-white/5 border-white/20"
    }`;

  // ---------------- helpers ----------------
  function normalizeStrand(s: string) {
    if (!s) return s;
    const up = s.toUpperCase();
    return up === "HUMMS" ? "HUMSS" : up;
  }

  function uniqueArray<T>(arr: T[]) {
    return Array.from(new Set(arr));
  }

  // robust base64 -> Uint8Array
  function base64ToBytes(b64: string): Uint8Array {
    try {
      // @ts-ignore
      const _atob: (s: string) => string = typeof atob === "function" ? atob : undefined;
      if (_atob) {
        const binary = _atob(b64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
      }
    } catch {
      // fall through
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Buffer } = require("buffer");
    const buf = Buffer.from(b64, "base64");
    return new Uint8Array(buf);
  }

  // ---------------- state updaters ----------------

  const handleInputChange = (field: keyof ModuleData, value: any) => {
    setModuleData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (
    field: "lessons" | "importance" | "tips" | "taskInstructions",
    index: number,
    value: string
  ) => {
    setModuleData((prev) => {
      return {
        ...prev,
        [field]: prev[field].map((item, i) => (i === index ? value : item)),
      };
    });
  };

  const handleAddItem = (
    field: "importance" | "tips" | "taskInstructions"
  ) => {
    setModuleData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const handleRemoveItem = (
    field: "importance" | "tips" | "taskInstructions",
    index: number
  ) => {
    setModuleData((prev) => {
      const newArray = [...prev[field]];
      newArray.splice(index, 1);
      return { ...prev, [field]: newArray as any };
    });
  };

  // QUIZ
  const handleQuizChange = (
    questionIndex: number,
    field: "question" | "options" | "correctAnswer",
    value: any,
    optionIndex?: number
  ) => {
    setModuleData((prev) => {
      const newQuiz = [...prev.quiz];
      if (field === "options" && optionIndex !== undefined) {
        const newOptions = [...newQuiz[questionIndex].options];
        newOptions[optionIndex] = value;
        newQuiz[questionIndex] = {
          ...newQuiz[questionIndex],
          options: newOptions,
        };
      } else {
        newQuiz[questionIndex] = {
          ...newQuiz[questionIndex],
          [field]: value,
        };
      }
      return { ...prev, quiz: newQuiz };
    });
  };

  // NEW: add/remove quiz question (mirrors other "Add ..." sections)
  const handleAddQuizQuestion = () => {
    setModuleData((prev) => ({
      ...prev,
      quiz: [
        ...prev.quiz,
        { question: "", options: ["", "", "", ""], correctAnswer: 0 },
      ],
    }));
  };

  const handleRemoveQuizQuestion = (index: number) => {
    setModuleData((prev) => {
      const copy = [...prev.quiz];
      copy.splice(index, 1);
      return { ...prev, quiz: copy };
    });
  };

  // RUBRIC
  const handleRubricChange = (
    index: number,
    field: "label" | keyof RubricItem["descriptions"],
    value: string
  ) => {
    const newRubric = [...moduleData.rubric];
    if (field === "label") {
      newRubric[index] = { ...newRubric[index], label: value };
    } else if (field === "high" || field === "medium" || field === "low") {
      newRubric[index] = {
        ...newRubric[index],
        descriptions: {
          ...newRubric[index].descriptions,
          [field]: value,
        },
      };
    }
    handleInputChange("rubric", newRubric);
  };

  const handleAddRubric = () => {
    handleInputChange("rubric", [
      ...moduleData.rubric,
      {
        label: "",
        descriptions: { high: "", medium: "", low: "" },
      },
    ]);
  };

  // -------------- FILE PICK + UPLOAD --------------
  const pickAndUploadResource = async () => {
    if (!teacherId) {
      Alert.alert(
        "Not signed in",
        "Can't attach files without a teacher account."
      );
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;

    const file = result.assets?.[0];
    if (!file) {
      Alert.alert("File Error", "No file selected.");
      return;
    }

    try {
      const bucketName = "class_resources";
      const fileExt = file.name?.split(".").pop() || "bin";
      const timestamp = Date.now();
      const storagePath = `${teacherId}/${timestamp}-${file.name || `file.${fileExt}`}`;

      const base64Data = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const bytes = base64ToBytes(base64Data);

      const { error: uploadErr } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, bytes, {
          contentType: file.mimeType || "application/octet-stream",
          upsert: false,
        });

      if (uploadErr) {
        console.warn("Upload error:", uploadErr);
        Alert.alert("Upload Failed", "Couldn't upload the file.");
        return;
      }

      setModuleData((prev) => ({
        ...prev,
        resources: [
          ...prev.resources,
          {
            name: file.name || `file.${fileExt}`,
            path: storagePath,
          },
        ],
      }));
    } catch (err) {
      console.warn("pickAndUploadResource exception:", err);
      Alert.alert("Upload Failed", "Something went wrong while uploading.");
    }
  };

  const handleRemoveResource = (index: number) => {
    setModuleData((prev) => {
      const copy = [...prev.resources];
      copy.splice(index, 1);
      return { ...prev, resources: copy };
    });
  };

  // ---------------- validation per step ----------------

  const validateStep = () => {
    // step 1: targeting
    if (step === 1) {
      if (!moduleData.grade) {
        Alert.alert("Selection Required", "Please select a grade level to continue");
        return false;
      }
      if (!moduleData.strand) {
        Alert.alert("Selection Required", "Please select a target strand (or All Strands)");
        return false;
      }

      // updated: require at least one class in multi-select
      const selectedCount = moduleData.classIds.length || (moduleData.classId ? 1 : 0);
      if (!isEdit && selectedCount === 0) { // In edit, we allow existing class to persist even if pills not toggled
        Alert.alert("Selection Required", "Please choose at least one class to assign this module to");
        return false;
      }

      if (!moduleData.category) {
        Alert.alert("Selection Required", "Please select if this is for Speaking or Reading");
        return false;
      }
    }

    // step 2: basic info
    if (
      step === 2 &&
      (!moduleData.title.trim() || !moduleData.description.trim())
    ) {
      Alert.alert("Required Fields", "Please fill in all required fields");
      return false;
    }

    // step 3: lesson / importance / tips
    if (step === 3) {
      if (!moduleData.lessons[0]?.trim()) {
        Alert.alert("Required Field", "Please enter the lesson content");
        return false;
      }
      if (moduleData.importance.some((i) => !i.trim())) {
        Alert.alert("Required Field", "Please fill in all key points or remove empty ones");
        return false;
      }
      if (moduleData.tips.some((t) => !t.trim())) {
        Alert.alert("Required Field", "Please fill in all learning tips or remove empty ones");
        return false;
      }
    }

    // step 4: quiz
    if (step === 4) {
      const invalidQuiz = moduleData.quiz.some(
        (q) =>
          !q.question.trim() ||
          q.options.some((o) => !o.trim()) ||
          q.correctAnswer === null ||
          q.correctAnswer === undefined
      );
      if (invalidQuiz) {
        Alert.alert(
          "Incomplete Quiz",
          "Please complete all quiz questions and select correct answers"
        );
        return false;
      }
    }

    // step 5: task & rubric
    if (step === 5) {
      if (!moduleData.taskBody.trim()) {
        Alert.alert("Required Field", "Please enter the task description");
        return false;
      }
      if (moduleData.taskInstructions.some((i) => !i.trim())) {
        Alert.alert(
          "Required Field",
          "Please fill in all task instructions or remove empty ones"
        );
        return false;
      }
      if (moduleData.rubric.length === 0) {
        Alert.alert("Required Field", "Please add at least one rubric item");
        return false;
      }
    }

    return true;
  };

  // ---------------- nav ----------------

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setStep((prev) => prev - 1);
  };

  // ---------------- helpers (class selection) ----------------

  const toggleClassSelection = (id: string) => {
    setModuleData((prev) => {
      const exists = prev.classIds.includes(id);
      const nextIds = exists
        ? prev.classIds.filter((x) => x !== id)
        : [...prev.classIds, id];

      // keep classId in sync for backward-compat (first selected)
      const nextClassId = nextIds[0] ?? null;

      return { ...prev, classIds: nextIds, classId: nextClassId };
    });
  };

  // ---------------- submit logic ----------------
  //
  // If multiple classes selected (including ALL), create one row per class.
  //
  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!teacherId) {
      Alert.alert("Not signed in", "Couldn't find teacher account. Please try again.");
      return;
    }

    if (!moduleData.grade || !moduleData.strand || !moduleData.category) {
      Alert.alert("Missing Target", "Please complete Grade/Strand/Type in Step 1.");
      return;
    }

    // EDIT PATH: update the single existing module row
    if (isEdit && existingModuleId) {
      try {
        setIsSubmitting(true);

        // determine single class_id to keep (first selected or existing)
        let nextClassId: string | null =
          moduleData.classIds[0] ??
          moduleData.classId ??
          null;

        // update header
        const { error: hErr } = await supabase
          .from("class_modules")
          .update({
            title: moduleData.title.trim(),
            body: moduleData.description.trim(),
            grade_level: String(moduleData.grade),
            strand: moduleData.strand === "ALL" ? null : moduleData.strand,
            class_id: nextClassId,
            module_type: moduleData.category,
          })
          .eq("id", existingModuleId);

        if (hErr) throw hErr;

        // upsert details
        const detailsRow = {
          module_id: existingModuleId,
          lessons: moduleData.lessons,
          importance: moduleData.importance,
          tips: moduleData.tips,
          task_body: moduleData.taskBody,
          task_instructions: moduleData.taskInstructions,
          rubric: moduleData.rubric,
          quiz: moduleData.quiz,
          resources: moduleData.resources,
          updated_at: new Date().toISOString(),
        };

        const { error: dErr } = await supabase
          .from("class_module_details")
          .upsert(detailsRow, { onConflict: "module_id" });

        if (dErr) throw dErr;

        Alert.alert("Saved", "Module updated successfully.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } catch (e) {
        console.warn("[PostModule] edit submit error", e);
        Alert.alert("Error", "Something went wrong updating this module.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // CREATE PATH (original)
    // Resolve target class IDs:
    // - If specific selections exist, use them;
    // - If strand === "ALL" and none selected, auto-assign all classes of the teacher at this grade.
    let targetClassIds = [...moduleData.classIds];
    if (moduleData.strand === "ALL" && targetClassIds.length === 0) {
      targetClassIds = classes
        .filter((c) => Number(c.grade_level) === Number(moduleData.grade))
        .map((c) => c.id);
    }
    // Fallback to single classId if provided and not already in list
    if (moduleData.classId && !targetClassIds.includes(moduleData.classId)) {
      targetClassIds.push(moduleData.classId);
    }

    if (targetClassIds.length === 0) {
      Alert.alert("Missing Class", "Please select at least one class for this module.");
      return;
    }

    if (!moduleData.title.trim()) {
      Alert.alert("Missing Title", "Module title is required.");
      return;
    }

    if (!moduleData.description.trim()) {
      Alert.alert("Missing Description", "Module description is required.");
      return;
    }

    setIsSubmitting(true);

    // Build details payload once
    const detailsPayload = {
      lessons: moduleData.lessons,
      importance: moduleData.importance,
      tips: moduleData.tips,
      task_body: moduleData.taskBody,
      task_instructions: moduleData.taskInstructions,
      rubric: moduleData.rubric,
      quiz: moduleData.quiz,
      resources: moduleData.resources,
    };

    const createdIds: string[] = [];

    try {
      // Insert one header+details per target class
      for (const class_id of targetClassIds) {
        const moduleRow = {
          teacher_id: teacherId,
          title: moduleData.title.trim(),
          body: moduleData.description.trim(),
          resource_url: null,
          due_at: null,
          grade_level: String(moduleData.grade),
          // If 'ALL' we store null (your original behavior), otherwise specific strand
          strand: moduleData.strand === "ALL" ? null : moduleData.strand,
          class_id,
          module_type: moduleData.category, // map UI "category" to DB "module_type"

          // NEW: visibility lifecycle (no UI changes here)
          status: "draft",
            // or "PUBLISHED" if you want it visible immediately
          published_at: null,         // set a Date when you publish
          archived_at: null,          // set a Date when you archive
        };

        const { data: inserted, error: insertHeaderErr } = await supabase
          .from("class_modules")
          .insert([moduleRow])
          .select("id")
          .limit(1)
          .single();

        if (insertHeaderErr || !inserted?.id) {
          throw insertHeaderErr || new Error("Insert class_modules failed");
        }

        createdIds.push(inserted.id);

        const detailsRow = {
          module_id: inserted.id,
          ...detailsPayload,
        };

        const { error: insertDetailsErr } = await supabase
          .from("class_module_details")
          .insert([detailsRow]);

        if (insertDetailsErr) {
          throw insertDetailsErr;
        }
      }

      Alert.alert(
        "Success",
        `Module created for ${createdIds.length} class${createdIds.length > 1 ? "es" : ""}!`,
        [
          {
            text: "OK",
            onPress: () => {
              setIsSubmitting(false);
              router.back();
            },
          },
        ]
      );
    } catch (e) {
      console.warn("[PostModule] submit exception", e);
      // rollback any created headers
      if (createdIds.length) {
        await supabase.from("class_modules").delete().in("id", createdIds);
      }
      Alert.alert("Error", "Something went wrong saving this module.");
      setIsSubmitting(false);
    }
  };

  // ---------------- render per-step ----------------

  const renderStep = () => {
    switch (step) {
      // STEP 1: Target (grade + strand + class + category)
      case 1:
        // filtering:
        // - If 'ALL': only by grade (strand ignored)
        // - Else: by grade + strand
        const filteredClasses = classes.filter((c) => {
          const gradeOk = moduleData.grade ? Number(c.grade_level) === Number(moduleData.grade) : true;
          if (!gradeOk) return false;

          if (moduleData.strand === "ALL") return true;

          const targetStrand = moduleData.strand ? normalizeStrand(moduleData.strand) : null;
          const classStrand = c.strand ? normalizeStrand(String(c.strand)) : null;
          return !targetStrand || targetStrand === classStrand;
        });

        // Helper: selected state (multi)
        const isSelected = (id: string) =>
          moduleData.classIds.includes(id) || moduleData.classId === id;

        return (
          <View className="space-y-8">
            <View className="items-center">
              <Text className="text-3xl font-bold text-white mb-2">
                Audience Target
              </Text>
              <Text className="text-slate-300 text-center">
                Choose which students will receive this module.
              </Text>
            </View>

            {/* Grade picker */}
            <View>
              <Text className="text-slate-200 mb-3 font-semibold text-lg">
                Grade Level *
              </Text>

              <View className="space-y-4">
                {(gradeOptions.length ? gradeOptions : [11, 12]).map((g) => (
                  <TouchableOpacity
                    key={g}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      moduleData.grade === g
                        ? "bg-violet-600 border-white"
                        : "border-white/10 bg-white/5"
                    }`}
                    onPress={() => {
                      handleInputChange("grade", g);
                      // reset class selections when grade changes
                      handleInputChange("classIds", []);
                      handleInputChange("classId", null);
                    }}
                  >
                    <Text
                      className={`text-xl font-semibold text-center ${
                        moduleData.grade === g ? "text-violet-300" : "text-white"
                      }`}
                    >
                      Grade {g}
                    </Text>
                    <Text
                      className={`text-center mt-2 ${
                        moduleData.grade === g ? "text-violet-200/80" : "text-slate-400"
                      }`}
                    >
                      {g === 11 ? "" : ""}
                    </Text>
                    {moduleData.grade === g && (
                      <View className="absolute top-4 right-4 w-7 h-7 bg-violet-500 rounded-full items-center justify-center">
                        <Ionicons name="checkmark" size={18} color="white" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Strand picker */}
            <View>
              <Text className="text-slate-200 mb-4 font-semibold text-lg">
                Strand *
              </Text>

              <Text className="text-slate-400 text-xs mb-3">
                Pick a specific strand OR choose “All Strands” to share with everyone in that grade.
              </Text>

              <View className="flex-row flex-wrap -mx-1">
                {[
                  { label: "All Strands", value: "ALL" },
                  ...(strandOptions.length ? strandOptions : ["ABM", "STEM", "HUMSS", "GAS", "TVL"]).map(
                    (v) => ({ label: v, value: normalizeStrand(v) })
                  ),
                ].map((opt) => {
                  const isSel = moduleData.strand === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => {
                        handleInputChange("strand", opt.value === "ALL" ? "ALL" : normalizeStrand(opt.value));
                        // reset class selections when strand changes
                        handleInputChange("classIds", []);
                        handleInputChange("classId", null);
                      }}
                      className={`px-4 py-3 rounded-xl border-2 m-1 ${
                        isSel ? "bg-violet-600 border-white" : "bg-white/5 border-white/10"
                      }`}
                      style={{ minWidth: width * 0.28, alignItems: "center" }}
                    >
                      <Text className={`font-semibold ${isSel ? "text-violet-200" : "text-white"}`}>
                        {opt.label}
                      </Text>
                      {isSel && (
                        <View className="absolute top-2 right-2 w-5 h-5 bg-violet-500 rounded-full items-center justify-center">
                          <Ionicons name="checkmark" size={14} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Class picker */}
            <View>
              <Text className="text-slate-200 mb-4 font-semibold text-lg">
                Class to Assign *
              </Text>

              <Text className="text-slate-400 text-xs mb-3">
                {moduleData.strand === "ALL"
                  ? "Tip: You can select multiple classes in this grade."
                  : "Tip: You can select one or multiple classes for this strand."}
              </Text>

              {filteredClasses.length === 0 ? (
                <Text className="text-slate-500 text-sm">
                  {classes.length === 0
                    ? "No classes found for your account."
                    : "No classes match the selected grade/strand."}
                </Text>
              ) : (
                <View className="flex-row flex-wrap -mx-1">
                  {filteredClasses.map((c) => {
                    const selected = isSelected(c.id);
                    const subtitleParts = [
                      c.section ? `Sec. ${c.section}` : null,
                      c.grade_level ? `G${c.grade_level}` : null,
                      c.strand ? `${normalizeStrand(String(c.strand))}` : null,
                    ].filter(Boolean);
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => toggleClassSelection(c.id)}
                        className={`px-4 py-3 rounded-xl border-2 m-1 ${
                          selected ? "bg-violet-600 border-white" : "bg-white/5 border-white/10"
                        }`}
                        style={{ minWidth: width * 0.44, alignItems: "flex-start" }}
                      >
                        <Text className={`font-semibold ${selected ? "text-violet-200" : "text-white"}`}>
                          {c.name}
                        </Text>
                        <Text className={`text-xs mt-1 ${selected ? "text-violet-100/80" : "text-slate-400"}`}>
                          {subtitleParts.join(" • ") || "—"}
                        </Text>
                        {selected && (
                          <View className="absolute top-2 right-2 w-5 h-5 bg-violet-500 rounded-full items-center justify-center">
                            <Ionicons name="checkmark" size={14} color="white" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Module Type */}
            <View>
              <Text className="text-slate-200 mb-4 font-semibold text-lg">Module Type *</Text>
              <View className="flex-row -mx-1">
                {[
                  { label: "Speaking", value: "SPEAKING" as const, icon: "mic-outline" as const },
                  { label: "Reading", value: "READING" as const, icon: "book-outline" as const },
                ].map((opt) => {
                  const isSel = moduleData.category === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => handleInputChange("category", opt.value)}
                      className={`flex-1 mx-1 px-4 py-4 rounded-xl border-2 flex-row items-center justify-center ${
                        isSel ? "bg-violet-600 border-white" : "bg-white/5 border-white/10"
                      }`}
                    >
                      <Ionicons
                        name={opt.icon as any}
                        size={18}
                        color={isSel ? "#E9D5FF" : "white"}
                        style={{ marginRight: 8 }}
                      />
                      <Text className={`font-semibold ${isSel ? "text-violet-200" : "text-white"}`}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        );

      // STEP 2: Basic Info
      case 2:
        return (
          <View className="space-y-6">
            <View className="items-center mb-2">
              <Text className="text-3xl font-bold text-white mb-2">
                Module Information
              </Text>
              <Text className="text-slate-300 text-center">
                Enter the basic details of your module
              </Text>
            </View>

            <View className="space-y-5">
              <View>
                <Text className="text-slate-200 mb-3 font-semibold text-lg">
                  Module Title *
                </Text>
                <TextInput
                  className="bg-white/10 rounded-xl px-5 py-4 text-white border-2 border-white/10 h-14"
                  placeholder="Enter module title"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={moduleData.title}
                  onChangeText={(text) => handleInputChange("title", text)}
                />
              </View>

              <View>
                <Text className="text-slate-200 mb-3 font-semibold text-lg">
                  Description *
                </Text>
                <TextInput
                  className="bg-white/10 rounded-xl px-5 py-4 text-white border-2 border-white/10 h-40"
                  placeholder="Write a compelling description of the module..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                  textAlignVertical="top"
                  value={moduleData.description}
                  onChangeText={(text) => handleInputChange("description", text)}
                />
              </View>
            </View>
          </View>
        );

      // STEP 3: Lesson / Importance / Tips / Materials
      case 3:
        return (
          <View className="space-y-6">
            <View className="items-center mb-6">
              <Text className="text-3xl font-bold text-white mb-2">
                Key Learning Points
              </Text>
              <Text className="text-slate-300 text-center">
                Add the essential learning components
              </Text>
            </View>

            {/* Lesson Content */}
            <View className="space-y-4">
              <View className="flex-row items-center">
                <Ionicons name="book-outline" size={22} color="white" />
                <Text className="left-2 text-xl font-semibold text-white">
                  Lesson Content
                </Text>
              </View>

              <Text className="text-slate-400 text-sm mb-2">
                Outline the main lesson content and key concepts.
              </Text>

              <TextInput
                className="bg-white/10 rounded-xl px-4 py-4 text-white border-2 border-white/10 text-base w-full h-32"
                value={moduleData.lessons[0] || ""}
                onChangeText={(text) => handleArrayChange("lessons", 0, text)}
                placeholder="Enter the main lesson content"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Importance */}
            <View className="space-y-4 mt-8">
              <View className="flex-row items-center">
                <Ionicons name="star-outline" size={22} color="white" />
                <Text className="left-2 text-xl font-semibold text-white">
                  Importance
                </Text>
              </View>

              <Text className="text-slate-400 text-sm mb-2">
                Highlight the most important concepts students must remember.
              </Text>

              {moduleData.importance.map((point, index) => (
                <View key={`importance-${index}`} className="mb-3">
                  <TextInput
                    className="bg-white/10 rounded-xl px-4 py-3 text-white border-2 border-white/10 text-base w-full"
                    value={point}
                    onChangeText={(text) => handleArrayChange("importance", index, text)}
                    placeholder={`Key point ${index + 1}...`}
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    multiline
                  />
                  {moduleData.importance.length > 1 && (
                    <TouchableOpacity
                      className="absolute -right-10 top-3 p-1"
                      onPress={() => handleRemoveItem("importance", index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                className="flex-row items-center justify-center bg-white/5 rounded-xl py-3 border-2 border-dashed border-white/20"
                onPress={() => handleAddItem("importance")}
              >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text className="text-white font-medium ml-2">Add Importance</Text>
              </TouchableOpacity>
            </View>

            {/* Tips */}
            <View className="space-y-4 mt-8">
              <View className="flex-row items-center">
                <Ionicons name="bulb-outline" size={22} color="white" />
                <Text className="left-2 text-xl font-semibold text-white">
                  Learning Tips
                </Text>
              </View>

              <Text className="text-slate-400 text-sm mb-2">
                Share study tips to help students master the material.
              </Text>

              {moduleData.tips.map((tip: string, index: number) => (
                <View key={`tip-${index}`} className="mb-3">
                  <TextInput
                    className="bg-white/10 rounded-xl px-4 py-3 text-white border-2 border-white/10 text-base w-full"
                    value={tip}
                    onChangeText={(text: string) => handleArrayChange("tips", index, text)}
                    placeholder={`Tip ${index + 1}...`}
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    multiline
                  />
                  {moduleData.tips.length > 1 && (
                    <TouchableOpacity
                      className="absolute -right-10 top-3 p-1"
                      onPress={() => handleRemoveItem("tips", index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                className="flex-row items-center justify-center bg-white/5 rounded-xl py-3 border-2 border-dashed border-white/20"
                onPress={() => handleAddItem("tips")}
              >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text className="text-white font-medium ml-2">Add Learning Tip</Text>
              </TouchableOpacity>
            </View>

            {/* Materials / Attachments */}
            <View className="space-y-4 mt-8">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-semibold text-white">Materials / Attachments</Text>
                <Ionicons name="link-outline" size={20} color="white" />
              </View>

              {moduleData.resources.length === 0 ? (
                <Text className="text-slate-500 text-sm">No materials added yet</Text>
              ) : (
                moduleData.resources.map((res, index) => (
                  <View key={`res-${index}`} className="flex-row items-center mb-2">
                    <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mr-3">
                      <Ionicons name="document-text-outline" size={14} color="white" />
                    </View>

                    <Text className="text-white flex-1" numberOfLines={1}>
                      {res.name || "(unnamed file)"}
                    </Text>

                    <TouchableOpacity className="ml-3 p-2" onPress={() => handleRemoveResource(index)}>
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <TouchableOpacity
                className="flex-row items-center justify-center bg-white/5 rounded-xl py-4 border-2 border-white/20"
                onPress={pickAndUploadResource}
              >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Add Material</Text>
              </TouchableOpacity>

              <Text className="text-slate-500 text-[11px] text-center">
                (PDF, PPT, etc. will upload to storage and appear here)
              </Text>
            </View>
          </View>
        );

      // STEP 4: Quiz
      case 4:
        return (
          <View className="space-y-6">
            <View className="items-center mb-6">
              <Text className="text-3xl font-bold text-white mb-2">Module Quiz</Text>
              <Text className="text-slate-300 text-center">Add quiz questions to test understanding</Text>
            </View>

            {moduleData.quiz.map((question, qIndex) => (
              <View key={`quiz-${qIndex}`} className="bg-white/5 rounded-2xl p-5 mb-6 border border-white/10">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-xl font-semibold text-white">Question {qIndex + 1}</Text>
                  {moduleData.quiz.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveQuizQuestion(qIndex)}
                      className="p-1"
                    >
                      <Ionicons name="close-circle" size={22} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  className="bg-white/10 rounded-xl px-4 py-3 text-white border-2 border-white/10 mb-4 text-lg"
                  placeholder="Enter the question..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={question.question}
                  onChangeText={(text) => handleQuizChange(qIndex, "question", text)}
                />

                <View className="space-y-3 mb-4">
                  {question.options.map((option, oIndex) => (
                    <View key={`option-${qIndex}-${oIndex}`} className="flex-row items-center">
                      <TouchableOpacity
                        className={`w-6 h-6 rounded-full border-2 ${
                          question.correctAnswer === oIndex ? "border-white" : "border-white/10"
                        } mr-3 items-center justify-center`}
                        onPress={() => handleQuizChange(qIndex, "correctAnswer", oIndex)}
                      >
                        {question.correctAnswer === oIndex && <View className="w-3 h-3 bg-white rounded-full" />}
                      </TouchableOpacity>
                      <TextInput
                        className={`flex-1 bg-white/10 rounded-xl px-4 py-3 text-white border-2 ${
                          question.correctAnswer === oIndex ? "border-white/50" : "border-white/10"
                        }`}
                        placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        value={option}
                        onChangeText={(text) => handleQuizChange(qIndex, "options", text, oIndex)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* NEW: Add Question button (mirrors other "Add ..." actions) */}
            <TouchableOpacity
              className="flex-row items-center justify-center bg-white/5 rounded-xl py-4 border-2 border-white/20"
              onPress={handleAddQuizQuestion}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Add Question</Text>
            </TouchableOpacity>
          </View>
        );

      // STEP 5: Task & Rubric
      case 5:
        return (
          <View className="space-y-6">
            <View className="items-center mb-4">
              <Text className="text-3xl font-bold text-white mb-2">Task & Assessment</Text>
              <Text className="text-slate-300 text-center">Define the task and how you'll grade it</Text>
            </View>

            {/* Task body + instructions */}
            <View className="space-y-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-semibold text-white">Learning Task</Text>
                <Ionicons name="create-outline" size={20} color="white" />
              </View>
              <TextInput
                className="bg-white/10 rounded-xl px-5 py-4 text-white border-2 border-white/10 h-40"
                placeholder="Describe the learning task in detail..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                multiline
                textAlignVertical="top"
                value={moduleData.taskBody}
                onChangeText={(text) => handleInputChange("taskBody", text)}
              />

              <Text className="text-slate-200 mt-6 mb-3 font-semibold text-lg">Task Instructions</Text>
              {moduleData.taskInstructions.map((instruction, index) => (
                <View key={`instruction-${index}`} className="flex-row items-center mb-3">
                  <View className="w-7 h-7 bg-white/10 rounded-full items-center justify-center mr-3">
                    <Text className="text-white font-bold text-sm">{index + 1}</Text>
                  </View>
                  <TextInput
                    className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-white border-2 border-white/10"
                    value={instruction}
                    onChangeText={(text) => handleArrayChange("taskInstructions", index, text)}
                    placeholder={`Step ${index + 1}...`}
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  />
                  {moduleData.taskInstructions.length > 1 && (
                    <TouchableOpacity className="ml-3 p-2" onPress={() => handleRemoveItem("taskInstructions", index)}>
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                className="flex-row items-center justify-center bg-white/5 rounded-xl py-4 border-2 border-white/10"
                onPress={() => handleAddItem("taskInstructions")}
              >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Add Instruction</Text>
              </TouchableOpacity>
            </View>

            {/* Rubric */}
            <View className="mt-8 space-y-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-semibold text-white">Assessment Rubric</Text>
                <Ionicons name="ribbon-outline" size={20} color="white" />
              </View>

              {moduleData.rubric.map((item, index) => (
                <View key={`rubric-${index}`} className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <View className="flex-row justify-between items-center mb-4">
                    <TextInput
                      className="text-lg font-semibold text-white bg-transparent flex-1 mr-2"
                      value={item.label}
                      onChangeText={(text) => handleRubricChange(index, "label", text)}
                      placeholder="Criterion name"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    />
                    {moduleData.rubric.length > 1 && (
                      <TouchableOpacity
                        onPress={() => {
                          const newRubric = [...moduleData.rubric];
                          newRubric.splice(index, 1);
                          handleInputChange("rubric", newRubric);
                        }}
                        className="p-1"
                      >
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View className="space-y-3">
                    <View>
                      <Text className="text-slate-400 text-sm font-medium mb-1">Excellent (4-5 pts)</Text>
                      <TextInput
                        className="bg-white/5 rounded-lg px-3 py-2 text-white text-sm border border-white/10"
                        value={item.descriptions.high}
                        onChangeText={(text) => handleRubricChange(index, "high", text)}
                        placeholder="Description for excellent performance"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        multiline
                      />
                    </View>

                    <View>
                      <Text className="text-slate-400 text-sm font-medium mb-1">Good (2-3 pts)</Text>
                      <TextInput
                        className="bg-white/5 rounded-lg px-3 py-2 text-white text-sm border border-white/10"
                        value={item.descriptions.medium}
                        onChangeText={(text) => handleRubricChange(index, "medium", text)}
                        placeholder="Description for good performance"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        multiline
                      />
                    </View>

                    <View>
                      <Text className="text-slate-400 text-sm font-medium mb-1">Needs Improvement (0-1 pts)</Text>
                      <TextInput
                        className="bg-white/5 rounded-lg px-3 py-2 text-white text-sm border border-white/10"
                        value={item.descriptions.low}
                        onChangeText={(text) => handleRubricChange(index, "low", text)}
                        placeholder="Description for needs improvement"
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        multiline
                      />
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                className="flex-row items-center justify-center bg-white/10 rounded-xl py-4 border-2 border-white/30 mt-4"
                onPress={handleAddRubric}
              >
                <Ionicons name="add-circle-outline" size={22} color="white" />
                <Text className="text-white font-semibold text-lg ml-3">Add Criterion</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      // STEP 6: Review
      case 6:
        // Build review label for classes (support multi)
        const names = moduleData.classIds
          .map((id) => classes.find((c) => c.id === id)?.name)
          .filter(Boolean) as string[];
        const classReview =
          names.length === 0
            ? (classes.find((c) => c.id === moduleData.classId)?.name || "Not selected")
            : names.length === 1
            ? names[0]
            : `Multiple classes (${names.length})`;

        return (
          <View className="space-y-6">
            <View className="items-center mb-6">
              <Text className="text-3xl font-bold text-white mb-2">Review Your Module</Text>
              <Text className="text-slate-300 text-center">Please review before publishing</Text>
            </View>

            {/* Target Audience */}
            <View className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-white">Target Audience</Text>
                <Ionicons name="people-outline" size={22} color="white" />
              </View>

              <View className="space-y-4">
                <View>
                  <Text className="text-slate-400 text-sm mb-1">Grade Level</Text>
                  <Text className="text-white font-medium">
                    {moduleData.grade ? `Grade ${moduleData.grade}` : "Not specified"}
                  </Text>
                </View>

                <View>
                  <Text className="text-slate-400 text-sm mb-1">Strand</Text>
                  <Text className="text-white font-medium">
                    {moduleData.strand === "ALL" ? "All Strands" : moduleData.strand || "Not specified"}
                  </Text>
                  <Text className="text-slate-400 text-xs mt-1">
                    {moduleData.strand === "ALL"
                      ? "Visible to any strand in this grade"
                      : "Visible only to this strand in this grade"}
                  </Text>
                </View>

                <View>
                  <Text className="text-slate-400 text-sm mb-1">Class</Text>
                  <Text className="text-white font-medium">
                    {classReview}
                  </Text>
                </View>

                <View className="flex-row">
                  <View className="flex-1">
                    <Text className="text-slate-400 text-sm mb-1">Module Type</Text>
                    <Text className="text-white font-medium">
                      {moduleData.category ? moduleData.category : "Not selected"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Module Info */}
            <View className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-white">Module Information</Text>
                <Ionicons name="information-circle-outline" size={24} color="white" />
              </View>

              <View className="space-y-4">
                <View>
                  <Text className="text-slate-400 text-sm mb-1">Module Title</Text>
                  <Text className="text-white font-medium">{moduleData.title || "No title provided"}</Text>
                </View>

                <View>
                  <Text className="text-slate-400 text-sm mb-1">Module Description</Text>
                  <Text className="text-white font-medium">{moduleData.description || "No description provided"}</Text>
                </View>
              </View>
            </View>

            {/* Lesson Content */}
            <View className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-white">Lesson Content</Text>
                <Ionicons name="book-outline" size={22} color="white" />
              </View>
              <View className="bg-white/5 p-4 rounded-lg">
                <Text className="text-white">{moduleData.lessons[0] || "No lesson content provided"}</Text>
              </View>
            </View>

            {/* Key Points */}
            <View className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-white">Key Points</Text>
                <Ionicons name="key-outline" size={22} color="white" />
              </View>
              <View className="space-y-3">
                {moduleData.importance.length > 0 ? (
                  moduleData.importance.map((point, index) => (
                    <View key={`review-importance-${index}`} className="flex-row items-start">
                      <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mt-1 mr-3">
                        <Text className="text-white font-bold text-xs">{index + 1}</Text>
                      </View>
                      <Text className="text-white flex-1">{point}</Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-slate-400">No key points added</Text>
                )}
              </View>
            </View>

            {/* Learning Tips */}
            <View className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-white">Learning Tips</Text>
                <Ionicons name="bulb-outline" size={22} color="white" />
              </View>
              <View className="space-y-3">
                {moduleData.tips.length > 0 ? (
                  moduleData.tips.map((tip, index) => (
                    <View key={`review-tip-${index}`} className="flex-row items-start">
                      <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mt-1 mr-3">
                        <Ionicons name="star-outline" size={14} color="white" />
                      </View>
                      <Text className="text-white flex-1">{tip}</Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-slate-400">No learning tips added</Text>
                )}
              </View>
            </View>

            {/* Quiz Summary */}
            {moduleData.quiz.filter((q) => q.question.trim() !== "").length > 0 && (
              <View className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-semibold text-white">Quiz Questions</Text>
                  <Ionicons name="help-circle-outline" size={24} color="white" />
                </View>

                <View className="space-y-6">
                  {moduleData.quiz
                    .filter((q) => q.question.trim() !== "")
                    .map((question, qIndex) => (
                      <View key={`review-quiz-${qIndex}`} className="space-y-3">
                        <View className="flex-row items-start">
                          <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mt-1 mr-3">
                            <Text className="text-white font-bold text-xs">{qIndex + 1}</Text>
                          </View>
                          <Text className="text-white font-medium flex-1">{question.question}</Text>
                        </View>

                        <View className="ml-9 space-y-2">
                          {question.options.map((option, oIndex) => (
                            <View key={`option-${qIndex}-${oIndex}`} className="flex-row items-start">
                              <View
                                className={`w-5 h-5 rounded-full border-2 ${
                                  question.correctAnswer === oIndex ? "border-white" : "border-white/30"
                                } mr-3 mt-0.5 items-center justify-center`}
                              >
                                {question.correctAnswer === oIndex && <View className="w-2 h-2 bg-white rounded-full" />}
                              </View>
                              <Text
                                className={`text-white ${
                                  question.correctAnswer === oIndex ? "font-medium" : "opacity-80"
                                }`}
                              >
                                {option || `Option ${String.fromCharCode(65 + oIndex)}`}
                              </Text>
                            </View>
                          ))}
                        </View>

                        {qIndex < moduleData.quiz.length - 1 && <View className="h-px bg-white/10 my-4" />}
                      </View>
                    ))}
                </View>
              </View>
            )}

            {/* Task Summary */}
            {(moduleData.taskBody || moduleData.taskInstructions.length > 0) && (
              <View className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-semibold text-white">Task Details</Text>
                  <Ionicons name="checkmark-circle-outline" size={24} color="white" />
                </View>

                {moduleData.taskBody ? (
                  <View className="mb-6">
                    <Text className="text-white font-medium mb-2">Task Description:</Text>
                    <View className="bg-white/5 p-4 rounded-lg">
                      <Text className="text-white">{moduleData.taskBody}</Text>
                    </View>
                  </View>
                ) : null}

                {moduleData.taskInstructions.length > 0 && (
                  <View>
                    <Text className="text-white font-medium mb-3">Instructions:</Text>
                    <View className="space-y-3">
                      {moduleData.taskInstructions.map((instruction, index) => (
                        <View key={`instruction-${index}`} className="flex-row items-start">
                          <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mt-0.5 mr-3">
                            <Text className="text-white text-xs font-bold">{index + 1}</Text>
                          </View>
                          <Text className="text-white flex-1">{instruction}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Materials / Attachments Summary */}
            {moduleData.resources.length > 0 && (
              <View className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-semibold text-white">Materials / Attachments</Text>
                  <Ionicons name="link-outline" size={24} color="white" />
                </View>

                <View className="space-y-3">
                  {moduleData.resources.map((res, index) => (
                    <View key={`res-review-${index}`} className="flex-row items-start">
                      <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mt-0.5 mr-3">
                        <Ionicons name="document-text-outline" size={14} color="white" />
                      </View>
                      <Text className="text-white flex-1" selectable>
                        {res.name || "(unnamed file)"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Rubric */}
            {moduleData.rubric.length > 0 && (
              <View className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-semibold text-white">Assessment Rubric</Text>
                  <Ionicons name="ribbon-outline" size={24} color="white" />
                </View>

                <View className="space-y-6">
                  {moduleData.rubric.map((item, index) => (
                    <View key={`rubric-${index}`} className="space-y-4">
                      <View className="flex-row items-start">
                        <View className="w-6 h-6 bg-white/10 rounded-full items-center justify-center mt-0.5 mr-3">
                          <Text className="text-white text-xs font-bold">{index + 1}</Text>
                        </View>
                        <Text className="text-white font-medium flex-1">
                          {item.label || `Criterion ${index + 1}`}
                        </Text>
                      </View>

                      <View className="ml-9 space-y-3">
                        {item.descriptions.high ? (
                          <View>
                            <Text className="text-white font-medium text-sm">Excellent (4-5 points):</Text>
                            <Text className="text-white/90 ml-2">{item.descriptions.high}</Text>
                          </View>
                        ) : null}

                        {item.descriptions.medium ? (
                          <View>
                            <Text className="text-white font-medium text-sm">Good (2-3 points):</Text>
                            <Text className="text-white/90 ml-2">{item.descriptions.medium}</Text>
                          </View>
                        ) : null}

                        {item.descriptions.low ? (
                          <View>
                            <Text className="text-white font-medium text-sm">Needs Improvement (0-1 point):</Text>
                            <Text className="text-white/90 ml-2">{item.descriptions.low}</Text>
                          </View>
                        ) : null}
                      </View>

                      {index < moduleData.rubric.length - 1 && <View className="h-px bg-white/10 my-2" />}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        );

      // STEP 7: Finish
      case 7:
        return (
          <View className="space-y-6">
            <View className="items-center mb-6">
              <Text className="text-3xl font-bold text-white mb-2">Finish</Text>
              <Text className="text-slate-300 text-center">You're all set!</Text>
            </View>

            <View className="bg-white/10 rounded-2xl border border-white/20 p-6 mt-8">
              <View className="flex-row items-center mb-4">
                <Ionicons name="checkmark-done-circle-outline" size={24} color="white" />
                <Text className="text-white font-bold text-xl ml-3">Ready to Create!</Text>
              </View>
              <Text className="text-white text-lg leading-6">
                Review your module details. Once created, you'll be able to edit and manage it from your dashboard.
              </Text>
            </View>

            <TouchableOpacity
              className={`bg-white/10 rounded-xl py-5 mt-4 ${isSubmitting ? "opacity-50" : "opacity-100"}`}
              disabled={isSubmitting}
              onPress={handleSubmit}
            >
              <Text className="text-white font-bold text-xl text-center">
                {isSubmitting ? "Saving..." : (isEdit ? "Update Learning Module" : "Create Learning Module")}
              </Text>
              <Text className="text-white text-center mt-1">All set! Let's get started</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  // ---------------- main render ----------------

  return (
    <View className="flex-1 bg-gray-900">
      <BackgroundDecor />

      {/* scroll body */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-10 pb-5">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-3xl font-bold text-white">Create Module</Text>
              <Text className="text-slate-400 text-lg">Step {step} of 7</Text>
            </View>
            <TouchableOpacity
              className="bottom-3 w-10 h-10 bg-white/10 rounded-full items-center justify-center"
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View className="h-2 bg-white/10 rounded-full mb-6 overflow-hidden">
            <View
              className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </View>

          {/* Step indicators */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-6 -mx-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <View key={i} className="items-center mx-3 w-16">
                <TouchableOpacity onPress={() => step > i && setStep(i)} className={getStepIndicatorStyle(step, i)} disabled={step < i}>
                  {step > i ? (
                    <Ionicons name="checkmark" size={16} color="white" />
                  ) : (
                    <Text className={`font-bold ${step === i ? "text-white" : "text-slate-400"}`}>{i}</Text>
                  )}
                </TouchableOpacity>
                <Text
                  className={`text-xs mt-2 text-center font-medium ${
                    step === i ? "text-white" : step > i ? "text-violet-300" : "text-slate-400"
                  }`}
                >
                  {["Target", "Details", "Key Pts", "Quiz", "Task", "Review", "Finish"][i - 1]}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Card content */}
        <View className="px-6 pb-6">
          <View className="bg-white/5 rounded-3xl border border-white/10 p-7 backdrop-blur">{renderStep()}</View>
        </View>

        {/* bottom spacer so buttons don't overlap content */}
        <View className="h-24" />
      </ScrollView>

      {/* footer nav buttons */}
      <View className="absolute bottom-0 left-0 right-0 flex-row justify-between p-6 bg-slate-900/90 border-t border-white/10 backdrop-blur-lg">
        {step < 7 ? (
          <View className="flex-1 flex-row">
            {step > 1 ? (
              <TouchableOpacity className="flex-row items-center justify-center bg-white/10 rounded-xl py-4 flex-1 mr-3" onPress={handlePrevious}>
                <Text className="text-slate-300 text-lg font-semibold">Previous</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-1 mr-3" />
            )}

            <TouchableOpacity
              className={`flex-row items-center justify-center rounded-xl py-4 flex-1 ${step > 1 ? "ml-3" : "ml-auto"} bg-violet-600`}
              onPress={handleNext}
            >
              <Text className="text-white font-bold text-lg">{step === 6 ? "Continue" : "Continue"}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1 flex-row">
            <TouchableOpacity className="flex-row items-center justify-center bg-white/10 rounded-xl py-4 flex-1 mr-3" onPress={handlePrevious}>
              <Text className="text-slate-300 font-semibold">Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center bg-violet-600 rounded-xl py-4 ml-3 ${isSubmitting ? "opacity-50" : "opacity-100"}`}
              disabled={isSubmitting}
              onPress={handleSubmit}
            >
              <Text className="text-white font-bold text-lg">{isSubmitting ? "Saving..." : (isEdit ? "Save Changes" : "Submit Module")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
