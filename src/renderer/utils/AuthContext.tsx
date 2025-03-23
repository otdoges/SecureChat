import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as pb from './pocketbaseClient';

interface AuthContextType {
  user: any | null;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: any }>;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // PocketBase automatically loads auth state from localStorage
        if (pb.isAuthenticated()) {
          setUser(pb.getCurrentUser());
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Subscribe to auth state changes
    const unsubscribe = pb.getPocketBase().authStore.onChange(() => {
      setUser(pb.getCurrentUser());
    });

    return () => {
      // Clean up subscription
      unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      await pb.login(email, password);
      setUser(pb.getCurrentUser());
      return {};
    } catch (error: any) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, username: string) => {
    try {
      await pb.register(email, password, username);
      // Automatically log in after registration
      await pb.login(email, password);
      setUser(pb.getCurrentUser());
      return {};
    } catch (error: any) {
      console.error('Error signing up:', error);
      return { error };
    }
  };

  // Sign out
  const signOut = () => {
    pb.logout();
    setUser(null);
  };

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 