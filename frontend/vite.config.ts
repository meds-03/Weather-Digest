import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/weather': 'http://127.0.0.1:8000',
      '/digest': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
    },
  },
})
