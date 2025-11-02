// app/TeacherScreen/TeacherClasses/index.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
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

const initialsFrom = (name?: string | null, email?: string | null) => {
  const base = (name && name.trim()) || (email && email.split("@")[0]) || "";
  if (!base) return "??";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
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

type EnrolledStudent = {
  id: string;          // student id
  name: string | null;
  email: string | null;
  avatar_url?: string | null;
  signed?: string | null; // resolved signed URL
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
   ClassCard (NEW: "view students" icon at right-12)
   ───────────────────────────────────────── */
const ClassCard = ({
  classInfo,
  onEdit,
  onOpen,
  onArchiveToggle,
  onViewStudents,
}: {
  classInfo: ClassInfo;
  onEdit: (cls: ClassInfo) => void;
  onOpen: (cls: ClassInfo) => void;
  onArchiveToggle: (cls: ClassInfo) => void;
  onViewStudents: (cls: ClassInfo) => void;
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
        {/* NEW: View students icon (left of archive) */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onViewStudents(classInfo);
          }}
          accessibilityLabel="View enrolled students"
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          className="absolute top-3 right-12 w-8 h-8 rounded-full items-center justify-center bg-white/10 border border-white/20"
          activeOpacity={0.75}
        >
          <Ionicons name="people-outline" size={16} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Archive icon (unchanged position at right-3) */}
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

        {/* Class code chip — aligned under the icon (kept) */}
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
                {initialsFrom(user.name, user.email)}
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

  // NEW: Students modal state
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);

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

    // 3) map to view model
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
            // Also refresh modal list if open
            if (selectedClass) {
              fetchStudents(selectedClass.id);
            }
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
  }, [loadClasses, selectedClass]);

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

  // NEW: fetch students for class & open modal
  const fetchStudents = React.useCallback(async (classId: string) => {
    setStudentsLoading(true);
    try {
      // 1) active enrollments for the class
      const { data: enr, error: enrErr } = await supabase
        .from("class_enrollments")
        .select("student_id, status, joined_at")
        .eq("class_id", classId)
        .eq("status", "active");

      if (enrErr || !Array.isArray(enr) || enr.length === 0) {
        setStudents([]);
        return;
      }

      const ids = Array.from(new Set(enr.map((e: any) => e.student_id).filter(Boolean)));
      if (ids.length === 0) {
        setStudents([]);
        return;
      }

      // 2) fetch matching profiles (may be empty for some students)
      let profs: any[] = [];
      const { data: profRows, error: pErr } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, email")
        .in("id", ids);

      if (!pErr && Array.isArray(profRows)) {
        profs = profRows;
      }

      const pmap = new Map(profs.map((p) => [p.id, p]));

      // 3) Build result for EVERY enrolled id (even without profile)
      const resolved: EnrolledStudent[] = await Promise.all(
        ids.map(async (sid) => {
          const p = pmap.get(sid);
          const signed =
            p?.avatar_url ? await resolveSignedAvatar(sid, p.avatar_url?.toString()) : null;
          return {
            id: sid,
            name: (p?.name ?? null) as string | null,
            email: (p?.email ?? null) as string | null,
            avatar_url: (p?.avatar_url ?? null) as string | null,
            signed: signed ?? null,
          };
        })
      );

      // sort by name (fallback to email)
      resolved.sort((a, b) => {
        const an = (a.name || a.email || "").toLowerCase();
        const bn = (b.name || b.email || "").toLowerCase();
        return an.localeCompare(bn);
      });

      setStudents(resolved);
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  const handleViewStudents = (cls: ClassInfo) => {
    setSelectedClass(cls);
    setShowStudentsModal(true);
    fetchStudents(cls.id);
  };

  const closeStudentsModal = () => {
    setShowStudentsModal(false);
    setSelectedClass(null);
    setStudents([]);
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
                onViewStudents={handleViewStudents}
              />
            ))}

          {classes.filter((c) => (showArchived ? c.isArchived : !c.isArchived)).length === 0 && (
            <Text className="text-white/60 text-sm">
              {showArchived ? "No archived classes yet." : "No classes yet."}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* NEW: Enrolled Students Modal */}
      <Modal
        visible={showStudentsModal}
        animationType="slide"
        onRequestClose={closeStudentsModal}
        transparent={true}
      >
        <View className="flex-1 bg-black/50">
          <View className="mt-20 mx-4 bg-[#0F172A] border border-white/10 rounded-2xl overflow-hidden">
            <View className="px-4 py-3 flex-row items-center justify-between border-b border-white/10">
              <Text className="text-white font-bold text-lg">
                {selectedClass ? `${selectedClass.className}` : "Class"} • Students
              </Text>
              <TouchableOpacity
                onPress={closeStudentsModal}
                className="bg-white/10 rounded-full p-2"
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <View className="px-4 py-2 border-b border-white/10">
              <Text className="text-white/80 text-xs">
                {studentsLoading
                  ? "Loading enrolled students…"
                  : `${students.length} active enrollee${students.length === 1 ? "" : "s"}`}
              </Text>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              {studentsLoading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" />
                </View>
              ) : students.length === 0 ? (
                <View className="py-8 items-center">
                  <Ionicons name="people-outline" size={28} color="#a78bfa" />
                  <Text className="text-white/80 mt-2 text-sm">No active students enrolled.</Text>
                </View>
              ) : (
                <View className="py-2">
                  {students.map((s) => {
                    const signed = s.signed;
                    const initials = initialsFrom(s.name, s.email);
                    return (
                      <View
                        key={s.id}
                        className="flex-row items-center px-4 py-3 border-b border-white/10"
                      >
                        {signed ? (
                          <Image
                            source={{ uri: signed }}
                            className="w-8 h-8 rounded-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-8 h-8 rounded-full bg-white/15 border border-white/20 items-center justify-center">
                            <Text className="text-white font-semibold text-xs">{initials}</Text>
                          </View>
                        )}
                        <View className="ml-3 flex-1">
                          <Text className="text-white text-sm font-medium">
                            {s.name || "(No name)"}
                          </Text>
                          {!!s.email && (
                            <Text className="text-white/60 text-xs">{s.email}</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View className="px-4 py-3">
              <TouchableOpacity
                onPress={closeStudentsModal}
                className="py-3 rounded-xl bg-white/10 border border-white/20"
                activeOpacity={0.8}
              >
                <Text className="text-white text-center font-medium">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <NavigationBar defaultActiveTab="Classes" />
    </View>
  );
}
