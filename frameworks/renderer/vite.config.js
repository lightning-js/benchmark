import { defineConfig } from "vite";
import path from "path";
import { importChunkUrl } from "@lightningjs/vite-plugin-import-chunk-url";

const target = "esnext";

export default defineConfig({
  plugins: [
    importChunkUrl()
  ],
  server: {
    hmr: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  esbuild: {
    target: target,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: target,
    },
  },
  build: {
    target: target,
    minify: true,
    sourcemap: false,
    outDir: path.resolve(__dirname, 'dist'),
  },
});
