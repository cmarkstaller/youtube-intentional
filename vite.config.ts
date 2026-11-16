import { defineConfig } from 'vite';

// Content scripts declared in manifest.json are loaded as classic scripts,
// not ES modules, so the content script must be a single self-contained IIFE.
// Files in public/ (including manifest.json) are copied to dist/ unchanged.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    lib: {
      entry: 'src/content/main.ts',
      formats: ['iife'],
      name: 'UnscrollForYoutube',
      fileName: () => 'content.js',
    },
  },
});
