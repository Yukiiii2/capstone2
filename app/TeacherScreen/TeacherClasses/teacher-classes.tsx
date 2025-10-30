import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import NavigationBar from "@/components/NavigationBar/nav-bar-teacher";
import ProfileMenuTeacher from "@/components/ProfileModal/ProfileMenuTeacher";
import { supabase } from "@/lib/supabaseClient";

/* ─────────────────────────────────────────
   Helpers
   ───────────────────────────────────────── */
const TRANSPARENT_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

async function resolveSignedAvatar(userId: string, storedPath?: string | null) {
  const stored = (storedPath ?? userId).toString();
  const normalized = stored.replace(/^avatars\//, "");
  let objectPath: string | null = null;

  if (/\.[a-zA-Z0-9]+$/.test(normalized)) {
    objectPath = normalized;
  } else {
    const { data: listed, error } = await supabase.storage
      .from("avatars")
      .list(normalized, {
        sortBy: { column: "created_at", order: "desc" },
        limit: 1,
      });
    if (error) return null;
    if (listed && listed.length > 0) {
      objectPath = `${normalized}/${listed[0].name}`;
    }
  }

  if (!objectPath) return null;
  const signedRes = await supabase.storage
    .from("avatars")
    .createSignedUrl(objectPath, 60 * 60);
  if (signedRes.error) return null;
  return signedRes.data?.signedUrl ?? null;
}

const initialsFrom = (name?: string | null) => {
  const n = (name || "").trim();
  if (!n) return "??";
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
};

/* ─────────────────────────────────────────
   Types
   ───────────────────────────────────────── */
type ClassInfo = {
  id: string;
  className: string;
  gradeLevel: string;
  strand: string;
  code: string;
  studentCount: number;
  description: string; // can be ""
  isArchived?: boolean;
};

/* ─────────────────────────────────────────
   BackgroundDecor
   ───────────────────────────────────────── */
const BackgroundDecor = () => (
  <View className="absolute left-0 right-0 top-0 bottom-0">
    <LinearGradient
      colors={["#0F172A", "#1E293B", "#0F172A"]}
      className="flex-1"
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
  </View>
);

/* ─────────────────────────────────────────
   ClassCard
   ───────────────────────────────────────── */
const ClassCard = ({
  classInfo,
  onEdit,
  onOpen,
  onArchiveToggle,
}: {
  classInfo: ClassInfo;
  onEdit: (cls: ClassInfo) => void;
  onOpen: (cls: ClassInfo) => void;
  onArchiveToggle: (cls: ClassInfo) => void;
}) => {
  const hasDesc = !!classInfo.description?.trim();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onOpen(classInfo)}
      className="w-full"
    >
      {/* Positioning context for absolutely positioned children */}
      <View className="relative bg-white/5 backdrop-blur-lg border border-white/30 rounded-2xl p-6 mb-4 w-full shadow-lg shadow-violet-900/20">
        {/* Archive icon (unchanged) */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onArchiveToggle(classInfo);
          }}
          accessibilityLabel={classInfo.isArchived ? "Unarchive class" : "Archive class"}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full items-center justify-center border
            ${classInfo.isArchived ? "bg-white/5 border-white/20" : "bg-white/10 border-white/20"}`}
          activeOpacity={0.75}
        >
          <Ionicons
            name={classInfo.isArchived ? "archive-outline" : "archive"}
            size={16}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Class code chip — aligned under the icon (only this moved) */}
        {!!classInfo.code && (
          <View className="absolute right-3 top-12 bg-violet-500/10 px-3 py-1.5 rounded-full">
            <Text className="text-violet-300 text-xs font-medium">
              {classInfo.code}
            </Text>
          </View>
        )}

        {/* Top row: Grade / Strand */}
        <View className="mb-4">
          <Text className="text-violet-300 font-bold text-xs tracking-wider uppercase mb-1 -mt-2">
            {`GRADE ${classInfo.gradeLevel} • ${classInfo.strand}${classInfo.isArchived ? " • ARCHIVED" : ""}`}
          </Text>

          <View className="flex-row items-start justify-between pr-10">
            <View className="flex-1 pr-3">
              <Text className="text-white font-bold text-lg">
                {classInfo.className}
              </Text>
              <Text className="text-white/60 text-xs mt-1">
                {classInfo.studentCount} students enrolled
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {hasDesc && (
          <Text className="text-white/80 text-sm leading-6 mb-5">
            {classInfo.description}
          </Text>
        )}

        {/* Actions */}
        <View className="flex-row w-full">
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEdit(classInfo);
            }}
            className="flex-1 py-3.5 rounded-xl bg-white/10 active:bg-white/20 border border-white/20 mr-2"
            activeOpacity={0.7}
          >
            <Text className="font-semibold text-center text-base text-white">
              Edit Class
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onOpen(classInfo);
            }}
            className="flex-1 py-3.5 rounded-xl bg-violet-500/90 active:bg-violet-500/80 border border-violet-400/30 ml-2"
            activeOpacity={0.7}
          >
            <Text className="font-semibold text-center text-base text-white">
              Manage Class
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/* ─────────────────────────────────────────
   Header
   ───────────────────────────────────────── */
const Header = ({
  user,
  isProfileMenuVisible,
  setIsProfileMenuVisible,
  onPressPostModule,
  onPressAddStudent,
}: {
  user: { name: string; email: string; image: { uri: string } };
  isProfileMenuVisible: boolean;
  setIsProfileMenuVisible: (v: boolean) => void;
  onPressPostModule: () => void;
  onPressAddStudent: () => void;
}) => {
  return (
    <View className="flex-row justify-between items-center mt-4 mb-3 w-full">
      <View className="flex-row items-center">
        <Image
          source={require("../../../assets/Speaksy.png")}
          className="w-12 h-12 rounded-full right-2"
          resizeMode="contain"
        />
        <Text className="text-white font-bold text-2xl ml-2 -left-5">
          Voclaria
        </Text>
      </View>

      <View className="flex-row items-center right-2">
        <TouchableOpacity
          activeOpacity={0.7}
          className="p-2 bg-white/10 rounded-full mr-4"
          onPress={onPressPostModule}
        >
          <Image
            source={require("../../../assets/Modules.png")}
            className="w-5 h-5"
            resizeMode="contain"
            tintColor="white"
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          className="p-2 bg-white/10 rounded-full mr-4"
          onPress={onPressAddStudent}
        >
          <Image
            source={require("../../../assets/add-student.png")}
            className="w-5 h-5"
            resizeMode="contain"
            tintColor="white"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsProfileMenuVisible(!isProfileMenuVisible)}
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          {user?.image?.uri && user.image.uri !== TRANSPARENT_PNG ? (
            <Image
              source={user.image}
              className="w-8 h-8 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(167,139,250,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>
                {initialsFrom(user.name)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {isProfileMenuVisible && (
          <ProfileMenuTeacher
            user={user}
            visible={isProfileMenuVisible}
            onDismiss={() => setIsProfileMenuVisible(false)}
          />
        )}
      </View>
    </View>
  );
};

/* ─────────────────────────────────────────
   Screen component
   ───────────────────────────────────────── */
export default function TeacherClasses() {
  const router = useRouter();

  const [isProfileMenuVisible, setIsProfileMenuVisible] = useState(false);
  const [fullName, setFullName] = useState<string>("Teacher");
  const [email, setEmail] = useState<string>("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const user = useMemo(
    () => ({
      name: fullName || "Teacher Name",
      email: email || "teacher@example.com",
      image: { uri: avatarUri || TRANSPARENT_PNG },
    }),
    [fullName, email, avatarUri]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid || !mounted) return;

      setEmail(auth?.user?.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", uid)
        .single();

      const name = (
        profile?.name ??
        auth?.user?.user_metadata?.full_name ??
        auth?.user?.email ??
        "Teacher"
      )
        .toString()
        .trim();

      if (!mounted) return;
      setFullName(name);

      const signed = await resolveSignedAvatar(
        uid,
        profile?.avatar_url?.toString()
      );
      if (!mounted) return;
      setAvatarUri(signed);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const loadClasses = React.useCallback(async () => {
  const { data: auth } = await supabase.auth.getUser();
  const teacherId = auth?.user?.id;
  if (!teacherId) {
    setClasses([]);
    return;
  }

  // 1) get classes owned by this teacher
  const { data: clsRows, error: clsErr } = await supabase
    .from("classes")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (clsErr) {
    console.warn("[TeacherClasses] loadClasses error:", clsErr);
    setClasses([]);
    return;
  }

  const classIds = (clsRows ?? []).map((c: any) => c.id).filter(Boolean);

  // 2) pull enrollments for these classes and count active ones
  let countsByClass: Record<string, number> = {};
  if (classIds.length > 0) {
    const { data: enrRows, error: enrErr } = await supabase
      .from("class_enrollments")
      .select("class_id, status")
      .in("class_id", classIds)
      .eq("status", "active");

    if (!enrErr && Array.isArray(enrRows)) {
      for (const r of enrRows) {
        const k = r.class_id as string;
        countsByClass[k] = (countsByClass[k] ?? 0) + 1;
      }
    }
  }

  // 3) map to your view model (prefer computed counts)
  const mapped: ClassInfo[] = (clsRows ?? []).map((c: any) => ({
    id: c.id,
    className: c.class_name ?? c.name ?? c.title ?? "(Untitled Class)",
    gradeLevel: String(c.grade_level ?? c.grade ?? ""),
    strand: c.strand ?? "ALL",
    code: c.class_code ?? c.code ?? "",
    description: c.description ?? "",
    studentCount:
      typeof countsByClass[c.id] === "number"
        ? countsByClass[c.id]
        : typeof c.student_count === "number"
        ? c.student_count
        : Array.isArray(c.students)
        ? c.students.length
        : 0,
    isArchived:
      Boolean(c.archived) ||
      String(c.status ?? "").toLowerCase() === "archived" ||
      Boolean(c.archived_at),
  }));

  setClasses(mapped);
}, []);


  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useFocusEffect(
    React.useCallback(() => {
      loadClasses();
    }, [loadClasses])
  );

  useEffect(() => {
  let mounted = true;
  (async () => {
    const { data: auth } = await supabase.auth.getUser();
    const teacherId = auth?.user?.id;
    if (!teacherId || !mounted) return;

    const enrollChan = supabase
      .channel("class-enrollments-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "class_enrollments" },
        () => {
          // Any insert/update/delete in enrollments → refresh counts
          loadClasses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(enrollChan);
    };
  })();

  return () => {
    mounted = false;
  };
}, [loadClasses]);


  const handleCreateClass = () => {
    router.push("/TeacherScreen/TeacherClasses/create-class");
  };

  const handleEditClass = (cls: ClassInfo) => {
    router.push(
      `/TeacherScreen/TeacherClasses/edit-class?id=${encodeURIComponent(cls.id)}`
    );
  };

  const handleOpenClass = (cls: ClassInfo) => {
    const q = new URLSearchParams({
      classId: cls.id,
      className: cls.className,
      code: cls.code,
      grade: cls.gradeLevel,
      strand: cls.strand,
    }).toString();
    router.push(`/TeacherScreen/TeacherClasses/class-module-row?${q}`);
  };

  const handleArchiveToggle = async (cls: ClassInfo) => {
    const action = cls.isArchived ? "Unarchive" : "Archive";
    Alert.alert(
      `${action} Class`,
      cls.isArchived
        ? "This class will be restored to Active."
        : "This class will be moved to Archived. Students will no longer see it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action,
          style: "destructive",
          onPress: async () => {
            const patch: any = {};
            if (cls.isArchived) {
              patch.archived = false;
              patch.status = "active";
              patch.archived_at = null;
            } else {
              patch.archived = true;
              patch.status = "archived";
              patch.archived_at = new Date().toISOString();
            }

            const tryUpdate = async (payload: any) =>
              supabase.from("classes").update(payload).eq("id", cls.id);

            let { error } = await tryUpdate(patch);
            if (error) {
              const { status, ...noStatus } = patch;
              ({ error } = await tryUpdate(noStatus));
              if (error) {
                const minimal =
                  "archived" in patch ? { archived: patch.archived } : {};
                ({ error } = await tryUpdate(minimal));
                if (error) {
                  const { archived_at } = patch;
                  ({ error } = await tryUpdate({ archived_at }));
                }
              }
            }

            if (error) {
              console.warn("[TeacherClasses] archive toggle error:", error);
              Alert.alert("Error", "Could not update archive status.");
              return;
            }

            loadClasses();
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-[#0F172A] relative">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <BackgroundDecor />

      <ScrollView
        className="flex-1 p-5 z-10"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 40,
          paddingTop: StatusBar.currentHeight,
        }}
      >
        <Header
          user={user}
          isProfileMenuVisible={isProfileMenuVisible}
          setIsProfileMenuVisible={setIsProfileMenuVisible}
          onPressPostModule={() => router.push("/ButtonIcon/post-module")}
          onPressAddStudent={() => router.push("/ButtonIcon/add-student")}
        />

        {/* Title + Archived toggle */}
        <View className="mb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-white">Your Classes</Text>
            <Text className="text-gray-400 text-xs mt-1">
              Create, edit, and manage each class.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowArchived((s) => !s)}
            activeOpacity={0.85}
            className="px-3 py-2 rounded-xl bg-white/10 border border-white/20"
          >
            <View className="flex-row items-center">
              <Ionicons
                name="archive-outline"
                size={16}
                color="#FFFFFF"
              />
              <Text className="text-white text-xs font-medium ml-1.5">
                {showArchived ? "View Active" : "View Archived"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Create button */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={handleCreateClass}
            activeOpacity={0.9}
            className="py-4 rounded-xl bg-violet-600 border border-violet-400/30 flex-row items-center justify-center"
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text className="text-white font-semibold text-base ml-2">
              Create New Class
            </Text>
          </TouchableOpacity>
        </View>

        <View className="w-full">
          <Text className="text-white text-xl font-bold mb-4">
            {showArchived ? "Archived Classes" : "Class Sections"}
          </Text>

          {(classes || [])
            .filter((c) => (showArchived ? c.isArchived : !c.isArchived))
            .map((cls) => (
              <ClassCard
                key={cls.id}
                classInfo={cls}
                onEdit={handleEditClass}
                onOpen={handleOpenClass}
                onArchiveToggle={handleArchiveToggle}
              />
            ))}

          {classes.filter((c) => (showArchived ? c.isArchived : !c.isArchived)).length === 0 && (
            <Text className="text-white/60 text-sm">
              {showArchived ? "No archived classes yet." : "No classes yet."}
            </Text>
          )}
        </View>
      </ScrollView>

      <NavigationBar defaultActiveTab="Classes" />
    </View>
  );
}
