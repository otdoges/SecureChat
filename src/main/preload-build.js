// This is a simple script to ensure preload.js is generated
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directory for output
const outputDir = path.join(__dirname, '..', '..', 'dist-electron');

// Check if directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Compile preload.ts to preload.js using TypeScript compiler
try {
  execSync(`tsc ${path.join(__dirname, 'preload.ts')} --outDir ${outputDir} --target ES2020 --module CommonJS`);
  console.log('Preload script compiled successfully');
} catch (error) {
  console.error('Error compiling preload script:', error);
}

// Copy preload.js to dist-electron if it exists but doesn't compile
if (!fs.existsSync(path.join(outputDir, 'preload.js'))) {
  const preloadContent = `
    const { contextBridge, ipcRenderer } = require('electron');

    // Expose protected methods that allow the renderer process to use
    // the ipcRenderer without exposing the entire object
    contextBridge.exposeInMainWorld('api', {
      // App info
      getAppVersion: () => ipcRenderer.invoke('app:version'),
    });
  `;
  
  fs.writeFileSync(path.join(outputDir, 'preload.js'), preloadContent);
  console.log('Preload script created manually');
} 