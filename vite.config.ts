import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@codesandbox/sandpack-react')) {
            return 'sandpack';
          }

          if (id.includes('@react-three') || id.includes('\\three\\') || id.includes('/three/')) {
            return 'three';
          }
        },
      },
    },
  },
})
