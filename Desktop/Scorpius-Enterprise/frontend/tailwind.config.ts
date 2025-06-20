import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        main: ["Roboto", "system-ui", "-apple-system", "sans-serif"],
        header: ["Audiowide", "cursive", "system-ui"],
        body: ["Roboto", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Space Mono", "monospace"],
        terminal: ["Space Mono", "JetBrains Mono", "monospace"],
      },
      colors: {
        bg: "#000000",
        surface: "#1a1a1a",
        card: "#2a2a2a",
        border: "#333333",
        primary: "#00ffff",
        accent: "#00e5ff",
        secondary: "#00b7ff",
        tertiary: "#0099cc",
        muted: "#666666",
        success: "#00ff88",
        warning: "#ffaa00",
        danger: "#ff4444",
        text: {
          primary: "#ffffff",
          secondary: "#e5e5e5",
          muted: "#999999",
        },
        clean: {
          bg: "#0f1419",
          surface: "#1a2332",
          card: "#233244",
          border: "#2d3f57",
          text: "#e5e7eb",
          muted: "#9ca3af",
          green: "#4ade80",
          teal: "#22d3ee",
        },
        "gray-950": "#030303",
        "gray-850": "#111111",
        "gray-800": "#1a1a1a",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        neon: "0 0 20px rgba(0, 255, 209, 0.3), 0 0 40px rgba(0, 255, 209, 0.1)",
        subtle: "0 4px 20px rgba(0, 0, 0, 0.3)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
