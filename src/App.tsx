import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { AuthPage } from '@/auth/AuthPage';
import { StudentDashboard } from '@/students/StudentDashboard';
import { MentorDashboard } from '@/mentors/MentorDashboard';
import { AdminDashboard } from '@/admin/AdminDashboard';
import { PageLoader } from '@/components/ui';

function AppContent() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!session || !profile) {
    return <AuthPage />;
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
