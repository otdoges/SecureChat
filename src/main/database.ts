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
      email TEXT UNIQUE NOT NULL,
      avatar_url TEXT,
      status TEXT DEFAULT 'offline',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      encrypted BOOLEAN DEFAULT TRUE,
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
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (channel_id, user_id),
      FOREIGN KEY (channel_id) REFERENCES channels (id),
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
}): void => {
  const { id, username, email, avatar_url, status } = userData;
  
  const stmt = db.prepare(`
    INSERT INTO users (id, username, email, avatar_url, status)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      username = excluded.username,
      email = excluded.email,
      avatar_url = excluded.avatar_url,
      status = excluded.status,
      updated_at = CURRENT_TIMESTAMP
  `);
  
  stmt.run(id, username, email, avatar_url || null, status || 'online');
};

// Close database connection
export const closeDatabase = (): void => {
  if (db) {
    db.close();
    console.log('Database connection closed');
  }
}; 