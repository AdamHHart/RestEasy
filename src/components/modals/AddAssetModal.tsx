import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AddAssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddAssetModal({ open, onOpenChange, onSuccess }: AddAssetModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'financial',
    name: '',
    description: '',
    location: '',
    account_number: '',
    access_info: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('assets').insert([
        {
          user_id: user?.id,
          ...formData,
        },
      ]);

      if (error) throw error;
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding asset:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Asset Type</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="financial">Financial</option>
              <option value="physical">Physical</option>
              <option value="digital">Digital</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Account Number</label>
            <Input
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Access Information</label>
            <Input
              value={formData.access_info}
              onChange={(e) => setFormData({ ...formData, access_info: e.target.value })}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}