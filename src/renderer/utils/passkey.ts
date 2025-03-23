import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import type { 
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON
} from '@simplewebauthn/typescript-types';
import { getPocketBase } from './pocketbaseClient';

// Application ID - should match your site's domain
const rpID = window.location.hostname || 'localhost';
const rpName = 'Secure Chat';

// Get PocketBase client
const pb = getPocketBase();

/**
 * Generate challenge for WebAuthn operations
 */
const generateChallenge = (): string => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Start the passkey registration process
 */
export async function registerPasskey(userId: string, username: string) {
  try {
    // Generate registration options
    const challenge = generateChallenge();
    
    // Basic registration options - in a production app, these would come from your server
    const options: PublicKeyCredentialCreationOptionsJSON = {
      challenge,
      rp: {
        name: rpName,
        id: rpID,
      },
      user: {
        id: userId,
        name: username,
        displayName: username,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      timeout: 60000,
      attestation: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        requireResidentKey: true,
      },
    };
    
    // Create credential with browser
    const attResp = await startRegistration(options);
    
    // Save credential to PocketBase
    await pb.collection('passkeys').create({
      user: userId,
      credentialId: attResp.id,
      publicKey: JSON.stringify(attResp.response),
      counter: 0,
      transports: attResp.response.transports || [],
    });
    
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
    // Find user by username
    const user = await pb.collection('users').getFirstListItem(`username = "${username}"`);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get user's passkeys
    const passkeys = await pb.collection('passkeys').getFullList({
      filter: `user = "${user.id}"`,
    });
    
    if (!passkeys || passkeys.length === 0) {
      throw new Error('No passkeys registered for this user');
    }
    
    // Generate authentication options
    const challenge = generateChallenge();
    
    // Basic authentication options - in a production app, these would come from your server
    const options: PublicKeyCredentialRequestOptionsJSON = {
      challenge,
      rpId: rpID,
      timeout: 60000,
      userVerification: 'preferred',
      allowCredentials: passkeys.map(passkey => ({
        id: passkey.credentialId,
        type: 'public-key',
        transports: passkey.transports || undefined,
      })),
    };
    
    // Use credential to sign challenge with browser
    const authResp = await startAuthentication(options);
    
    // In a real application, you would verify the authentication on the server
    // Here we're just checking if the credential ID exists in the user's passkeys
    const matchingPasskey = passkeys.find(p => p.credentialId === authResp.id);
    
    if (!matchingPasskey) {
      throw new Error('Invalid credential');
    }
    
    // Authenticate the user with PocketBase
    const authData = await pb.collection('users').authWithPassword(user.email, 'passkey-auth');
    
    if (!authData) {
      throw new Error('Authentication failed');
    }
    
    return { 
      success: true, 
      message: 'Authentication successful!',
      session: authData
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