import { defineConfig } from "vite";
import { importChunkUrl } from "@lightningjs/vite-plugin-import-chunk-url";

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
});
