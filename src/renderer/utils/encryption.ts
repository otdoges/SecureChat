import CryptoJS from 'crypto-js';

// AES encryption key size (256 bits)
const KEY_SIZE = 256 / 32;
const ITERATION_COUNT = 10000; // Increased for better security

// Generate a secure key from a password and salt
const generateKey = (password: string, salt: string): string => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: KEY_SIZE,
    iterations: ITERATION_COUNT
  }).toString();
};

// Generate a random salt
export const generateSalt = (): string => {
  return CryptoJS.lib.WordArray.random(128 / 8).toString();
};

// Generate a secure random key
export const generateRandomKey = (): string => {
  return CryptoJS.lib.WordArray.random(KEY_SIZE).toString();
};

// Encrypt message using AES-256
export const encryptMessage = (message: string, channelKey: string): { encryptedContent: string, iv: string } => {
  try {
    // Generate random IV for this message
    const iv = CryptoJS.lib.WordArray.random(128 / 8);
    
    // Encrypt the message
    const encrypted = CryptoJS.AES.encrypt(message, channelKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return {
      encryptedContent: encrypted.toString(),
      iv: iv.toString()
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

// Decrypt message using AES-256
export const decryptMessage = (encryptedContent: string, iv: string, channelKey: string): string => {
  try {
    const ivParsed = CryptoJS.enc.Hex.parse(iv);
    
    // Decrypt the message
    const decrypted = CryptoJS.AES.decrypt(encryptedContent, channelKey, {
      iv: ivParsed,
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

// Generate an asymmetric key pair for the user
export const generateKeyPair = (): { publicKey: string, privateKey: string } => {
  // In a real-world app, you'd use a proper asymmetric crypto library
  // For this example, we'll simulate by generating two random keys
  const privateKey = CryptoJS.lib.WordArray.random(KEY_SIZE).toString();
  const publicKey = CryptoJS.SHA256(privateKey).toString();
  
  return { publicKey, privateKey };
};

// Encrypt a key with a user's public key (simulated)
export const encryptKeyWithPublicKey = (key: string, publicKey: string): string => {
  // In a real app, you'd use the recipient's public key for asymmetric encryption
  // Here we're simplifying by using a symmetric approach
  const salt = generateSalt();
  const encrypted = CryptoJS.AES.encrypt(key, publicKey, {
    salt: CryptoJS.enc.Hex.parse(salt)
  }).toString();
  
  return salt + ':' + encrypted;
};

// Decrypt a key with a user's private key (simulated)
export const decryptKeyWithPrivateKey = (encryptedKey: string, privateKey: string): string => {
  // In a real app, you'd use the user's private key for asymmetric decryption
  // Here we're simplifying by using a symmetric approach
  const parts = encryptedKey.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted key format');
  }
  
  const salt = parts[0];
  const encrypted = parts[1];
  
  const decrypted = CryptoJS.AES.decrypt(encrypted, privateKey, {
    salt: CryptoJS.enc.Hex.parse(salt)
  });
  
  return decrypted.toString(CryptoJS.enc.Utf8);
};

// Encrypt user's private key with their password
export const encryptPrivateKey = (privateKey: string, password: string): string => {
  const salt = generateSalt();
  const encrypted = CryptoJS.AES.encrypt(privateKey, password, {
    salt: CryptoJS.enc.Hex.parse(salt)
  }).toString();
  
  return salt + ':' + encrypted;
};

// Decrypt user's private key with their password
export const decryptPrivateKey = (encryptedPrivateKey: string, password: string): string => {
  const parts = encryptedPrivateKey.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted private key format');
  }
  
  const salt = parts[0];
  const encrypted = parts[1];
  
  const decrypted = CryptoJS.AES.decrypt(encrypted, password, {
    salt: CryptoJS.enc.Hex.parse(salt)
  });
  
  return decrypted.toString(CryptoJS.enc.Utf8);
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
  console.log('Enhanced encryption system initialized');
}; 