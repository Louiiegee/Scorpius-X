import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; style-src 'self' 'unsafe-inline' data: blob:; img-src 'self' data: https: http: blob:; font-src 'self' data: blob:; connect-src 'self' ws: wss: http://localhost:3001 http://localhost:8001 http://localhost:8545 http://localhost:* ws://localhost:* http: https:; worker-src 'self' blob: data:; child-src 'self' blob: data:; object-src 'none';"
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
