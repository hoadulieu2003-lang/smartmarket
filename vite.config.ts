import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function inlineCssIntoAppJs(): Plugin {
  return {
    name: "inline-css-into-app-js",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      let css = "";
      for (const [fileName, output] of Object.entries(bundle)) {
        if (output.type === "asset" && fileName.endsWith(".css")) {
          css +=
            typeof output.source === "string"
              ? output.source
              : output.source.toString();
          delete bundle[fileName];
        }
      }
      if (!css) return;

      // Chèn CSS vào đầu entry chunk để tự nạp vào <head> khi app chạy
      for (const output of Object.values(bundle)) {
        if (output.type === "chunk" && output.isEntry) {
          const inject =
            `(function(){try{var s=document.createElement('style');` +
            `s.setAttribute('data-vite-inline','');` +
            `s.textContent=${JSON.stringify(css)};` +
            `document.head.appendChild(s);}catch(e){console.error(e);}})();\n`;
          output.code = inject + output.code;
        }
      }

      // Gỡ thẻ <link rel="stylesheet"> khỏi index.html vì CSS đã được inline
      for (const output of Object.values(bundle)) {
        if (output.type === "asset" && output.fileName.endsWith(".html")) {
          const html =
            typeof output.source === "string"
              ? output.source
              : output.source.toString();
          output.source = html.replace(
            /\s*<link[^>]+rel="stylesheet"[^>]*>/gi,
            "",
          );
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineCssIntoAppJs()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5174,
  },
  preview: {
    port: 5174,
  },
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: "iife",
        name: "SmartMarketApp",
        entryFileNames: "app-v1.js",
        codeSplitting: false,
        chunkFileNames: "app-v1.js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
