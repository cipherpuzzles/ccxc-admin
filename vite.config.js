import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    include: ['monaco-editor/esm/vs/editor/editor.api']
  },
  build:{
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['monaco-editor/esm/vs/editor/editor.api']
        }
      }
    }
  },
  server: {
    host: 'test.my.ikp.yt',
    port: 10446,
    https: {
      cert: fs.readFileSync('D:/Mycache/nginx-1.17-rtmp-x86/fullchain.pem'),
      key: fs.readFileSync('D:/Mycache/nginx-1.17-rtmp-x86/privkey.pem')
    }
  }
})
