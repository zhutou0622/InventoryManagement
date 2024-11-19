import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    host: true // 允许外部访问
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})