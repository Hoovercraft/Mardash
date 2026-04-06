import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8282',
        changeOrigin: true,
      },
      '/icons': {
        target: 'http://localhost:8282',
        changeOrigin: true,
      },
      '/backgrounds': {
        target: 'http://localhost:8282',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react-vendor'
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) return 'i18n'
          if (id.includes('node_modules/leaflet')) return 'leaflet'
          if (id.includes('node_modules/@dnd-kit')) return 'dnd-kit'

          if (id.includes('/src/pages/MediaPage') || id.includes('/src/components/MediaCard')) return 'media'
          if (id.includes('/src/pages/UnraidPage')) return 'unraid'
          if (id.includes('/src/pages/WidgetsPage')) return 'widgets'
          if (id.includes('/src/pages/HaPage') || id.includes('/src/pages/HaPanelCard') || id.includes('/src/components/Ha')) return 'home-assistant'
          if (id.includes('/src/pages/BackupPage')) return 'backup'
          if (id.includes('/src/pages/NetworkPage')) return 'network'
          if (id.includes('/src/pages/LogbuchPage')) return 'logbuch'
        },
      },
    },
  },
})
