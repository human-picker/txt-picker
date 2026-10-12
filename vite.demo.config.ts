import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  root: resolve(import.meta.dirname, 'examples/web'),
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:4173', changeOrigin: false } }
  },
  build: { outDir: resolve(import.meta.dirname, 'dist-demo'), emptyOutDir: true }
})
