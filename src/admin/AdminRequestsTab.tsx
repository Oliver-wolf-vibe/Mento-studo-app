import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, EmptyState, Spinner, Select } from '@/components/ui';
import type { MentorshipRequest, Profile } from '@/lib/types';
import { Inbox, Clock, Check, X, Calendar } from 'lucide-react';

interface RequestWithProfiles extends MentorshipRequest {
  student_profile?: Profile;
  mentor_profile?: Profile;
}

export function AdminRequestsTab() {
  const [requests, setRequests] = useState<RequestWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setQueryError(null);
    let query = supabase.from('mentorship_requests').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data, error } = await query;
    if (error) {
      setRequests([]);
      setQueryError(error.message);
      setLoading(false);
      return;
    }

    const requestRows = (data || []) as MentorshipRequest[];
    const profileIds = [...new Set(requestRows.flatMap((request) => [request.student_id, request.mentor_id]))];
    const { data: profileRows, error: profileError } = profileIds.length > 0
      ? await supabase.from('profiles').select('id, full_name, email, role, avatar_url, phone, is_active, created_at, updated_at').in('id', profileIds)
      : { data: [], error: null };

    if (profileError) {
      setRequests(requestRows as RequestWithProfiles[]);
      setQueryError(`Requests loaded, but participant names could not be loaded: ${profileError.message}`);
    } else {
      const profilesById = new Map((profileRows || []).map((participant) => [participant.id, participant as Profile]));
      setRequests(requestRows.map((request) => ({
        ...request,
        student_profile: profilesById.get(request.student_id),
        mentor_profile: profilesById.get(request.mentor_id),
      })));
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
    const channel = supabase
      .channel('admin-mentorship-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mentorship_requests' }, () => fetchRequests())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchRequests]);

  const statusConfig = {
    pending: { label: 'Pending', variant: 'warning' as const, icon: Clock },
    accepted: { label: 'Accepted', variant: 'success' as const, icon: Check },
    declined: { label: 'Declined', variant: 'error' as const, icon: X },
    proposed_time: { label: 'Time Proposed', variant: 'info' as const, icon: Calendar },
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>;
  }

  return (
    <div className="space-y-4">
      {queryError && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {queryError}
        </div>
      )}
      <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-xs">
        <option value="all">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="accepted">Accepted</option>
        <option value="declined">Declined</option>
        <option value="proposed_time">Time Proposed</option>
      </Select>

      {requests.length === 0 ? (
        <EmptyState icon={<Inbox size={32} />} title="No requests found" description="Mentorship requests will appear here." />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const config = statusConfig[req.status];
            const StatusIcon = config.icon;
            return (
              <Card key={req.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-white/40 text-xs">
                      <span className="text-white/60 font-medium">{req.student_profile?.full_name}</span>
                      <span className="mx-1">→</span>
                      <span className="text-white/60 font-medium">{req.mentor_profile?.full_name}</span>
                    </div>
                  </div>
                  <Badge variant={config.variant}><StatusIcon size={12} /> {config.label}</Badge>
                </div>
                <div className="text-xs">
                  <span className="text-white/40">Goal: </span><span className="text-white/70">{req.goal}</span>
                </div>
                <div className="text-xs mt-1">
                  <span className="text-white/40">Message: </span><span className="text-white/50">{req.message}</span>
                </div>
                <div className="text-white/20 text-[10px] mt-2">{new Date(req.created_at).toLocaleString()}</div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
