import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { registerPasskey, isPasskeySupported } from '../utils/passkey';

interface PasskeySetupProps {
  userId: string;
  username: string;
}

const PasskeySetup: React.FC<PasskeySetupProps> = ({ userId, username }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if passkeys are supported by the browser
    setSupported(isPasskeySupported());
  }, []);

  const handleRegisterPasskey = async () => {
    if (!userId || !username) {
      setStatus('error');
      setMessage('User information is missing');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const result = await registerPasskey(userId, username);
      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Passkey registered successfully!');
      } else {
        setStatus('error');
        setMessage(result.message || 'Failed to register passkey');
      }
    } catch (error: any) {
      console.error('Passkey registration error:', error);
      setStatus('error');
      setMessage(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="p-4 border border-discord-border rounded-md bg-discord-secondary">
        <h3 className="text-lg font-medium text-discord-text-normal mb-2">Passkeys</h3>
        <p className="text-discord-text-muted mb-4">
          Your browser doesn't support passkeys. Try using a modern browser like Chrome, Safari, or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-discord-border rounded-md bg-discord-secondary">
      <h3 className="text-lg font-medium text-discord-text-normal mb-2">Passkeys</h3>
      <p className="text-discord-text-muted mb-4">
        Passkeys are a more secure way to log in without passwords. You can use your device's biometric sensors or screen lock.
      </p>

      {status === 'success' && (
        <div className="mb-4 p-3 bg-green-900 bg-opacity-20 border border-green-700 rounded-md text-green-400 text-sm">
          {message}
        </div>
      )}

      {status === 'error' && (
        <div className="mb-4 p-3 bg-discord-error bg-opacity-20 border border-discord-error rounded-md text-discord-error text-sm">
          {message}
        </div>
      )}

      <button
        onClick={handleRegisterPasskey}
        disabled={loading}
        className={`px-4 py-2 rounded-md font-medium transition ${
          loading 
            ? 'bg-discord-blurple-dark cursor-not-allowed' 
            : 'bg-discord-blurple hover:bg-discord-blurple-dark'
        } text-white flex items-center`}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Registering...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
            Register Passkey
          </>
        )}
      </button>
    </div>
  );
};

export default PasskeySetup; 