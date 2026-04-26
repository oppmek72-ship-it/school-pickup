import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: ['defaults', 'not IE 11', 'iOS >= 11', 'Android >= 5', 'Chrome >= 60', 'Safari >= 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      modernPolyfills: true,
    }),
  ],
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
    cssMinify: true,
    sourcemap: false,
    reportCompressedSize: false, // skip gzip-size calc to speed up build
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
