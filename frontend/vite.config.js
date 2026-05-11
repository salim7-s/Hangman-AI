import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,      // disable source maps in production build
    chunkSizeWarningLimit: 800, // silence warnings for Three.js chunks
  },
  preview: {
    port: 5173,
  },
  server: {
    port: 5173,
  },
})
