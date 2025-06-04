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
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'legal',
    file_path: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, you would:
      // 1. Upload the scanned image or file to storage
      // 2. Get the file path
      // 3. Then create the document record
      
      let file_path = formData.file_path;
      if (scannedImage) {
        // Here you would upload the scanned image and get its path
        file_path = 'scanned_document.jpg'; // Placeholder
      }

      const { error } = await supabase.from('documents').insert([
        {
          user_id: user?.id,
          ...formData,
          file_path,
        },
      ]);

      if (error) throw error;
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'legal',
        file_path: '',
      });
      setScannedImage(null);
    } catch (error) {
      console.error('Error adding document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = (imageData: string) => {
    setScannedImage(imageData);
    setShowScanner(false);
    setFormData(prev => ({ ...prev, file_path: 'scanned_document.jpg' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file_path: file.name }));
    }
  };

  return (
    <>
      {showScanner && (
        <DocumentScanner
          onCapture={handleCapture}
          onClose={() => setShowScanner(false)}
        />
      )}
      
      <Dialog open={open && !showScanner} onOpenChange={onOpenChange}>
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
              <div className="space-y-3">
                {scannedImage ? (
                  <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={scannedImage} 
                      alt="Scanned document" 
                      className="w-full h-full object-contain"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setScannedImage(null);
                        setFormData(prev => ({ ...prev, file_path: '' }));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowScanner(true)}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !formData.name || (!formData.file_path && !scannedImage)}
              >
                {loading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}