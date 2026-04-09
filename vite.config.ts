import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'

function resolveJsToTs() {
  return {
    name: 'resolve-js-to-ts',
    resolveId(source: string, importer?: string) {
      if (!importer) return null;
      const dir = path.dirname(importer);
      if (source.endsWith('.jsx')) {
        const tsxPath = path.resolve(dir, source.replace(/\.jsx$/, '.tsx'));
        if (fs.existsSync(tsxPath)) return tsxPath;
      }
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

export default defineConfig(({ mode }) => {
  // Load env file based on mode (development/production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      resolveJsToTs(),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Miles Optimizer',
          short_name: 'Miles',
          description: 'Comparez cash vs miles — trouvez le moins cher',
          theme_color: '#2563EB',
          background_color: '#F8FAFC',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-helmet':   ['react-helmet-async'],
          },
        },
      },
    },
    server: {
      proxy: { '/api': 'http://localhost:3001' },
    },
    // Expose env vars to frontend (only VITE_* prefix is safe to expose)
    define: {
      __SUPABASE_URL__:      JSON.stringify(env.VITE_SUPABASE_URL      || ''),
      __SUPABASE_ANON_KEY__: JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
    },
  };
});
