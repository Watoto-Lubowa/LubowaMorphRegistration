import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Base URL for GitHub Pages deployment under /vue/ path
  base: '/vue/',
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
