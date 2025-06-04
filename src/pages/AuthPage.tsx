import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Lock, Mail, ShieldCheck, ArrowLeft } from 'lucide-react';
import { toast } from '../components/ui/toast';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
      } else if (mode === 'signup') {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              role: 'planner',
            },
          },
        });
        
        if (signUpError) throw signUpError;
        
        if (data.user) {
          toast({
            title: "Success",
            description: "Please check your email to verify your account.",
          });
          setMode('signin');
        }
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Password reset instructions sent to your email.",
        });
        setMode('signin');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-calm-300 to-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="h-16 w-16 text-calm-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Rest Easy</h1>
          <p className="text-muted-foreground">
            Secure end-of-life planning made simple
          </p>
        </div>
        
        <Card className="w-full shadow-lg border-none">
          <CardHeader>
            <CardTitle>
              {mode === 'signin' ? 'Sign in to your account' : 
               mode === 'signup' ? 'Create an account' : 
               'Reset your password'}
            </CardTitle>
            <CardDescription>
              {mode === 'signin' 
                ? 'Enter your email and password to access your secure vault'
                : mode === 'signup'
                ? 'Sign up to start planning and organizing your important information'
                : 'Enter your email to receive password reset instructions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              {mode !== 'reset' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-calm-500 hover:bg-calm-600 text-white"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {mode === 'signin' ? 'Signing in...' : 
                     mode === 'signup' ? 'Creating account...' :
                     'Sending reset instructions...'}
                  </span>
                ) : (
                  <>{mode === 'signin' ? 'Sign in' : 
                     mode === 'signup' ? 'Create account' :
                     'Send reset instructions'}</>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center text-muted-foreground">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-calm-600 hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-calm-600 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-calm-600 hover:underline font-medium flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </button>
              )}
            </div>
            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => setMode('reset')}
                className="text-sm text-calm-600 hover:underline font-medium"
              >
                Forgot your password?
              </button>
            )}
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Rest Easy secures your data with end-to-end encryption</p>
        </div>
      </div>
    </div>
  );
}