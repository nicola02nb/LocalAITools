import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from 'path'
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    viteStaticCopy({
      targets: [
        {
          src: "README.md",
          dest: "",
        },
      ],
    }), 
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background.ts'),
        overlay: resolve(__dirname, 'src/overlay.ts')
      },
      output: {
        entryFileNames: '[name].js',
        dir: 'dist'
      }
    }
  }
});
