import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button, Input, Select, Textarea, Card, Badge } from '@/components/ui';
import type { MentorProfile } from '@/lib/types';
import { Upload, Check, X, Plus, Linkedin, Clock, Users, MapPin } from 'lucide-react';

const DEPARTMENTS = [
  'Computer Science Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence & Data Science',
  'Mechatronics',
  'Biomedical Engineering',
];

const FORMATS = ['In-Person', 'Online', 'Hybrid'];
const AVAILABILITY = ['Available', 'Limited', 'Unavailable'];

function TagInput({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim();
    if (t && !values.includes(t)) { onChange([...values, t]); setInput(''); }
  };
  return (
    <div>
      <label className="block text-sm font-medium text-white/70 mb-1.5">{label}</label>
      <div className="flex gap-2 mb-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder={placeholder}
          className="flex-1 bg-neutral-800 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30" />
        <Button type="button" variant="secondary" size="md" onClick={add}><Plus size={16} /></Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 text-white/80 rounded-full text-xs font-medium">
              {v}<button type="button" onClick={() => onChange(values.filter((s) => s !== v))} className="text-white/40 hover:text-white"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function MentorProfileTab() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [organization, setOrganization] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [expertiseTags, setExpertiseTags] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState<typeof AVAILABILITY[number]>('Available');
  const [mentoringFormat, setMentoringFormat] = useState<typeof FORMATS[number]>('In-Person');
  const [maxMentees, setMaxMentees] = useState(5);
  const [linkedinUrl, setLinkedinUrl] = useState('');

  const loadProfile = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setFullName(profile.full_name || '');
    setPhone(profile.phone || '');
    setAvatarUrl(profile.avatar_url || null);

    const { data: mp } = await supabase
      .from('mentor_profiles')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (mp) {
      const m = mp as MentorProfile;
      setHasProfile(true);
      setIsApproved(m.is_approved);
      setOrganization(m.organization || '');
      setDesignation(m.designation || '');
      setDepartment(m.department || DEPARTMENTS[0]);
      setExpertiseTags(m.expertise_tags || []);
      setBio(m.bio || '');
      setAvailability(m.availability || 'Available');
      setMentoringFormat(m.mentoring_format || 'In-Person');
      setMaxMentees(m.max_mentees || 5);
      setLinkedinUrl(m.linkedin_url || '');
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setAvatarUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${profile.id}/${profile.id}-${Date.now()}.${fileExt}`;
    const { error: upErr } = await supabase.storage.from('profile-photos').upload(filePath, file, { upsert: true });
    if (upErr) { setError(upErr.message); setAvatarUploading(false); return; }
    const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(filePath);
    setAvatarUrl(urlData.publicUrl);
    await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', profile.id);
    await refreshProfile();
    setAvatarUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error: pErr } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', profile.id);
    if (pErr) { setError(pErr.message); setSaving(false); return; }

    const payload = {
      user_id: profile.id,
      organization, designation, department,
      expertise_tags: expertiseTags,
      bio: bio || null,
      availability, mentoring_format: mentoringFormat,
      max_mentees: maxMentees,
      linkedin_url: linkedinUrl || null,
    };

    if (hasProfile) {
      const { error: uErr } = await supabase.from('mentor_profiles').update(payload).eq('user_id', profile.id);
      if (uErr) setError(uErr.message);
    } else {
      const { error: iErr } = await supabase.from('mentor_profiles').insert(payload);
      if (iErr) setError(iErr.message);
    }

    if (!error) {
      setSuccess(true);
      setHasProfile(true);
      await refreshProfile();
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="inline-block animate-spin rounded-full border-2 border-white/20 border-t-white w-6 h-6" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {hasProfile && (
        <div className="mb-6">
          {isApproved ? (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2">
              <Check size={18} className="text-green-400" />
              <span className="text-green-400 text-sm font-medium">Your profile is approved and visible to students.</span>
            </div>
          ) : (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-2">
              <Clock size={18} className="text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">Your profile is pending admin approval. You'll be notified once approved.</span>
            </div>
          )}
        </div>
      )}

      {!hasProfile && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
          <h3 className="text-white font-semibold text-sm mb-1">Complete Your Mentor Profile</h3>
          <p className="text-white/50 text-xs">Fill out your expertise and availability. An admin will review and approve your profile before it appears in student searches.</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-2xl font-bold">{fullName.charAt(0).toUpperCase() || '?'}</div>
              )}
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-white text-black rounded-full flex items-center justify-center cursor-pointer hover:bg-white/90 transition-colors">
                {avatarUploading ? <div className="inline-block animate-spin rounded-full border-2 border-black/20 border-t-black w-3 h-3" /> : <Upload size={14} />}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div><h3 className="text-white font-semibold text-sm">Profile Photo</h3><p className="text-white/40 text-xs mt-0.5">Click the icon to upload</p></div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/10 pb-3">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/10 pb-3">Professional Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Organization" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="e.g. Google, TCS" required />
            <Input label="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Senior Engineer" required />
          </div>
          <Select label="Department" value={department} onChange={(e) => setDepartment(e.target.value)}>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          <TagInput label="Expertise Tags" values={expertiseTags} onChange={setExpertiseTags} placeholder="e.g. Machine Learning, Web Dev, Career Guidance" />
          <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell students about your experience and mentoring style..." rows={4} />
          <Input label="LinkedIn URL" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/10 pb-3">Mentoring Preferences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Availability" value={availability} onChange={(e) => setAvailability(e.target.value as typeof AVAILABILITY[number])}>
              {AVAILABILITY.map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
            <Select label="Format" value={mentoringFormat} onChange={(e) => setMentoringFormat(e.target.value as typeof FORMATS[number])}>
              {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </Select>
            <Input label="Max Mentees" type="number" min={1} max={50} value={maxMentees} onChange={(e) => setMaxMentees(parseInt(e.target.value) || 1)} />
          </div>
        </Card>

        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</div>}

        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? 'Saving...' : hasProfile ? 'Update Profile' : 'Create Profile'}
          </Button>
          {success && <Badge variant="success" className="animate-slideInRight"><Check size={12} /> Saved</Badge>}
        </div>
      </form>
    </div>
  );
}
