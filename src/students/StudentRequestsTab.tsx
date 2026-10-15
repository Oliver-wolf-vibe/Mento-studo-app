import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchProfilesByIds } from '@/lib/profileLookup';
import { Card, Badge, EmptyState, Button, Spinner } from '@/components/ui';
import type { MentorshipRequest, Profile } from '@/lib/types';
import { Send, Clock, Check, X, Calendar } from 'lucide-react';

interface RequestWithMentor extends MentorshipRequest {
  mentor_profile?: Profile;
}

export function StudentRequestsTab() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<RequestWithMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingRequest, setConfirmingRequest] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('mentorship_requests')
      .select('*')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) {
      const requestRows = data as MentorshipRequest[];
      const { profiles } = await fetchProfilesByIds(requestRows.map((request) => request.mentor_id));
      setRequests(requestRows.map((request) => ({
        ...request,
        mentor_profile: profiles.get(request.mentor_id),
      })));
    }
    setLoading(false);
  }, [profile]);

  const confirmProposedTime = async (requestId: string) => {
    setConfirmingRequest(requestId);
    setActionError(null);
    const { error } = await supabase.rpc('confirm_mentorship_request', { p_request_id: requestId });
    if (error) {
      setActionError(error.message);
    } else {
      await fetchRequests();
    }
    setConfirmingRequest(null);
  };

  useEffect(() => {
    fetchRequests();

    if (!profile) return;

    const channel = supabase
      .channel('student-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentorship_requests',
          filter: `student_id=eq.${profile.id}`,
        },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests, profile]);

  const statusConfig = {
    pending: { label: 'Pending', variant: 'warning' as const, icon: Clock },
    accepted: { label: 'Accepted', variant: 'success' as const, icon: Check },
    declined: { label: 'Declined', variant: 'error' as const, icon: X },
    proposed_time: { label: 'Time Proposed', variant: 'info' as const, icon: Calendar },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={<Send size={32} />}
        title="No requests yet"
        description="Browse mentors and send a mentorship request to get started."
      />
    );
  }

  return (
    <div className="space-y-3">
      {actionError && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {actionError}
        </div>
      )}
      {requests.map((req) => {
        const config = statusConfig[req.status];
        const StatusIcon = config.icon;
        return (
          <Card key={req.id} className="p-4 animate-slideUp">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                {req.mentor_profile?.avatar_url ? (
                  <img src={req.mentor_profile.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold text-sm">
                    {req.mentor_profile?.full_name?.charAt(0).toUpperCase() || 'M'}
                  </div>
                )}
                <div>
                  <div className="text-white text-sm font-medium">{req.mentor_profile?.full_name}</div>
                  <div className="text-white/30 text-xs">{new Date(req.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <Badge variant={config.variant}>
                <StatusIcon size={12} /> {config.label}
              </Badge>
            </div>

            <div className="space-y-1.5 text-sm">
              <div>
                <span className="text-white/40 text-xs">Goal: </span>
                <span className="text-white/80">{req.goal}</span>
              </div>
              <div>
                <span className="text-white/40 text-xs">Message: </span>
                <span className="text-white/60">{req.message}</span>
              </div>
            </div>

            {req.status === 'proposed_time' && req.proposed_time && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-medium mb-1">
                  <Calendar size={14} /> Proposed Session Time
                </div>
                <p className="text-white/80 text-sm">
                  {new Date(req.proposed_time).toLocaleString()}
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => confirmProposedTime(req.id)}
                  disabled={confirmingRequest === req.id}
                >
                  {confirmingRequest === req.id ? <Spinner className="w-3 h-3" /> : <Check size={14} />}
                  Confirm Session
                </Button>
              </div>
            )}

            {req.status === 'accepted' && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-xs">
                  Your mentorship has been accepted! Check "My Mentors" to start chatting.
                </p>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
