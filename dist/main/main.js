"use strict";const e=require("electron"),r=require("path");function c(n){const o=Object.create(null,{[Symbol.toStringTag]:{value:"Module"}});if(n){for(const t in n)if(t!=="default"){const a=Object.getOwnPropertyDescriptor(n,t);Object.defineProperty(o,t,a.get?a:{enumerable:!0,get:()=>n[t]})}}return o.default=n,Object.freeze(o)}const i=c(r),d="https://qwenpgqeqtbxeyvtqzpi.supabase.co",p="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3ZW5wZ3FlcXRieGV5dnRxenBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NjM2NTksImV4cCI6MjA1ODMzOTY1OX0.x6hko_Eilw4Uc9Zy6ycU4SCz__kDIu2A0o3VUkOlwiU";console.log("Supabase URL:",d);console.log("Supabase Anon Key exists:",!!p);let s=null;const l=()=>{console.log("Creating window..."),console.log("Current directory:",__dirname);const n=i.join(__dirname,"preload.js");console.log("Preload path:",n),s=new e.BrowserWindow({width:1280,height:800,minWidth:940,minHeight:600,backgroundColor:"#36393f",webPreferences:{preload:n,nodeIntegration:!1,contextIsolation:!0,sandbox:!1,webSecurity:!0},frame:!0,titleBarStyle:"hidden",titleBarOverlay:{color:"#202225",symbolColor:"#dcddde",height:32}}),e.session.defaultSession.webRequest.onHeadersReceived((o,t)=>{t({responseHeaders:{...o.responseHeaders,"Content-Security-Policy":["default-src 'self' https://*.supabase.co; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"]}})}),process.env.NODE_ENV==="development"||!e.app.isPackaged?(s.loadURL("http://localhost:3000"),s.webContents.openDevTools(),s.webContents.on("did-fail-load",(o,t,a,u)=>{t===-6&&s&&(console.log("Page not found, loading default index.html"),s.loadFile(i.join(__dirname,"..","..","index.html")))})):s.loadFile(i.join(__dirname,"../dist/index.html")),s.webContents.setWindowOpenHandler(({url:o})=>(e.shell.openExternal(o),{action:"deny"}))};e.app.whenReady().then(()=>{l()});e.app.on("window-all-closed",()=>{process.platform!=="darwin"&&e.app.quit()});e.app.on("activate",()=>{e.BrowserWindow.getAllWindows().length===0&&l()});e.ipcMain.handle("app:version",()=>e.app.getVersion());
