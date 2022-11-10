import { defineConfig } from 'vite';
import electronPlugin from 'vite-plugin-electron';
import rendererPlugin from 'vite-plugin-electron-renderer';
import reactPlugin from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { builtinModules } from 'module';
import { fileURLToPath } from 'url';
import { rmSync } from 'fs';

rmSync('dist', { recursive: true, force: true });

export default defineConfig({
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss'],
    alias: {
      '@': resolve(dirname(fileURLToPath(import.meta.url)), 'src'),
    },
  },
  base: './',
  root: resolve('./src/renderer'),
  publicDir: resolve('./src/renderer/public'),
  build: {
    assetsDir: '', // See: https://github.com/electron-vite/electron-vite-vue/issues/287
    outDir: resolve('./dist'),
  },
  plugins: [
    reactPlugin(),
    // Docs: https://github.com/electron-vite/vite-plugin-electron
    electronPlugin([
      {
        entry: ['src/main/index.js'],
        onstart: (options) => {
          options.startup(['.', '--no-sandbox']);
        },
        vite: {
          build: {
            assetsDir: '.',
            outDir: 'dist/main',
            rollupOptions: {
              external: ['electron', ...builtinModules],
            },
          },
        },
      },
    ]),
    rendererPlugin({
      nodeIntegration: true,
    }),
  ],
});
