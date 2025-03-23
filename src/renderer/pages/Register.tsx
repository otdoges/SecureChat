import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../utils/AuthContext';
import { generateUserKey, storeUserKey } from '../utils/encryption';
import { createOrUpdateProfile } from '../utils/supabaseService';
import { registerPasskey, isPasskeySupported } from '../utils/passkey';

// Use the Window interface from Login.tsx
declare global {
  interface Window {
    api: {
      createOrUpdateUser: (userData: any) => Promise<any>;
      getUserById: (userId: string) => Promise<any>;
      // other API methods
    };
  }
}

const Register: React.FC = () => {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [setupPasskey, setSetupPasskey] = useState(false);
  
  // Check if passkeys are supported
  useEffect(() => {
    const checkPasskeySupport = async () => {
      const supported = await isPasskeySupported();
      setPasskeySupported(supported);
    };
    
    checkPasskeySupport();
  }, []);
  
  // If user is already logged in, redirect to chat
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate form inputs
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    
    try {
      // Register user
      const result = await signUp(email, password, username);
      
      // If user opted to set up a passkey and passkeys are supported
      if (setupPasskey && passkeySupported && result.success) {
        try {
          // Set up passkey for the user
          const passkeyResult = await registerPasskey(username);
          if (!passkeyResult.success) {
            setError('Account created, but passkey setup failed: ' + passkeyResult.error);
            return;
          }
        } catch (passkeyError: any) {
          setError('Account created, but passkey setup failed: ' + passkeyError.message);
          return;
        }
      }
      
      // Navigate to login page
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
    
    setLoading(false);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center min-h-screen bg-discord-tertiary"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md p-8 space-y-8 bg-discord-secondary rounded-lg shadow-xl"
      >
        <div className="text-center">
          <motion.h1 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-3xl font-bold text-discord-text-normal"
          >
            Create an Account
          </motion.h1>
        </div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 text-white bg-discord-danger rounded"
          >
            {error}
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-discord-text-normal">
              USERNAME
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input w-full mt-1"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-discord-text-normal">
              EMAIL
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full mt-1"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-discord-text-normal">
              PASSWORD
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full mt-1"
            />
            <p className="mt-1 text-xs text-discord-text-muted">
              Must be at least 8 characters long
            </p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-discord-text-normal">
              CONFIRM PASSWORD
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input w-full mt-1"
            />
          </div>
          
          {passkeySupported && (
            <div className="flex items-center">
              <input
                id="setupPasskey"
                type="checkbox"
                checked={setupPasskey}
                onChange={(e) => setSetupPasskey(e.target.checked)}
                className="w-4 h-4 bg-discord-tertiary border-discord-text-muted rounded focus:ring-discord-text-link"
              />
              <label htmlFor="setupPasskey" className="ml-2 text-sm text-discord-text-muted">
                Set up passkey for passwordless login
              </label>
            </div>
          )}
          
          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex justify-center"
            >
              {loading ? 'Creating Account...' : 'Continue'}
            </motion.button>
          </div>
        </form>

        <div className="text-center text-sm">
          <span className="text-discord-text-muted">Already have an account?</span>{' '}
          <Link to="/login" className="text-discord-text-link hover:underline">
            Login
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Register; 