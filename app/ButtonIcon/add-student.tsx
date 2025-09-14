// app/ButtonIcon/add-student.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
// keep your dynamic import pattern
const { useNavigation } = require('@react-navigation/native');
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabaseClient';

/* ──────────────────────────────────────────────────────────────────────────
   Types (close to your originals)
   ────────────────────────────────────────────────────────────────────────── */
type Student = {
  id: string;                // join_request id (NOT profile id)
  name: string;
  grade: string;
  strand: string;
  status: string;            // "pending" | "approved" | "rejected"
  progress: number;          // 0 to match dashboard parity
  satisfaction: number;      // 0 to match dashboard parity
  initials: string;
  color: string;
  statusColor: string;
};

type JoinRequestRow = {
  id: string;
  teacher_id: string;
  student_id: string;
  grade_level: string | null;
  strand: string | null;
  code_entered: string | null;
  status: string;            // pending | approved | rejected
  requested_at: string | null;
};

type ProfileRow = {
  id: string;
  name: string | null;
  // NOTE: no email column in your `profiles` table
};

/* ──────────────────────────────────────────────────────────────────────────
   Helpers / UI bits (unchanged visuals)
   ────────────────────────────────────────────────────────────────────────── */
const BackgroundDecor = () => (
  <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0">
    <View className="absolute left-0 right-0 top-0 bottom-0">
      <LinearGradient colors={['#0F172A', '#1E293B', '#0F172A']} className="flex-1" start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
    </View>
    <View className="absolute top-[-60px] left-[-50px] w-40 h-40 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[100px] right-[-40px] w-[90px] h-[90px] bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-[100px] left-[50px] w-9 h-9 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute bottom-5 right-10 w-12 h-12 bg-[#a78bfa]/10 rounded-full" />
    <View className="absolute top-[200px] left-[90px] w-5 h-5 bg-[#a78bfa]/10 rounded-full" />
  </View>
);

const getStrandColor = (strand: string) => {
  switch (strand) {
    case 'ABM': return 'bg-yellow-500/20 border-yellow-500/30';
    case 'STEM': return 'bg-green-500/20 border-green-500/30';
    case 'HUMSS':
    case 'HUMMS': return 'bg-red-500/20 border-red-500/30';
    case 'TVL': return 'bg-blue-500/20 border-blue-500/30';
    case 'GAS': return 'bg-orange-500/20 border-orange-500/30';
    default: return 'bg-white/10 border-white/20';
  }
};

const initialsFrom = (s?: string | null) => {
  const src = (s || '').trim();
  if (!src) return '??';
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
};

const safeStrand = (s: string | null | undefined) => (s === 'HUMMS' ? 'HUMSS' : (s || ''));

/* ──────────────────────────────────────────────────────────────────────────
   Student card (unchanged UI)
   ────────────────────────────────────────────────────────────────────────── */
