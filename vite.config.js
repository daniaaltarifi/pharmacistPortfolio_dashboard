import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: {
    // The portfolio runs on 5173; the dashboard sits next to it.
    port: 5174,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
