import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, Badge, EmptyState, Spinner, Modal, Button, Input, Select, Textarea } from '@/components/ui';
import { MessageThread } from '@/messages/MessageThread';
import type { Match, Profile, Session, Feedback } from '@/lib/types';
import { Users, MessageSquare, Calendar, Star, MapPin, Clock } from 'lucide-react';

interface MatchWithProfiles extends Match {
  mentor_profile?: Profile;
  student_profile?: Profile;
}

interface SessionTabProps {
  match: MatchWithProfiles;
  isStudent: boolean;
}

function SessionsTab({ match, isStudent }: SessionTabProps) {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSession, setFeedbackSession] = useState<Session | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('match_id', match.id)
      .order('session_date', { ascending: false });
    if (data) {
      setSessions(data as Session[]);
      // Check feedback for completed sessions
      if (isStudent) {
        const feedbackMap: Record<string, boolean> = {};
        for (const s of data as Session[]) {
          if (s.status === 'completed') {
            const { data: fb } = await supabase
              .from('feedback')
              .select('id')
              .eq('session_id', s.id)
              .eq('student_id', profile?.id)
              .maybeSingle();
            feedbackMap[s.id] = !!fb;
          }
        }
        setFeedbackGiven(feedbackMap);
      }
    }
    setLoading(false);
  }, [match.id, isStudent, profile]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const submitFeedback = async () => {
    if (!feedbackSession || !profile) return;
    setSubmitting(true);

    const { error } = await supabase.from('feedback').insert({
      session_id: feedbackSession.id,
      match_id: match.id,
      student_id: profile.id,
      mentor_id: match.mentor_id,
      rating,
      comment: comment.trim() || null,
    });

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: match.mentor_id,
        type: 'new_feedback',
        title: `New feedback from ${profile.full_name}`,
        body: `Rating: ${rating}/5${comment.trim() ? ' - ' + comment.trim().substring(0, 60) : ''}`,
        related_id: feedbackSession.id,
      });
      setShowFeedbackModal(false);
      setFeedbackSession(null);
      setRating(5);
      setComment('');
      fetchSessions();
    }

    setSubmitting(false);
  };

  const statusConfig = {
    scheduled: { label: 'Scheduled', variant: 'info' as const },
    completed: { label: 'Completed', variant: 'success' as const },
    cancelled: { label: 'Cancelled', variant: 'error' as const },
    no_show: { label: 'No Show', variant: 'error' as const },
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Spinner className="w-5 h-5" /></div>;
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<Calendar size={28} />}
        title="No sessions scheduled"
        description={isStudent ? "Your mentor hasn't scheduled any sessions yet." : "Schedule a session for this match."}
      />
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const config = statusConfig[session.status];
        return (
          <Card key={session.id} className="p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="text-white font-medium text-sm">{session.title}</div>
                <div className="flex items-center gap-3 mt-1 text-white/40 text-xs">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {new Date(session.session_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {session.session_time}
                  </span>
                </div>
              </div>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>

            {/* Classroom number - visible to matched student after approval (session is scheduled/completed) */}
            {session.classroom_number && (session.status === 'scheduled' || session.status === 'completed') && (
              <div className="mt-2 p-2.5 bg-white/5 rounded-lg flex items-center gap-2">
                <MapPin size={14} className="text-white/60" />
                <span className="text-white/80 text-xs font-medium">Classroom: {session.classroom_number}</span>
              </div>
            )}

            {session.notes && (
              <p className="text-white/40 text-xs mt-2">{session.notes}</p>
            )}

            {/* Feedback button for students on completed sessions */}
            {isStudent && session.status === 'completed' && (
              <div className="mt-3">
                {feedbackGiven[session.id] ? (
                  <Badge variant="success"><Star size={12} /> Feedback submitted</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setFeedbackSession(session);
                      setShowFeedbackModal(true);
                    }}
                  >
                    <Star size={14} /> Rate this session
                  </Button>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* Feedback modal */}
      <Modal
        open={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        title="Rate Your Session"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`transition-all ${star <= rating ? 'text-yellow-400' : 'text-white/20 hover:text-white/40'}`}
                >
                  <Star size={28} fill={star <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            label="Feedback (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about the session..."
            rows={3}
          />
          <Button size="lg" className="w-full" onClick={submitFeedback} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function StudentMatchesTab() {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<MatchWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchWithProfiles | null>(null);
  const [matchTab, setMatchTab] = useState<'sessions' | 'messages'>('sessions');

  const fetchMatches = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('matches')
      .select('*, mentor_profile:profiles!matches_mentor_id_fkey(*), student_profile:profiles!matches_student_id_fkey(*)')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setMatches(data as MatchWithProfiles[]);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>;
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={<Users size={32} />}
        title="No matches yet"
        description="When a mentor accepts your request, they'll appear here."
      />
    );
  }

  if (selectedMatch) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setSelectedMatch(null); setMatchTab('sessions'); }}
          className="text-white/50 hover:text-white text-sm transition-colors"
        >
          ← Back to matches
        </button>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            {selectedMatch.mentor_profile?.avatar_url ? (
              <img src={selectedMatch.mentor_profile.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold">
                {selectedMatch.mentor_profile?.full_name?.charAt(0).toUpperCase() || 'M'}
              </div>
            )}
            <div>
              <div className="text-white font-semibold text-sm">{selectedMatch.mentor_profile?.full_name}</div>
              <Badge variant={selectedMatch.status === 'active' ? 'success' : 'default'}>
                {selectedMatch.status}
              </Badge>
            </div>
          </div>
        </Card>

        <div className="flex gap-1 p-1 bg-neutral-800 rounded-lg">
          <button
            onClick={() => setMatchTab('sessions')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
              matchTab === 'sessions' ? 'bg-white text-black' : 'text-white/50 hover:text-white'
            }`}
          >
            <Calendar size={16} /> Sessions
          </button>
          <button
            onClick={() => setMatchTab('messages')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
              matchTab === 'messages' ? 'bg-white text-black' : 'text-white/50 hover:text-white'
            }`}
          >
            <MessageSquare size={16} /> Messages
          </button>
        </div>

        {matchTab === 'sessions' ? (
          <SessionsTab match={selectedMatch} isStudent={true} />
        ) : (
          <Card className="overflow-hidden">
            <MessageThread
              matchId={selectedMatch.id}
              otherPersonName={selectedMatch.mentor_profile?.full_name || 'Mentor'}
            />
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {matches.map((match) => (
        <Card
          key={match.id}
          className="p-5 hover:border-white/20 transition-all cursor-pointer group"
          onClick={() => setSelectedMatch(match)}
        >
          <div className="flex items-center gap-3 mb-3">
            {match.mentor_profile?.avatar_url ? (
              <img src={match.mentor_profile.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold">
                {match.mentor_profile?.full_name?.charAt(0).toUpperCase() || 'M'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm truncate">{match.mentor_profile?.full_name}</h3>
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
