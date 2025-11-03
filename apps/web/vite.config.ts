import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    open: true,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@edustats/shared': path.resolve(__dirname, '../../packages/shared'),
    },
    preserveSymlinks: true,
  },
  define: {
    'process.env': process.env
  }
})
