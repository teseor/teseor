import { defineConfig } from 'vite';

export default defineConfig({
  root: 'dist',
  base: '/ui-lib/',
  server: {
    port: 3000,
    open: true,
  },
});
