import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { AuthPage } from '@/auth/AuthPage';
import { StudentDashboard } from '@/students/StudentDashboard';
import { MentorDashboard } from '@/mentors/MentorDashboard';
import { AdminDashboard } from '@/admin/AdminDashboard';
import { PageLoader } from '@/components/ui';
import { LandingPage } from '@/public/LandingPage';
import { useState } from 'react';

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return <PageLoader />;
  }

  if (!session || !profile) {
    return showAuth
      ? <AuthPage onBackToLanding={() => setShowAuth(false)} />
      : <LandingPage onGetStarted={() => setShowAuth(true)} onSignIn={() => setShowAuth(true)} />;
  }

  if (profile.role === 'student') {
    return <StudentDashboard />;
  }

  if (profile.role === 'mentor') {
    return <MentorDashboard />;
  }

  if (profile.role === 'admin') {
    return <AdminDashboard />;
  }

  return <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
