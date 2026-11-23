import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** Vite configuration used by Storybook, the component catalog (ADR-0021). */
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
