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

        console.log('Getting user profile for:', user.email);

        // Fetch user profile from our profiles table
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // Profile doesn't exist yet, create it
            console.log('Creating new profile for user:', user.id);
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
          console.log('Found existing profile with role:', profile.role);
          setUserRole(profile.role);
        }

        // After profile is set up, check for pending executor token
        await handlePendingExecutorInvitation();

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

  const handlePendingExecutorInvitation = async () => {
    const pendingToken = localStorage.getItem('pendingExecutorToken');
    if (!pendingToken || !user) {
      return;
    }

    console.log('Processing pending executor token:', pendingToken);

    try {
      // Get the invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from('executor_invitations')
        .select(`
          id,
          executor:executors!inner(
            id,
            name,
            email,
            planner_id,
            status
          )
        `)
        .eq('token', pendingToken)
        .single();

      if (inviteError || !invitation) {
        console.error('Error fetching invitation:', inviteError);
        localStorage.removeItem('pendingExecutorToken');
        return;
      }

      console.log('Found invitation:', invitation);

      // Check if the signed-in user's email matches the invitation
      if (user.email !== invitation.executor.email) {
        console.error('Email mismatch:', user.email, 'vs', invitation.executor.email);
        toast({
          title: "Email mismatch",
          description: "The signed-in account doesn't match the invitation email.",
          variant: "destructive"
        });
        localStorage.removeItem('pendingExecutorToken');
        return;
      }

      // Check if already accepted
      if (invitation.executor.status === 'active') {
        console.log('Invitation already accepted');
        localStorage.removeItem('pendingExecutorToken');
        toast({
          title: "Already accepted",
          description: "This executor invitation has already been accepted.",
        });
        return;
      }

      console.log('Updating executor status to active...');

      // Update executor status to active
      const { error: updateError } = await supabase
        .from('executors')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.executor.id);

      if (updateError) {
        console.error('Error updating executor status:', updateError);
        toast({
          title: "Error",
          description: "Failed to accept executor invitation. Please try again.",
          variant: "destructive"
        });
        return;
      }

      console.log('Executor status updated successfully');

      // Delete the invitation token (it's been used)
      await supabase
        .from('executor_invitations')
        .delete()
        .eq('token', pendingToken);

      // Log the acceptance
      await supabase
        .from('activity_log')
        .insert([
          {
            user_id: invitation.executor.planner_id,
            action_type: 'executor_accepted',
            details: `Executor ${invitation.executor.name} accepted invitation (existing user)`,
          }
        ]);

      // Remove the token from localStorage
      localStorage.removeItem('pendingExecutorToken');

      // Update user role to include executor capabilities
      // Check if user already has executor role or if we need to update
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (currentProfile?.role === 'planner') {
        // User is already a planner, they can also be an executor
        // No need to change role, they can access both dashboards
        console.log('User is planner, can also serve as executor');
      } else {
        // Update role to executor if they weren't a planner
        await supabase
          .from('profiles')
          .update({ role: 'executor' })
          .eq('id', user.id);
        
        setUserRole('executor');
      }

      toast({
        title: "Executor invitation accepted! ✅",
        description: "You now have executor access. You can access planning documents when needed.",
      });

      // Refresh the page to update the UI
      window.location.reload();

    } catch (error) {
      console.error('Error handling pending executor invitation:', error);
      localStorage.removeItem('pendingExecutorToken');
      toast({
        title: "Error",
        description: "Failed to process executor invitation. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event, session?.user?.email);
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