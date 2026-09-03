import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    // Vercel/Netlify/split deploys: build to local `dist` (their expected dir).
    // Railway single-service: build into ../backend/public so Express serves it.
    // VERCEL=1 is set automatically by Vercel's build env.
    outDir: process.env.VERCEL || process.env.NETLIFY ? 'dist' : '../backend/public',
    emptyOutDir: true,
  },
});
