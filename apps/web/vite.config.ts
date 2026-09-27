import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    proxy: {
      "/api": "http://localhost:8787",
      "/auth": "http://localhost:8787",
      "/healthz": "http://localhost:8787",
    },
  },
});
