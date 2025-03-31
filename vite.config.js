// vite.config.js
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  base: './', // Important for GitHub Pages
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
});
