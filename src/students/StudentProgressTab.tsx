import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchProfilesByIds } from '@/lib/profileLookup';
import { Badge, Button, Card, EmptyState, Input, Spinner, Textarea } from '@/components/ui';
import type { Match, PointLedgerEntry, ProgressUpdate, Profile } from '@/lib/types';
import { Award, BookOpen, Plus, Target } from 'lucide-react';

interface MatchWithMentor extends Match {
  mentor_profile?: Profile;
}

const POINTS: Record<string, number> = {
  session_completed: 25,
  feedback_submitted: 10,
  progress_posted: 15,
};

export function StudentProgressTab() {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<MatchWithMentor[]>([]);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [ledger, setLedger] = useState<PointLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [matchId, setMatchId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const [{ data: matchData }, { data: updateData }, { data: ledgerData }] = await Promise.all([
      supabase
        .from('matches')
        .select('*')
        .eq('student_id', profile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase
        .from('progress_updates')
        .select('*')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('point_ledger')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false }),
    ]);
    const matchRows = (matchData || []) as Match[];
    const { profiles } = await fetchProfilesByIds(matchRows.map((match) => match.mentor_id));
    const nextMatches = matchRows.map((match) => ({
      ...match,
      mentor_profile: profiles.get(match.mentor_id),
    })) as MatchWithMentor[];
    setMatches(nextMatches);
    setUpdates((updateData || []) as ProgressUpdate[]);
    setLedger((ledgerData || []) as PointLedgerEntry[]);
    if (!matchId && nextMatches[0]) setMatchId(nextMatches[0].id);
    setLoading(false);
  }, [profile, matchId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const submitUpdate = async () => {
    if (!profile || !matchId || !title.trim() || !body.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('progress_updates')
      .insert({
        student_id: profile.id,
        match_id: matchId,
        title: title.trim(),
        body: body.trim(),
        evidence_url: evidenceUrl.trim() || null,
      })
      .select()
      .single();

    if (!error && data) {
      await supabase.rpc('award_points', {
        p_user_id: profile.id,
        p_event_type: 'progress_posted',
        p_points: POINTS.progress_posted,
        p_reference_id: data.id,
        p_idempotency_key: `progress_posted:${data.id}`,
      });
      setTitle('');
      setBody('');
      setEvidenceUrl('');
      setShowForm(false);
      fetchData();
    }
    setSubmitting(false);
  };

  const points = ledger.reduce((total, entry) => total + entry.points, 0);
  const tier = points >= 150 ? 'Role Model' : points >= 75 ? 'Momentum Builder' : points >= 30 ? 'Committed' : 'Getting Started';

  if (loading) return <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4"><div className="flex items-center gap-2 text-white/50 text-xs"><Award size={15} /> Recognition</div><div className="text-white text-2xl font-bold mt-2">{points}</div><Badge variant="info">{tier}</Badge></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-white/50 text-xs"><Target size={15} /> Progress posts</div><div className="text-white text-2xl font-bold mt-2">{updates.length}</div><p className="text-white/35 text-xs mt-1">Keep your mentors in the loop</p></Card>
      </div>

      <div className="flex items-center justify-between">
        <div><h2 className="text-white font-semibold">My progress</h2><p className="text-white/40 text-xs mt-1">Turn each mentoring conversation into a next step.</p></div>
        {matches.length > 0 && <Button size="sm" onClick={() => setShowForm((value) => !value)}><Plus size={15} /> Post update</Button>}
      </div>

      {showForm && (
        <Card className="p-4 space-y-4">
          <select value={matchId} onChange={(event) => setMatchId(event.target.value)} className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3.5 py-2.5 text-white">
            {matches.map((match) => <option key={match.id} value={match.id}>With {match.mentor_profile?.full_name || 'your mentor'}</option>)}
          </select>
          <Input label="What did you accomplish?" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Completed my portfolio outline" maxLength={120} />
          <Textarea label="Progress details" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share what changed, what you learned, and your next step." rows={4} maxLength={4000} />
          <Input label="Evidence link (optional)" value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="https://..." type="url" />
          <Button onClick={submitUpdate} disabled={submitting || !title.trim() || !body.trim()}>{submitting ? <Spinner className="w-4 h-4" /> : <BookOpen size={15} />} Publish progress</Button>
        </Card>
      )}

      {updates.length === 0 ? (
        <EmptyState icon={<Target size={32} />} title="No progress updates yet" description="Share your first meaningful step after connecting with a mentor." />
      ) : updates.map((update) => (
        <Card key={update.id} className="p-4">
          <div className="flex items-start justify-between gap-3"><div><h3 className="text-white font-medium">{update.title}</h3><p className="text-white/30 text-xs mt-1">{new Date(update.created_at).toLocaleDateString()}</p></div><Badge variant="success">+{POINTS.progress_posted} pts</Badge></div>
          <p className="text-white/60 text-sm mt-3 whitespace-pre-wrap">{update.body}</p>
          {update.evidence_url && <a href={update.evidence_url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs mt-3 inline-block hover:underline">View evidence</a>}
          {update.mentor_advice && <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"><p className="text-blue-300 text-xs font-medium">Mentor advice</p><p className="text-white/60 text-sm mt-1">{update.mentor_advice}</p></div>}
        </Card>
      ))}
    </div>
  );
}