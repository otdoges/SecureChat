"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.createOrUpdateUser = exports.getDb = exports.initDatabase = void 0;
const path = __importStar(require("path"));
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
// Define the path for the database
const dbPath = path.join(electron_1.app.getPath('userData'), 'secure-chat.db');
// Dynamically import better-sqlite3 to avoid bundling issues
let Database;
let db;
// Initialize database
const initDatabase = async () => {
    try {
        // Dynamically import better-sqlite3
        Database = require('better-sqlite3');
        console.log(`Initializing database at ${dbPath}`);
        // Ensure the directory exists
        const dbDir = path.dirname(dbPath);
        if (!fs_1.default.existsSync(dbDir)) {
            fs_1.default.mkdirSync(dbDir, { recursive: true });
        }
        // Create database connection
        db = new Database(dbPath, { verbose: console.log });
        // Create tables
        createTables();
        console.log('Database initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
};
exports.initDatabase = initDatabase;
// Create necessary tables
const createTables = () => {
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
const getDb = () => {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
};
exports.getDb = getDb;
// Create or get a user
const createOrUpdateUser = (userData) => {
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
exports.createOrUpdateUser = createOrUpdateUser;
// Close database connection
const closeDatabase = () => {
    if (db) {
        db.close();
        console.log('Database connection closed');
    }
};
exports.closeDatabase = closeDatabase;
