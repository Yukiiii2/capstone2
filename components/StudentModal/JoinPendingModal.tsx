import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimePostgresUpdatePayload } from '@supabase/supabase-js';

type Props = {
  visible: boolean;
  teacherId: string | null;
  code: string | null;
  onClose: () => void;
  onApproved: (code: string) => void;
};

type JoinRequestRow = {
  id: string;
  student_id: string;
  teacher_id: string;
  code_entered: string;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
  updated_at: string | null;
};

export default function JoinPendingModal({
  visible,
  teacherId,
  code,
  onClose,
  onApproved,
}: Props) {
  const [status, setStatus] = useState<'pending' | 'approved' | 'declined' | ''>('pending');

  useEffect(() => {
    if (!visible) return;
    let sub: ReturnType<typeof supabase.channel> | null = null;
    let mounted = true;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid || !teacherId || !code) return;

      const normCode = String(code).toUpperCase();

      // initial check
      const { data: req } = await supabase
        .from('class_join_requests')
        .select('id, status')
        .eq('student_id', uid)
        .eq('teacher_id', teacherId)
        .eq('code_entered', normCode)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (mounted && req?.status) setStatus(req.status as any);

      // realtime updates
      sub = supabase
        .channel('rt-join-approval')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'class_join_requests',
            filter: `student_id=eq.${uid}`,
          },
          (payload: RealtimePostgresUpdatePayload<JoinRequestRow>) => {
            const s = payload.new?.status;
            if (!s) return;
            setStatus(s);
          }
        )
        .subscribe();
    })();

    return () => {
      mounted = false;
      if (sub) supabase.removeChannel(sub);
    };
  }, [visible, teacherId, code]);

  useEffect(() => {
    if (status === 'approved' && code) {
      onApproved(String(code).toUpperCase());
    }
  }, [status, code, onApproved]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="w-full max-w-md bg-[#0F172A] rounded-2xl p-6 border border-white/10">
          <View className="items-center mb-4">
            <Ionicons name="hourglass" size={42} color="#A78BFA" />
          </View>

          <Text className="text-white text-xl font-semibold text-center mb-2">
            Waiting for Approval
          </Text>
          <Text className="text-white/70 text-center">
            Your request to join the class ({String(code ?? '')}) was sent to your teacher.
            You’ll enter the class as soon as they approve it.
          </Text>

          <View className="mt-6 items-center">
            <ActivityIndicator color="#fff" />
            <Text className="text-white/60 text-xs mt-2 capitalize">{status}</Text>
          </View>

          <TouchableOpacity
            className="mt-8 px-4 py-3 rounded-lg bg-white/10 border border-white/10 items-center"
            onPress={onClose}
          >
            <Text className="text-white">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
