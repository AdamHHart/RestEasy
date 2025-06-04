import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import DocumentScanner from '../DocumentScanner';
import { Camera } from 'lucide-react';
import { toast } from '../ui/toast';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'legal',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let file_path = '';

      // Handle file upload
      if (selectedFile || scannedImage) {
        const file = selectedFile || dataURLtoFile(scannedImage!, 'scanned_document.jpg');
        const fileName = `${user!.id}/${Date.now()}-${file.name}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        file_path = data.path;
      }

      // Create document record
      const { error: docError } = await supabase.from('documents').insert([
        {
          user_id: user?.id,
          ...formData,
          file_path,
        },
      ]);

      if (docError) throw docError;

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'legal',
      });
      setScannedImage(null);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error adding document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = (imageData: string) => {
    setScannedImage(imageData);
    setShowScanner(false);
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
      setScannedImage(null);
    }
  };

  // Helper function to convert data URL to File
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
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
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : selectedFile ? (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setSelectedFile(null)}
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
                disabled={loading || !formData.name || (!selectedFile && !scannedImage)}
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