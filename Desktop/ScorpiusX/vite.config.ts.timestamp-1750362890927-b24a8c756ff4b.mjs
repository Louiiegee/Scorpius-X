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
    hmr: {
      port: 8080,
      overlay: false,
      // Disable error overlay to prevent WebSocket conflicts
      clientPort: 8080
      // Ensure client connects to the right port
    },
    watch: {
      usePolling: false
      // Use native file watching for better performance
    },
    cors: true
    // Enable CORS for development
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2NvZGUvRGVza3RvcC9TY29ycGl1c1hcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9hcHAvY29kZS9EZXNrdG9wL1Njb3JwaXVzWC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYXBwL2NvZGUvRGVza3RvcC9TY29ycGl1c1gvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcbiAgICBwb3J0OiA4MDgwLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgaG1yOiB7XG4gICAgICBwb3J0OiA4MDgwLFxuICAgICAgb3ZlcmxheTogZmFsc2UsIC8vIERpc2FibGUgZXJyb3Igb3ZlcmxheSB0byBwcmV2ZW50IFdlYlNvY2tldCBjb25mbGljdHNcbiAgICAgIGNsaWVudFBvcnQ6IDgwODAsIC8vIEVuc3VyZSBjbGllbnQgY29ubmVjdHMgdG8gdGhlIHJpZ2h0IHBvcnRcbiAgICB9LFxuICAgIHdhdGNoOiB7XG4gICAgICB1c2VQb2xsaW5nOiBmYWxzZSwgLy8gVXNlIG5hdGl2ZSBmaWxlIHdhdGNoaW5nIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2VcbiAgICB9LFxuICAgIGNvcnM6IHRydWUsIC8vIEVuYWJsZSBDT1JTIGZvciBkZXZlbG9wbWVudFxuICB9LFxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6IFwiZGlzdFwiLFxuICAgIGFzc2V0c0RpcjogXCJhc3NldHNcIixcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgdmVuZG9yOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcbiAgICAgICAgICB1aTogW1wiQHJhZGl4LXVpL3JlYWN0LWRpYWxvZ1wiLCBcIkByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51XCJdLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICAvLyBFbGVjdHJvbiBjb21wYXRpYmlsaXR5XG4gIGJhc2U6IG1vZGUgPT09IFwiZWxlY3Ryb25cIiA/IFwiLi9cIiA6IFwiL1wiLFxuICBkZWZpbmU6IHtcbiAgICAvLyBNYWtlIHN1cmUgcHJvY2Vzcy5lbnYgaXMgYXZhaWxhYmxlIGZvciBFbGVjdHJvbiBkZXRlY3Rpb25cbiAgICBcInByb2Nlc3MuZW52Lk5PREVfRU5WXCI6IEpTT04uc3RyaW5naWZ5KG1vZGUpLFxuICB9LFxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFtUSxTQUFTLG9CQUFvQjtBQUNoUyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osS0FBSztBQUFBLE1BQ0gsTUFBTTtBQUFBLE1BQ04sU0FBUztBQUFBO0FBQUEsTUFDVCxZQUFZO0FBQUE7QUFBQSxJQUNkO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxZQUFZO0FBQUE7QUFBQSxJQUNkO0FBQUEsSUFDQSxNQUFNO0FBQUE7QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLFVBQzdCLElBQUksQ0FBQywwQkFBMEIsK0JBQStCO0FBQUEsUUFDaEU7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBRUEsTUFBTSxTQUFTLGFBQWEsT0FBTztBQUFBLEVBQ25DLFFBQVE7QUFBQTtBQUFBLElBRU4sd0JBQXdCLEtBQUssVUFBVSxJQUFJO0FBQUEsRUFDN0M7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
