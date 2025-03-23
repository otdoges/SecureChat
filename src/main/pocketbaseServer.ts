import { app } from 'electron';
import * as path from 'path';
import PocketBase from 'pocketbase';
import * as fs from 'fs';
import * as http from 'http';

// Define PocketBase server URL and port
const PB_PORT = 8090;
const PB_URL = `http://127.0.0.1:${PB_PORT}`;

// Path to the PocketBase executable in production
const getPocketBaseExecutablePath = () => {
  // In development, we'll use the PocketBase node module
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    return null;
  }

  // In production, we'll use the PocketBase executable
  const platform = process.platform;
  const arch = process.arch;
  
  let executableName = 'pocketbase';
  
  if (platform === 'win32') {
    executableName = 'pocketbase.exe';
  }
  
  return path.join(app.getAppPath(), 'pocketbase', platform, arch, executableName);
};

// Path to PocketBase data directory
const getPocketBaseDataDir = () => {
  return path.join(app.getPath('userData'), 'pocketbase_data');
};

// PocketBase server process
let pocketBaseProcess: any = null;

// Initialize PocketBase client
const pb = new PocketBase(PB_URL);

/**
 * Start the PocketBase server
 */
export const startPocketBaseServer = async (): Promise<void> => {
  // Check if PocketBase server is already running
  try {
    const response = await fetch(`${PB_URL}/api/health`);
    if (response.ok) {
      console.log('PocketBase server is already running');
      return;
    }
  } catch (err) {
    // Server is not running, continue with startup
  }

  // Create data directory if it doesn't exist
  const dataDir = getPocketBaseDataDir();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const execPath = getPocketBaseExecutablePath();
  
  if (execPath && fs.existsSync(execPath)) {
    // Start PocketBase executable in production
    const { spawn } = require('child_process');
    
    pocketBaseProcess = spawn(execPath, ['serve', '--http', `127.0.0.1:${PB_PORT}`, '--dir', dataDir], {
      detached: false,
    });
    
    pocketBaseProcess.stdout.on('data', (data: Buffer) => {
      console.log(`PocketBase: ${data.toString()}`);
    });
    
    pocketBaseProcess.stderr.on('data', (data: Buffer) => {
      console.error(`PocketBase error: ${data.toString()}`);
    });
  } else {
    // In development, we'll use the HTTP server to check if PocketBase is available
    console.log('Please start PocketBase server separately during development');
    console.log(`- Download PocketBase from https://pocketbase.io/docs/`);
    console.log(`- Run it with: ./pocketbase serve --http=127.0.0.1:${PB_PORT} --dir=${dataDir}`);
  }

  // Wait for server to be ready
  await waitForServerReady();
  
  // Initialize collections
  await initializeCollections();
};

/**
 * Wait for the PocketBase server to be ready
 */
const waitForServerReady = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const MAX_RETRIES = 20;
    let retries = 0;
    
    const checkServer = () => {
      http.get(`${PB_URL}/api/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('PocketBase server is ready');
          resolve();
        } else {
          retryConnection();
        }
      }).on('error', () => {
        retryConnection();
      });
    };
    
    const retryConnection = () => {
      retries += 1;
      if (retries > MAX_RETRIES) {
        reject(new Error('Could not connect to PocketBase server'));
        return;
      }
      
      console.log(`Waiting for PocketBase server to be ready (attempt ${retries}/${MAX_RETRIES})...`);
      setTimeout(checkServer, 1000);
    };
    
    checkServer();
  });
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
            name: 'content',
            type: 'text',
            required: true,
          },
          {
            name: 'encrypted',
            type: 'bool',
            defaultValue: true,
          },
          {
            name: 'channel',
            type: 'relation',
            required: true,
            options: { collectionId: 'channels', cascadeDelete: true },
          },
          {
            name: 'user',
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
        updateRule: '@request.auth.id = @collection.messages.user',
        deleteRule: '@request.auth.id = @collection.messages.user',
      });
      console.log('Created messages collection');
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
        listRule: '@request.auth.id = @collection.passkeys.user',
        viewRule: '@request.auth.id = @collection.passkeys.user',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id = @collection.passkeys.user',
        deleteRule: '@request.auth.id = @collection.passkeys.user',
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
              values: ['pending', 'authenticated', 'expired'],
            },
          },
          {
            name: 'user',
            type: 'relation',
            options: { collectionId: '_pb_users_auth_', cascadeDelete: false },
          },
          {
            name: 'expires_at',
            type: 'date',
            required: true,
          },
          {
            name: 'authenticated_at',
            type: 'date',
          },
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: '',
      });
      console.log('Created qr_login_sessions collection');
    }
    
    console.log('PocketBase collections initialized');
    
  } catch (error) {
    console.error('Error initializing PocketBase collections:', error);
  }
};

/**
 * Stop the PocketBase server
 */
export const stopPocketBaseServer = (): void => {
  if (pocketBaseProcess) {
    console.log('Stopping PocketBase server...');
    pocketBaseProcess.kill();
    pocketBaseProcess = null;
  }
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