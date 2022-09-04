import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import react from '@vitejs/plugin-react';
import { resolve, join } from 'path';

export default defineConfig({
  resolve: {
    extensions: [
      '.mjs',
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.json',
      '.scss',
    ],
    alias: {
      '@': join(__dirname, 'src'),
    },
  },
  base: './',
  root: resolve('./src/renderer'),
  publicDir: resolve('./src/renderer/public'),
  build: {
    outDir: resolve('./dist'),
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: 'src/main/index.js',
        format: 'cjs',
        vite: {
          publicDir: resolve('./src/main'),
          build: {
            emptyOutDir: true,
            outDir: 'dist/main',
          },
        },
      },
      renderer: {},
    }),
  ],
});
