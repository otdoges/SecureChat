import React, { useState } from 'react';
import { registerPasskey, isPasskeySupported } from '../utils/passkey';

interface PasskeySetupProps {
  username: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PasskeySetup: React.FC<PasskeySetupProps> = ({ username, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  
  // Check if passkeys are supported on component mount
  React.useEffect(() => {
    const checkSupport = async () => {
      const isSupported = await isPasskeySupported();
      setSupported(isSupported);
    };
    
    checkSupport();
  }, []);
  
  // Handle passkey registration
  const handleRegisterPasskey = async () => {
    if (!username) {
      onError('Username is required to register a passkey');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await registerPasskey(username);
      
      if (result.success) {
        onSuccess();
      } else {
        onError(result.error || 'Failed to register passkey');
      }
    } catch (error: any) {
      onError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // If we're still checking support, show loading
  if (supported === null) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <p className="text-gray-400 mb-4">Checking passkey support...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // If passkeys are not supported, show message
  if (!supported) {
    return (
      <div className="p-6 border border-yellow-600 bg-yellow-800 bg-opacity-30 rounded-md">
        <h3 className="text-yellow-500 font-semibold text-lg mb-2">Passkeys Not Supported</h3>
        <p className="text-gray-300">
          Your browser or device doesn't support passkeys. Consider updating your browser to the latest version or using a different device.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-6 border border-indigo-600 bg-indigo-900 bg-opacity-20 rounded-md">
      <h3 className="text-indigo-400 font-semibold text-lg mb-2">Set Up Passkey</h3>
      <p className="text-gray-300 mb-4">
        Passkeys let you sign in without typing your password. You'll use your device's biometrics (like fingerprint or face) or screen lock instead.
      </p>
      
      <button
        onClick={handleRegisterPasskey}
        disabled={loading}
        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors duration-300 w-full disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
            <span>Setting up...</span>
          </>
        ) : (
          <>
            <span className="material-icons text-xl">fingerprint</span>
            <span>Create Passkey</span>
          </>
        )}
      </button>
      
      <p className="text-gray-400 text-sm mt-3">
        You'll be prompted to use your device's authentication method to create a passkey for this account.
      </p>
    </div>
  );
};

export default PasskeySetup; 