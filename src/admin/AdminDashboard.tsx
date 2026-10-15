import { useState } from 'react';
import { DashboardLayout, type NavItem } from '@/components/DashboardLayout';
import { AdminApprovalsTab } from './AdminApprovalsTab';
import { AdminRequestsTab } from './AdminRequestsTab';
import { AdminSessionsTab } from './AdminSessionsTab';
import { AdminFeedbackTab } from './AdminFeedbackTab';
import { AdminUsersTab } from './AdminUsersTab';
import { ShieldCheck, Inbox, Calendar, Star, Users } from 'lucide-react';

const navItems: NavItem[] = [
  { id: 'approvals', label: 'Mentor Approvals', icon: ShieldCheck },
  { id: 'requests', label: 'All Requests', icon: Inbox },
  { id: 'sessions', label: 'Sessions', icon: Calendar },
  { id: 'feedback', label: 'Feedback Stats', icon: Star },
  { id: 'users', label: 'Users', icon: Users },
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('approvals');

  return (
    <DashboardLayout navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} roleLabel="Admin">
      {activeTab === 'approvals' && <AdminApprovalsTab />}
      {activeTab === 'requests' && <AdminRequestsTab />}
      {activeTab === 'sessions' && <AdminSessionsTab />}
      {activeTab === 'feedback' && <AdminFeedbackTab />}
      {activeTab === 'users' && <AdminUsersTab />}
    </DashboardLayout>
  );
}
