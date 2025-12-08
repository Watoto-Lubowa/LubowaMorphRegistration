import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Base URL - can be overridden via --base flag or VITE_BASE_URL env var
  // Default: / for root deployment
  // For subdirectory: use '/subdirectory/'
  base: process.env.VITE_BASE_URL || '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    // Generate sourcemaps for debugging
    sourcemap: false,
    // Ensure assets are in a predictable location
    assetsDir: 'assets'
  }
})
