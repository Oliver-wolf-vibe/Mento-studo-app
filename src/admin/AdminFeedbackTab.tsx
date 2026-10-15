import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, EmptyState, Spinner } from '@/components/ui';
import type { Feedback, Profile } from '@/lib/types';
import { Star, TrendingUp, MessageSquare, Award } from 'lucide-react';

interface FeedbackWithProfiles extends Feedback {
  mentor_profile?: Profile;
  student_profile?: Profile;
}

interface MentorStats {
  mentor_id: string;
  mentor_name: string;
  avg_rating: number;
  total_feedback: number;
}

export function AdminFeedbackTab() {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithProfiles[]>([]);
  const [stats, setStats] = useState<MentorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallAvg, setOverallAvg] = useState(0);
  const [totalFeedback, setTotalFeedback] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('feedback')
      .select('*, mentor_profile:profiles!feedback_mentor_id_fkey(*), student_profile:profiles!feedback_student_id_fkey(*)')
      .order('created_at', { ascending: false });
    if (data) {
      const fbs = data as FeedbackWithProfiles[];
      setFeedbacks(fbs);
      setTotalFeedback(fbs.length);

      const allRatings = fbs.map((f) => f.rating);
      setOverallAvg(allRatings.length > 0 ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0);

      // Compute per-mentor stats
      const mentorMap = new Map<string, MentorStats>();
      for (const f of fbs) {
        const key = f.mentor_id;
        const existing = mentorMap.get(key);
        if (existing) {
          existing.total_feedback += 1;
          existing.avg_rating = (existing.avg_rating * (existing.total_feedback - 1) + f.rating) / existing.total_feedback;
        } else {
          mentorMap.set(key, {
            mentor_id: f.mentor_id,
            mentor_name: f.mentor_profile?.full_name || 'Unknown',
            avg_rating: f.rating,
            total_feedback: 1,
          });
        }
      }
      setStats(Array.from(mentorMap.values()).sort((a, b) => b.avg_rating - a.avg_rating));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>;
  }

  if (feedbacks.length === 0) {
    return <EmptyState icon={<Star size={32} />} title="No feedback yet" description="Student feedback will appear here once sessions are completed and rated." />;
  }

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-white/70" />
            </div>
            <div>
              <div className="text-white/40 text-xs">Overall Average</div>
              <div className="text-white text-2xl font-bold">{overallAvg.toFixed(1)}/5</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <MessageSquare size={20} className="text-white/70" />
            </div>
            <div>
              <div className="text-white/40 text-xs">Total Feedback</div>
              <div className="text-white text-2xl font-bold">{totalFeedback}</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Award size={20} className="text-white/70" />
            </div>
            <div>
              <div className="text-white/40 text-xs">Active Mentors Rated</div>
              <div className="text-white text-2xl font-bold">{stats.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top-rated mentors */}
      {stats.length > 0 && (
        <div>
          <h3 className="text-white/70 text-sm font-medium mb-3">Mentor Ratings</h3>
          <div className="space-y-2">
            {stats.map((s, idx) => (
              <Card key={s.mentor_id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-white/50 text-xs font-bold">{idx + 1}</div>
                  <div>
                    <div className="text-white text-sm font-medium">{s.mentor_name}</div>
                    <div className="text-white/30 text-xs">{s.total_feedback} review{s.total_feedback > 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={14} className={star <= Math.round(s.avg_rating) ? 'text-yellow-400' : 'text-white/15'} fill={star <= Math.round(s.avg_rating) ? 'currentColor' : 'none'} />
                  ))}
                  <span className="text-white/60 text-sm font-medium ml-2">{s.avg_rating.toFixed(1)}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent feedback */}
      <div>
        <h3 className="text-white/70 text-sm font-medium mb-3">Recent Feedback</h3>
        <div className="space-y-3">
          {feedbacks.slice(0, 10).map((fb) => (
            <Card key={fb.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-white text-sm font-medium">{fb.mentor_profile?.full_name}</div>
                  <div className="text-white/30 text-xs">Reviewed by {fb.student_profile?.full_name}</div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={14} className={star <= fb.rating ? 'text-yellow-400' : 'text-white/15'} fill={star <= fb.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
              </div>
              {fb.comment && <p className="text-white/50 text-sm">{fb.comment}</p>}
              <div className="text-white/20 text-[10px] mt-2">{new Date(fb.created_at).toLocaleString()}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
