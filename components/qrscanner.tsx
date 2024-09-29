// components/qrscanner.tsx
import React, { useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';

interface QrScannerProps {
  onScan: (result: string) => void;
  onError: (error: Error) => void;
}

const QrScannerComponent: React.FC<QrScannerProps> = ({ onScan, onError }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const qrScanner = new QrScanner(
      videoRef.current,
      (result) => {
        if (result) {
          onScan(result);
        }
      },
      {
        onDecodeError: (error: Error | string) => {
          console.error("QR Scan Error:", error);
          if (error instanceof Error) {
            onError(error);
          } else {
            onError(new Error(error));
          }
        },
        highlightScanRegion: true,
        highlightCodeOutline: true
      }
    );

    qrScanner.start().catch((error) => {
      console.error("Failed to start QR Scanner:", error); // Log start errors
      onError(error);
    });

    return () => {
      qrScanner.stop();
    };
  }, [onScan, onError]);

  return (
    <div className="qr-scanner">
      <video ref={videoRef} className="w-full h-auto" />
    </div>
  );
};

export default QrScannerComponent;
