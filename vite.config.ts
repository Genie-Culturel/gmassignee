import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  // GitHub Pages project site: https://<org>.github.io/gmassignee/
  base: process.env.GITHUB_PAGES === 'true' ? '/gmassignee/' : '/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        // Public client page (no PIN): /souvenirs/?token=…
        souvenirs: path.resolve(__dirname, "souvenirs/index.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

