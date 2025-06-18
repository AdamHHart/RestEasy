import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShieldCheck, CheckCircle, AlertCircle, UserCheck, Mail, Lock } from 'lucide-react';
import { toast } from '../components/ui/toast';

interface InvitationData {
  id: string;
  executor: {
    id: string;
    name: string;
    email: string;
    relationship: string;
    planner_id: string;
  };
  expires_at: string;
  valid: boolean;
}

export default function ExecutorAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'verify' | 'account-setup' | 'complete'>('verify');
  const [accountData, setAccountData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    isExistingUser: false,
  });

  useEffect(() => {
    if (token) {
      verifyInvitation();
    }
  }, [token]);

  const verifyInvitation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verify the invitation token
      const { data, error } = await supabase
        .from('executor_invitations')
        .select(`
          id,
          expires_at,
          executor:executors!inner(
            id,
            name,
            email,
            relationship,
            planner_id,
            status
          )
        `)
        .eq('token', token)
        .single();

      if (error) {
        throw new Error('Invalid or expired invitation link');
      }

      // Check if invitation has expired
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      
      if (now > expiresAt) {
        throw new Error('This invitation has expired. Please contact the person who invited you for a new invitation.');
      }

      // Check if already accepted
      if (data.executor.status === 'active') {
        setStep('complete');
        setInvitation({ ...data, valid: true });
        return;
      }

      setInvitation({ ...data, valid: true });
      setAccountData(prev => ({ ...prev, email: data.executor.email }));
      setStep('account-setup');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation) return;

    try {
      setAccepting(true);

      if (accountData.isExistingUser) {
        // Handle existing user - they need to sign in first
        toast({
          title: "Please sign in",
          description: "Sign in to your existing account to accept this executor invitation.",
        });
        
        // Store the token in localStorage so we can complete the process after sign in
        localStorage.setItem('pendingExecutorToken', token!);
        navigate('/auth');
        return;
      }

      // Handle new user account creation
      if (accountData.password !== accountData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (accountData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: accountData.email,
        password: accountData.password,
        options: {
          data: {
            role: 'executor',
            name: invitation.executor.name,
          },
        },
      });

      if (authError) {
        // If user already exists, they should sign in instead
        if (authError.message.includes('User already registered')) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in instead.",
          });
          setAccountData(prev => ({ ...prev, isExistingUser: true }));
          return;
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      // Create or update profile for the new user
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          role: 'executor'
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't fail the process if profile creation fails
      }

      // Update executor status to active
      const { error: updateError } = await supabase
        .from('executors')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.executor.id);

      if (updateError) {
        throw updateError;
      }

      // Delete the invitation token (it's been used)
      await supabase
        .from('executor_invitations')
        .delete()
        .eq('token', token);

      // Log the acceptance
      await supabase
        .from('activity_log')
        .insert([
          {
            user_id: invitation.executor.planner_id,
            action_type: 'executor_accepted',
            details: `Executor ${invitation.executor.name} accepted invitation (new user)`,
          }
        ]);

      toast({
        title: "Welcome to Ever Ease! ✅",
        description: "Your executor account has been created successfully. Please check your email to verify your account.",
      });

      setStep('complete');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-calm-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-pulse h-8 w-8 rounded-full bg-calm-400"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-calm-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Invalid Invitation</CardTitle>
            <CardDescription className="text-red-700">
              {error}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/auth')}
            >
              Go to Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-calm-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {step === 'account-setup' && invitation && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-calm-100 flex items-center justify-center">
                <UserCheck className="h-8 w-8 text-calm-600" />
              </div>
              <CardTitle className="text-2xl">Accept Executor Invitation</CardTitle>
              <CardDescription>
                You've been invited to serve as an executor by someone who trusts you with this important responsibility.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Invitation Details</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Your Name:</span>
                    <span className="font-medium">{invitation.executor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="font-medium">{invitation.executor.email}</span>
                  </div>
                  {invitation.executor.relationship && (
                    <div className="flex justify-between">
                      <span>Relationship:</span>
                      <span className="font-medium">{invitation.executor.relationship}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span className="font-medium">
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Account Setup</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      value={accountData.email}
                      disabled
                      className="pl-10 bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="new-user"
                      name="user-type"
                      checked={!accountData.isExistingUser}
                      onChange={() => setAccountData(prev => ({ ...prev, isExistingUser: false }))}
                      className="h-4 w-4 text-calm-600"
                    />
                    <label htmlFor="new-user" className="text-sm font-medium">
                      I'm new to Ever Ease - Create an account
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="existing-user"
                      name="user-type"
                      checked={accountData.isExistingUser}
                      onChange={() => setAccountData(prev => ({ ...prev, isExistingUser: true }))}
                      className="h-4 w-4 text-calm-600"
                    />
                    <label htmlFor="existing-user" className="text-sm font-medium">
                      I already have an Ever Ease account
                    </label>
                  </div>
                </div>

                {!accountData.isExistingUser && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          type="password"
                          value={accountData.password}
                          onChange={(e) => setAccountData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Create a secure password"
                          className="pl-10"
                          minLength={8}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          type="password"
                          value={accountData.confirmPassword}
                          onChange={(e) => setAccountData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm your password"
                          className="pl-10"
                          minLength={8}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {accountData.isExistingUser && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">✅ Existing Account</h4>
                    <p className="text-sm text-blue-800">
                      You'll be redirected to sign in to your existing account. After signing in, 
                      the executor role will be added to your account automatically.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-900 mb-2">⚠️ Important Responsibilities</h4>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• You'll have access to sensitive planning documents</li>
                  <li>• You'll be responsible for carrying out their final wishes</li>
                  <li>• This access will only be activated when needed</li>
                  <li>• You can decline this responsibility at any time</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/auth')}
              >
                Decline
              </Button>
              <Button 
                className="flex-1 bg-calm-500 hover:bg-calm-600"
                onClick={handleAcceptInvitation}
                disabled={accepting || (!accountData.isExistingUser && (!accountData.password || !accountData.confirmPassword))}
              >
                {accepting ? 'Processing...' : accountData.isExistingUser ? 'Continue to Sign In' : 'Accept & Create Account'}
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 'complete' && (
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-900">Welcome to Ever Ease!</CardTitle>
              <CardDescription>
                Your executor account has been successfully created.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">✅ Success!</h3>
                <p className="text-sm text-green-800">
                  You now have executor access in Ever Ease. Please check your email to verify your account, 
                  then you'll be able to access planning documents and carry out responsibilities when the time comes.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">What happens next?</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-calm-500 mt-2 flex-shrink-0"></div>
                    <span>Check your email and click the verification link</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-calm-500 mt-2 flex-shrink-0"></div>
                    <span>You'll receive notifications about any updates to the planning documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-calm-500 mt-2 flex-shrink-0"></div>
                    <span>When needed, you'll have access to all necessary information and guidance</span>
                  </li>
                </ul>
              </div>
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full bg-calm-500 hover:bg-calm-600"
                onClick={() => navigate('/auth')}
              >
                Sign In to Your Account
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}