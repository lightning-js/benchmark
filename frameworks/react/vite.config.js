import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";

const target = "esnext";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'fonts/**/*',
          dest: 'fonts'
        }
      ]
    })
  ],
  esbuild: {
    target: target,
  },
  build: {
    target: target,
    minify: true,
    sourcemap: true,
    outDir: path.resolve(__dirname, 'dist'),
  },
  optimizeDeps: {
    include: [],
    esbuildOptions: {
      target: target,
    },
  },
  server: {
    hmr: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