const StudentCard = ({
  student,
  onSelect,
  isSelected = false
}: {
  student: Student;
  onSelect: (id: string) => void;
  isSelected: boolean;
}) => {
  return (
    <TouchableOpacity
      onPress={() => onSelect(student.id)}
      activeOpacity={0.8}
      className={`bg-white/5 backdrop-blur-xl rounded-xl p-4 mb-3 border ${isSelected ? 'border-purple-400' : 'border-white/10'} shadow-sm`}
    >
      <View className="flex-row items-center">
        {/* checkbox */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onSelect(student.id);
          }}
          className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/40'} items-center justify-center mr-3`}
        >
          {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
        </TouchableOpacity>

        {/* name + meta */}
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 rounded-full flex items-center justify-center mr-3 bg-white/10 border border-white/20">
            <Text className="text-white font-bold text-base">{student.initials}</Text>
          </View>
          <View className="flex-1 flex-row items-center">
            <Text className="text-white font-medium text-base flex-1">{student.name}</Text>
            <View className="items-end space-y-1">
              <Text className="text-white text-sm font-medium mb-0.5">Grade {student.grade}</Text>
              <View className={`${getStrandColor(student.strand)} px-2.5 py-0.5 rounded-md border`}>
                <Text className="text-white text-xs font-medium">{student.strand}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

/* ──────────────────────────────────────────────────────────────────────────
   Main screen
   ────────────────────────────────────────────────────────────────────────── */
export default function StudentApprovalScreen() {
  const navigation = useNavigation();

  // UI state
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // caches
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const requestByIdRef = useRef<Record<string, JoinRequestRow>>({});

  // IMPORTANT: your real table name + columns
  const JOIN_TABLE = 'class_join_requests';

  /* get current user id (teacher) */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id ?? null;
      if (mounted) setTeacherId(uid);
    })();
    return () => { mounted = false; };
  }, []);

  /* map rows => Student UI */
  const mapToStudentUI = useCallback((rows: JoinRequestRow[], profiles: ProfileRow[]): Student[] => {
    const byId = new Map(profiles.map(p => [p.id, p]));
    return rows
      .filter(r => r.status === 'pending')
      .map((r) => {
        const prof = byId.get(r.student_id);
        const displayName = (prof?.name || 'Unknown Student').trim();
        return {
          id: r.id,
          name: displayName,
          grade: r.grade_level || '',
          strand: safeStrand(r.strand),
          status: r.status,
          progress: 0,
          satisfaction: 0,
          initials: initialsFrom(displayName),
          color: '#4F46E5',
          statusColor: 'text-yellow-600',
        };
      });
  }, []);

  /* fetch pending requests for this teacher */
  const fetchPending = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      // 1) join requests for this teacher
      const { data: reqs, error: reqErr } = await supabase
        .from(JOIN_TABLE)
        .select('id, teacher_id, student_id, grade_level, strand, code_entered, status, requested_at')
        .eq('teacher_id', teacherId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: true });

      if (reqErr) throw reqErr;

      const rows = (reqs || []) as JoinRequestRow[];
      requestByIdRef.current = Object.fromEntries(rows.map(r => [r.id, r]));

      if (rows.length === 0) {
        setStudents([]);
        setSelectedStudents(new Set());
        setLoading(false);
        return;
      }

      // 2) fetch minimal profiles (no email column in your table)
      const studentIds = Array.from(new Set(rows.map(r => r.student_id))).filter(Boolean);
      const { data: profs, error: profErr } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', studentIds);

      if (profErr) throw profErr;

      const ui = mapToStudentUI(rows, (profs || []) as ProfileRow[]);
      setStudents(ui);
      setSelectedStudents(new Set());
    } catch (e: any) {
      console.warn('[add-student] fetchPending error:', e);
      setStudents([]);
      setSelectedStudents(new Set());
    } finally {
      setLoading(false);
    }
  }, [teacherId, mapToStudentUI]);

  /* realtime subscription to class_join_requests */
  useEffect(() => {
    if (!teacherId) return;
    fetchPending();

    const channel = supabase
      .channel(`class_join_requests:teacher:${teacherId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: JOIN_TABLE, filter: `teacher_id=eq.${teacherId}` },
        () => fetchPending()
      )
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [teacherId, fetchPending]);

  /* selection */
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) => {
      const ns = new Set(prev);
      if (ns.has(studentId)) ns.delete(studentId);
      else ns.add(studentId);
      return ns;
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === students.length) setSelectedStudents(new Set());
    else setSelectedStudents(new Set(students.map((s) => s.id)));
  };

  /* approve / decline */
  const approveBatch = useCallback(async (ids: string[]) => {
    if (!teacherId || ids.length === 0) return;

    for (const reqId of ids) {
      const req = requestByIdRef.current[reqId];
      if (!req) continue;

      // 1) add to teacher_students (active)
      try {
        await supabase
          .from('teacher_students')
          .upsert(
            {
              teacher_id: teacherId,
              student_id: req.student_id,
              grade_level: req.grade_level,
              strand: req.strand,
              status: 'active',
            },
            { onConflict: 'teacher_id,student_id' } as any
          );
      } catch {}

      // 2) mark request as approved
      try {
        await supabase
          .from(JOIN_TABLE)
          .update({ status: 'approved' })
          .eq('id', reqId);
      } catch {}
    }

    await fetchPending();
  }, [teacherId, fetchPending]);

  const declineBatch = useCallback(async (ids: string[]) => {
    if (!teacherId || ids.length === 0) return;

    try {
      await supabase
        .from(JOIN_TABLE)
        .update({ status: 'rejected' })
        .in('id', ids);
    } catch {}
    await fetchPending();
  }, [teacherId, fetchPending]);

  const handleApproveSelected = () => {
    const ids = Array.from(selectedStudents);
    approveBatch(ids);
    setSelectedStudents(new Set());
  };

  const handleApprove = (id: string) => approveBatch([id]);
  const handleDecline = (id: string) => declineBatch([id]);

  /* derived */
  const pendingStudents = useMemo(
    () => students.filter((s) => s.status === 'pending'),
    [students]
  );

  /* render */
  return (
    <View className="flex-1 bg-[#0F172A]">
      <BackgroundDecor />

      {/* Header */}
      <View className="pt-10 pb-4 px-6">
        <View className="flex-row items-center justify-between mb-1">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#E2E8F0" />
          </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Add Students</Text>
          <View className="w-8" />
        </View>

        <Text className="text-white/60 text-sm mb-3 text-center">
          {loading ? 'Loading…' : `${pendingStudents.length} pending student${pendingStudents.length === 1 ? '' : 's'}`}
        </Text>

        {/* Selection Actions */}
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={toggleSelectAll} className="flex-row items-center">
            <View
              className={`w-5 h-5 rounded border-2 ${
                selectedStudents.size === students.length && students.length > 0
                  ? 'bg-purple-500 border-purple-500'
                  : 'border-white/40'
              } items-center justify-center mr-2`}
            >
              {selectedStudents.size === students.length && students.length > 0 && (
                <Ionicons name="checkmark" size={14} color="white" />
              )}
            </View>
            <Text className="text-white/80 text-sm">Select All</Text>
          </TouchableOpacity>

          {selectedStudents.size > 0 && (
            <TouchableOpacity
              onPress={handleApproveSelected}
              className="bg-purple-600 px-4 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="person-add" size={16} color="white" />
              <Text className="text-white font-medium ml-2">
                Add Selected ({selectedStudents.size})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <ScrollView className="flex-1 px-4" testID="student-list" indicatorStyle="black">
        {(!loading && pendingStudents.length === 0) ? (
          <View className="bg-white/5 rounded-lg p-4 my-4 items-center justify-center">
            <Ionicons name="people-outline" size={32} color="#64748B" />
            <Text className="text-white/60 text-center mt-2">No pending students to display</Text>
          </View>
        ) : (
          pendingStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              isSelected={selectedStudents.has(student.id)}
              onSelect={toggleStudentSelection}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
