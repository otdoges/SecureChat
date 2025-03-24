import * as path from 'path';
import { app } from 'electron';
import fs from 'fs';

// Define the path for the database
const dbPath = path.join(app.getPath('userData'), 'secure-chat.db');

// Dynamically import better-sqlite3 to avoid bundling issues
let Database: any;
let db: any;

// Initialize database
export const initDatabase = async (): Promise<void> => {
  try {
    // Dynamically import better-sqlite3
    Database = require('better-sqlite3');
    
    console.log(`Initializing database at ${dbPath}`);
    
    // Ensure the directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Create database connection
    db = new Database(dbPath, { verbose: console.log });
    
    // Create tables
    createTables();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Create necessary tables
const createTables = (): void => {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      username_suffix INTEGER NOT NULL,
      email TEXT UNIQUE NOT NULL,
      avatar_url TEXT,
      status TEXT DEFAULT 'offline',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      public_key TEXT,
      encrypted_private_key TEXT,
      custom_css TEXT
    );
  `);
  
  // Create channels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      is_direct BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      encrypted_channel_key TEXT
    );
  `);
  
  // Create messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      encrypted_content TEXT NOT NULL,
      iv TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channels (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);
  
  // Create channel_members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS channel_members (
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      encrypted_channel_key TEXT NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (channel_id, user_id),
      FOREIGN KEY (channel_id) REFERENCES channels (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  // Create user_keys table to store encrypted keys for each user
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_keys (
      user_id TEXT NOT NULL,
      key_id TEXT NOT NULL,
      encrypted_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, key_id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);
};

// Helper to get database instance
export const getDb = (): any => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

// Create or get a user
export const createOrUpdateUser = (userData: {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  status?: string;
  username_suffix?: number;
  public_key?: string;
  encrypted_private_key?: string;
  custom_css?: string;
}): void => {
  const { 
    id, 
    username, 
    email, 
    avatar_url, 
    status, 
    username_suffix = Math.floor(1000 + Math.random() * 9000), 
    public_key, 
    encrypted_private_key,
    custom_css
  } = userData;
  
  const stmt = db.prepare(`
    INSERT INTO users (
      id, 
      username, 
      username_suffix,
      email, 
      avatar_url, 
      status, 
      public_key, 
      encrypted_private_key,
      custom_css
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      username = excluded.username,
      email = excluded.email,
      avatar_url = excluded.avatar_url,
      status = excluded.status,
      public_key = COALESCE(excluded.public_key, users.public_key),
      encrypted_private_key = COALESCE(excluded.encrypted_private_key, users.encrypted_private_key),
      custom_css = COALESCE(excluded.custom_css, users.custom_css),
      updated_at = CURRENT_TIMESTAMP
  `);
  
  stmt.run(
    id, 
    username, 
    username_suffix, 
    email, 
    avatar_url || null, 
    status || 'online', 
    public_key || null, 
    encrypted_private_key || null,
    custom_css || null
  );
};

// Get a user by ID
export const getUserById = (userId: string): any => {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(userId);
};

// Update user's custom CSS
export const updateUserCSS = (userId: string, css: string): void => {
  const stmt = db.prepare('UPDATE users SET custom_css = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(css, userId);
};

// Save an encrypted message
export const saveMessage = (messageData: {
  id: string;
  channel_id: string;
  user_id: string;
  encrypted_content: string;
  iv: string;
}): void => {
  const { id, channel_id, user_id, encrypted_content, iv } = messageData;
  
  const stmt = db.prepare(`
    INSERT INTO messages (id, channel_id, user_id, encrypted_content, iv)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, channel_id, user_id, encrypted_content, iv);
};

// Get messages for a channel
export const getChannelMessages = (channelId: string): any[] => {
  const stmt = db.prepare(`
    SELECT m.*, u.username, u.username_suffix, u.avatar_url 
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.channel_id = ?
    ORDER BY m.created_at ASC
  `);
  
  return stmt.all(channelId);
};

// Store encrypted channel key for a user
export const storeChannelKey = (data: {
  channel_id: string;
  user_id: string;
  encrypted_channel_key: string;
}): void => {
  const { channel_id, user_id, encrypted_channel_key } = data;
  
  const stmt = db.prepare(`
    INSERT INTO channel_members (channel_id, user_id, encrypted_channel_key)
    VALUES (?, ?, ?)
    ON CONFLICT(channel_id, user_id) DO UPDATE SET
      encrypted_channel_key = excluded.encrypted_channel_key,
      joined_at = CURRENT_TIMESTAMP
  `);
  
  stmt.run(channel_id, user_id, encrypted_channel_key);
};

// Get encrypted channel key for a user
export const getChannelKey = (channelId: string, userId: string): string | null => {
  const stmt = db.prepare(`
    SELECT encrypted_channel_key
    FROM channel_members
    WHERE channel_id = ? AND user_id = ?
  `);
  
  const result = stmt.get(channelId, userId);
  return result ? result.encrypted_channel_key : null;
};

// Close database connection
export const closeDatabase = (): void => {
  if (db) {
    db.close();
    console.log('Database connection closed');
  }
}; 