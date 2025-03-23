import CryptoJS from 'crypto-js';

// AES encryption key size (256 bits)
const KEY_SIZE = 256 / 32;
const ITERATION_COUNT = 1000;

// Generate a secure key from a password and salt
const generateKey = (password: string, salt: string): string => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: KEY_SIZE,
    iterations: ITERATION_COUNT
  }).toString();
};

// Generate a random salt
const generateSalt = (): string => {
  return CryptoJS.lib.WordArray.random(128 / 8).toString();
};

// Encrypt message using AES-256
export const encryptMessage = (message: string, channelKey: string): string => {
  try {
    // Generate random IV for this message
    const iv = CryptoJS.lib.WordArray.random(128 / 8);
    
    // Encrypt the message
    const encrypted = CryptoJS.AES.encrypt(message, channelKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Combine IV and encrypted message
    const result = iv.toString() + ':' + encrypted.toString();
    
    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

// Decrypt message using AES-256
export const decryptMessage = (encryptedMessage: string, channelKey: string): string => {
  try {
    // Split IV and encrypted part
    const parts = encryptedMessage.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted message format');
    }
    
    const iv = CryptoJS.enc.Hex.parse(parts[0]);
    const encrypted = parts[1];
    
    // Decrypt the message
    const decrypted = CryptoJS.AES.decrypt(encrypted, channelKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
};

// Generate a channel key based on channel ID and user keys
export const generateChannelKey = (channelId: string, userKey: string): string => {
  const salt = channelId; // Use channelId as salt
  return generateKey(userKey, salt);
};

// Generate a user encryption key
export const generateUserKey = (userId: string, password: string): string => {
  const salt = userId; // Use userId as salt
  return generateKey(password, salt);
};

// Store user key securely in local storage (encrypted with their password)
export const storeUserKey = (userKey: string, password: string): void => {
  const salt = generateSalt();
  const encryptedKey = CryptoJS.AES.encrypt(userKey, password, {
    salt: CryptoJS.enc.Hex.parse(salt)
  }).toString();
  
  localStorage.setItem('userEncryptionKey', encryptedKey);
  localStorage.setItem('userKeySalt', salt);
};

// Retrieve user key from local storage
export const retrieveUserKey = (password: string): string | null => {
  const encryptedKey = localStorage.getItem('userEncryptionKey');
  const salt = localStorage.getItem('userKeySalt');
  
  if (!encryptedKey || !salt) {
    return null;
  }
  
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, password, {
      salt: CryptoJS.enc.Hex.parse(salt)
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error retrieving user key:', error);
    return null;
  }
};

// Setup encryption (called once when app starts)
export const setupEncryption = () => {
  // Initialize any encryption setup needed
  console.log('Encryption system initialized');
}; 