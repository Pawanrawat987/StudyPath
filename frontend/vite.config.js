import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Forward API calls to the Express backend during local development
    proxy: {
      '/api': process.env.VITE_API_PROXY_TARGET || 'http://localhost:5000',
    },
  },
});
