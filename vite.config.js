import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'

function resolveJsToTs() {
  return {
    name: 'resolve-js-to-ts',
    resolveId(source, importer) {
      if (!importer || !source.endsWith('.js')) return null;
      const tsPath = source.replace(/\.js$/, '.ts');
      const resolved = path.resolve(path.dirname(importer), tsPath);
      if (fs.existsSync(resolved)) return resolved;
      const tsxPath = source.replace(/\.js$/, '.tsx');
      const resolvedTsx = path.resolve(path.dirname(importer), tsxPath);
      if (fs.existsSync(resolvedTsx)) return resolvedTsx;
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
      },
    }),
  ],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
})
