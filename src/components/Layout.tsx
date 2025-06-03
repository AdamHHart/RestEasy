import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to auth if not logged in
    if (!loading && !user && location.pathname !== '/auth') {
      navigate('/auth');
    }
  }, [user, loading, navigate, location]);

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

  // Don't render layout for unauthenticated users
  if (!user) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
}