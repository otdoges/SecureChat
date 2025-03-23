import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import PasskeySetup from '../components/PasskeySetup';
import { isPasskeySupported } from '../utils/passkey';
import * as pbClient from '../utils/pocketbaseClient';

const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  
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
          setAvatar(userData.avatar || null);
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
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-indigo-500"
                />
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