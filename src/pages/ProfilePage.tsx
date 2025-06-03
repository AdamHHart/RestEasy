import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { User, Mail, Shield, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    email: user?.email || '',
    role: userRole || '',
  });

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', user?.id);

      if (error) throw error;
      setSuccessMessage('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-calm-500" />
              Account Information
            </CardTitle>
            <CardDescription>
              Manage your account settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{profile.email}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Account Role
              </label>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="capitalize text-gray-600">{profile.role}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-calm-500" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your security settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {/* Implement password change */}}
            >
              Change Password
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {/* Implement 2FA setup */}}
            >
              Enable Two-Factor Authentication
            </Button>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-600">
            <Shield className="h-5 w-5" />
            {successMessage}
          </div>
        )}
      </div>
    </div>
  );
}