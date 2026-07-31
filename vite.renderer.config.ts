import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { aliases } from './vite.shared';

export default defineConfig({
  root: 'apps/desktop/src/renderer',
  base: './',
  plugins: [react()],
  resolve: { alias: aliases },
  build: {
    outDir: '../../../../.vite/renderer/main_window',
    emptyOutDir: true,
  },
});
