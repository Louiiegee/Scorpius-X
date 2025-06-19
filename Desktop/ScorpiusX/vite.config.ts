import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    hmr: false, // Disable HMR completely to avoid WebSocket issues
    watch: {
      usePolling: true, // Use polling for file watching in proxy environments
      interval: 1000, // Check for changes every second
    },
    cors: true, // Enable CORS for development
    force: true, // Force dependency pre-bundling
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
        },
      },
    },
  },
  // Electron compatibility
  base: mode === "electron" ? "./" : "/",
  define: {
    // Make sure process.env is available for Electron detection
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
}));
