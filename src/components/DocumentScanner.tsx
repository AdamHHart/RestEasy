import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button } from './ui/button';
import { Camera, X, Check, RotateCcw } from 'lucide-react';

interface DocumentScannerProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export default function DocumentScanner({ onCapture, onClose }: DocumentScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setCapturedImage(null);
  };

  const accept = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-4 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Document Scanner</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
          {!capturedImage ? (
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={{
                facingMode: 'environment',
                aspectRatio: 4/3,
                width: { ideal: 1920 },
                height: { ideal: 1440 }
              }}
            />
          ) : (
            <img 
              src={capturedImage} 
              alt="Captured document" 
              className="w-full h-full object-contain"
            />
          )}
        </div>

        <div className="flex justify-center gap-4 mt-4">
          {!capturedImage ? (
            <Button 
              className="flex items-center gap-2" 
              onClick={capture}
            >
              <Camera className="h-5 w-5" />
              Capture
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={retake}
              >
                <RotateCcw className="h-5 w-5" />
                Retake
              </Button>
              <Button 
                className="flex items-center gap-2"
                onClick={accept}
              >
                <Check className="h-5 w-5" />
                Accept
              </Button>
            </>
          )}
        </div>

        <p className="text-sm text-gray-500 text-center mt-4">
          Position your document within the frame and ensure good lighting
        </p>
      </div>
    </div>
  );
}