import { sentryVitePlugin } from "@sentry/vite-plugin"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    sentryVitePlugin({
      org: "simulive-fi", // Replace with your Sentry Org
      project: "javascript-react", // Replace with your Sentry Project
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: false, // Disable sourcemaps for production
    chunkSizeWarningLimit: 1000, // Raise limit to reduce noise
    assetsInlineLimit: 4096, // Inline small assets < 4kb
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
      },
      mangle: true,
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor splitting
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('@vidstack') || id.includes('vidstack')) return 'vendor-vidstack';
          }
          
          // Page splitting (create a chunk for each page)
          if (id.includes('src/pages')) {
            const match = id.match(/src\/pages\/(.*?)\.tsx/);
            if (match) {
              return `page-${match[1].toLowerCase()}`;
            }
          }
        },
      },
    },
  },
})
