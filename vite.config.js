import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use '/' as base path for development, '/DearHome-Frontend/' for production
  base: process.env.NODE_ENV === 'production' ? '/DearHome-Frontend/' : '/',
  build: {
    outDir: 'dist',
  },
  // Ensure the server properly serves static assets
  server: {
    watch: {
      usePolling: true,
    },
    fs: {
      strict: false,
    },
  }
})
