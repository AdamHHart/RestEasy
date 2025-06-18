import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../ui/toast';

interface Document {
  id: string;
  name: string;
  description: string | null;
  category: 'legal' | 'financial' | 'health' | 'personal';
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_organization: string | null;
}

interface EditDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  document: Document | null;
}

export function EditDocumentModal({ open, onOpenChange, onSuccess, document }: EditDocumentModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'legal',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contact_organization: '',
  });

  useEffect(() => {
    if (document) {
      setFormData({
        name: document.name,
        description: document.description || '',
        category: document.category,
        contact_name: document.contact_name || '',
        contact_email: document.contact_email || '',
        contact_phone: document.contact_phone || '',
        contact_organization: document.contact_organization || '',
      });
    }
  }, [document]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('documents')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', document.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: "Error",
        description: "Failed to update document. Please try again.",
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
          <DialogTitle>Edit Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Document Name *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Document title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="legal">Legal</option>
                <option value="financial">Financial</option>
                <option value="health">Health</option>
                <option value="personal">Personal</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the document"
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
                  placeholder="Law firm, company, or organization"
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
              {loading ? 'Updating...' : 'Update Document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}