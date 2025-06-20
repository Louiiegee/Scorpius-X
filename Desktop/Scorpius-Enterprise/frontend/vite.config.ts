import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },

    // Development server configuration
    server: {
      port: 8080,
      host: true,
      cors: true,
      open: false,
    },

    // Preview server configuration
    preview: {
      port: 8080,
      host: true,
    },

    // Build configuration
    build: {
      target: "esnext",
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: mode !== "production",
      minify: mode === "production" ? "esbuild" : false,

      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
            charts: ["recharts"],
            motion: ["framer-motion"],
            query: ["@tanstack/react-query"],
          },
        },
      },

      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
    },

    // Dependency optimization
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "framer-motion",
        "@tanstack/react-query",
      ],
      exclude: ["@vite/client", "@vite/env"],
    },

    // CSS configuration
    css: {
      postcss: "./postcss.config.js",
      devSourcemap: mode !== "production",
    },

    // Environment variables
    envPrefix: "VITE_",

    // Worker configuration
    worker: {
      format: "es",
    },

    // Security headers for preview
    ...(command === "serve" && {
      server: {
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "X-XSS-Protection": "1; mode=block",
        },
      },
    }),
  };
});
