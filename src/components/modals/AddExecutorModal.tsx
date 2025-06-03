import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AddExecutorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddExecutorModal({ open, onOpenChange, onSuccess }: AddExecutorModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    relationship: '',
    access_level: 'standard',
    notification_method: 'email',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create executor record
      const { data: executor, error: executorError } = await supabase
        .from('executors')
        .insert([
          {
            planner_id: user?.id,
            name: formData.name,
            email: formData.email,
            relationship: formData.relationship,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (executorError) throw executorError;

      // Create trigger event for this executor
      const { error: triggerError } = await supabase
        .from('trigger_events')
        .insert([
          {
            user_id: user?.id,
            type: 'death',
            verification_method: 'professional',
            executor_id: executor.id
          }
        ]);

      if (triggerError) throw triggerError;

      // Send invitation email through edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-executor-invitation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          executorId: executor.id,
          email: formData.email,
          name: formData.name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding executor:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Executor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter executor's full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter executor's email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Relationship</label>
            <Input
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              placeholder="e.g., Family member, Attorney, Friend"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Access Level</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={formData.access_level}
              onChange={(e) => setFormData({ ...formData, access_level: e.target.value })}
            >
              <option value="standard">Standard Access</option>
              <option value="limited">Limited Access</option>
              <option value="full">Full Access</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Notification Method</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={formData.notification_method}
              onChange={(e) => setFormData({ ...formData, notification_method: e.target.value })}
            >
              <option value="email">Email Only</option>
              <option value="sms">SMS + Email</option>
            </select>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}