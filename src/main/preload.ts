import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getPocketBaseUrl: async () => {
    try {
      // Try to get from the main process
      return await ipcRenderer.invoke('get-pocketbase-url');
    } catch (error) {
      console.error('Failed to get PocketBase URL from main process:', error);
      // Fallback to default
      return 'http://127.0.0.1:8090';
    }
  },
});

// Expose environment variables to renderer process
contextBridge.exposeInMainWorld('env', {
  POCKETBASE_URL: process.env.POCKETBASE_URL || 'http://127.0.0.1:8090',
}); 