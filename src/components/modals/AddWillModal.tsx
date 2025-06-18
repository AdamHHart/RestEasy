import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import DocumentScanner from '../DocumentScanner';
import { Camera, FileText, Upload } from 'lucide-react';
import { toast } from '../ui/toast';

interface AddWillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddWillModal({ open, onOpenChange, onSuccess }: AddWillModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'type'>('upload');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: 'Last Will and Testament',
    description: '',
    will_content: '',
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
      let will_content = '';

      if (activeTab === 'upload') {
        // Handle file upload
        if (selectedFile || scannedImage) {
          const file = selectedFile || dataURLtoFile(scannedImage!, 'will_document.jpg');
          const fileName = `${user!.id}/will/${Date.now()}-${file.name}`;
          
          const { error: uploadError, data } = await supabase.storage
            .from('documents')
            .upload(fileName, file);

          if (uploadError) throw uploadError;
          file_path = data.path;
        }
      } else {
        // Handle typed will content
        will_content = formData.will_content;
      }

      // Create will record in wishes table
      const { error: willError } = await supabase.from('wishes').insert([
        {
          user_id: user?.id,
          type: 'will',
          title: formData.name,
          content: will_content || 'Will document uploaded',
          created_at: new Date().toISOString(),
        },
      ]);

      if (willError) throw willError;

      // If there's a file, also create a document record
      if (file_path) {
        const { error: docError } = await supabase.from('documents').insert([
          {
            user_id: user?.id,
            name: formData.name,
            description: formData.description || 'Last Will and Testament document',
            file_path,
            category: 'legal',
            contact_name: formData.contact_name,
            contact_email: formData.contact_email,
            contact_phone: formData.contact_phone,
            contact_organization: formData.contact_organization,
          },
        ]);

        if (docError) throw docError;
      }

      toast({
        title: "Success",
        description: "Will has been saved successfully",
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: 'Last Will and Testament',
        description: '',
        will_content: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        contact_organization: '',
      });
      setScannedImage(null);
      setSelectedFile(null);
      setActiveTab('upload');
    } catch (error) {
      console.error('Error adding will:', error);
      toast({
        title: "Error",
        description: "Failed to save will. Please try again.",
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Your Will</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upload' | 'type')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Document
              </TabsTrigger>
              <TabsTrigger value="type" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Type Will
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Document Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Last Will and Testament"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description"
                  />
                </div>
              </div>

              <TabsContent value="upload" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Will Document</label>
                  <div className="space-y-3">
                    {scannedImage ? (
                      <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={scannedImage} 
                          alt="Scanned will" 
                          className="w-full h-full object-contain"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setScannedImage(null)}
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
                          accept="image/*,application/pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="flex-1"
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
              </TabsContent>

              <TabsContent value="type" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Will Content</label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[300px]"
                    value={formData.will_content}
                    onChange={(e) => setFormData({ ...formData, will_content: e.target.value })}
                    placeholder="Type your will content here. Include all necessary legal language and provisions..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Note: For legal validity, consider having this reviewed by an attorney and properly witnessed/notarized.
                  </p>
                </div>
              </TabsContent>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-3">Attorney/Legal Representative</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Attorney Name</label>
                    <Input
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      placeholder="Attorney's full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Law Firm</label>
                    <Input
                      value={formData.contact_organization}
                      onChange={(e) => setFormData({ ...formData, contact_organization: e.target.value })}
                      placeholder="Law firm or organization"
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
                      placeholder="attorney@lawfirm.com"
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
                  disabled={loading || (activeTab === 'upload' && !selectedFile && !scannedImage) || (activeTab === 'type' && !formData.will_content.trim())}
                >
                  {loading ? 'Saving...' : 'Save Will'}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}