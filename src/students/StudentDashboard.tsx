import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout, type NavItem } from '@/components/DashboardLayout';
import { StudentProfileTab } from './StudentProfileTab';
import { MentorSearchTab } from './MentorSearchTab';
import { StudentRequestsTab } from './StudentRequestsTab';
import { StudentMatchesTab } from './StudentMatchesTab';
import { StudentFeedbackTab } from './StudentFeedbackTab';
import { StudentProgressTab } from './StudentProgressTab';
import { GraduationCap, Search, Send, Users, Star, Target } from 'lucide-react';

const navItems: NavItem[] = [
  { id: 'profile', label: 'My Profile', icon: GraduationCap },
  { id: 'search', label: 'Find Mentors', icon: Search },
  { id: 'requests', label: 'My Requests', icon: Send },
  { id: 'matches', label: 'My Mentors', icon: Users },
  { id: 'feedback', label: 'Feedback', icon: Star },
  { id: 'progress', label: 'Progress', icon: Target },
];

export function StudentDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  const checkProfile = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', profile.id)
      .maybeSingle();
    setHasProfile(!!data);
  }, [profile]);

  useEffect(() => {
    checkProfile();
  }, [checkProfile]);

  return (
    <DashboardLayout
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      roleLabel="Student"
    >
      {activeTab === 'profile' && (
        <StudentProfileTab
          hasProfile={hasProfile}
          onProfileSaved={() => {
            setHasProfile(true);
            checkProfile();
            setActiveTab('search');
          }}
        />
      )}
      {activeTab === 'search' && <MentorSearchTab />}
      {activeTab === 'requests' && <StudentRequestsTab />}
      {activeTab === 'matches' && <StudentMatchesTab />}
      {activeTab === 'feedback' && <StudentFeedbackTab />}
      {activeTab === 'progress' && <StudentProgressTab />}
    </DashboardLayout>
  );
}
