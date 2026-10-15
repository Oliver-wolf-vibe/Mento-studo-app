import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout, type NavItem } from '@/components/DashboardLayout';
import { MentorProfileTab } from './MentorProfileTab';
import { MentorRequestsTab } from './MentorRequestsTab';
import { MentorMatchesTab } from './MentorMatchesTab';
import { Users, Send, FileText, Inbox } from 'lucide-react';

const navItems: NavItem[] = [
  { id: 'profile', label: 'My Profile', icon: Users },
  { id: 'requests', label: 'Requests', icon: Inbox },
  { id: 'matches', label: 'My Mentees', icon: Send },
];

export function MentorDashboard() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <DashboardLayout
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      roleLabel="Mentor"
    >
      {activeTab === 'profile' && <MentorProfileTab />}
      {activeTab === 'requests' && <MentorRequestsTab />}
      {activeTab === 'matches' && <MentorMatchesTab />}
    </DashboardLayout>
  );
}
