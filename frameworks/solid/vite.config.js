import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";

const target = "esnext";

export default defineConfig({
  base: "./",
  plugins: [
    solidPlugin({
      solid: {
        moduleName: "@lightningtv/solid",
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
    sourcemap: true,
    outDir: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    dedupe: ["solid-js", "@lightningtv/solid", "@lightningjs/renderer"],
  },
  optimizeDeps: {
    include: [],
    exclude: [
      "@lightningtv/solid",
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
