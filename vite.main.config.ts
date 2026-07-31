import { builtinModules } from 'node:module';
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
      /*
       * Bare builtin specifiers must be listed alongside the `node:`-prefixed
       * form. Without them Vite resolves `require('tty')` to an empty browser
       * stub, and the main process dies at load with `tty.isatty is not a
       * function` — `electron-squirrel-startup` pulls in `debug`, which calls
       * it on import. Dev never sees this because `electron-forge start`
       * resolves builtins natively.
       */
      external: ['electron', /^node:/, ...builtinModules],
    },
    minify: false,
    sourcemap: true,
  },
});
