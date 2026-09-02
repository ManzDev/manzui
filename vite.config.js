import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  publicDir: "../public",
  server: {
    fs: {
      allow: [".."],
    },
  },
  plugins: [],
  build: {
    target: "esnext",
    outDir: "../dist",
    emptyOutDir: true,
  },
});
