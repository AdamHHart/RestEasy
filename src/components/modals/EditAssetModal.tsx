import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../ui/toast';

interface Asset {
  id: string;
  type: 'financial' | 'physical' | 'digital';
  name: string;
  description: string | null;
  location: string | null;
  account_number: string | null;
  access_info: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_organization: string | null;
}

interface EditAssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  asset: Asset | null;
}

export function EditAssetModal({ open, onOpenChange, onSuccess, asset }: EditAssetModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'financial',
    name: '',
    description: '',
    location: '',
    account_number: '',
    access_info: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contact_organization: '',
  });

  useEffect(() => {
    if (asset) {
      setFormData({
        type: asset.type,
        name: asset.name,
        description: asset.description || '',
        location: asset.location || '',
        account_number: asset.account_number || '',
        access_info: asset.access_info || '',
        contact_name: asset.contact_name || '',
        contact_email: asset.contact_email || '',
        contact_phone: asset.contact_phone || '',
        contact_organization: asset.contact_organization || '',
      });
    }
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('assets')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', asset.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Asset updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating asset:', error);
      toast({
        title: "Error",
        description: "Failed to update asset. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Asset name"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the asset"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Physical or digital location"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Account Number</label>
              <Input
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                placeholder="Account or reference number"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Access Information</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[80px]"
              value={formData.access_info}
              onChange={(e) => setFormData({ ...formData, access_info: e.target.value })}
              placeholder="Login details, passwords, or access instructions"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-3">Contact/Representative Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Contact Name</label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Representative's full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Organization/Company</label>
                <Input
                  value={formData.contact_organization}
                  onChange={(e) => setFormData({ ...formData, contact_organization: e.target.value })}
                  placeholder="Bank, company, or organization name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}