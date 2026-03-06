import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/story_v5/',
  plugins: [react()],
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')]
    }
  }
})
