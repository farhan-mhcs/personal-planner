import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({
  base: '/personal-planner/',
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate', includeAssets: ['icon.svg'],
    manifest: { name: 'Personal Planner', short_name: 'Planner', lang: 'fa', dir: 'rtl', display: 'standalone',
      background_color: '#101827', theme_color: '#101827', start_url: '.', scope: '.',
      icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }] },
    workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2,woff}'] } })]
})
