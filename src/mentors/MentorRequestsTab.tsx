import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchProfilesByIds } from '@/lib/profileLookup';
import { Card, Badge, EmptyState, Spinner, Button, Modal, Input } from '@/components/ui';
import type { MentorshipRequest, Profile, StudentProfile } from '@/lib/types';
import { Inbox, Clock, Check, X, Calendar, GraduationCap } from 'lucide-react';

interface RequestWithStudent extends MentorshipRequest {
  student_profile?: Profile;
  student_details?: StudentProfile;
}

export function MentorRequestsTab() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<RequestWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposeRequest, setProposeRequest] = useState<RequestWithStudent | null>(null);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');

  const fetchRequests = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('mentorship_requests')
      .select('*')
      .eq('mentor_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) {
      const requestRows = data as MentorshipRequest[];
      const { profiles } = await fetchProfilesByIds(requestRows.map((request) => request.student_id));
      setRequests(requestRows.map((request) => ({
        ...request,
        student_profile: profiles.get(request.student_id),
      })));
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchRequests();
    if (!profile) return;
    const channel = supabase
      .channel('mentor-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mentorship_requests', filter: `mentor_id=eq.${profile.id}` }, () => fetchRequests())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchRequests, profile]);

  const handleAccept = async (req: RequestWithStudent) => {
    if (!profile) return;
    setActionLoading(req.id);

    // Update request status
    const { error: reqErr } = await supabase
      .from('mentorship_requests')
      .update({ status: 'accepted' })
      .eq('id', req.id);
    if (reqErr) { setActionLoading(null); return; }

    // Create match
    const { data: matchData, error: matchErr } = await supabase
      .from('matches')
      .insert({ request_id: req.id, student_id: req.student_id, mentor_id: profile.id })
      .select().single();
    if (matchErr) { setActionLoading(null); return; }

    // Update mentor mentee count
    const { data: mp } = await supabase
      .from('mentor_profiles')
      .select('current_mentee_count')
      .eq('user_id', profile.id)
      .maybeSingle();
    if (mp) {
      await supabase
        .from('mentor_profiles')
        .update({ current_mentee_count: (mp as { current_mentee_count: number }).current_mentee_count + 1 })
        .eq('user_id', profile.id);
    }

    // Notify student
    await supabase.from('notifications').insert({
      user_id: req.student_id,
      type: 'request_accepted',
      title: `Mentorship accepted by ${profile.full_name}`,
      body: 'Your mentorship request has been accepted! You can now start messaging.',
      related_id: matchData.id,
    });

    setActionLoading(null);
    fetchRequests();
  };

  const handleDecline = async (req: RequestWithStudent) => {
    if (!profile) return;
    setActionLoading(req.id);
    const { error } = await supabase
      .from('mentorship_requests')
      .update({ status: 'declined' })
      .eq('id', req.id);
    if (!error) {
      await supabase.from('notifications').insert({
        user_id: req.student_id,
        type: 'request_declined',
        title: `Request declined by ${profile.full_name}`,
        body: 'Your mentorship request was declined. Try finding another mentor.',
        related_id: req.id,
      });
    }
    setActionLoading(null);
    fetchRequests();
  };

  const handleProposeTime = async () => {
    if (!proposeRequest || !proposedDate || !proposedTime) return;
    setActionLoading(proposeRequest.id);
    const proposedDateTime = new Date(`${proposedDate}T${proposedTime}`).toISOString();
    const { error } = await supabase
      .from('mentorship_requests')
      .update({ status: 'proposed_time', proposed_time: proposedDateTime })
      .eq('id', proposeRequest.id);
    if (!error) {
      await supabase.from('notifications').insert({
        user_id: proposeRequest.student_id,
        type: 'session_scheduled',
        title: 'Session time proposed',
        body: `Your mentor proposed a session on ${new Date(proposedDateTime).toLocaleString()}`,
        related_id: proposeRequest.id,
      });
    }
    setActionLoading(null);
    setShowProposeModal(false);
    setProposeRequest(null);
    setProposedDate('');
    setProposedTime('');
    fetchRequests();
  };

  const statusConfig = {
    pending: { label: 'Pending', variant: 'warning' as const, icon: Clock },
    accepted: { label: 'Accepted', variant: 'success' as const, icon: Check },
    declined: { label: 'Declined', variant: 'error' as const, icon: X },
    proposed_time: { label: 'Time Proposed', variant: 'info' as const, icon: Calendar },
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>;
  }

  if (requests.length === 0) {
    return <EmptyState icon={<Inbox size={32} />} title="No requests yet" description="When students send you mentorship requests, they'll appear here." />;
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const config = statusConfig[req.status];
        const StatusIcon = config.icon;
        const isLoading = actionLoading === req.id;
        return (
          <Card key={req.id} className="p-4 animate-slideUp">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                {req.student_profile?.avatar_url ? (
                  <img src={req.student_profile.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold text-sm">
                    {req.student_profile?.full_name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                )}
                <div>
                  <div className="text-white text-sm font-medium">{req.student_profile?.full_name}</div>
                  <div className="text-white/30 text-xs flex items-center gap-1">
                    <GraduationCap size={12} /> {new Date(req.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <Badge variant={config.variant}><StatusIcon size={12} /> {config.label}</Badge>
            </div>

            <div className="space-y-1.5 text-sm mb-3">
              <div><span className="text-white/40 text-xs">Goal: </span><span className="text-white/80">{req.goal}</span></div>
              <div><span className="text-white/40 text-xs">Message: </span><span className="text-white/60">{req.message}</span></div>
            </div>

            {req.status === 'proposed_time' && req.proposed_time && (
              <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-medium mb-1">
                  <Calendar size={14} /> Proposed Time
                </div>
                <p className="text-white/80 text-sm">{new Date(req.proposed_time).toLocaleString()}</p>
              </div>
            )}

            {req.status === 'pending' && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handleAccept(req)} disabled={isLoading}>
                  {isLoading ? <Spinner className="w-3 h-3" /> : <Check size={14} />} Accept
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDecline(req)} disabled={isLoading}>
                  <X size={14} /> Decline
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { setProposeRequest(req); setShowProposeModal(true); }} disabled={isLoading}>
                  <Calendar size={14} /> Propose Time
                </Button>
              </div>
            )}

            {req.status === 'accepted' && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-xs">Match created! Go to "My Mentees" to schedule sessions and chat.</p>
              </div>
            )}
          </Card>
        );
      })}

      <Modal open={showProposeModal} onClose={() => setShowProposeModal(false)} title="Propose Session Time">
        <div className="space-y-4">
          <p className="text-white/50 text-sm">Propose a session time for {proposeRequest?.student_profile?.full_name}. They'll be notified and can accept.</p>
          <Input label="Date" type="date" value={proposedDate} onChange={(e) => setProposedDate(e.target.value)} required />
          <Input label="Time" type="time" value={proposedTime} onChange={(e) => setProposedTime(e.target.value)} required />
          <Button size="lg" className="w-full" onClick={handleProposeTime} disabled={!proposedDate || !proposedTime}>
            Propose Time
          </Button>
        </div>
      </Modal>
    </div>
  );
}
