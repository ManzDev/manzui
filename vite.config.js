import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  publicDir: "../public",
  plugins: [],
  build: {
    target: "esnext",
    outDir: "../dist",
    emptyOutDir: true,
  },
});
