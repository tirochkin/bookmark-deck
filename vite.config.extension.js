import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

// Vite config for building the Chrome extension
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'extension/assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        extension: resolve(__dirname, 'src/extension/main.js'),
        newtab: resolve(__dirname, 'src/newtab/main.js')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'shared-[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
})
