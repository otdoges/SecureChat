import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../utils/AuthContext';
import { retrieveUserKey, generateUserKey, storeUserKey } from '../utils/encryption';
import { createOrUpdateProfile } from '../utils/supabaseService';
import PasskeyLogin from '../components/PasskeyLogin';
import QRCodeLogin from '../components/QRCodeLogin';
import { isPasskeySupported, authenticateWithPasskey } from '../utils/passkey';
import QRCode from 'react-qr-code';
import { generateQRLoginSession, checkQRLoginStatus } from '../utils/qrLogin';

declare global {
  interface Window {
    api: {
      createOrUpdateUser: (userData: any) => Promise<any>;
      getUserById: (userId: string) => Promise<any>;
      // other API methods
    };
  }
}

// Enum for auth methods
enum AuthMethod {
  PASSWORD = 'password',
  PASSKEY = 'passkey',
  QR_CODE = 'qr_code'
}

const Login = () => {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(AuthMethod.PASSWORD);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrToken, setQRToken] = useState('');
  const [qrPolling, setQRPolling] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If user is already authenticated, redirect to channels
    if (user) {
      navigate('/channels');
    }
  }, [user, navigate]);

  // Check if passkeys are supported
  useEffect(() => {
    const checkPasskeySupport = async () => {
      const supported = await isPasskeySupported();
      setPasskeySupported(supported);
    };
    
    checkPasskeySupport();
  }, []);

  // Handle QR code polling
  useEffect(() => {
    if (showQR && qrToken) {
      const interval = setInterval(async () => {
        const result = await checkQRLoginStatus(qrToken);
        
        if (result.status === 'authenticated' && result.session) {
          // User authenticated via QR code
          setShowQR(false);
          clearInterval(interval);
          
          // Complete login with the session
          setLoading(true);
          try {
            // Use the session from QR login
            navigate('/');
          } catch (error: any) {
            setError('Failed to authenticate with QR session: ' + error.message);
          }
          setLoading(false);
        } else if (result.status === 'expired' || result.status === 'error') {
          setError('QR code has expired or is invalid. Please try again.');
          setShowQR(false);
          clearInterval(interval);
        }
      }, 2000);
      
      setQRPolling(interval);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [showQR, qrToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Please enter both email and password');
      }
      
      const { error } = await signIn(email, password);
      if (error) throw new Error(error.message);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  // Handle successful passkey login
  const handlePasskeySuccess = (session: any) => {
    // The session will be handled by the auth context
    console.log('Passkey login successful');
    // You might need to refresh or redirect here
  };

  // Handle successful QR code login
  const handleQRSuccess = (session: any) => {
    // The session will be handled by the auth context
    console.log('QR code login successful');
    // You might need to refresh or redirect here
  };

  // Error handler for authentication methods
  const handleAuthError = (message: string) => {
    setError(message);
  };

  // Handle passkey login
  const handlePasskeyLogin = async () => {
    setError(null);
    setLoading(true);
    
    try {
      const result = await authenticateWithPasskey();
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Failed to authenticate with passkey');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with passkey');
    }
    
    setLoading(false);
  };

  // Handle QR code login
  const handleQRLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const result = await generateQRLoginSession();
      if (result.success) {
        setQRToken(result.token);
        setShowQR(true);
      } else {
        setError(result.error || 'Failed to generate QR login session');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR login session');
    }
    
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-discord-tertiary">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md p-6 bg-discord-primary rounded-lg shadow-lg"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-discord-text-normal">Welcome back!</h1>
          <p className="text-discord-text-muted">We're so excited to see you again!</p>
        </div>
        
        {/* Auth Method Tabs */}
        <div className="flex mb-6 border-b border-discord-border">
          <button
            className={`flex-1 py-2 font-medium text-sm ${
              authMethod === AuthMethod.PASSWORD
                ? 'text-discord-text-normal border-b-2 border-discord-blurple'
                : 'text-discord-text-muted hover:text-discord-text-normal'
            }`}
            onClick={() => setAuthMethod(AuthMethod.PASSWORD)}
          >
            Password
          </button>
          <button
            className={`flex-1 py-2 font-medium text-sm ${
              authMethod === AuthMethod.PASSKEY
                ? 'text-discord-text-normal border-b-2 border-discord-blurple'
                : 'text-discord-text-muted hover:text-discord-text-normal'
            }`}
            onClick={() => setAuthMethod(AuthMethod.PASSKEY)}
          >
            Passkey
          </button>
          <button
            className={`flex-1 py-2 font-medium text-sm ${
              authMethod === AuthMethod.QR_CODE
                ? 'text-discord-text-normal border-b-2 border-discord-blurple'
                : 'text-discord-text-muted hover:text-discord-text-normal'
            }`}
            onClick={() => setAuthMethod(AuthMethod.QR_CODE)}
          >
            QR Code
          </button>
        </div>
        
        {/* Error message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-discord-error bg-opacity-20 border border-discord-error rounded-md text-discord-error text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Authentication Method Content */}
        <AnimatePresence mode="wait">
          {authMethod === AuthMethod.PASSWORD && (
            <motion.form
              key="password-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
            >
              <div className="mb-4">
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-discord-text-normal">
                  Email
                </label>
                <input 
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 bg-discord-secondary border border-discord-border rounded-md text-discord-text-normal focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label htmlFor="password" className="text-sm font-medium text-discord-text-normal">
                    Password
                  </label>
                  <a href="#" className="text-xs text-discord-blurple hover:underline">
                    Forgot Password?
                  </a>
                </div>
                <input 
                  type="password"
                  id="password"
                  className="w-full px-3 py-2 bg-discord-secondary border border-discord-border rounded-md text-discord-text-normal focus:outline-none focus:ring-2 focus:ring-discord-blurple"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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
                  'Login'
                )}
              </button>
            </motion.form>
          )}
          
          {authMethod === AuthMethod.PASSKEY && (
            <motion.div
              key="passkey-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PasskeyLogin 
                onLoginSuccess={handlePasskeySuccess}
                onError={handleAuthError}
              />
            </motion.div>
          )}
          
          {authMethod === AuthMethod.QR_CODE && (
            <motion.div
              key="qr-code-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {showQR ? (
                <div className="p-4 bg-white rounded-lg mb-4 flex flex-col items-center">
                  <p className="text-black text-center mb-2">Scan this QR code with the mobile app to sign in</p>
                  <div className="p-2 bg-white">
                    <QRCode value={`https://yourdomain.com/qr-login?token=${qrToken}`} size={200} />
                  </div>
                  <button
                    className="mt-4 text-sm text-blue-400 hover:text-blue-300"
                    onClick={() => {
                      setShowQR(false);
                      if (qrPolling) clearInterval(qrPolling);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <form onSubmit={handleQRLogin} className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-600 transition duration-300 disabled:opacity-50"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span className="material-icons text-xl">qr_code_scanner</span>
                      <span>Sign in with QR Code</span>
                    </div>
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="mt-6 text-sm text-center">
          <span className="text-discord-text-muted">Need an account? </span>
          <Link to="/register" className="text-discord-blurple hover:underline">
            Register
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login; 