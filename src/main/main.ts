import { app, BrowserWindow, ipcMain, shell, session } from 'electron';
import * as path from 'path';
import { startPocketBaseServer, stopPocketBaseServer, getPocketBaseUrl } from './pocketbaseServer';

// Ensure environment variables are accessible
const pocketBaseUrl = getPocketBaseUrl();
console.log('PocketBase URL:', pocketBaseUrl);

// Remove electron-squirrel-startup dependency
// if (require('electron-squirrel-startup')) {
//   app.quit();
// }

let mainWindow: BrowserWindow | null = null;

const createWindow = async (): Promise<void> => {
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
          `default-src 'self' ${pocketBaseUrl}; ` +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " + 
          "font-src 'self' https://fonts.gstatic.com; " +
          "img-src 'self' data: https:; " +
          `connect-src 'self' ${pocketBaseUrl} ws://${new URL(pocketBaseUrl).host};`
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
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  // Start PocketBase server
  try {
    await startPocketBaseServer();
    console.log('PocketBase server started');
  } catch (error) {
    console.error('Failed to start PocketBase server:', error);
  }
  
  await createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopPocketBaseServer();
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

app.on('will-quit', () => {
  // Stop PocketBase server when app is about to quit
  stopPocketBaseServer();
});

// IPC handlers
ipcMain.handle('app:version', () => {
  return app.getVersion();
});

ipcMain.handle('get-pocketbase-url', () => {
  return getPocketBaseUrl();
}); 