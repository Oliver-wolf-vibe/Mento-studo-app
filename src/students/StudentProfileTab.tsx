import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button, Input, Select, Textarea, Card, Badge } from '@/components/ui';
import type { StudentProfile } from '@/lib/types';
import { Upload, Check, X, Plus } from 'lucide-react';

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

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Final Year'];

interface SkillInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}

function SkillInput({ label, values, onChange, placeholder }: SkillInputProps) {
  const [input, setInput] = useState('');

  const addSkill = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInput('');
    }
  };

  const removeSkill = (skill: string) => {
    onChange(values.filter((s) => s !== skill));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-white/70 mb-1.5">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSkill();
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-neutral-800 border border-white/10 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
        />
        <Button type="button" variant="secondary" size="md" onClick={addSkill}>
          <Plus size={16} />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 text-white/80 rounded-full text-xs font-medium"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="text-white/40 hover:text-white"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  hasProfile: boolean | null;
  onProfileSaved: () => void;
}

export function StudentProfileTab({ hasProfile, onProfileSaved }: Props) {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [year, setYear] = useState(YEARS[0]);
  const [careerGoals, setCareerGoals] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [startupIdea, setStartupIdea] = useState('');
  const [projects, setProjects] = useState('');

  const loadProfile = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    setFullName(profile.full_name || '');
    setPhone(profile.phone || '');
    setAvatarUrl(profile.avatar_url || null);

    const { data: sp } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (sp) {
      const s = sp as StudentProfile;
      setDepartment(s.department || DEPARTMENTS[0]);
      setYear(s.year || YEARS[0]);
      setCareerGoals(s.career_goals || '');
      setSkills(s.skills || []);
      setInterests(s.interests || []);
      setStartupIdea(s.startup_idea || '');
      setProjects(s.projects || '');
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setAvatarUploading(true);
    setError(null);

    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
    const filePath = `${profile.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError('Failed to upload photo: ' + uploadError.message);
      setAvatarUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    setAvatarUrl(publicUrl);

    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', profile.id);

    await refreshProfile();
    setAvatarUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', profile.id);

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    const payload = {
      user_id: profile.id,
      department,
      year,
      career_goals: careerGoals || null,
      skills,
      interests,
      startup_idea: startupIdea || null,
      projects: projects || null,
    };

    if (hasProfile) {
      const { error: updateError } = await supabase
        .from('student_profiles')
        .update(payload)
        .eq('user_id', profile.id);
      if (updateError) setError(updateError.message);
    } else {
      const { error: insertError } = await supabase
        .from('student_profiles')
        .insert(payload);
      if (insertError) setError(insertError.message);
    }

    if (!error) {
      setSuccess(true);
      await refreshProfile();
      onProfileSaved();
      setTimeout(() => setSuccess(false), 3000);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full border-2 border-white/20 border-t-white w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {!hasProfile && (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
          <h3 className="text-white font-semibold text-sm mb-1">Complete Your Profile</h3>
          <p className="text-white/50 text-xs">
            Fill out your details to start finding mentors. Your profile helps mentors understand your goals.
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Photo upload */}
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-2xl font-bold">
                  {fullName.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-white text-black rounded-full flex items-center justify-center cursor-pointer hover:bg-white/90 transition-colors">
                {avatarUploading ? (
                  <div className="inline-block animate-spin rounded-full border-2 border-black/20 border-t-black w-3 h-3" />
                ) : (
                  <Upload size={14} />
                )}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Profile Photo</h3>
              <p className="text-white/40 text-xs mt-0.5">Click the icon to upload a photo</p>
            </div>
          </div>
        </Card>

        {/* Basic info */}
        <Card className="p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/10 pb-3">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </div>
        </Card>

        {/* Academic info */}
        <Card className="p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/10 pb-3">Academic Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Department" value={department} onChange={(e) => setDepartment(e.target.value)}>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
            <Select label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </div>
        </Card>

        {/* Goals & skills */}
        <Card className="p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/10 pb-3">Goals & Expertise</h3>
          <Textarea
            label="Career Goals"
            value={careerGoals}
            onChange={(e) => setCareerGoals(e.target.value)}
            placeholder="What are your career aspirations?"
            rows={3}
          />
          <SkillInput label="Skills" values={skills} onChange={setSkills} placeholder="e.g. Python, React, UI/UX" />
          <SkillInput label="Interests" values={interests} onChange={setInterests} placeholder="e.g. AI, Robotics, Entrepreneurship" />
        </Card>

        {/* Startup & projects */}
        <Card className="p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm border-b border-white/10 pb-3">Innovation & Projects</h3>
          <Textarea
            label="Startup / Product Idea"
            value={startupIdea}
            onChange={(e) => setStartupIdea(e.target.value)}
            placeholder="Do you have a startup or product idea? Describe it here."
            rows={3}
          />
          <Textarea
            label="Projects"
            value={projects}
            onChange={(e) => setProjects(e.target.value)}
            placeholder="List your notable projects, achievements, or portfolio links."
            rows={4}
          />
        </Card>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? 'Saving...' : hasProfile ? 'Update Profile' : 'Create Profile'}
          </Button>
          {success && (
            <Badge variant="success" className="animate-slideInRight">
              <Check size={12} /> Saved successfully
            </Badge>
          )}
        </div>
      </form>
    </div>
  );
}
