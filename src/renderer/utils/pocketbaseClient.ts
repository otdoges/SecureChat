import PocketBase from 'pocketbase';

// Type alias for PocketBase record
type Record = any;

// Declare window for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      getPocketBaseUrl: () => Promise<string>;
    };
    env: {
      POCKETBASE_URL: string;
    };
  }
}

// Get PocketBase URL
const getPocketBaseUrl = async (): Promise<string> => {
  try {
    // Try to get from preload script first
    if (window.electronAPI?.getPocketBaseUrl) {
      return await window.electronAPI.getPocketBaseUrl();
    }
  } catch (error) {
    console.error('Error getting PocketBase URL from IPC:', error);
  }

  // Fallback to window.env
  if (window.env?.POCKETBASE_URL) {
    return window.env.POCKETBASE_URL;
  }

  // Default fallback
  return 'http://127.0.0.1:8090';
};

// Initialize PocketBase client
let pocketBaseUrl = 'http://127.0.0.1:8090';
let pb: PocketBase = new PocketBase(pocketBaseUrl);

// Initialize the client asynchronously
export const initPocketBaseClient = async (): Promise<void> => {
  pocketBaseUrl = await getPocketBaseUrl();
  pb = new PocketBase(pocketBaseUrl);
  
  // Try to auto-authenticate from local storage
  pb.authStore.onChange(() => {
    console.log('Auth state changed:', pb.authStore.isValid);
  });
};

// Initialize the client immediately
initPocketBaseClient().catch(error => {
  console.error('Failed to initialize PocketBase client:', error);
});

// Auth related functions
export const register = async (
  email: string,
  password: string,
  username: string
): Promise<Record> => {
  return await pb.collection('users').create({
    email,
    password,
    passwordConfirm: password,
    username,
  });
};

export const login = async (
  email: string,
  password: string
): Promise<Record> => {
  return await pb.collection('users').authWithPassword(email, password);
};

export const logout = (): void => {
  pb.authStore.clear();
};

export const getCurrentUser = (): Record | null => {
  return pb.authStore.model;
};

export const isAuthenticated = (): boolean => {
  return pb.authStore.isValid;
};

// Passkey related functions
export const registerPasskey = async (
  userId: string,
  credentialId: string,
  publicKey: string,
  counter: number,
  transports?: string[]
): Promise<Record> => {
  return await pb.collection('passkeys').create({
    user: userId,
    credentialId,
    publicKey,
    counter,
    transports,
  });
};

export const getPasskeys = async (userId: string): Promise<Record[]> => {
  return await pb.collection('passkeys').getFullList({
    filter: `user = "${userId}"`,
  });
};

// QR login related functions
export const createQRLoginSession = async (): Promise<Record> => {
  return await pb.collection('qr_login_sessions').create({
    token: crypto.randomUUID(),
    status: 'pending',
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
};

export const getQRLoginSession = async (token: string): Promise<Record> => {
  return await pb.collection('qr_login_sessions').getFirstListItem(`token = "${token}"`);
};

export const updateQRLoginSession = async (
  id: string,
  data: { status: string; user?: string; authenticated_at?: string }
): Promise<Record> => {
  return await pb.collection('qr_login_sessions').update(id, data);
};

// Channel related functions
export const createChannel = async (
  name: string,
  description: string,
  isPrivate: boolean = false,
  members: string[] = []
): Promise<Record> => {
  return await pb.collection('channels').create({
    name,
    description,
    isPrivate,
    members,
  });
};

export const getChannels = async (): Promise<Record[]> => {
  return await pb.collection('channels').getFullList();
};

export const getChannel = async (id: string): Promise<Record> => {
  return await pb.collection('channels').getOne(id);
};

// Message related functions
export const createMessage = async (
  content: string,
  channelId: string,
  encrypted: boolean = true,
  attachments?: File[]
): Promise<Record> => {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('channel', channelId);
  formData.append('encrypted', encrypted.toString());
  
  if (attachments) {
    for (const file of attachments) {
      formData.append('attachments', file);
    }
  }
  
  return await pb.collection('messages').create(formData);
};

export const getMessages = async (
  channelId: string,
  page: number = 1,
  perPage: number = 50
): Promise<Record[]> => {
  return await pb.collection('messages').getList(page, perPage, {
    filter: `channel = "${channelId}"`,
    sort: '-created',
    expand: 'user',
  }).then(result => result.items);
};

// Realtime subscription helper
export const subscribeToCollection = (
  collection: string,
  callback: (data: any) => void
): (() => void) => {
  const unsubscribe = pb.collection(collection).subscribe('*', callback);
  return () => {
    unsubscribe.then(unsub => unsub());
  };
};

// Export the PocketBase instance
export const getPocketBase = (): PocketBase => pb;

/**
 * Get a user's profile data
 * @param userId The user ID
 * @returns The user profile or null if not found
 */
export async function getUserProfile(userId: string) {
  try {
    const pb = getPocketBase();
    const record = await pb.collection('users').getOne(userId, {
      expand: 'passkeys'
    });
    return record;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update a user's profile data
 * @param userId The user ID
 * @param data The profile data to update
 * @returns The updated user profile
 */
export async function updateUserProfile(userId: string, data: any) {
  try {
    const pb = getPocketBase();
    const record = await pb.collection('users').update(userId, data);
    return record;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Update a user's custom CSS
 * @param userId The user ID
 * @param css The custom CSS code
 * @returns The updated user profile
 */
export async function updateUserCustomCSS(userId: string, css: string) {
  try {
    const pb = getPocketBase();
    const record = await pb.collection('users').update(userId, {
      custom_css: css
    });
    return record;
  } catch (error) {
    console.error('Error updating user custom CSS:', error);
    throw error;
  }
}

/**
 * Update a user's encryption keys
 * @param userId The user ID
 * @param publicKey The user's public key
 * @param encryptedPrivateKey The user's encrypted private key
 * @returns The updated user profile
 */
export async function updateUserKeys(userId: string, publicKey: string, encryptedPrivateKey: string) {
  try {
    const pb = getPocketBase();
    const record = await pb.collection('users').update(userId, {
      public_key: publicKey,
      encrypted_private_key: encryptedPrivateKey
    });
    return record;
  } catch (error) {
    console.error('Error updating user encryption keys:', error);
    throw error;
  }
}

/**
 * Get the encrypted channel key for a user
 * @param channelId The channel ID
 * @param userId The user ID
 * @returns The encrypted channel key or null if not found
 */
export async function getChannelKey(channelId: string, userId: string) {
  try {
    const pb = getPocketBase();
    const record = await pb.collection('channel_members').getFirstListItem(`channel_id = "${channelId}" && user_id = "${userId}"`);
    return record?.encrypted_channel_key || null;
  } catch (error: any) {
    // If the record doesn't exist, return null
    if (error.status === 404) {
      return null;
    }
    console.error('Error getting channel key:', error);
    throw error;
  }
}

/**
 * Save an encrypted message
 * @param messageData Message data to save
 * @returns The created message record
 */
export async function saveMessage(messageData: {
  id: string;
  channel_id: string;
  user_id: string;
  encrypted_content: string;
  iv: string;
}) {
  try {
    const pb = getPocketBase();
    const record = await pb.collection('messages').create(messageData);
    return record;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
} 