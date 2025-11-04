import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  StyleSheet,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'expo-router';

// ──────────────────────────────────────
// Table names in your project
const CLASSES_TABLE = 'classes';
const JOIN_TABLE = 'class_join_requests';
const PROFILE_TABLE = 'profiles';
// ──────────────────────────────────────

interface JoinClassModalProps {
  visible: boolean;
  onClose: () => void;
  // Fired ONLY when teacher approved (not on submit).
  onJoinClass?: (data: { classCode: string; gradeLevel: string; strand: string }) => void;
}

type GradeLevel = '11' | '12' | '';
type Strand = 'STEM' | 'ABM' | 'GAS' | 'HUMMS' | 'TVL' | '';

// ──────────────────────────────────────
// Small inline “Pending” watcher modal
// ──────────────────────────────────────
function JoinPendingModal({
  visible,
  onClose,
  teacherId,
  code,
  onApproved,
}: {
  visible: boolean;
  onClose: () => void;
  teacherId: string | null;
  code: string | null;
  onApproved: (approvedCode: string) => void;
}) {
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<'pending' | 'approved' | 'denied'>('pending');

  // resolve teacher name (optional)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!teacherId || !visible) return;
      const { data } = await supabase
        .from(PROFILE_TABLE)
        .select('name')
        .eq('id', teacherId)
        .maybeSingle();
      if (!cancelled) setTeacherName(data?.name || null);
    })();
  }, [teacherId, visible]);

  // realtime watch for approval/denial of the most recent request for this code
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let mounted = true;

    (async () => {
      if (!visible || !code) return;
      const { data: auth } = await supabase.auth.getUser();
      const studentId = auth?.user?.id;
      if (!studentId) return;

      // find latest request for this student + code
      const { data: latest } = await supabase
        .from(JOIN_TABLE)
        .select('id,status,code_entered')
        .eq('student_id', studentId)
        .eq('code_entered', code)
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const watchedId = latest?.id;

      channel = supabase
        .channel(`class-join-pending-${studentId}-${code}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: JOIN_TABLE,
            filter: watchedId ? `id=eq.${watchedId}` : `student_id=eq.${studentId}`,
          },
          (payload: any) => {
            if (!mounted) return;
            const row = payload?.new || payload?.old;
            if (!row || row.code_entered !== code) return;

            const status = (row.status as 'pending' | 'approved' | 'denied') ?? 'pending';
            setRequestStatus(status);

            if (status === 'approved') {
              setTimeout(() => onApproved(code), 300);
            }
            if (status === 'denied') {
              Alert.alert('Request Denied', 'Your join request was denied by the teacher.');
              onClose();
            }
          }
        )
        .subscribe();
    })();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [visible, code, onApproved, onClose]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback>
        <View className="flex-1 bg-black/60 items-center justify-center p-6">
          <View className="bg-[#1A1F2E]/95 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <View className="items-center mb-4">
              <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center mb-2">
                {requestStatus === 'pending' ? (
                  <ActivityIndicator />
                ) : (
                  <Ionicons
                    name={requestStatus === 'approved' ? 'checkmark-circle' : 'close-circle'}
                    size={26}
                    color={requestStatus === 'approved' ? '#10B981' : '#EF4444'}
                  />
                )}
              </View>
              <Text className="text-white text-lg font-semibold">
                {requestStatus === 'pending' ? 'Waiting for Approval' : requestStatus === 'approved' ? 'Approved' : 'Denied'}
              </Text>
              <Text className="text-white/70 text-sm mt-1 text-center">
                {requestStatus === 'pending'
                  ? `Your request to join ${teacherName ? teacherName + "'s" : 'the'} class is pending.`
                  : requestStatus === 'approved'
                  ? 'You can now access the class progress view.'
                  : 'Please contact your teacher if you think this is a mistake.'}
              </Text>
              {!!code && (
                <Text className="text-white/60 text-xs mt-2">Class Code: <Text className="text-white font-semibold">{code}</Text></Text>
              )}
            </View>

            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 bg-white/10 border border-white/15 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-medium">
                  {requestStatus === 'approved' ? 'Close' : 'Hide'}
                </Text>
              </TouchableOpacity>
              {requestStatus === 'approved' && (
                <TouchableOpacity
                  onPress={() => code && onApproved(code)}
                  className="flex-1 bg-violet-600 rounded-xl py-3 items-center"
                >
                  <Text className="text-white font-semibold">Go to Class</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ──────────────────────────────────────

const JoinClassModal: React.FC<JoinClassModalProps> = ({ visible, onClose, onJoinClass }) => {
  const router = useRouter();

  const [classCode, setClassCode] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('');
  const [strand, setStrand] = useState<Strand>('');
  const [showGradeError, setShowGradeError] = useState(false);
  const [showStrandError, setShowStrandError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showStrandDropdown, setShowStrandDropdown] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // pending watcher state
  const [pending, setPending] = useState<{ open: boolean; teacherId: string | null; code: string | null; classId?: string | null; gradeLevel?: GradeLevel; strand?: 'STEM'|'ABM'|'GAS'|'HUMSS'|'TVL'; }>({
    open: false,
    teacherId: null,
    code: null,
    classId: null,
    gradeLevel: undefined,
    strand: undefined,
  });

  const normalizedStrand = strand === 'HUMMS' ? 'HUMSS' : strand;

  const gradeLevels = [
    { label: 'Grade 11', value: '11' },
    { label: 'Grade 12', value: '12' },
  ];

  const strands = [
    { label: 'STEM', value: 'STEM' },
    { label: 'ABM', value: 'ABM' },
    { label: 'GAS', value: 'GAS' },
    { label: 'HUMMS', value: 'HUMMS' },
    { label: 'TVL', value: 'TVL' },
  ];

  // ⬇️ When the modal opens: if there is ALREADY a pending request, skip form and show Pending
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!visible) return;
      const { data: auth } = await supabase.auth.getUser();
      const studentId = auth?.user?.id;
      if (!studentId) return;

      // latest pending for this student (any teacher/code), if any
      const { data: pendingRow } = await supabase
        .from(JOIN_TABLE)
        .select('teacher_id, code_entered, status, class_id, grade_level, strand')
        .eq('student_id', studentId)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (pendingRow?.status === 'pending') {
        // Close the form and show the pending watcher immediately
        onClose();
        setPending({
          open: true,
          teacherId: pendingRow.teacher_id as string,
          code: pendingRow.code_entered as string,
          classId: pendingRow.class_id as string,
          gradeLevel: (pendingRow.grade_level as GradeLevel) ?? undefined,
          strand: ((pendingRow.strand === 'HUMMS' ? 'HUMSS' : pendingRow.strand) as any) ?? undefined,
        });
      }
    })();
    return () => { cancelled = true; };
  }, [visible, onClose]);

  const toggleGradeDropdown = () => {
    if (showStrandDropdown) setShowStrandDropdown(false);
    setShowGradeDropdown(!showGradeDropdown);
  };

  const toggleStrandDropdown = () => {
    if (!gradeLevel) return;
    if (showGradeDropdown) setShowGradeDropdown(false);
    setShowStrandDropdown(!showStrandDropdown);
  };

  const selectGrade = (value: GradeLevel) => {
    setGradeLevel(value);
    setShowGradeError(false);
    setShowGradeDropdown(false);
    setStrand('');
  };

  const selectStrand = (value: Strand) => {
    setStrand(value);
    setShowStrandError(false);
    setShowStrandDropdown(false);
  };

  const resetForm = () => {
    setClassCode('');
    setGradeLevel('');
    setStrand('');
    setShowGradeError(false);
    setShowStrandError(false);
    setShowGradeDropdown(false);
    setShowStrandDropdown(false);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const isFormValid = classCode.trim().length > 0 && gradeLevel && strand;

  // ─────────────────────────────────────────────
  // NEW: After approval, recreate membership rows
  // ─────────────────────────────────────────────
  const finalizeEnrollmentAfterApproval = async (opts: {
    teacherId: string | null | undefined;
    classId: string | null | undefined;
    gradeLevel?: GradeLevel;
    strand?: 'STEM'|'ABM'|'GAS'|'HUMSS'|'TVL';
  }) => {
    const { teacherId, classId, gradeLevel: g, strand: s } = opts;
    if (!teacherId || !classId) return;

    const { data: auth } = await supabase.auth.getUser();
    const studentId = auth?.user?.id;
    if (!studentId) return;

    const now = new Date().toISOString();

    // 1) teacher_students upsert (status back to 'active')
    const { error: tsErr } = await supabase
      .from('teacher_students')
      .upsert(
        {
          teacher_id: teacherId,
          student_id: studentId,
          grade_level: g ?? null,
          strand: (s === 'HUMMS' ? 'HUMSS' : s) ?? null,
          status: 'active',
          joined_at: now,
        } as any,
        { onConflict: 'teacher_id,student_id', ignoreDuplicates: false }
      );
    if (tsErr) throw tsErr;

    // 2) class_enrollments upsert (status back to 'active')
    const { error: ceErr } = await supabase
      .from('class_enrollments')
      .upsert(
        {
          class_id: classId,
          student_id: studentId,
          role: 'student',
          status: 'active',
          joined_at: now,
        } as any,
        { onConflict: 'class_id,student_id', ignoreDuplicates: false }
      );
    if (ceErr) throw ceErr;
  };

  const handleJoin = async () => {
    let ok = true;
    if (!gradeLevel) { setShowGradeError(true); ok = false; }
    if (!strand) { setShowStrandError(true); ok = false; }
    if (!classCode.trim()) ok = false;
    if (!ok) return;

    try {
      setIsSubmitting(true);

      const code = classCode.trim().toUpperCase();
      const canonicalStrand = (strand === 'HUMMS' ? 'HUMSS' : strand) as 'STEM'|'ABM'|'GAS'|'HUMSS'|'TVL';

      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr || !auth?.user?.id) {
        Alert.alert('Not signed in', 'Please sign in first.');
        return;
      }
      const studentId = auth.user.id;

      // 1) resolve class by code (from classes)
      const { data: klass, error: classErr } = await supabase
        .from(CLASSES_TABLE)
        .select('id, teacher_id, class_code')
        .eq('class_code', code)
        .maybeSingle();

      if (classErr) {
        Alert.alert('Error', 'Could not verify class code.');
        return;
      }
      if (!klass?.teacher_id) {
        Alert.alert('Invalid code', 'No class was found for that code.');
        return;
      }
      const teacherId = klass.teacher_id as string;
      const classId = klass.id as string;

      // 2) check the LATEST request (so "removed/denied" students can re-join)
      const { data: lastReq } = await supabase
        .from(JOIN_TABLE)
        .select('id,status,code_entered,class_id')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastReq?.status === 'pending') {
        // open watcher instead of blocking; DO NOT mark joined
        setPending({ open: true, teacherId, code, classId, gradeLevel, strand: canonicalStrand });
        resetForm();
        onClose();
        return;
      }

      if (lastReq?.status === 'approved') {
        Alert.alert('Already joined', 'You are already in this class.');
        return;
      }

      // 3) insert NEW pending request when status is 'denied' (or no record)
      const { error: insErr } = await supabase
        .from(JOIN_TABLE)
        .insert({
          class_id: classId,
          teacher_id: teacherId,
          student_id: studentId,
          grade_level: gradeLevel,
          strand: normalizedStrand,
          code_entered: code,
          status: 'pending',
        });

      if (insErr) {
        Alert.alert('Error', insErr.message || 'Could not send join request.');
        return;
      }

      // DO NOT call onJoinClass here (no state change yet).
      resetForm();
      onClose();
      setPending({ open: true, teacherId, code, classId, gradeLevel, strand: canonicalStrand });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-[#1A1F2E]/95 backdrop-blur-xl rounded-t-3xl p-6 max-h=[80%] border-t border-white/10">
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-white text-2xl font-bold">Join a Class</Text>
                  <TouchableOpacity onPress={onClose} className="p-1">
                    <Ionicons name="close" size={24} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text className="text-slate-400 text-base mb-6">
                    Please select your grade level and strand, then enter the class code provided by your teacher.
                  </Text>

                  {/* Grade Level */}
                  <View className="mb-4 relative">
                    <Text className="text-white text-base font-medium mb-2">Grade Level</Text>
                    <TouchableOpacity
                      className="bg-white/5 rounded-xl p-4 border border-white/10 flex-row justify-between items-center"
                      onPress={toggleGradeDropdown}
                      activeOpacity={0.7}
                    >
                      <Text className={`${gradeLevel ? 'text-white' : 'text-gray-400'}`}>
                        {gradeLevel ? `Grade ${gradeLevel}` : 'Select Grade Level'}
                      </Text>
                      <Ionicons name={showGradeDropdown ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
                    </TouchableOpacity>
                    {showGradeError && <Text className="text-red-400 text-xs mt-1">Please select your grade level</Text>}

                    {showGradeDropdown && (
                      <View className="absolute z-10 w-full mt-1 bg-[#1A1F2E] border border-white/10 rounded-xl overflow-hidden top-full">
                        {gradeLevels.map((item) => (
                          <TouchableOpacity
                            key={item.value}
                            className={`px-4 py-3 ${gradeLevel === item.value ? 'bg-blue-500/20' : ''}`}
                            onPress={() => selectGrade(item.value as GradeLevel)}
                          >
                            <Text className="text-white">{item.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Strand */}
                  <View className="mb-6 relative">
                    <Text className="text-white text-base font-medium mb-2">Strand</Text>
                    <TouchableOpacity
                      className={`${!gradeLevel ? 'opacity-50' : ''} bg-white/5 rounded-xl p-4 border ${
                        !gradeLevel ? 'border-white/5' : 'border-white/10'
                      } flex-row justify-between items-center`}
                      onPress={toggleStrandDropdown}
                      activeOpacity={0.7}
                      disabled={!gradeLevel}
                    >
                      <Text className={`${strand ? 'text-white' : 'text-gray-400'}`}>
                        {strand || (gradeLevel ? 'Select Strand' : 'Select Grade Level First')}
                      </Text>
                      <Ionicons
                        name={showStrandDropdown ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={!gradeLevel ? '#4B5563' : '#94A3B8'}
                      />
                    </TouchableOpacity>
                    {showStrandError && <Text className="text-red-400 text-xs mt-1">Please select your strand</Text>}

                    {showStrandDropdown && (
                      <View className="absolute z-10 w-full mt-1 bg-[#1A1F2E] border border-white/10 rounded-xl overflow-hidden top-full">
                        {strands.map((item) => (
                          <TouchableOpacity
                            key={item.value}
                            className={`px-4 py-3 ${strand === item.value ? 'bg-blue-500/20' : ''}`}
                            onPress={() => selectStrand(item.value as Strand)}
                          >
                            <Text className="text-white">{item.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Class Code */}
                  <View className="mb-6">
                    <Text className="text-white text-base font-medium mb-2">Class Code</Text>
                    <TextInput
                      className="bg-white/5 text-white rounded-xl p-4 border border-white/10 text-base"
                      placeholder="Enter class code"
                      placeholderTextColor="#94A3B8"
                      value={classCode}
                      onChangeText={(t) => setClassCode(t.toUpperCase())}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!!gradeLevel && !!strand}
                      style={!gradeLevel || !strand ? { opacity: 0.5 } : {}}
                    />
                    {(!gradeLevel || !strand) && (
                      <Text className="text-amber-400 text-xs mt-1">Please select both grade level and strand first</Text>
                    )}
                  </View>

                  {/* Actions */}
                  <View className="flex-row gap-3 mt-4">
                    <TouchableOpacity
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl py-4 items-center justify-center active:bg-white/10"
                      onPress={handleCancel}
                      disabled={isSubmitting}
                    >
                      <Text className="text-white font-semibold text-base">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`flex-1 rounded-xl py-4 items-center justify-center border ${
                        isFormValid ? 'bg-violet-600 border-violet-600 active:bg-violet-700' : 'bg-violet-600/50 border-violet-600/50'
                      }`}
                      onPress={handleJoin}
                      disabled={!isFormValid || isSubmitting}
                    >
                      <Text className="text-white font-semibold text-base">
                        {isSubmitting ? 'Joining...' : 'Join Class'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>

        {(showGradeDropdown || showStrandDropdown) && (
          <TouchableWithoutFeedback
            onPress={() => {
              setShowGradeDropdown(false);
              setShowStrandDropdown(false);
            }}
          >
            <View className="absolute inset-0" />
          </TouchableWithoutFeedback>
        )}
      </Modal>

      {/* Pending watcher (opens after successful insert OR if one already exists) */}
      <JoinPendingModal
        visible={pending.open}
        teacherId={pending.teacherId}
        code={pending.code}
        onClose={() => setPending({ open: false, teacherId: null, code: null, classId: null, gradeLevel: undefined, strand: undefined })}
        onApproved={async (approvedCode) => {
          // Snapshot current pending before we clear it
          const snapshot = { ...pending };

          // Close pending modal state
          setPending({ open: false, teacherId: null, code: null, classId: null, gradeLevel: undefined, strand: undefined });

          // ⬇️ NEW: Recreate memberships on approval
          try {
            await finalizeEnrollmentAfterApproval({
              teacherId: snapshot.teacherId,
              classId: snapshot.classId || undefined,
              gradeLevel: snapshot.gradeLevel,
              strand: snapshot.strand,
            });
          } catch (e: any) {
            Alert.alert('Join Error', e?.message || 'Could not complete enrollment after approval.');
            return;
          }

          // Notify parent (optional) then navigate
          if (onJoinClass) {
            onJoinClass({
              classCode: approvedCode,
              gradeLevel: (snapshot.gradeLevel ?? gradeLevel) || '',
              strand: ((snapshot.strand ?? (strand === 'HUMMS' ? 'HUMSS' : strand)) as any) || '',
            });
          }

          router.replace({
            pathname: '/StudentScreen/StudentClass/class-progress',
            params: { code: approvedCode },
          });
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  picker: {
    color: 'white',
    height: 50,
  },
});

export default JoinClassModal;
