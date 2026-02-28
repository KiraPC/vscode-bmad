import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: '../../dist/webviews/sidebar',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'index.js',
        assetFileNames: 'index.css',
      },
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../src/shared'),
    },
  },
});
