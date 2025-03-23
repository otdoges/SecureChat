import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getPocketBaseUrl: () => ipcRenderer.invoke('get-pocketbase-url'),
});

// Expose environment variables to renderer process
contextBridge.exposeInMainWorld('env', {
  POCKETBASE_URL: 'http://127.0.0.1:8090',
}); 