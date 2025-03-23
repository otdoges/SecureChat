import { v4 as uuidv4 } from 'uuid';
import * as pbClient from './pocketbaseClient';

/**
 * Generate a QR code login session
 * @returns The session token to embed in QR code
 */
export async function generateQRLoginSession(): Promise<{ token: string, success: boolean, error?: string }> {
  try {
    // Generate a unique session token
    const sessionToken = uuidv4();
    
    // Create QR login session in PocketBase
    await pbClient.createQRLoginSession();
    
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
    // Get session from PocketBase
    const session = await pbClient.getQRLoginSession(token);
    
    if (!session) {
      throw new Error('QR login session not found');
    }
    
    // Check if session has expired
    if (session.status === 'expired') {
      return { status: 'expired' };
    }
    
    // If authenticated, return the session
    if (session.status === 'authenticated') {
      // In a real implementation, this would provide the auth session
      // For now, we'll just return the user ID, which the app would use to authenticate
      if (session.user) {
        return { 
          status: 'authenticated',
          session: { user: session.user }
        };
      }
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
    // Get session from PocketBase
    const session = await pbClient.getQRLoginSession(token);
    
    if (!session) {
      throw new Error('QR login session not found');
    }
    
    // Check if session has expired
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date() || session.status !== 'pending') {
      // Update status to expired if needed
      if (session.status === 'pending') {
        await pbClient.updateQRLoginSession(session.id, { 
          status: 'expired' 
        });
      }
      throw new Error('QR login session has expired or is no longer valid');
    }
    
    // Get user information
    const pb = pbClient.getPocketBase();
    const userData = await pb.collection('users').getOne(userId);
    
    if (!userData) {
      throw new Error('User not found');
    }
    
    // Update QR session as authenticated with user data
    await pbClient.updateQRLoginSession(session.id, { 
      status: 'authenticated',
      user: userId,
      authenticated_at: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error authenticating QR login:', error);
    return { success: false, error: error.message };
  }
} 