import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { authenticateWithPasskey, isPasskeySupported } from '../utils/passkey';

interface PasskeyLoginProps {
  onLoginSuccess: (session: any) => void;
  onError: (message: string) => void;
}

const PasskeyLogin: React.FC<PasskeyLoginProps> = ({ onLoginSuccess, onError }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(isPasskeySupported());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      onError('Username is required');
      return;
    }

    setLoading(true);
    try {
      const result = await authenticateWithPasskey(username);
      if (result.success && result.session) {
        onLoginSuccess(result.session);
      } else {
        onError(result.message || 'Authentication failed');
      }
    } catch (error: any) {
      console.error('Passkey error:', error);
      onError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="mt-4 text-center">
        <p className="text-discord-text-muted">
          Passkeys are not supported by your browser.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="mt-4"
    >
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label htmlFor="username" className="block mb-2 text-sm font-medium text-discord-text-normal">
            Username
          </label>
          <input 
            type="text"
            id="username"
            className="w-full px-3 py-2 bg-discord-secondary border border-discord-border rounded-md text-discord-text-normal focus:outline-none focus:ring-2 focus:ring-discord-blurple"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          className={`w-full py-2 px-4 rounded-md font-medium transition ${
            loading 
              ? 'bg-discord-blurple-dark cursor-not-allowed' 
              : 'bg-discord-blurple hover:bg-discord-blurple-dark'
          } text-white`}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logging in...
            </span>
          ) : (
            'Sign in with Passkey'
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default PasskeyLogin; 