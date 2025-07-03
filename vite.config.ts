import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vercel from 'vite-plugin-vercel'
import path from 'path'

export default defineConfig({
  plugins: [vercel(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  }
})
