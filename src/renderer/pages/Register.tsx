import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../utils/AuthContext';
import { generateUserKey, storeUserKey } from '../utils/encryption';
import { createOrUpdateProfile } from '../utils/supabaseService';

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

const Register = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error, user } = await signUp(email, password, username);
      
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      
      if (user) {
        // Generate and store user encryption key
        const userKey = generateUserKey(user.id, password);
        storeUserKey(userKey, password);
        
        try {
          // Save/update user profile to Supabase
          await createOrUpdateProfile({
            id: user.id,
            username: username,
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
            status: 'online'
          });
          
          // Navigate to login
          navigate('/login', { state: { registrationSuccess: true } });
        } catch (err: any) {
          console.error("Error saving profile to Supabase:", err);
          setError("Registration successful, but failed to save profile data.");
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
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
        
        <form className="space-y-6" onSubmit={handleRegister}>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 text-white bg-discord-danger rounded"
            >
              {error}
            </motion.div>
          )}
          
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