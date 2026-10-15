import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, Badge, EmptyState, Spinner, Button, Modal, Input, Select, Textarea } from '@/components/ui';
import { MessageThread } from '@/messages/MessageThread';
import type { Match, Profile, Session } from '@/lib/types';
import { Send, Calendar, MapPin, Clock, MessageSquare, Plus, Check, X } from 'lucide-react';

interface MatchWithProfiles extends Match {
  mentor_profile?: Profile;
  student_profile?: Profile;
}

export function MentorMatchesTab() {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<MatchWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithProfiles | null>(null);
  const [matchTab, setMatchTab] = useState<'sessions' | 'messages'>('sessions');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionTitle, setSessionTitle] = useState('Mentoring Session');
  const [classroomNumber, setClassroomNumber] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [savingSession, setSavingSession] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('matches')
      .select('*, mentor_profile:profiles!matches_mentor_id_fkey(*), student_profile:profiles!matches_student_id_fkey(*)')
      .eq('mentor_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setMatches(data as MatchWithProfiles[]);
    setLoading(false);
  }, [profile]);

  const fetchSessions = useCallback(async (matchId: string) => {
    setSessionsLoading(true);
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('match_id', matchId)
      .order('session_date', { ascending: false });
    if (data) setSessions(data as Session[]);
    setSessionsLoading(false);
  }, []);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const handleSelectMatch = (match: MatchWithProfiles) => {
    setSelectedMatch(match);
    setMatchTab('sessions');
    fetchSessions(match.id);
  };

  const handleScheduleSession = async () => {
    if (!selectedMatch || !profile) return;
    setSavingSession(true);
    const { data, error } = await supabase.from('sessions').insert({
      match_id: selectedMatch.id,
      mentor_id: profile.id,
      student_id: selectedMatch.student_id,
      title: sessionTitle,
      session_date: sessionDate,
      session_time: sessionTime,
      classroom_number: classroomNumber || null,
      notes: sessionNotes || null,
      status: 'scheduled',
    }).select().single();

    if (!error && data) {
      await supabase.from('notifications').insert({
        user_id: selectedMatch.student_id,
        type: 'session_scheduled',
        title: `Session scheduled by ${profile.full_name}`,
        body: `${sessionTitle} on ${new Date(sessionDate).toLocaleDateString()} at ${sessionTime}${classroomNumber ? ' - Classroom: ' + classroomNumber : ''}`,
        related_id: (data as Session).id,
      });
      setShowScheduleModal(false);
      setSessionDate(''); setSessionTime(''); setSessionTitle('Mentoring Session'); setClassroomNumber(''); setSessionNotes('');
      fetchSessions(selectedMatch.id);
    }
    setSavingSession(false);
  };

  const updateSessionStatus = async (session: Session, status: Session['status']) => {
    const { error } = await supabase.from('sessions').update({ status }).eq('id', session.id);
    if (!error && selectedMatch) {
      await supabase.from('notifications').insert({
        user_id: selectedMatch.student_id,
        type: 'session_updated',
        title: `Session ${status}`,
        body: `"${session.title}" has been marked as ${status}.`,
        related_id: session.id,
      });
      fetchSessions(selectedMatch.id);
    }
  };

  const statusConfig = {
    scheduled: { label: 'Scheduled', variant: 'info' as const },
    completed: { label: 'Completed', variant: 'success' as const },
    cancelled: { label: 'Cancelled', variant: 'error' as const },
    no_show: { label: 'No Show', variant: 'error' as const },
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>;
  }

  if (matches.length === 0) {
    return <EmptyState icon={<Send size={32} />} title="No mentees yet" description="When you accept a mentorship request, the student will appear here." />;
  }

  if (selectedMatch) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setSelectedMatch(null); setMatchTab('sessions'); }} className="text-white/50 hover:text-white text-sm transition-colors">
          ← Back to mentees
        </button>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            {selectedMatch.student_profile?.avatar_url ? (
              <img src={selectedMatch.student_profile.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold">
                {selectedMatch.student_profile?.full_name?.charAt(0).toUpperCase() || 'S'}
              </div>
            )}
            <div>
              <div className="text-white font-semibold text-sm">{selectedMatch.student_profile?.full_name}</div>
              <Badge variant={selectedMatch.status === 'active' ? 'success' : 'default'}>{selectedMatch.status}</Badge>
            </div>
          </div>
        </Card>

        <div className="flex gap-1 p-1 bg-neutral-800 rounded-lg">
          <button onClick={() => setMatchTab('sessions')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${matchTab === 'sessions' ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
            <Calendar size={16} /> Sessions
          </button>
          <button onClick={() => setMatchTab('messages')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${matchTab === 'messages' ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>
            <MessageSquare size={16} /> Messages
          </button>
        </div>

        {matchTab === 'sessions' ? (
          <div className="space-y-3">
            <Button size="md" onClick={() => setShowScheduleModal(true)}>
              <Plus size={16} /> Schedule Session
            </Button>

            {sessionsLoading ? (
              <div className="flex justify-center py-8"><Spinner className="w-5 h-5" /></div>
            ) : sessions.length === 0 ? (
              <EmptyState icon={<Calendar size={28} />} title="No sessions scheduled" description="Schedule your first mentoring session." />
            ) : (
              sessions.map((session) => {
                const config = statusConfig[session.status];
                return (
                  <Card key={session.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-white font-medium text-sm">{session.title}</div>
                        <div className="flex items-center gap-3 mt-1 text-white/40 text-xs">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(session.session_date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {session.session_time}</span>
                        </div>
                      </div>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>

                    {session.classroom_number && (
                      <div className="mt-2 p-2.5 bg-white/5 rounded-lg flex items-center gap-2">
                        <MapPin size={14} className="text-white/60" />
                        <span className="text-white/80 text-xs font-medium">Classroom: {session.classroom_number}</span>
                      </div>
                    )}

                    {session.notes && <p className="text-white/40 text-xs mt-2">{session.notes}</p>}

                    {session.status === 'scheduled' && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="secondary" onClick={() => updateSessionStatus(session, 'completed')}>
                          <Check size={14} /> Mark Completed
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => updateSessionStatus(session, 'cancelled')}>
                          <X size={14} /> Cancel
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <MessageThread matchId={selectedMatch.id} otherPersonName={selectedMatch.student_profile?.full_name || 'Student'} />
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {matches.map((match) => (
        <Card key={match.id} className="p-5 hover:border-white/20 transition-all cursor-pointer group" onClick={() => handleSelectMatch(match)}>
          <div className="flex items-center gap-3 mb-3">
            {match.student_profile?.avatar_url ? (
              <img src={match.student_profile.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold">
                {match.student_profile?.full_name?.charAt(0).toUpperCase() || 'S'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm truncate">{match.student_profile?.full_name}</h3>
              <p className="text-white/30 text-xs">Matched on {new Date(match.created_at).toLocaleDateString()}</p>
            </div>
            <Badge variant={match.status === 'active' ? 'success' : 'default'}>{match.status}</Badge>
          </div>
          <div className="flex items-center gap-3 text-white/40 text-xs">
            <span className="flex items-center gap-1"><Calendar size={14} /> Sessions</span>
            <span className="flex items-center gap-1"><MessageSquare size={14} /> Messages</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
