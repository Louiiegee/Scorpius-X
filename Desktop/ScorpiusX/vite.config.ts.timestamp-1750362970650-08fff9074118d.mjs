// vite.config.ts
import { defineConfig } from "file:///app/code/Desktop/ScorpiusX/node_modules/vite/dist/node/index.js";
import react from "file:///app/code/Desktop/ScorpiusX/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/app/code/Desktop/ScorpiusX";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    hmr: false,
    // Disable HMR completely to avoid WebSocket issues
    watch: {
      usePolling: true,
      // Use polling for file watching in proxy environments
      interval: 1e3
      // Check for changes every second
    },
    cors: true,
    // Enable CORS for development
    force: true
    // Force dependency pre-bundling
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"]
        }
      }
    }
  },
  // Electron compatibility
  base: mode === "electron" ? "./" : "/",
  define: {
    // Make sure process.env is available for Electron detection
    "process.env.NODE_ENV": JSON.stringify(mode)
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2NvZGUvRGVza3RvcC9TY29ycGl1c1hcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9hcHAvY29kZS9EZXNrdG9wL1Njb3JwaXVzWC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYXBwL2NvZGUvRGVza3RvcC9TY29ycGl1c1gvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcbiAgICBwb3J0OiA4MDgwLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgaG1yOiBmYWxzZSwgLy8gRGlzYWJsZSBITVIgY29tcGxldGVseSB0byBhdm9pZCBXZWJTb2NrZXQgaXNzdWVzXG4gICAgd2F0Y2g6IHtcbiAgICAgIHVzZVBvbGxpbmc6IHRydWUsIC8vIFVzZSBwb2xsaW5nIGZvciBmaWxlIHdhdGNoaW5nIGluIHByb3h5IGVudmlyb25tZW50c1xuICAgICAgaW50ZXJ2YWw6IDEwMDAsIC8vIENoZWNrIGZvciBjaGFuZ2VzIGV2ZXJ5IHNlY29uZFxuICAgIH0sXG4gICAgY29yczogdHJ1ZSwgLy8gRW5hYmxlIENPUlMgZm9yIGRldmVsb3BtZW50XG4gICAgZm9yY2U6IHRydWUsIC8vIEZvcmNlIGRlcGVuZGVuY3kgcHJlLWJ1bmRsaW5nXG4gIH0sXG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIG91dERpcjogXCJkaXN0XCIsXG4gICAgYXNzZXRzRGlyOiBcImFzc2V0c1wiLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICB2ZW5kb3I6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCJdLFxuICAgICAgICAgIHVpOiBbXCJAcmFkaXgtdWkvcmVhY3QtZGlhbG9nXCIsIFwiQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnVcIl0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIC8vIEVsZWN0cm9uIGNvbXBhdGliaWxpdHlcbiAgYmFzZTogbW9kZSA9PT0gXCJlbGVjdHJvblwiID8gXCIuL1wiIDogXCIvXCIsXG4gIGRlZmluZToge1xuICAgIC8vIE1ha2Ugc3VyZSBwcm9jZXNzLmVudiBpcyBhdmFpbGFibGUgZm9yIEVsZWN0cm9uIGRldGVjdGlvblxuICAgIFwicHJvY2Vzcy5lbnYuTk9ERV9FTlZcIjogSlNPTi5zdHJpbmdpZnkobW9kZSksXG4gIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW1RLFNBQVMsb0JBQW9CO0FBQ2hTLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixLQUFLO0FBQUE7QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNMLFlBQVk7QUFBQTtBQUFBLE1BQ1osVUFBVTtBQUFBO0FBQUEsSUFDWjtBQUFBLElBQ0EsTUFBTTtBQUFBO0FBQUEsSUFDTixPQUFPO0FBQUE7QUFBQSxFQUNUO0FBQUEsRUFDQSxTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLFVBQzdCLElBQUksQ0FBQywwQkFBMEIsK0JBQStCO0FBQUEsUUFDaEU7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBRUEsTUFBTSxTQUFTLGFBQWEsT0FBTztBQUFBLEVBQ25DLFFBQVE7QUFBQTtBQUFBLElBRU4sd0JBQXdCLEtBQUssVUFBVSxJQUFJO0FBQUEsRUFDN0M7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
