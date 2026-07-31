import { defineConfig } from 'vite';
import { aliases, copyMockSites } from './vite.shared';

export default defineConfig({
  resolve: {
    alias: aliases,
    // Electron main is CJS-ish; prefer node conditions.
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
  plugins: [copyMockSites()],
  build: {
    outDir: '.vite/build',
    emptyOutDir: false,
    lib: {
      entry: 'apps/desktop/src/main/index.ts',
      formats: ['cjs'],
      fileName: () => 'main.js',
    },
    rollupOptions: {
      external: ['electron', /^node:/],
    },
    minify: false,
    sourcemap: true,
  },
});
