import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Get Supabase instance
const supabaseUrl = window.env?.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = window.env?.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Generate a QR code login session
 * @returns The session token to embed in QR code
 */
export async function generateQRLoginSession(): Promise<{ token: string, success: boolean, error?: string }> {
  try {
    // Generate a unique session token
    const sessionToken = uuidv4();
    
    // Store in Supabase with status 'pending'
    const { error } = await supabase
      .from('qr_login_sessions')
      .insert([{ 
        token: sessionToken, 
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // Expires in 5 minutes
      }]);
    
    if (error) throw new Error(error.message);
    
    return { token: sessionToken, success: true };
  } catch (error: any) {
    console.error('Error generating QR login session:', error);
    return { token: '', success: false, error: error.message };
  }
}

/**
 * Poll for QR login session status
 * @param token The session token to check
 * @returns Status information and session if authenticated
 */
export async function checkQRLoginStatus(token: string): Promise<{ 
  status: 'pending' | 'authenticated' | 'expired' | 'error',
  session?: any,
  error?: string
}> {
  try {
    // Check if the token exists and get its status
    const { data, error } = await supabase
      .from('qr_login_sessions')
      .select('status, session_data')
      .eq('token', token)
      .single();
    
    if (error) throw new Error(error.message);
    if (!data) throw new Error('QR login session not found');
    
    // Check if session has expired
    if (data.status === 'expired') {
      return { status: 'expired' };
    }
    
    // If authenticated, return the session
    if (data.status === 'authenticated' && data.session_data) {
      return { 
        status: 'authenticated',
        session: data.session_data
      };
    }
    
    // Otherwise, still pending
    return { status: 'pending' };
  } catch (error: any) {
    console.error('Error checking QR login status:', error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Authenticate a QR login session from a mobile device
 * @param token The session token from the QR code
 * @param userId The authenticating user's ID
 */
export async function authenticateQRLogin(token: string, userId: string): Promise<{ 
  success: boolean, 
  error?: string 
}> {
  try {
    // First check if the token is valid and pending
    const { data: qrSessionData, error: qrSessionError } = await supabase
      .from('qr_login_sessions')
      .select('status, expires_at')
      .eq('token', token)
      .single();
    
    if (qrSessionError) throw new Error(qrSessionError.message);
    if (!qrSessionData) throw new Error('QR login session not found');
    
    // Check if session has expired
    const expiresAt = new Date(qrSessionData.expires_at);
    if (expiresAt < new Date() || qrSessionData.status !== 'pending') {
      // Update status to expired if needed
      if (qrSessionData.status === 'pending') {
        await supabase
          .from('qr_login_sessions')
          .update({ status: 'expired' })
          .eq('token', token);
      }
      throw new Error('QR login session has expired or is no longer valid');
    }
    
    // Get user information
    const { data: userData, error: userError } = await supabase.auth.getUser(userId);
    if (userError) throw new Error(userError.message);
    if (!userData?.user) throw new Error('User not found');
    
    // Create a session for the desktop client by signing in with a custom token
    // Note: In a real implementation, you would need a secure server-side function with admin privileges
    // to create a proper session token. This is a simplified version.
    const { data: customSessionData, error: customSessionError } = await supabase.functions.invoke('create-session-for-user', {
      body: { userId: userData.user.id }
    });
    
    if (customSessionError && customSessionError.message) {
      throw new Error(customSessionError.message);
    }
    
    // Update QR session as authenticated with session data
    const { error: updateError } = await supabase
      .from('qr_login_sessions')
      .update({ 
        status: 'authenticated',
        session_data: customSessionData,
        authenticated_at: new Date().toISOString()
      })
      .eq('token', token);
    
    if (updateError) throw new Error(updateError.message);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error authenticating QR login:', error);
    return { success: false, error: error.message };
  }
} 