import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "var(--color-bg)",
        surface: {
          DEFAULT: "var(--color-surface)",
          muted: "var(--color-surface-muted)",
          hover: "var(--color-surface-hover)",
        },
        fg: {
          DEFAULT: "var(--color-fg)",
          strong: "var(--color-fg-strong)",
          muted: "var(--color-fg-muted)",
          subtle: "var(--color-fg-subtle)",
          faint: "var(--color-fg-faint)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        drain: {
          400: "var(--color-drain-400)",
          500: "var(--color-drain-500)",
          600: "var(--color-drain-600)",
        },
        cool: {
          400: "var(--color-cool-400)",
          500: "var(--color-cool-500)",
          600: "var(--color-cool-600)",
        },
        pool: {
          DEFAULT: "var(--color-pool)",
        },
        overshoot: {
          DEFAULT: "var(--color-overshoot)",
        },
      },
      backgroundImage: {
        "app-gradient": "var(--bg-app)",
        "drain-gradient": "var(--bg-drain-gradient)",
        "cool-gradient": "var(--bg-cool-gradient)",
      },
      borderRadius: {
        "2xl": "1rem",
      },
      boxShadow: {
        glass: "var(--shadow-card)",
      },
    },
  },
  plugins: [],
} satisfies Config;
