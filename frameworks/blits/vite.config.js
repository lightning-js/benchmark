/// <reference types="vite/client" />

import { defineConfig } from 'vite'
import blitsVitePlugins from '@lightningjs/blits/vite'
import path from "path"

const target = "esnext"

export default defineConfig(({ command, mode, ssrBuild }) => {
  return {
    base: './', // Set to your base path if you are deploying to a subdirectory (example: /myApp/)
    plugins: [...blitsVitePlugins],
    resolve: {
      mainFields: ['browser', 'module', 'jsnext:main', 'jsnext'],
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
      fs: {
        allow: ['..'],
      },
      port: 1234
    },
    worker: {
      format: 'es',
    },
    blits: {
      precompile: false
    },
    build: {
      target: target,
      minify: true,
      sourcemap: false,
      outDir: path.resolve(__dirname, 'dist'),
    },
  }
})
