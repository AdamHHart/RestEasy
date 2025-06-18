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
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contact_organization: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let file_path = '';

      // Handle file upload
      if (selectedFile || scannedImage) {
        let fileToUpload: File;
        
        if (selectedFile) {
          fileToUpload = selectedFile;
        } else if (scannedImage) {
          fileToUpload = dataURLtoFile(scannedImage, 'scanned_document.jpg');
        } else {
          throw new Error('No file selected');
        }

        // Create a unique file name with proper extension
        const fileExtension = fileToUpload.name.split('.').pop() || 'jpg';
        const fileName = `${user!.id}/${Date.now()}-${formData.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
        
        console.log('Uploading file:', fileName, 'Size:', fileToUpload.size, 'Type:', fileToUpload.type);
        
        const { error: uploadError, data } = await supabase.storage
          .from('documents')
          .upload(fileName, fileToUpload, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        if (!data?.path) {
          throw new Error('Upload succeeded but no file path returned');
        }

        file_path = data.path;
        console.log('File uploaded successfully to:', file_path);
      }

      // Create document record
      const documentData = {
        user_id: user?.id,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        file_path: file_path,
        contact_name: formData.contact_name || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        contact_organization: formData.contact_organization || null,
      };

      console.log('Creating document record:', documentData);

      const { error: docError } = await supabase.from('documents').insert([documentData]);

      if (docError) {
        console.error('Document creation error:', docError);
        throw docError;
      }

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
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        contact_organization: '',
      });
      setScannedImage(null);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error adding document:', error);
      
      let errorMessage = "Failed to upload document. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('storage')) {
          errorMessage = "Storage error. Please check your file and try again.";
        } else if (error.message.includes('size')) {
          errorMessage = "File is too large. Please use a file smaller than 10MB.";
        } else if (error.message.includes('type')) {
          errorMessage = "Unsupported file type. Please use PDF, JPG, or PNG files.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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
      console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive"
        });
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Please select a PDF, JPG, PNG, or GIF file",
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
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
            
            <div>
              <label className="block text-sm font-medium mb-1">Document File</label>
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
                      {(selectedFile.size / 1024 / 1024).toFixed(2)}MB • {selectedFile.type}
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
                      accept="image/*,application/pdf,.doc,.docx"
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
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, JPG, PNG, GIF, DOC, DOCX (max 10MB)
              </p>
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