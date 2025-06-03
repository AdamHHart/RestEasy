import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userRole: string | null;
  signOut: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ 
  children,
  session: initialSession
}: { 
  children: ReactNode;
  session: Session | null;
}) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [user, setUser] = useState<User | null>(initialSession?.user || null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function getUserProfile() {
      try {
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch user profile from our profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Profile doesn't exist yet, create it
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([
                { id: user.id, role: 'planner' }
              ])
              .single();

            if (insertError) {
              console.error('Error creating user profile:', insertError);
            } else {
              setUserRole('planner');
            }
          } else {
            console.error('Error fetching user profile:', error);
          }
        } else if (data) {
          setUserRole(data.role);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    }

    getUserProfile();
  }, [user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const value = {
    session,
    user,
    userRole,
    signOut,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}