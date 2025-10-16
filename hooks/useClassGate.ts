// components/hooks/useClassGate.ts
import { useEffect, useState } from 'react';
import { supabase } from "../lib/supabaseClient";

type GateState = 'none' | 'pending' | 'approved';

export type LatestRequest = {
  id: string;
  status: 'pending' | 'approved' | 'denied';
  code_entered: string | null;
  teacher_id: string | null;
};

export function useClassGate() {
  const [state, setState] = useState<GateState>('none');
  const [latest, setLatest] = useState<LatestRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const studentId = auth?.user?.id;
      if (!studentId) {
        if (!mounted) return;
        setState('none');
        setLatest(null);
        setLoading(false);
        return;
      }

      // Get the most recent request for this student, regardless of code/teacher.
      const { data: req, error } = await supabase
        .from('class_join_requests')
        .select('id,status,code_entered,teacher_id,requested_at')
        .eq('student_id', studentId)
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;

      if (error || !req) {
        setState('none');
        setLatest(null);
        setLoading(false);
      } else {
        setLatest({
          id: req.id,
          status: req.status,
          code_entered: req.code_entered ?? null,
          teacher_id: req.teacher_id ?? null,
        });
        setState(req.status === 'approved' ? 'approved' : req.status === 'pending' ? 'pending' : 'none');
        setLoading(false);

        // Realtime: watch this student's latest request row (or all rows if no id yet)
        channel = supabase
          .channel(`class-gate-${studentId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'class_join_requests',
              filter: req.id ? `id=eq.${req.id}` : `student_id=eq.${studentId}`,
            },
            (payload: any) => {
              const row = payload?.new;
              if (!row) return;
              if (!mounted) return;

              const next: LatestRequest = {
                id: row.id,
                status: row.status,
                code_entered: row.code_entered ?? null,
                teacher_id: row.teacher_id ?? null,
              };
              setLatest(next);
              setState(row.status === 'approved' ? 'approved' : row.status === 'pending' ? 'pending' : 'none');
            }
          )
          .subscribe();
      }
    })();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return { state, latest, loading };
}
