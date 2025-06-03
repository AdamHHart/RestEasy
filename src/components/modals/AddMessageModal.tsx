import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AddMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddMessageModal({ open, onOpenChange, onSuccess }: AddMessageModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_email: '',
    relationship: '',
    subject: '',
    content: '',
    draft: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('personal_messages').insert([
        {
          user_id: user?.id,
          ...formData,
        },
      ]);

      if (error) throw error;
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Message</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Recipient Name</label>
            <Input
              required
              value={formData.recipient_name}
              onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Recipient Email</label>
            <Input
              type="email"
              required
              value={formData.recipient_email}
              onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Relationship</label>
            <Input
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <Input
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[200px]"
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({ ...formData, draft: true });
                handleSubmit;
              }}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              onClick={() => setFormData({ ...formData, draft: false })}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Message'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}