"use strict";const e=require("electron");e.contextBridge.exposeInMainWorld("electronAPI",{getAppVersion:()=>e.ipcRenderer.invoke("app:version"),getPocketBaseUrl:()=>e.ipcRenderer.invoke("get-pocketbase-url")});e.contextBridge.exposeInMainWorld("env",{POCKETBASE_URL:"http://127.0.0.1:8090"});
