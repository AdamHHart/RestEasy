import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import DocumentScanner from '../DocumentScanner';
import { Camera } from 'lucide-react';

interface AddDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddDocumentModal({ open, onOpenChange, onSuccess }: AddDocumentModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'legal',
    file_path: '', // In a real app, this would be handled by file upload
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('documents').insert([
        {
          user_id: user?.id,
          ...formData,
        },
      ]);

      if (error) throw error;
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async (imageData: string) => {
    try {
      // In a real app, you would:
      // 1. Upload the image to storage
      // 2. Get the file path
      // 3. Update formData with the file path
      setFormData({ ...formData, file_path: 'scanned_document.jpg' });
    } catch (error) {
      console.error('Error processing scanned document:', error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Document Name</label>
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
            
            <div>
              <label className="block text-sm font-medium mb-1">Document</label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    // In a real app, this would handle file upload
                    setFormData({ ...formData, file_path: e.target.value });
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScanner(true)}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showScanner && (
        <DocumentScanner
          onCapture={handleCapture}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}