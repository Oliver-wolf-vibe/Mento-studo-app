import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button, Card, EmptyState, Spinner, Textarea } from '@/components/ui';
import type { ProgressUpdate } from '@/lib/types';
import { MessageSquare, Target } from 'lucide-react';

interface ProgressWithStudent extends ProgressUpdate {
  student_profile?: { full_name: string };
}

export function MentorProgressTab() {
  const { profile } = useAuth();
  const [updates, setUpdates] = useState<ProgressWithStudent[]>([]);
  const [advice, setAdvice] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUpdates = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data: matches } = await supabase.from('matches').select('id').eq('mentor_id', profile.id).eq('status', 'active');
    const matchIds = (matches || []).map((match) => match.id);
    if (matchIds.length === 0) { setUpdates([]); setLoading(false); return; }
    const { data } = await supabase
      .from('progress_updates')
      .select('*')
      .in('match_id', matchIds)
      .order('created_at', { ascending: false });
    setUpdates((data || []) as ProgressWithStudent[]);
    setLoading(false);
  }, [profile]);

  useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

  const saveAdvice = async (update: ProgressWithStudent) => {
    const value = advice[update.id]?.trim();
    if (!value) return;
    setSaving(update.id);
    const { error } = await supabase.from('progress_updates').update({ mentor_advice: value }).eq('id', update.id);
    if (!error) { setAdvice((current) => ({ ...current, [update.id]: '' })); fetchUpdates(); }
    setSaving(null);
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>;
  if (updates.length === 0) return <EmptyState icon={<Target size={32} />} title="No progress updates yet" description="Updates from your active mentees will appear here." />;

  return <div className="space-y-4">{updates.map((update) => (
    <Card key={update.id} className="p-4">
      <div className="flex items-start justify-between gap-3"><div><p className="text-white/50 text-xs">Mentee progress</p><h3 className="text-white font-semibold mt-1">{update.title}</h3><p className="text-white/30 text-xs mt-1">{new Date(update.created_at).toLocaleDateString()}</p></div><MessageSquare size={17} className="text-white/30" /></div>
      <p className="text-white/60 text-sm mt-3 whitespace-pre-wrap">{update.body}</p>
      {update.evidence_url && <a href={update.evidence_url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs mt-3 inline-block hover:underline">View evidence</a>}
      {update.mentor_advice && <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"><p className="text-blue-300 text-xs font-medium">Your previous advice</p><p className="text-white/60 text-sm mt-1">{update.mentor_advice}</p></div>}
      <div className="mt-4 space-y-2"><Textarea label="Add advice" value={advice[update.id] || ''} onChange={(event) => setAdvice((current) => ({ ...current, [update.id]: event.target.value }))} placeholder="Suggest one practical next step..." rows={3} /><Button size="sm" onClick={() => saveAdvice(update)} disabled={saving === update.id || !advice[update.id]?.trim()}>{saving === update.id ? <Spinner className="w-3 h-3" /> : 'Save advice'}</Button></div>
    </Card>
  ))}</div>;
}