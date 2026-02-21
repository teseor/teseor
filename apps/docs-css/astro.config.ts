import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  output: 'static',
  build: {
    format: 'directory',
  },
  vite: {
    resolve: {
      alias: {
        '@teseor/css': join(__dirname, '../../packages/css/dist/index.css'),
      },
    },
  },
});
