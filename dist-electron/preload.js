"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    getAppVersion: () => electron_1.ipcRenderer.invoke('app:version'),
    getPocketBaseUrl: () => electron_1.ipcRenderer.invoke('get-pocketbase-url'),
});
// Expose environment variables to renderer process
electron_1.contextBridge.exposeInMainWorld('env', {
    POCKETBASE_URL: 'http://127.0.0.1:8090',
});
