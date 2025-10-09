import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   manifest: {
    //     name: 'Sugar Booth',
    //     short_name: 'sugarbooth',
    //     description: 'Cute photobooth with 4-frame strips, stickers, and pastel vibes.',
    //     theme_color: '#f6e8f7',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     start_url: '/',
    //     icons: [
    //       { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    //       { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    //     ]
    //   },
    //   workbox: { globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'] }
    // })
  ]
})
