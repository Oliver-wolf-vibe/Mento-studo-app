import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, Badge, EmptyState, Spinner, Button } from '@/components/ui';
import type { MentorProfile, Profile } from '@/lib/types';
import { ShieldCheck, Check, X, Linkedin, Users, MapPin, Clock } from 'lucide-react';

interface MentorWithProfile extends MentorProfile {
  profiles?: Profile;
}

export function AdminApprovalsTab() {
  const { profile } = useAuth();
  const [mentors, setMentors] = useState<MentorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    setQueryError(null);
    const { data, error } = await supabase
      .from('mentor_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setMentors([]);
      setQueryError(error.message);
    } else if (data) {
      const mentorRows = data as MentorProfile[];
      const userIds = mentorRows.map((mentor) => mentor.user_id);
      const { data: profileRows, error: profileError } = userIds.length > 0
        ? await supabase
          .from('profiles')
          .select('id, email, full_name, role, avatar_url, phone, is_active, created_at, updated_at')
          .in('id', userIds)
        : { data: [], error: null };

      if (profileError) {
        setQueryError(`Mentor applications loaded, but profile names could not be loaded: ${profileError.message}`);
      }

      const profilesById = new Map((profileRows || []).map((participant) => [participant.id, participant as Profile]));
      setMentors(mentorRows.map((mentor) => ({
        ...mentor,
        profiles: profilesById.get(mentor.user_id),
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMentors(); }, [fetchMentors]);

  const handleApprove = async (mentor: MentorWithProfile) => {
    if (!profile) return;
    setActionLoading(mentor.id);
    const { error } = await supabase
      .from('mentor_profiles')
      .update({ is_approved: true, approved_by: profile.id, approved_at: new Date().toISOString() })
      .eq('id', mentor.id);
    if (!error) {
      await supabase.from('notifications').insert({
        user_id: mentor.user_id,
        type: 'mentor_approved',
        title: 'Your mentor profile has been approved!',
        body: 'You are now visible in student searches. Students can send you mentorship requests.',
      });
    }
    setActionLoading(null);
    fetchMentors();
  };

  const handleReject = async (mentor: MentorWithProfile) => {
    if (!profile) return;
    setActionLoading(mentor.id);
    const { error } = await supabase
      .from('mentor_profiles')
      .update({ is_approved: false, approved_by: profile.id, approved_at: new Date().toISOString() })
      .eq('id', mentor.id);
    if (!error) {
      await supabase.from('notifications').insert({
        user_id: mentor.user_id,
        type: 'mentor_rejected',
        title: 'Your mentor profile was not approved',
        body: 'Please review your profile and contact the admin office for more information.',
      });
    }
    setActionLoading(null);
    fetchMentors();
  };

  const pending = mentors.filter((m) => !m.is_approved);
  const approved = mentors.filter((m) => m.is_approved);

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>;
  }

  const renderMentorCard = (mentor: MentorWithProfile) => {
    const isLoading = actionLoading === mentor.id;
    return (
      <Card key={mentor.id} className="p-5 animate-slideUp">
        <div className="flex items-start gap-3 mb-3">
          {mentor.profiles?.avatar_url ? (
            <img src={mentor.profiles.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold">
              {mentor.profiles?.full_name?.charAt(0).toUpperCase() || 'M'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm truncate">{mentor.profiles?.full_name}</h3>
            <p className="text-white/50 text-xs truncate">{mentor.designation} at {mentor.organization}</p>
          </div>
          <Badge variant={mentor.is_approved ? 'success' : 'warning'}>
            {mentor.is_approved ? 'Approved' : 'Pending'}
          </Badge>
        </div>

        {mentor.bio && <p className="text-white/40 text-xs mb-3 line-clamp-2">{mentor.bio}</p>}

        {mentor.expertise_tags && mentor.expertise_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {mentor.expertise_tags.slice(0, 5).map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-white/5 text-white/60 rounded-full text-[10px] font-medium">{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-white/30 text-[10px] mb-3">
          <span className="flex items-center gap-1"><Users size={12} /> {mentor.current_mentee_count}/{mentor.max_mentees}</span>
          <span className="flex items-center gap-1"><MapPin size={12} /> {mentor.mentoring_format}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {mentor.availability}</span>
          {mentor.linkedin_url && <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white/60"><Linkedin size={12} /> LinkedIn</a>}
        </div>

        <div className="flex gap-2">
          {!mentor.is_approved ? (
            <>
              <Button size="sm" onClick={() => handleApprove(mentor)} disabled={isLoading}>
                {isLoading ? <Spinner className="w-3 h-3" /> : <Check size={14} />} Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleReject(mentor)} disabled={isLoading}>
                <X size={14} /> Reject
              </Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => handleReject(mentor)} disabled={isLoading}>
              {isLoading ? <Spinner className="w-3 h-3" /> : <X size={14} />} Revoke
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
        <h3 className="text-white font-semibold text-sm">Mentor applications</h3>
        <p className="text-white/40 text-xs mt-1">
          Mentor applications are stored in mentor profiles. Student mentorship requests appear under “All Requests”.
        </p>
      </div>

      {queryError && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          Could not load mentor applications: {queryError}
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h3 className="text-white/70 text-sm font-medium mb-3 flex items-center gap-2">
            <ShieldCheck size={16} /> Pending Approval ({pending.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.map(renderMentorCard)}
          </div>
        </div>
      )}

      {pending.length === 0 && approved.length === 0 && (
        <EmptyState icon={<ShieldCheck size={32} />} title="No mentor profiles" description="Mentor profiles will appear here for approval once they sign up." />
      )}

      {approved.length > 0 && (
        <div>
          <h3 className="text-white/70 text-sm font-medium mb-3">Approved Mentors ({approved.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approved.map(renderMentorCard)}
          </div>
        </div>
      )}
    </div>
  );
}
