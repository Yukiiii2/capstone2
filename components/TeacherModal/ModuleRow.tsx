// components/TeacherModal/ModuleRow.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// ✅ ADDED: Supabase import (no UI changes)
import { supabase } from "@/lib/supabaseClient";

export type ModuleRowProps = {
  id: string;
  title: string;
  status: "Published" | "Draft";
  gradeLevel: "11" | "12";
  strand: "ABM" | "STEM" | "HUMSS" | "GAS" | "TVL" | "ALL";
  updatedAt?: string;
  attachmentsCount?: number;
  hasQuiz?: boolean;
  assigned?: boolean;

  onToggleAssign: (moduleId: string, next: boolean) => void | Promise<void>;
  onOpen?: (moduleId: string) => void;

  // ✅ add this line
  onOpenProgress?: (moduleId: string, moduleTitle?: string) => void;
};

export default function ModuleRow(props: ModuleRowProps) {
  const {
    id,
    title,
    status,
    gradeLevel,
    strand,
    updatedAt,
    attachmentsCount,
    hasQuiz,
    assigned,
    onToggleAssign,
    onOpen, // ✅ existing
    onOpenProgress, // ✅ ADDED (typed above)
  } = props;

  return (
    /* ✅ wrap the whole card with a touchable (same classes) */
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onOpen?.(id)}
      className="bg-white/5 border border-white/15 rounded-2xl p-4 mb-3"
    >
      {/* Title + status */}
      <View className="flex-row items-center justify-between">
        <Text className="text-white font-semibold text-base" numberOfLines={1}>
          {title}
        </Text>

        <View className="flex-row items-center">
          <View
            className={`px-2 py-1 rounded-full ${
              status === "Published" ? "bg-emerald-500/20" : "bg-yellow-500/20"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                status === "Published" ? "text-emerald-300" : "text-yellow-300"
              }`}
            >
              {status}
            </Text>
          </View>

          {/* ✅ tiny stats icon (optional, no layout disruption) */}
          {onOpenProgress && (
            <TouchableOpacity
              onPress={() => onOpenProgress(id, title)}
              className="ml-2 px-2 py-1 rounded-lg bg-white/10 border border-white/15"
              activeOpacity={0.8}
            >
              <Ionicons name="stats-chart-outline" size={14} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Meta */}
      <View className="flex-row items-center mt-2">
        <Text className="text-white/70 text-xs mr-3">{`G${gradeLevel}`}</Text>
        <Text className="text-white/70 text-xs mr-3">
          {strand === "ALL" ? "All Strands" : strand}
        </Text>
        {updatedAt ? (
          <Text className="text-white/50 text-xs">{`Updated ${updatedAt}`}</Text>
        ) : null}
      </View>

      {/* Badges */}
      <View className="flex-row items-center mt-3">
        <View className="flex-row items-center bg-white/10 px-2 py-1 rounded-lg mr-2">
          <Ionicons name="document-text-outline" size={14} color="#fff" />
          <Text className="text-white text-xs ml-1">{attachmentsCount} files</Text>
        </View>
        <View className="flex-row items-center bg-white/10 px-2 py-1 rounded-lg">
          <Ionicons name="help-circle-outline" size={14} color="#fff" />
          <Text className="text-white text-xs ml-1">
            {hasQuiz ? "Quiz included" : "No quiz"}
          </Text>
        </View>
      </View>

      {/* Assign toggle */}
      <View className="flex-row justify-end mt-4">
        <TouchableOpacity
          onPress={() => onToggleAssign?.(id, !assigned)}
          className={`px-3 py-2 rounded-xl flex-row items-center border ${
            assigned
              ? "bg-emerald-600 border-emerald-400/40"
              : "bg-white/10 border-white/15"
          }`}
        >
          <Ionicons
            name={assigned ? "checkmark-circle-outline" : "add-circle-outline"}
            size={16}
            color="#fff"
          />
          <Text className="text-white text-xs ml-2">
            {assigned ? "Assigned to class" : "Assign to class"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

/* ===========================
   ✅ Status helpers (unchanged)
   =========================== */
export async function publishModule(moduleId: string, teacherId: string) {
  await supabase
    .from("class_modules")
    .update({
      status: "PUBLISHED",
      published_at: new Date().toISOString(),
      archived_at: null,
    })
    .eq("id", moduleId)
    .eq("teacher_id", teacherId);
}

export async function unpublishModule(moduleId: string, teacherId: string) {
  await supabase
    .from("class_modules")
    .update({
      status: "DRAFT",
      // published_at: null,
    })
    .eq("id", moduleId)
    .eq("teacher_id", teacherId);
}

export async function archiveModule(moduleId: string, teacherId: string) {
  await supabase
    .from("class_modules")
    .update({
      status: "ARCHIVED",
      archived_at: new Date().toISOString(),
    })
    .eq("id", moduleId)
    .eq("teacher_id", teacherId);
}
