import { app, BrowserWindow, ipcMain, shell, session } from 'electron';
import * as path from 'path';

// Ensure environment variables are accessible
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key exists:', !!supabaseAnonKey);

// Remove electron-squirrel-startup dependency
// if (require('electron-squirrel-startup')) {
//   app.quit();
// }

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  console.log('Creating window...');
  console.log('Current directory:', __dirname);
  
  // Get the preload script path
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload path:', preloadPath);
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 940,
    minHeight: 600,
    backgroundColor: '#36393f', // Discord primary color
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
    frame: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#202225', // Discord tertiary color
      symbolColor: '#dcddde', // Discord text color
      height: 32
    },
  });

  // Set Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' https://*.supabase.co; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " + 
          "img-src 'self' data: https:; " +
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
        ],
      },
    });
  });

  // In development mode, load from the development server
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools for debugging
    mainWindow.webContents.openDevTools();
    
    // Load index.html if 404 is encountered
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      if (errorCode === -6 && mainWindow) { // ERR_FILE_NOT_FOUND
        console.log('Page not found, loading default index.html');
        mainWindow.loadFile(path.join(__dirname, '..', '..', 'index.html'));
      }
    });
  } else {
    // In production, load from the local file
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for secure communication between main and renderer process
ipcMain.handle('app:version', () => {
  return app.getVersion();
}); 