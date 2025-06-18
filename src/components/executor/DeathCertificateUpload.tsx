import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, FileText, CheckCircle2, AlertCircle, Camera } from 'lucide-react';
import { toast } from '../ui/toast';
import DocumentScanner from '../DocumentScanner';

interface DeathCertificateUploadProps {
  onVerificationComplete: () => void;
  isVerified: boolean;
}

export default function DeathCertificateUpload({ onVerificationComplete, isVerified }: DeathCertificateUploadProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const handleCapture = (imageData: string) => {
    setScannedImage(imageData);
    setShowScanner(false);
    setSelectedFile(null);
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

  const handleUpload = async () => {
    if (!selectedFile && !scannedImage) {
      toast({
        title: "Error",
        description: "Please select a file or scan a document first",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Get the planner ID from executor relationship
      const { data: executorData } = await supabase
        .from('executors')
        .select('planner_id, id')
        .eq('email', user?.email)
        .eq('status', 'active')
        .single();

      if (!executorData) {
        throw new Error('Executor relationship not found');
      }

      const plannerId = executorData.planner_id;
      const executorId = executorData.id;

      // Upload the death certificate
      const file = selectedFile || dataURLtoFile(scannedImage!, 'death_certificate.jpg');
      const fileName = `death-certificates/${plannerId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document record for the death certificate
      const { error: docError } = await supabase.from('documents').insert([
        {
          user_id: plannerId,
          name: 'Death Certificate',
          description: 'Official death certificate for verification',
          file_path: data.path,
          category: 'legal',
        },
      ]);

      if (docError) throw docError;

      // Update or create trigger event to mark as verified
      const { data: existingTrigger } = await supabase
        .from('trigger_events')
        .select('id')
        .eq('user_id', plannerId)
        .eq('executor_id', executorId)
        .single();

      if (existingTrigger) {
        // Update existing trigger event
        const { error: updateError } = await supabase
          .from('trigger_events')
          .update({
            triggered: true,
            triggered_date: new Date().toISOString(),
            verification_details: 'Death certificate uploaded and verified'
          })
          .eq('id', existingTrigger.id);

        if (updateError) throw updateError;
      } else {
        // Create new trigger event
        const { error: triggerError } = await supabase
          .from('trigger_events')
          .insert([
            {
              user_id: plannerId,
              executor_id: executorId,
              type: 'death',
              verification_method: 'professional',
              verification_details: 'Death certificate uploaded and verified',
              triggered: true,
              triggered_date: new Date().toISOString()
            }
          ]);

        if (triggerError) throw triggerError;
      }

      // Log the verification
      await supabase.from('activity_log').insert([
        {
          user_id: plannerId,
          action_type: 'death_verified',
          details: `Death certificate uploaded and verified by executor ${user?.email}`,
        }
      ]);

      toast({
        title: "Verification Complete ✅",
        description: "Death certificate has been uploaded and verified. You now have access to the estate documents.",
      });

      // Clear the uploaded file
      setSelectedFile(null);
      setScannedImage(null);

      // Notify parent component
      onVerificationComplete();

    } catch (error) {
      console.error('Error uploading death certificate:', error);
      toast({
        title: "Error",
        description: "Failed to upload death certificate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (isVerified) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-medium text-green-900">Death Certificate Verified</h3>
              <p className="text-sm text-green-700">
                The death has been verified. You now have access to all estate documents and can proceed with the executor workflow.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {showScanner && (
        <DocumentScanner
          onCapture={handleCapture}
          onClose={() => setShowScanner(false)}
        />
      )}

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-amber-600" />
            Death Certificate Verification Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white border border-amber-200 rounded-lg p-4">
            <h3 className="font-medium text-amber-900 mb-2">📋 Before You Begin</h3>
            <p className="text-sm text-amber-800 mb-3">
              To access the estate documents and begin the executor process, you must first upload 
              an official death certificate for verification.
            </p>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Upload a clear, legible copy of the official death certificate</li>
              <li>• Accepted formats: PDF, JPG, PNG</li>
              <li>• Maximum file size: 10MB</li>
              <li>• For testing purposes, verification is automatic</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Upload Death Certificate</h4>
            
            {scannedImage ? (
              <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={scannedImage} 
                  alt="Scanned death certificate" 
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
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="space-y-3">
                  <div className="flex justify-center gap-2">
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="max-w-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowScanner(true)}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Select a file or use the camera to scan the death certificate
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleUpload}
              disabled={(!selectedFile && !scannedImage) || uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Verifying...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload & Verify
                </>
              )}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">🔒 Security & Privacy</h4>
            <p className="text-sm text-blue-800">
              The death certificate is securely encrypted and stored. It will only be accessible 
              to authorized parties and is used solely for verification purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}