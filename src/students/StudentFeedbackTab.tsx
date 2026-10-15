import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, Badge, EmptyState, Spinner } from '@/components/ui';
import type { Feedback, Profile, Session } from '@/lib/types';
import { Star } from 'lucide-react';

interface FeedbackWithDetails extends Feedback {
  mentor_profile?: Profile;
  session?: Session;
}

export function StudentFeedbackTab() {
  const { profile } = useAuth();
  const [feedbacks, setFeedbacks] = useState<FeedbackWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingSessions, setPendingSessions] = useState<Session[]>([]);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    const { data: fbs } = await supabase
      .from('feedback')
      .select('*, mentor_profile:profiles!feedback_mentor_id_fkey(*), session:sessions!feedback_session_id_fkey(*)')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });
    if (fbs) setFeedbacks(fbs as FeedbackWithDetails[]);

    // Find completed sessions without feedback
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('student_id', profile.id)
      .eq('status', 'completed')
      .order('session_date', { ascending: false });

    if (sessions) {
      const pending: Session[] = [];
      for (const s of sessions as Session[]) {
        const { data: fb } = await supabase
          .from('feedback')
          .select('id')
          .eq('session_id', s.id)
          .eq('student_id', profile.id)
          .maybeSingle();
        if (!fb) pending.push(s);
      }
      setPendingSessions(pending);
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>;
  }

  if (feedbacks.length === 0 && pendingSessions.length === 0) {
    return (
      <EmptyState
        icon={<Star size={32} />}
        title="No feedback yet"
        description="After completing a mentoring session, you can rate your mentor here."
      />
    );
  }

  return (
    <div className="space-y-6">
      {pendingSessions.length > 0 && (
        <Card className="p-4 border-yellow-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} className="text-yellow-400" />
            <h3 className="text-white font-semibold text-sm">Pending Feedback</h3>
          </div>
          <p className="text-white/40 text-xs mb-3">
            You have {pendingSessions.length} completed session(s) waiting for feedback. Go to "My Mentors" to rate them.
          </p>
        </Card>
      )}

      {feedbacks.length > 0 && (
        <div>
          <h3 className="text-white/70 text-sm font-medium mb-3">Submitted Feedback</h3>
          <div className="space-y-3">
            {feedbacks.map((fb) => (
              <Card key={fb.id} className="p-4 animate-slideUp">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-white font-medium text-sm">
                      {fb.mentor_profile?.full_name || 'Mentor'}
                    </div>
                    <div className="text-white/30 text-xs">
                      {fb.session && new Date(fb.session.session_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={star <= fb.rating ? 'text-yellow-400' : 'text-white/15'}
                        fill={star <= fb.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                </div>
                {fb.comment && (
                  <p className="text-white/50 text-sm mt-2">{fb.comment}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
