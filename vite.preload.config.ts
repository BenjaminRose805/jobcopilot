import { defineConfig } from 'vite';
import { aliases } from './vite.shared';

export default defineConfig({
  resolve: { alias: aliases },
  build: {
    outDir: '.vite/build',
    emptyOutDir: false,
    lib: {
      entry: 'apps/desktop/src/preload/preload.ts',
      formats: ['cjs'],
      fileName: () => 'preload.js',
    },
    rollupOptions: { external: ['electron', /^node:/] },
    minify: false,
    sourcemap: true,
  },
});
