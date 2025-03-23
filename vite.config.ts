import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { rmSync } from 'node:fs';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd());
  
  // Clean the dist directory
  rmSync('dist', { recursive: true, force: true });
  
  return {
    root: 'src/renderer',
    publicDir: '../../public',
    server: {
      port: 3000,
    },
    build: {
      outDir: '../../dist',
      emptyOutDir: true,
    },
    // Make env variables available to the renderer process
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    plugins: [
      react(),
      electron([
        {
          entry: path.join(__dirname, 'src/main/main.ts'),
          vite: {
            build: {
              outDir: 'dist/main',
            },
            // Pass environment variables as define in the build
            define: {
              'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
              'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
            },
          },
        },
        // Electron preload script
        {
          entry: path.join(__dirname, 'src/main/preload.ts'),
          vite: {
            build: {
              outDir: 'dist/preload',
            },
          },
          onstart: (options) => {
            options.startup();
          },
        }
      ]),
      renderer(),
    ],
  };
}); 