import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { importChunkUrl } from "@lightningjs/vite-plugin-import-chunk-url";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";

const target = "esnext";

export default defineConfig({
  base: "./",
  plugins: [
    importChunkUrl(),
    solidPlugin({
      solid: {
        moduleName: "@lightningjs/solid",
        generate: "universal",
      },
    }),
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
    sourcemap: false,
    outDir: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    dedupe: ["solid-js", "@lightningjs/solid", "@lightningjs/renderer"],
  },
  optimizeDeps: {
    include: [],
    exclude: [
      "@lightningjs/solid",
      "@lightningjs/solid-primitives",
      "@lightningjs/renderer/core",
      "@lightningjs/renderer/workers/renderer",
    ],
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
