import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { rendererPlugins } from './vite.shared.ts';

/** Browser-only renderer on the fake platform: fast local iteration and Chromium E2E tests (ADR-0010). */
export default defineConfig({
  root: resolve(import.meta.dirname, 'src/renderer'),
  plugins: rendererPlugins(),
  define: {
    'import.meta.env.VITE_PLATFORM': JSON.stringify('fake'),
  },
  server: {
    port: 5199,
    strictPort: true,
  },
});
