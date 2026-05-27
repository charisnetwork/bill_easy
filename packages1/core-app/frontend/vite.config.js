import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// =========================================
// Vercel + Railway Deployment Config
// =========================================
// 
// LOCAL DEVELOPMENT:
// - Frontend runs on http://localhost:3000
// - Backend runs on http://localhost:8001 (proxied)
//
// PRODUCTION (Vercel):
// - Set VITE_BACKEND_URL in Vercel dashboard
// - Example: https://my-app.up.railway.app

// Get backend URL from env
const BACKEND_URL = process.env.VITE_BACKEND_URL;

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // Enable network access
    port: 3000,      // Frontend port
    proxy: {
      '/api': {
        target: 'http://localhost:8001',  // Local backend
        changeOrigin: true,
      }
    }
  },
  envPrefix: ['VITE_', 'REACT_APP_'],
  define: {
    // Only inject if defined
    'process.env.REACT_APP_BACKEND_URL': JSON.stringify(BACKEND_URL || ''),
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(BACKEND_URL || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
});
