import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { bridgePlugin } from './vite-bridge-plugin.ts'

export default defineConfig({
  base: '/story_v5/',
  plugins: [react(), bridgePlugin()],
  server: {
    host: true,
    fs: {
      allow: [path.resolve(__dirname, '..')]
    }
  }
})
