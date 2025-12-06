import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import pugPlugin from 'vite-plugin-pug-transformer';

const rootDir = resolve(__dirname, '../..');

export default defineConfig({
  root: 'src',
  plugins: [
    pugPlugin({
      pugOptions: {
        basedir: rootDir,
      },
    }),
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
