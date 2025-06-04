import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from '../components/ui/toast';

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
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // Profile doesn't exist yet, create it
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([
                { id: user.id, role: 'planner' }
              ]);

            if (insertError) {
              toast({
                title: "Error",
                description: "Failed to create user profile. Please try again.",
                variant: "destructive"
              });
              console.error('Error creating user profile:', insertError);
              await supabase.auth.signOut();
              navigate('/auth');
              return;
            }
            setUserRole('planner');
          } else {
            toast({
              title: "Error",
              description: "Failed to fetch user profile. Please try again.",
              variant: "destructive"
            });
            console.error('Error fetching user profile:', fetchError);
          }
        } else if (profile) {
          setUserRole(profile.role);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    }

    getUserProfile();
  }, [user, navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
      console.error('Error signing out:', error);
    }
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