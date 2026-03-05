import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/story_v5/',
  build: {
    outDir: 'dist-scripts',
    rollupOptions: {
      input: path.resolve(__dirname, 'scripts-site.html'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')]
    }
  }
})
