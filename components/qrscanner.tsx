import React from 'react';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';

interface QrScannerProps {
  onScan: (result: string) => void;
  onError: (error: Error) => void;
}

const QrScannerComponent: React.FC<QrScannerProps> = ({ onScan, onError }) => {
  return (
    <div className="qr-scanner flex items-center justify-center w-full h-full bg-charleston">
      {/* The scanner will be centered within this flex container */}
      <div className="w-96 h-96">
        <Scanner
          onScan={(results: IDetectedBarcode[]) => {
            if (results && results.length > 0) {
              const scannedResult = results[0].rawValue;
              onScan(scannedResult);
            }
          }}
          onError={(error) => onError(error as Error)}
          constraints={{ facingMode: 'environment' }} // Use back camera for mobile
        />
      </div>
    </div>
  );
};

export default QrScannerComponent;
