import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { generateQRLoginSession, checkQRLoginStatus } from '../utils/qrLogin';

interface QRCodeLoginProps {
  onLoginSuccess: (session: any) => void;
  onError: (message: string) => void;
}

const QRCodeLogin: React.FC<QRCodeLoginProps> = ({ onLoginSuccess, onError }) => {
  const [qrToken, setQRToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Generate QR code on component mount
  useEffect(() => {
    generateQR();
    
    // Clean up poll interval on unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  const generateQR = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateQRLoginSession();
      if (result.success) {
        setQRToken(result.token);
        // Start polling for status
        startPolling(result.token);
      } else {
        setError(result.error || 'Failed to generate QR code');
        onError(result.error || 'Failed to generate QR code');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      onError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (token: string) => {
    // Clear any existing interval
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    
    // Poll every 2 seconds
    const interval = setInterval(async () => {
      try {
        const result = await checkQRLoginStatus(token);
        
        if (result.status === 'authenticated' && result.session) {
          // Success! Stop polling and call the success handler
          clearInterval(interval);
          onLoginSuccess(result.session);
        } else if (result.status === 'expired' || result.status === 'error') {
          // Handle expired or error states
          clearInterval(interval);
          setError(result.error || 'QR code has expired. Please refresh.');
          setQRToken(null);
        }
        // If status is 'pending', just keep polling
      } catch (err: any) {
        clearInterval(interval);
        setError(err.message || 'Error checking login status');
        onError(err.message || 'Error checking login status');
      }
    }, 2000);
    
    setPollInterval(interval);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    generateQR();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="mt-6"
    >
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-medium text-discord-text-normal mb-4">
          Scan with your phone
        </h3>
        
        <div className="bg-white p-3 rounded-lg mb-4">
          {loading ? (
            <div className="w-48 h-48 flex items-center justify-center bg-gray-100">
              <svg className="animate-spin h-8 w-8 text-discord-blurple" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : error ? (
            <div className="w-48 h-48 flex items-center justify-center bg-gray-100">
              <div className="text-center p-4">
                <div className="text-red-500 text-xl mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-discord-tertiary text-sm">{error}</p>
              </div>
            </div>
          ) : qrToken ? (
            <QRCode 
              value={`secure-chat://login?token=${qrToken}`}
              size={192}
              level="H"
            />
          ) : null}
        </div>
        
        <p className="text-sm text-discord-text-muted mb-4 text-center max-w-xs">
          Open the Secure Chat app on your phone and scan this code to log in
        </p>
        
        {error && (
          <button
            onClick={handleRefresh}
            className="py-2 px-4 rounded-md font-medium transition bg-discord-blurple hover:bg-discord-blurple-dark text-white"
          >
            Refresh QR Code
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default QRCodeLogin; 