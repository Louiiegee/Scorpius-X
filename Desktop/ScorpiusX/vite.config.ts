import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    hmr: {
      port: 8080,
      host: "localhost",
      overlay: false, // Disable error overlay to prevent WebSocket conflicts
    },
    watch: {
      usePolling: false, // Use native file watching for better performance
    },
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
