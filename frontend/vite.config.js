import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true
      }
    }
  },
  build: {
    target: ['es2015', 'chrome80', 'safari13', 'firefox78'],
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router')) return 'react-vendor';
          if (id.includes('react-dom') || id.includes('/react/')) return 'react-vendor';
          if (id.includes('socket.io-client')) return 'socket';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('react-hot-toast')) return 'toast';
          if (id.includes('axios')) return 'axios';
        }
      }
    }
  }
})
