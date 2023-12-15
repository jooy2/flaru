import { defineConfig, loadEnv } from 'vite';
import electronPlugin, { ElectronOptions } from 'vite-plugin-electron';
import rendererPlugin from 'vite-plugin-electron-renderer';
import eslintPlugin from 'vite-plugin-eslint';
import reactPlugin from '@vitejs/plugin-react-swc';
import millionPlugin from 'million/compiler';
import { resolve, dirname } from 'path';
import { builtinModules } from 'module';
import { fileURLToPath } from 'url';
import { rmSync } from 'fs';

const isDevEnv = process.env.NODE_ENV === 'development';

export default defineConfig(({ mode }) => {
  process.env = {
    ...(isDevEnv
      ? {
          ELECTRON_ENABLE_LOGGING: 'true',
        }
      : {}),
    ...process.env,
    ...loadEnv(mode, process.cwd()),
  };

  rmSync('dist', { recursive: true, force: true });

  const electronPluginConfigs: ElectronOptions[] = [
    {
      entry: 'src/main/index.ts',
      onstart({ startup }) {
        startup();
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
    {
      entry: 'src/preload/index.ts',
      onstart({ reload }) {
        reload();
      },
      vite: {
        build: {
          outDir: 'dist/preload',
        },
      },
    },
  ];

  if (isDevEnv) {
    electronPluginConfigs.push({
      entry: 'src/main/index.dev.ts',
      vite: {
        build: {
          outDir: 'dist/main',
        },
      },
    });
  }

  return {
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
      millionPlugin.vite({ auto: true }),
      reactPlugin(),
      // Docs: https://github.com/gxmari007/vite-plugin-eslint
      eslintPlugin(),
      // Docs: https://github.com/electron-vite/vite-plugin-electron
      electronPlugin(electronPluginConfigs),
      rendererPlugin(),
    ],
  };
});
