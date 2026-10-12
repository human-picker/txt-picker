import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'TxtPicker',
      formats: ['es'],
      fileName: () => 'txt-picker.js',
      cssFileName: 'style'
    },
    rollupOptions: { external: ['vue'] },
    target: 'es2022'
  }
})
