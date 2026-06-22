import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// El sitio público se sirve desde un subdirectorio:
//   https://codexpy.com/odontopacientes/app/
// La raíz /odontopacientes/ es el front controller de Laravel (la API), y el
// web-admin vive en /odontopacientes/web-admin/.
// https://vitejs.dev/config/
export default defineConfig({
  base: '/odontopacientes/app/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    host: true,
    cors: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
