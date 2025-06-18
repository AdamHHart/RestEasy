import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PlusCircle, Trash2, Edit, Users, Mail, UserCheck, UserX, Shield } from 'lucide-react';
import { AddExecutorModal } from '../components/modals/AddExecutorModal';
import { EditExecutorModal } from '../components/modals/EditExecutorModal';
import { toast } from '../components/ui/toast';

interface Executor {
  id: string;
  name: string;
  email: string;
  relationship: string | null;
  status: 'pending' | 'active' | 'revoked';
  created_at: string;
}

interface TriggerEvent {
  id: string;
  type: 'incapacitation' | 'death';
  verification_method: 'professional' | 'manual';
  triggered: boolean;
  executor_id: string;
}

export default function ExecutorsPage() {
  const { user } = useAuth();
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [triggerEvents, setTriggerEvents] = useState<TriggerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedExecutor, setSelectedExecutor] = useState<Executor | null>(null);

  useEffect(() => {
    fetchExecutors();
  }, []);

  async function fetchExecutors() {
    try {
      setLoading(true);
      
      // Fetch executors
      const { data: executorsData, error: executorsError } = await supabase
        .from('executors')
        .select('*')
        .eq('planner_id', user?.id)
        .order('created_at', { ascending: false });

      if (executorsError) throw executorsError;
      setExecutors(executorsData || []);

      // Fetch trigger events
      const { data: triggersData, error: triggersError } = await supabase
        .from('trigger_events')
        .select('*')
        .eq('user_id', user?.id);

      if (triggersError) throw triggersError;
      setTriggerEvents(triggersData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching executors');
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (executor: Executor) => {
    setSelectedExecutor(executor);
    setIsEditModalOpen(true);
  };

  const handleRevokeAccess = async (executorId: string) => {
    if (!confirm('Are you sure you want to revoke access for this executor?')) return;

    try {
      const { error } = await supabase
        .from('executors')
        .update({ status: 'revoked' })
        .eq('id', executorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Executor access revoked successfully",
      });

      fetchExecutors();
    } catch (err) {
      console.error('Error revoking access:', err);
      toast({
        title: "Error",
        description: "Failed to revoke access. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (executorId: string) => {
    if (!confirm('Are you sure you want to delete this executor? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('executors')
        .delete()
        .eq('id', executorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Executor deleted successfully",
      });

      fetchExecutors();
    } catch (error) {
      console.error('Error deleting executor:', error);
      toast({
        title: "Error",
        description: "Failed to delete executor. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: Executor['status']) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800',
      active: 'bg-green-100 text-green-800',
      revoked: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const getStatusIcon = (status: Executor['status']) => {
    switch (status) {
      case 'pending':
        return <Users className="h-4 w-4 text-amber-600" />;
      case 'active':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'revoked':
        return <UserX className="h-4 w-4 text-red-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse h-8 w-8 rounded-full bg-calm-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="p-6 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executors</h1>
          <p className="text-gray-500 mt-1">Manage trusted individuals who can access your information</p>
        </div>
        
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsAddModalOpen(true)}
        >
          <PlusCircle className="h-5 w-5" />
          Add Executor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {executors.map((executor) => {
          const triggerEvent = triggerEvents.find(t => t.executor_id === executor.id);
          
          return (
            <Card key={executor.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{executor.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="h-4 w-4" />
                    {executor.email}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleEdit(executor)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-600"
                    onClick={() => handleDelete(executor.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(executor.status)}`}>
                  {getStatusIcon(executor.status)}
                  {executor.status}
                </span>
              </div>
              
              {executor.relationship && (
                <p className="text-sm text-gray-600 mb-3">
                  Relationship: {executor.relationship}
                </p>
              )}

              {executor.status === 'active' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleRevokeAccess(executor.id)}
                >
                  Revoke Access
                </Button>
              )}

              {triggerEvent && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Shield className="h-4 w-4 text-calm-500" />
                    Trigger Event
                  </div>
                  <p className="text-sm text-gray-600 mt-1 capitalize">
                    Type: {triggerEvent.type}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    Verification: {triggerEvent.verification_method}
                  </p>
                </div>
              )}
              
              <div className="text-xs text-gray-400 mt-4">
                Added {new Date(executor.created_at).toLocaleDateString()}
              </div>
            </Card>
          );
        })}
      </div>

      {executors.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">No executors added yet</p>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-5 w-5" />
            Add Your First Executor
          </Button>
        </Card>
      )}

      <AddExecutorModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={fetchExecutors}
      />

      <EditExecutorModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSuccess={fetchExecutors}
        executor={selectedExecutor}
      />
    </div>
  );
}