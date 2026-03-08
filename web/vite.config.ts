import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/wardrobe': { target: 'http://localhost:8000', changeOrigin: true },
      '/upload-clothing-image': { target: 'http://localhost:8000', changeOrigin: true },
      '/stylist': { target: 'http://localhost:8000', changeOrigin: true },
      '/weather': { target: 'http://localhost:8000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8000', changeOrigin: true },
      '/outfits': { target: 'http://localhost:8000', changeOrigin: true },
      '/health': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
});
