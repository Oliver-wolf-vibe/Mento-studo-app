import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button, Input, Select, Card, Badge, Modal, Textarea, EmptyState, Spinner } from '@/components/ui';
import type { MentorProfile, Profile } from '@/lib/types';
import { Search, Linkedin, MapPin, Clock, Users, Send, Filter } from 'lucide-react';

interface MentorWithProfile extends MentorProfile {
  profiles?: Profile;
}

export function MentorSearchTab() {
  const { profile } = useAuth();
  const [mentors, setMentors] = useState<MentorWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');
  const [filterExpertise, setFilterExpertise] = useState('all');
  const [selectedMentor, setSelectedMentor] = useState<MentorWithProfile | null>(null);
  const [requestGoal, setRequestGoal] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('mentor_profiles')
      .select('*, profiles!mentor_profiles_user_id_fkey(*)')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (filterAvailability !== 'all') {
      query = query.eq('availability', filterAvailability);
    }
    if (filterDept !== 'all') {
      query = query.eq('department', filterDept);
    }

    const { data } = await query;
    if (data) {
      let filtered = data as MentorWithProfile[];

      if (filterExpertise !== 'all') {
        filtered = filtered.filter((m) =>
          m.expertise_tags?.some((tag) => tag.toLowerCase().includes(filterExpertise.toLowerCase()))
        );
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.profiles?.full_name?.toLowerCase().includes(q) ||
            m.organization?.toLowerCase().includes(q) ||
            m.designation?.toLowerCase().includes(q) ||
            m.expertise_tags?.some((tag) => tag.toLowerCase().includes(q)) ||
            m.bio?.toLowerCase().includes(q)
        );
      }

      setMentors(filtered);
    }
    setLoading(false);
  }, [filterDept, filterAvailability, filterExpertise, searchQuery]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const handleSendRequest = async () => {
    if (!selectedMentor || !profile || !requestGoal.trim() || !requestMessage.trim()) return;
    setSending(true);

    const { error } = await supabase.from('mentorship_requests').insert({
      student_id: profile.id,
      mentor_id: selectedMentor.user_id,
      goal: requestGoal.trim(),
      message: requestMessage.trim(),
    });

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: selectedMentor.user_id,
        type: 'new_request',
        title: `New mentorship request from ${profile.full_name}`,
        body: requestGoal.trim().substring(0, 80),
      });
      setSendSuccess(true);
      setTimeout(() => {
        setSelectedMentor(null);
        setRequestGoal('');
        setRequestMessage('');
        setSendSuccess(false);
      }, 2000);
    }

    setSending(false);
  };

  const allExpertise = Array.from(
    new Set(mentors.flatMap((m) => m.expertise_tags || []))
  ).sort();

  const allDepartments = Array.from(
    new Set(mentors.map((m) => m.department))
  ).sort();

  const availabilityColors = {
    Available: 'success' as const,
    Limited: 'warning' as const,
    Unavailable: 'error' as const,
  };

  return (
    <div className="space-y-6">
      {/* Search & filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mentors by name, expertise, organization..."
              className="w-full bg-neutral-800 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
              <option value="all">All Departments</option>
              {allDepartments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
            <Select value={filterAvailability} onChange={(e) => setFilterAvailability(e.target.value)}>
              <option value="all">All Availability</option>
              <option value="Available">Available</option>
              <option value="Limited">Limited</option>
              <option value="Unavailable">Unavailable</option>
            </Select>
            <Select value={filterExpertise} onChange={(e) => setFilterExpertise(e.target.value)}>
              <option value="all">All Expertise</option>
              {allExpertise.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="w-6 h-6" />
        </div>
      ) : mentors.length === 0 ? (
        <EmptyState
          icon={<Filter size={32} />}
          title="No mentors found"
          description="Try adjusting your search or filters to find available mentors."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mentors.map((mentor) => (
            <Card
              key={mentor.id}
              className="p-5 hover:border-white/20 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3 mb-3">
                {mentor.profiles?.avatar_url ? (
                  <img
                    src={mentor.profiles.avatar_url}
                    alt={mentor.profiles.full_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold">
                    {mentor.profiles?.full_name?.charAt(0).toUpperCase() || 'M'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm truncate">
                    {mentor.profiles?.full_name}
                  </h3>
                  <p className="text-white/50 text-xs truncate">{mentor.designation} at {mentor.organization}</p>
                </div>
                <Badge variant={availabilityColors[mentor.availability]}>
                  {mentor.availability}
                </Badge>
              </div>

              {mentor.bio && (
                <p className="text-white/40 text-xs mb-3 line-clamp-2">{mentor.bio}</p>
              )}

              {mentor.expertise_tags && mentor.expertise_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {mentor.expertise_tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-white/5 text-white/60 rounded-full text-[10px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                  {mentor.expertise_tags.length > 4 && (
                    <span className="px-2 py-0.5 text-white/30 text-[10px]">
                      +{mentor.expertise_tags.length - 4} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 text-white/30 text-[10px] mb-3">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {mentor.current_mentee_count}/{mentor.max_mentees} mentees
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {mentor.mentoring_format}
                </span>
                {mentor.linkedin_url && (
                  <a
                    href={mentor.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-white/60"
                  >
                    <Linkedin size={12} /> LinkedIn
                  </a>
                )}
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={() => setSelectedMentor(mentor)}
                disabled={mentor.availability === 'Unavailable' || mentor.current_mentee_count >= mentor.max_mentees}
              >
                <Send size={14} /> Request Mentorship
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Request modal */}
      <Modal
        open={!!selectedMentor}
        onClose={() => setSelectedMentor(null)}
        title="Send Mentorship Request"
      >
        {sendSuccess ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send size={28} />
            </div>
            <h3 className="text-white font-semibold mb-1">Request Sent!</h3>
            <p className="text-white/40 text-sm">Your request has been sent to {selectedMentor?.profiles?.full_name}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedMentor && (
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                {selectedMentor.profiles?.avatar_url ? (
                  <img src={selectedMentor.profiles.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold text-sm">
                    {selectedMentor.profiles?.full_name?.charAt(0).toUpperCase() || 'M'}
                  </div>
                )}
                <div>
                  <div className="text-white text-sm font-medium">{selectedMentor.profiles?.full_name}</div>
                  <div className="text-white/40 text-xs">{selectedMentor.designation} at {selectedMentor.organization}</div>
                </div>
              </div>
            )}

            <Textarea
              label="Your Goal"
              value={requestGoal}
              onChange={(e) => setRequestGoal(e.target.value)}
              placeholder="What do you want to achieve through this mentorship?"
              rows={2}
              required
            />
            <Textarea
              label="Message to Mentor"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Introduce yourself and explain why you're requesting this mentor..."
              rows={4}
              required
            />

            <Button
              size="lg"
              className="w-full"
              onClick={handleSendRequest}
              disabled={sending || !requestGoal.trim() || !requestMessage.trim()}
            >
              {sending ? 'Sending...' : 'Send Request'}
              {!sending && <Send size={16} />}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
