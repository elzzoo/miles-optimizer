import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'

function resolveJsToTs() {
  return {
    name: 'resolve-js-to-ts',
    resolveId(source, importer) {
      if (!importer) return null;
      const dir = path.dirname(importer);
      // .jsx → .tsx
      if (source.endsWith('.jsx')) {
        const tsxPath = path.resolve(dir, source.replace(/\.jsx$/, '.tsx'));
        if (fs.existsSync(tsxPath)) return tsxPath;
      }
      // .js → .ts or .tsx
      if (source.endsWith('.js')) {
        const tsPath = path.resolve(dir, source.replace(/\.js$/, '.ts'));
        if (fs.existsSync(tsPath)) return tsPath;
        const tsxPath = path.resolve(dir, source.replace(/\.js$/, '.tsx'));
        if (fs.existsSync(tsxPath)) return tsxPath;
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    resolveJsToTs(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Miles Optimizer',
        short_name: 'Miles',
        description: 'Comparez cash vs miles — trouvez le moins cher',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Prevent service worker from intercepting API routes opened as navigations
        // (e.g. /api/go redirect for booking links, opened in a new tab)
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
})
