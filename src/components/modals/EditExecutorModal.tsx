import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../ui/toast';

interface Executor {
  id: string;
  name: string;
  email: string;
  relationship: string | null;
  status: 'pending' | 'active' | 'revoked';
}

interface EditExecutorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  executor: Executor | null;
}

export function EditExecutorModal({ open, onOpenChange, onSuccess, executor }: EditExecutorModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    relationship: '',
  });

  useEffect(() => {
    if (executor) {
      setFormData({
        name: executor.name,
        email: executor.email,
        relationship: executor.relationship || '',
      });
    }
  }, [executor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!executor) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('executors')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', executor.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Executor updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating executor:', error);
      toast({
        title: "Error",
        description: "Failed to update executor. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Executor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter executor's full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email Address *</label>
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
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-2">⚠️ Important Note</h4>
            <p className="text-sm text-amber-800">
              Changing the email address will require the executor to accept a new invitation 
              if they haven't already accepted the original one.
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Executor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}