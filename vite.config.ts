import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        serviceWorker: resolve(__dirname, 'src/background/serviceWorker.ts'),
        mediaBridge: resolve(__dirname, 'src/content/mediaBridge.ts'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'serviceWorker' || chunk.name === 'mediaBridge'
            ? '[name].js'
            : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
