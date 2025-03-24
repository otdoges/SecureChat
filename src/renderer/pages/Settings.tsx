import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import PasskeySetup from '../components/PasskeySetup';
import { isPasskeySupported } from '../utils/passkey';
import * as pbClient from '../utils/pocketbaseClient';
import { generateKeyPair, encryptPrivateKey } from '../utils/encryption';

const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [usernameSuffix, setUsernameSuffix] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [customCSS, setCustomCSS] = useState('');
  const [showResetEncryptionKey, setShowResetEncryptionKey] = useState(false);
  const [password, setPassword] = useState('');
  
  useEffect(() => {
    // Check if passkeys are supported
    const checkPasskeySupport = async () => {
      const supported = await isPasskeySupported();
      setPasskeySupported(supported);
    };
    
    checkPasskeySupport();
    
    // Load user data
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get user profile from PocketBase
        const userData = await pbClient.getUserProfile(user.id);
        
        if (userData) {
          setUsername(userData.username || '');
          setUsernameSuffix(userData.username_suffix || null);
          setAvatar(userData.avatar || null);
          setCustomCSS(userData.custom_css || '');
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        setMessage({
          text: 'Failed to load user profile',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user]);
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setLoading(true);
      setMessage(null);
      
      // Update user profile in PocketBase
      await pbClient.updateUserProfile(user.id, {
        username
      });
      
      setMessage({
        text: 'Profile updated successfully',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({
        text: error.message || 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomCSS = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setLoading(true);
      setMessage(null);
      
      // Update custom CSS in PocketBase
      await pbClient.updateUserCustomCSS(user.id, customCSS);
      
      // Apply the custom CSS to the current page
      applyCustomCSS(customCSS);
      
      setMessage({
        text: 'Custom CSS updated successfully',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error updating custom CSS:', error);
      setMessage({
        text: error.message || 'Failed to update custom CSS',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const applyCustomCSS = (css: string) => {
    // Remove any existing custom style element
    const existingStyle = document.getElementById('user-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create and append new style element with user's CSS
    if (css.trim()) {
      const styleElement = document.createElement('style');
      styleElement.id = 'user-custom-css';
      styleElement.textContent = css;
      document.head.appendChild(styleElement);
    }
  };

  const handleResetEncryptionKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !password) return;
    
    try {
      setLoading(true);
      setMessage(null);
      
      // Generate new key pair
      const { publicKey, privateKey } = generateKeyPair();
      
      // Encrypt private key with user password
      const encryptedPrivateKey = encryptPrivateKey(privateKey, password);
      
      // Update keys in PocketBase
      await pbClient.updateUserKeys(user.id, publicKey, encryptedPrivateKey);
      
      setMessage({
        text: 'Encryption keys reset successfully. You will need to re-join channels to access them.',
        type: 'success'
      });
      
      setShowResetEncryptionKey(false);
      setPassword('');
    } catch (error: any) {
      console.error('Error resetting encryption keys:', error);
      setMessage({
        text: error.message || 'Failed to reset encryption keys',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const handlePasskeySuccess = () => {
    setMessage({
      text: 'Passkey created successfully! You can now use it to sign in.',
      type: 'success'
    });
    setShowPasskeySetup(false);
  };
  
  const handlePasskeyError = (error: string) => {
    setMessage({
      text: error,
      type: 'error'
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        {message && (
          <div 
            className={`mb-6 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-800 bg-opacity-20 border border-green-700 text-green-400' 
                : 'bg-red-800 bg-opacity-20 border border-red-700 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}
        
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 opacity-70"
                />
                <p className="text-gray-400 text-sm mt-1">Email cannot be changed</p>
              </div>
              
              <div>
                <label htmlFor="username" className="block text-gray-300 mb-1">Username</label>
                <div className="flex items-center">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 p-2 rounded-l bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="bg-gray-600 p-2 rounded-r border border-gray-600">
                    #{usernameSuffix || '0000'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">Your unique ID number cannot be changed</p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition duration-300 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Appearance</h2>
            
            <form onSubmit={handleUpdateCustomCSS} className="space-y-4">
              <div>
                <label htmlFor="customcss" className="block text-gray-300 mb-1">Custom CSS</label>
                <textarea
                  id="customcss"
                  value={customCSS}
                  onChange={(e) => setCustomCSS(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                  rows={10}
                  placeholder="/* Add your custom CSS here */"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Customize the appearance of the app with CSS. Changes apply immediately.
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition duration-300 disabled:opacity-50"
              >
                {loading ? 'Applying...' : 'Apply CSS'}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Security</h2>
            
            {!showResetEncryptionKey ? (
              <button
                onClick={() => setShowResetEncryptionKey(true)}
                className="bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition duration-300"
              >
                Reset Encryption Keys
              </button>
            ) : (
              <form onSubmit={handleResetEncryptionKeys} className="space-y-4 border border-yellow-700 rounded-md p-4 bg-yellow-900 bg-opacity-20">
                <p className="text-yellow-400 text-sm">
                  <strong>Warning:</strong> Resetting your encryption keys will require you to re-join all encrypted channels.
                  Messages encrypted with your old keys will become inaccessible.
                </p>
                
                <div>
                  <label htmlFor="password" className="block text-gray-300 mb-1">Enter Your Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-indigo-500"
                    autoComplete="current-password"
                    required
                  />
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading || !password}
                    className="bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Resetting...' : 'Confirm Reset'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetEncryptionKey(false);
                      setPassword('');
                    }}
                    className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        
        {passkeySupported && (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Authentication</h2>
              
              {showPasskeySetup ? (
                <PasskeySetup
                  username={username}
                  onSuccess={handlePasskeySuccess}
                  onError={handlePasskeyError}
                />
              ) : (
                <button
                  onClick={() => setShowPasskeySetup(true)}
                  className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition duration-300 flex items-center"
                >
                  <span className="material-icons mr-2">security</span>
                  Set Up Passkey
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Session</h2>
            
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition duration-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 