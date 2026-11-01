import { defineConfig } from 'electron-vite';
import { rendererPlugins } from './vite.shared.ts';

export default defineConfig({
  main: {},
  preload: {
    build: {
      // Sandboxed preload scripts can only require 'electron': bundle everything else
      // into a single CommonJS file.
      externalizeDeps: false,
      rollupOptions: {
        output: {
          format: 'cjs',
          entryFileNames: '[name].cjs',
        },
      },
    },
  },
  renderer: {
    plugins: rendererPlugins(),
  },
});
