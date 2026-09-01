import { defineConfig } from "vite";

import { resolve } from "node:path";

export default defineConfig({
  root: "src",
  publicDir: "../public",
  plugins: [],
  build: {
    target: "esnext",
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "src/index.html"),
        sandbox: resolve(import.meta.dirname, "src/sandbox.html"),
      },
    },
  },
});
