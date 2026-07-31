import { defineConfig } from 'vite';
import { aliases } from './vite.shared';

export default defineConfig({
  resolve: { alias: aliases },
  build: {
    outDir: '.vite/build',
    emptyOutDir: false,
    lib: {
      entry: 'apps/desktop/src/preload/mock-page-preload.ts',
      formats: ['cjs'],
      fileName: () => 'mock-page-preload.js',
    },
    rollupOptions: { external: ['electron', /^node:/] },
    minify: false,
    sourcemap: true,
  },
});
