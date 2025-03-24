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
      'import.meta.env.POCKETBASE_URL': JSON.stringify(env.POCKETBASE_URL || 'http://127.0.0.1:8090'),
      'process.env.POCKETBASE_URL': JSON.stringify(env.POCKETBASE_URL || 'http://127.0.0.1:8090'),
      'process.env.PB_ADMIN_EMAIL': JSON.stringify(env.PB_ADMIN_EMAIL || 'admin@secuechat.app'),
      'process.env.PB_ADMIN_PASSWORD': JSON.stringify(env.PB_ADMIN_PASSWORD || 'secureadminpassword'),
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
              'process.env.POCKETBASE_URL': JSON.stringify(env.POCKETBASE_URL || 'http://127.0.0.1:8090'),
              'process.env.PB_ADMIN_EMAIL': JSON.stringify(env.PB_ADMIN_EMAIL || 'admin@secuechat.app'),
              'process.env.PB_ADMIN_PASSWORD': JSON.stringify(env.PB_ADMIN_PASSWORD || 'secureadminpassword'),
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
            define: {
              'process.env.POCKETBASE_URL': JSON.stringify(env.POCKETBASE_URL || 'http://127.0.0.1:8090'),
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