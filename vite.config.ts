import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// Groups a module id under a short package/app label for the inventory report.
function getModuleGroup(id: string): string {
  if (id.includes('node_modules')) {
    const match = id.replace(/\\/g, '/').match(/node_modules\/(\.pnpm\/)?(@[^/]+\/[^/]+|[^/]+)/);
    return match ? match[2].replace(/^@n20a\//, '@n20a/') : 'node_modules/other';
  }
  const appMatch = id.replace(/\\/g, '/').match(/\/src\/component\/([^/]+)/);
  return appMatch ? `src/${appMatch[1]}` : 'app/other';
}

// Emits dist/chunk-inventory.json: for every output chunk, its size and the
// modules it contains (grouped by package), so oversized chunks can be reorganized.
function chunkInventoryPlugin(): Plugin {
  return {
    name: 'chunk-inventory',
    generateBundle(_options, bundle) {
      const report: Record<string, unknown> = {};

      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type !== 'chunk') continue;

        const groupSizes: Record<string, number> = {};
        for (const [modId, modInfo] of Object.entries(item.modules)) {
          const group = getModuleGroup(modId);
          groupSizes[group] = (groupSizes[group] || 0) + (modInfo.renderedLength || 0);
        }

        const topContributors = Object.entries(groupSizes)
          .sort((a, b) => b[1] - a[1])
          .map(([group, bytes]) => ({ group, bytes }));

        report[fileName] = {
          name: item.name,
          isEntry: item.isEntry,
          isDynamicEntry: item.isDynamicEntry,
          sizeBytes: Buffer.byteLength(item.code, 'utf8'),
          imports: item.imports,
          dynamicImports: item.dynamicImports,
          moduleCount: Object.keys(item.modules).length,
          topContributors,
        };
      }

      this.emitFile({
        type: 'asset',
        fileName: 'chunk-inventory.json',
        source: JSON.stringify(report, null, 2),
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    open: true,
    port: 3000,
    proxy: {
      '/expapi': {
        target: 'https://n20a.netzoom.com',
        changeOrigin: true,
        secure: false
      },
      '/dcmlistener': {
        target: 'https://n20a.netzoom.com',
        changeOrigin: true,
        secure: false
      },
      '/nzinthubapi': {
        target: 'https://n20a.netzoom.com',
        changeOrigin: true,
        secure: false
      },
      '/n20api': {
        target: 'https://n20a.netzoom.com',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'https://n20a.netzoom.com',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
          });
        }
      }
    }
  },
  build: {
    minify: 'esbuild',
    // Emits dist/.vite/manifest.json mapping entries to their output chunks.
    manifest: true,
    rollupOptions: {
      plugins: [
        chunkInventoryPlugin(),
        // Interactive treemap of gzip/brotli sizes per module, per chunk.
        visualizer({
          filename: 'dist/stats/treemap.html',
          template: 'treemap',
          gzipSize: true,
          brotliSize: true,
          open: false,
        }),
      ],
      output: {
        manualChunks(id) {
          // Only chunk vendor modules to avoid circular dependencies
          // Let Vite handle app code chunking automatically

          if (id.includes('node_modules')) {
            // Let Vite handle React, ReactDOM, and scheduler automatically
            // Manually chunking React causes circular dependencies with MUI

            // 1. Charts and visualization
            if (id.includes('ag-charts')) {
              return 'vendor-charts';
            }

            // 2. Heavy utilities (lazy load these)
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }

            // 3. 3D rendering (three.js + konva + its react-reconciler, used by libbox3d)
            if (id.includes('/three/') || id.includes('konva') || id.includes('react-reconciler')) {
              return 'vendor-3d';
            }

            // 4. AG Grid (large grid library)
            if (id.includes('ag-grid')) {
              return 'vendor-aggrid';
            }

            // 5. PDF/canvas export utilities
            if (id.includes('html2canvas') || id.includes('jspdf')) {
              return 'vendor-pdf';
            }

            // 6. @n20a libs isolated as their own vendor chunks (verified no circular deps in build)
            if (id.includes('@n20a/libcountry')) {
              return 'vendor-libcountry';
            }
            if (id.includes('@n20a/libchart')) {
              return 'vendor-libchart';
            }
            if (id.includes('@n20a/libflippdf')) {
              return 'vendor-libflippdf';
            }
            if (id.includes('@n20a/libreport')) {
              return 'vendor-libreport';
            }

            // 7. Core UI stack, always loaded together and only depended upon (never depends
            // back on the chunks above) — safe to merge into one chunk to cut request count.
            // react-router + MUI/Emotion + PrimeReact + @n20a/libicon
            if (
              id.includes('react-router') ||
              id.includes('@mui') ||
              id.includes('@emotion') ||
              id.includes('primereact') ||
              id.includes('@n20a/libicon')
            ) {
              return 'vendor-core';
            }

            // 8. Standalone integrations with no interdependency, merged purely to reduce
            // the number of small requests (each was previously < 250 KB alone).
            // markdown-it + firebase + powerbi-client + lodash/moment/axios
            if (
              id.includes('markdown-it') ||
              id.includes('firebase') ||
              id.includes('powerbi-client') ||
              id.includes('lodash') ||
              id.includes('moment') ||
              id.includes('axios')
            ) {
              return 'vendor-shared';
            }

            // 9. Let Vite handle other node_modules automatically to avoid circular dependencies
            // Don't use a catch-all return here
          }

          // App code chunking strategy for appqa components
          //slash-bounded matching (/appqaentities/, /appqamessage/, /appqaalerts/, /appqareminder/, /appqareport/, /appqadelegate/, /appqatask/), ensuring shared interface files in allinterface/ stay in app-appqa
          // Check specific components first before general appqa pattern
          if (id.includes('/appqa')) {
            // AppqaEntities gets its own chunk
            if (id.includes('/appqaentities/')) {
              return 'app-appqaentities';
            }

            // Individual chunks for components without circular dependencies
            if (id.includes('/appqamessage/')) {
              return 'app-appqamessage';
            }
            // appqaalerts has a circular dependency with app-appqa — keep it in app-appqa
            if (id.includes('/appqareminder/')) {
              return 'app-appqareminder';
            }
            if (id.includes('/appqareport/')) {
              return 'app-appqareport';
            }

            // Large components that can be separated (no circular dependencies)
            if (id.includes('/appqadelegate/')) {
              return 'app-appqadelegate';
            }
            if (id.includes('/appqatask/')) {
              return 'app-appqatask';
            }

            // All other appqa components must stay together to avoid circular dependencies
            // appqahelp is used by appqaentities, appcontainer, settings, appqasettings — cannot isolate
            // appqasettings imports appqahelp which is too widely shared
            // appqatheme and alldefaultprops are imported by NzApp — keep with app-appqa
            return 'app-appqa';
          }

          // Let Vite handle other app code chunking automatically
          // This avoids circular dependencies between app-* and vendor-* chunks
        },
        // Asset file naming pattern (CSS is combined into single file due to cssCodeSplit: false)
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
      onwarn: (warning, warn) => {
        // Suppress "use client" directive warnings from RSC-aware libraries (MUI, PrimeReact, react-router)
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('"use client"')) return;
        warn(warning);
      },
    },
    chunkSizeWarningLimit: 3000,
    // Combine all CSS into single file to reduce network requests (most CSS chunks are small)
    cssCodeSplit: false,
    // Enable source maps for better debugging (disable in production if needed)
    sourcemap: false,
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Optimize chunk size
    cssMinify: false,
    // Configure module preload for critical chunks
    // This generates <link rel="modulepreload"> tags to load chunks in parallel
    modulePreload: {
      polyfill: true,
      resolveDependencies: (_filename, deps) => {
        // Strategy: Preload critical chunks that are needed for initial app render
        // Browser will load these in parallel while parsing the main chunk

        // Always preload these critical vendor chunks (needed by most pages)
        const criticalVendors = deps.filter(dep =>
          dep.includes('vendor-core')         // React Router + MUI + PrimeReact + libicon
        );

        // If loading the main app, also preload critical app chunks
        // Uncomment and adjust based on your initial route needs:
        // const criticalAppChunks = deps.filter(dep =>
        //   dep.includes('app-layout') ||      // Main layout component
        //   dep.includes('app-auth')           // Authentication chunk
        // );

        return criticalVendors;
        // return [...criticalVendors, ...criticalAppChunks]; // Combine both if needed
      }
    }
  }
})
