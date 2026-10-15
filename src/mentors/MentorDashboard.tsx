import { useState } from 'react';
import { DashboardLayout, type NavItem } from '@/components/DashboardLayout';
import { MentorProfileTab } from './MentorProfileTab';
import { MentorRequestsTab } from './MentorRequestsTab';
import { MentorMatchesTab } from './MentorMatchesTab';
import { MentorProgressTab } from './MentorProgressTab';
import { Users, Send, Inbox, Target } from 'lucide-react';

const navItems: NavItem[] = [
  { id: 'profile', label: 'My Profile', icon: Users },
  { id: 'requests', label: 'Requests', icon: Inbox },
  { id: 'matches', label: 'My Mentees', icon: Send },
  { id: 'progress', label: 'Progress', icon: Target },
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
      {activeTab === 'progress' && <MentorProgressTab />}
    </DashboardLayout>
  );
}
