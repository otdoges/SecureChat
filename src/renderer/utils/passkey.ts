import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type { 
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON
} from '@simplewebauthn/typescript-types';
import { createClient } from '@supabase/supabase-js';

// Get Supabase instance
const supabaseUrl = window.env?.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = window.env?.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Application ID - should match your site's domain
const rpID = window.location.hostname || 'localhost';
const rpName = 'Secure Chat';

/**
 * Start the passkey registration process
 */
export async function registerPasskey(userId: string, username: string) {
  try {
    // 1. Request challenge from server
    const { data, error } = await supabase.functions.invoke('get-registration-options', {
      body: { userId, username, rpID, rpName }
    });
    
    if (error) throw new Error(error.message);
    if (!data) throw new Error('No registration options returned');
    
    // 2. Create credential with browser
    const attResp = await startRegistration(data);
    
    // 3. Verify and register credential on server
    const verificationResp = await supabase.functions.invoke('verify-registration', {
      body: { 
        userId, 
        credential: attResp,
        expectedChallenge: data.challenge,
      }
    });
    
    if (verificationResp.error) throw new Error(verificationResp.error.message);
    
    return { success: true, message: 'Passkey registered successfully!' };
  } catch (error: any) {
    console.error('Error registering passkey:', error);
    return { success: false, message: error.message || 'Failed to register passkey' };
  }
}

/**
 * Start the passkey authentication process
 */
export async function authenticateWithPasskey(username: string) {
  try {
    // 1. Request challenge from server
    const { data, error } = await supabase.functions.invoke('get-authentication-options', {
      body: { username, rpID }
    });
    
    if (error) throw new Error(error.message);
    if (!data) throw new Error('No authentication options returned');
    
    // 2. Use credential to sign challenge with browser
    const authResp = await startAuthentication(data);
    
    // 3. Verify authentication with server
    const verificationResp = await supabase.functions.invoke('verify-authentication', {
      body: { 
        credential: authResp,
        expectedChallenge: data.challenge,
      }
    });
    
    if (verificationResp.error) throw new Error(verificationResp.error.message);
    
    return { 
      success: true, 
      message: 'Authentication successful!',
      session: verificationResp.data.session
    };
  } catch (error: any) {
    console.error('Error authenticating with passkey:', error);
    return { success: false, message: error.message || 'Failed to authenticate with passkey' };
  }
}

/**
 * Check if passkeys are supported by the browser
 */
export function isPasskeySupported() {
  return window.PublicKeyCredential !== undefined;
} 