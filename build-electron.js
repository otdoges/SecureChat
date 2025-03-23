const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Compile TypeScript for main and preload
console.log('Compiling TypeScript for Electron...');
exec('tsc --project electron.tsconfig.json', (err) => {
  if (err) {
    console.error('Error compiling TypeScript:', err);
    process.exit(1);
  }
  
  console.log('TypeScript compilation completed.');
  
  // Ensure preload.js is available
  const preloadSrc = path.join(__dirname, 'dist-electron', 'preload.js');
  
  if (!fs.existsSync(preloadSrc)) {
    console.error('Error: preload.js was not generated!');
    process.exit(1);
  }
  
  console.log('preload.js was successfully generated at:', preloadSrc);
  console.log('Build completed successfully.');
}); 