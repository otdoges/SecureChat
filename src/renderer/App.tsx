import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Supabase
import { createClient } from '@supabase/supabase-js';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import NotFound from './pages/NotFound';

// Context for authentication
import { AuthProvider, useAuth } from './utils/AuthContext';

// Encryption utilities
import { setupEncryption } from './utils/encryption';

// Get Supabase instance - try multiple sources for the environment variables
console.log('Environment variables in App.tsx:', {
  fromWindow: !!window.env?.SUPABASE_URL,
  fromImport: !!import.meta.env.VITE_SUPABASE_URL
});

// Try to get from preload script first, then fallback to import.meta.env, then fallback to hardcoded values
const supabaseUrl = window.env?.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || 'https://qwenpgqeqtbxeyvtqzpi.supabase.co';
const supabaseAnonKey = window.env?.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

console.log('Using Supabase URL in App.tsx:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize encryption
setupEncryption();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If still loading, show a loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-discord-tertiary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-discord-blurple"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Public route component (accessible only when not logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  // If still loading, show a loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-discord-tertiary">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-discord-blurple"></div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/channels" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/channels/*" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <AuthProvider supabase={supabase}>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App; 