import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), vue()],
  server: {
    host: "127.0.0.1",
    port: 5188,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4188,
    strictPort: true,
  },
});
