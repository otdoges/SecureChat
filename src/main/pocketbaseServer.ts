import { app } from 'electron';
import * as path from 'path';
import PocketBase from 'pocketbase';

// Define PocketBase server URL 
// This can be your local or remote PocketBase URL
const PB_PORT = 8090;
const PB_URL = process.env.POCKETBASE_URL || `http://127.0.0.1:${PB_PORT}`;

// Initialize PocketBase client
const pb = new PocketBase(PB_URL);

/**
 * Start the PocketBase client connection
 * Now we're just initializing the client connection, not starting a server
 */
export const startPocketBaseServer = async (): Promise<void> => {
  try {
    console.log('Connecting to PocketBase at:', PB_URL);
    
    // Check if the server is accessible
    const response = await fetch(`${PB_URL}/api/health`);
    if (response.ok) {
      console.log('PocketBase server is accessible');
    } else {
      console.warn('PocketBase server responded with status:', response.status);
    }
    
    // Initialize collections if we're using an admin account
    if (process.env.PB_ADMIN_EMAIL && process.env.PB_ADMIN_PASSWORD) {
      await initializeCollections();
    } else {
      console.log('Skipping collection initialization (no admin credentials provided)');
    }
  } catch (error) {
    console.error('Failed to connect to PocketBase server:', error);
    console.log('Please make sure PocketBase is running at:', PB_URL);
    console.log('You can:');
    console.log('1. Install PocketBase from https://pocketbase.io/docs/');
    console.log(`2. Run it with: ./pocketbase serve --http=127.0.0.1:${PB_PORT}`);
    console.log('3. Or use a remote PocketBase instance by setting POCKETBASE_URL environment variable');
    
    // Don't throw an error, just log it - the app can still function without PocketBase
  }
};

/**
 * Initialize PocketBase collections
 */
const initializeCollections = async (): Promise<void> => {
  try {
    // Log in as admin
    await pb.admins.authWithPassword(
      process.env.PB_ADMIN_EMAIL || 'admin@secuechat.app',
      process.env.PB_ADMIN_PASSWORD || 'secureadminpassword'
    );
    
    // Create collections if they don't exist
    const collections = await pb.collections.getFullList();
    
    // Check if users collection exists
    if (!collections.find(c => c.name === 'users')) {
      // Users collection is created automatically
      console.log('Users collection exists by default');
    }
    
    // Create channels collection
    if (!collections.find(c => c.name === 'channels')) {
      await pb.collections.create({
        name: 'channels',
        type: 'base',
        schema: [
          {
            name: 'name',
            type: 'text',
            required: true,
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'isPrivate',
            type: 'bool',
            defaultValue: false,
          },
          {
            name: 'members',
            type: 'relation',
            options: { collectionId: '_pb_users_auth_', cascadeDelete: false },
          },
          {
            name: 'encrypted_channel_key',
            type: 'text',
          },
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
      });
      console.log('Created channels collection');
    }
    
    // Create messages collection
    if (!collections.find(c => c.name === 'messages')) {
      await pb.collections.create({
        name: 'messages',
        type: 'base',
        schema: [
          {
            name: 'encrypted_content',
            type: 'text',
            required: true,
          },
          {
            name: 'iv',
            type: 'text',
            required: true,
          },
          {
            name: 'channel_id',
            type: 'relation',
            required: true,
            options: { collectionId: 'channels', cascadeDelete: true },
          },
          {
            name: 'user_id',
            type: 'relation',
            required: true,
            options: { collectionId: '_pb_users_auth_', cascadeDelete: false },
          },
          {
            name: 'attachments',
            type: 'file',
            options: { maxSelect: 5, maxSize: 5242880 },
          },
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id = @collection.messages.user_id',
        deleteRule: '@request.auth.id = @collection.messages.user_id',
      });
      console.log('Created messages collection');
    }
    
    // Create channel_members collection
    if (!collections.find(c => c.name === 'channel_members')) {
      await pb.collections.create({
        name: 'channel_members',
        type: 'base',
        schema: [
          {
            name: 'channel_id',
            type: 'relation',
            required: true,
            options: { collectionId: 'channels', cascadeDelete: true },
          },
          {
            name: 'user_id',
            type: 'relation',
            required: true,
            options: { collectionId: '_pb_users_auth_', cascadeDelete: true },
          },
          {
            name: 'encrypted_channel_key',
            type: 'text',
            required: true,
          },
          {
            name: 'joined_at',
            type: 'date',
            required: true,
          },
        ],
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id = @collection.channel_members.user_id',
        deleteRule: '@request.auth.id = @collection.channel_members.user_id',
      });
      console.log('Created channel_members collection');
    }
    
    // Create passkeys collection
    if (!collections.find(c => c.name === 'passkeys')) {
      await pb.collections.create({
        name: 'passkeys',
        type: 'base',
        schema: [
          {
            name: 'user',
            type: 'relation',
            required: true,
            options: { collectionId: '_pb_users_auth_', cascadeDelete: true },
          },
          {
            name: 'credentialId',
            type: 'text',
            required: true,
          },
          {
            name: 'publicKey',
            type: 'text',
            required: true,
          },
          {
            name: 'counter',
            type: 'number',
            required: true,
          },
          {
            name: 'transports',
            type: 'json',
          },
        ],
        listRule: '@request.auth.id = user.id',
        viewRule: '@request.auth.id = user.id',
        createRule: '@request.auth.id = user.id',
        updateRule: '@request.auth.id = user.id',
        deleteRule: '@request.auth.id = user.id',
      });
      console.log('Created passkeys collection');
    }
    
    // Create qr_login_sessions collection
    if (!collections.find(c => c.name === 'qr_login_sessions')) {
      await pb.collections.create({
        name: 'qr_login_sessions',
        type: 'base',
        schema: [
          {
            name: 'token',
            type: 'text',
            required: true,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            options: {
              values: ['pending', 'authenticated', 'expired', 'cancelled'],
            },
          },
          {
            name: 'user',
            type: 'relation',
            options: { collectionId: '_pb_users_auth_', cascadeDelete: false },
          },
          {
            name: 'authenticated_at',
            type: 'date',
          },
          {
            name: 'expires_at',
            type: 'date',
            required: true,
          },
        ],
        createRule: '',
        updateRule: 'status = "pending" && @request.data.status = "authenticated"',
        deleteRule: '',
      });
      console.log('Created qr_login_sessions collection');
    }
  } catch (error) {
    console.error('Error initializing collections:', error);
  }
};

/**
 * Stop the PocketBase connection
 * Now just a no-op function since we're not managing a server
 */
export const stopPocketBaseServer = (): void => {
  console.log('Disconnecting from PocketBase');
  // Nothing to do here now
};

/**
 * Get the PocketBase client instance
 */
export const getPocketBaseClient = (): PocketBase => {
  return pb;
};

/**
 * Get the PocketBase server URL
 */
export const getPocketBaseUrl = (): string => {
  return PB_URL;
}; 