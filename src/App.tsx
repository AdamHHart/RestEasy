import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

// Components
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import OnboardingPage from './pages/OnboardingPage';
import ChecklistPage from './pages/ChecklistPage';
import AssetsPage from './pages/AssetsPage';
import DocumentsPage from './pages/DocumentsPage';
import WishesPage from './pages/WishesPage';
import ExecutorsPage from './pages/ExecutorsPage';
import ProfilePage from './pages/ProfilePage';
import LegalPage from './pages/LegalPage';
import EmailTestPage from './pages/EmailTestPage';
import NotFoundPage from './pages/NotFoundPage';

// Auth provider
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-pulse h-12 w-12 rounded-full bg-calm-400"></div>
          <p className="text-muted-foreground">Loading Rest Easy...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider session={session}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/email-test" element={<EmailTestPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="checklist" element={<ChecklistPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="wishes" element={<WishesPage />} />
          <Route path="executors" element={<ExecutorsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="legal" element={<LegalPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;