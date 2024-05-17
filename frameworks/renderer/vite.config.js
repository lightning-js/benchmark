import { defineConfig } from "vite";
import path from "path";
import { importChunkUrl } from "@lightningjs/vite-plugin-import-chunk-url";
import { viteStaticCopy } from "vite-plugin-static-copy";

const target = "esnext";

export default defineConfig({
  base: "./",
  plugins: [
    importChunkUrl(),
    viteStaticCopy({
      targets: [
        {
          src: 'fonts/**/*',
          dest: 'fonts'
        }
      ]
    })
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
