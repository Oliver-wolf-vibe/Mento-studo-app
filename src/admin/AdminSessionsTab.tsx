import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchProfilesByIds } from '@/lib/profileLookup';
import { Card, Badge, EmptyState, Spinner, Select } from '@/components/ui';
import type { Session, Profile } from '@/lib/types';
import { Calendar, MapPin, Clock } from 'lucide-react';

interface SessionWithProfiles extends Session {
  mentor_profile?: Profile;
  student_profile?: Profile;
}

export function AdminSessionsTab() {
  const [sessions, setSessions] = useState<SessionWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('sessions')
      .select('*')
      .order('session_date', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data } = await query;
    if (data) {
      const sessionRows = data as Session[];
      const { profiles } = await fetchProfilesByIds(sessionRows.flatMap((session) => [session.mentor_id, session.student_id]));
      setSessions(sessionRows.map((session) => ({
        ...session,
        mentor_profile: profiles.get(session.mentor_id),
        student_profile: profiles.get(session.student_id),
      })));
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const statusConfig = {
    scheduled: { label: 'Scheduled', variant: 'info' as const },
    completed: { label: 'Completed', variant: 'success' as const },
    cancelled: { label: 'Cancelled', variant: 'error' as const },
    no_show: { label: 'No Show', variant: 'error' as const },
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>;
  }

  return (
    <div className="space-y-4">
      <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
        <option value="all">All Statuses</option>
        <option value="scheduled">Scheduled</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
        <option value="no_show">No Show</option>
      </Select>

      {sessions.length === 0 ? (
        <EmptyState icon={<Calendar size={32} />} title="No sessions found" description="Mentoring sessions will appear here." />
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const config = statusConfig[session.status];
            return (
              <Card key={session.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-white font-medium text-sm">{session.title}</div>
                    <div className="text-white/40 text-xs mt-0.5">
                      {session.mentor_profile?.full_name} → {session.student_profile?.full_name}
                    </div>
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
                <div className="flex items-center gap-3 text-white/40 text-xs">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(session.session_date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {session.session_time}</span>
                  {session.classroom_number && <span className="flex items-center gap-1"><MapPin size={12} /> {session.classroom_number}</span>}
                </div>
                {session.notes && <p className="text-white/30 text-xs mt-2">{session.notes}</p>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
