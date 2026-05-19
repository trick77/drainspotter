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
        ink: {
          950: "#0a0a14",
          900: "#0f172a",
          800: "#1e1b4b",
        },
        drain: {
          400: "#fb923c",
          500: "#f97316",
          600: "#f43f5e",
        },
        cool: {
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
        },
        pool: {
          DEFAULT: "#22d3ee",
        },
        overshoot: {
          DEFAULT: "#ef4444",
        },
      },
      backgroundImage: {
        "app-gradient":
          "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
        "drain-gradient":
          "linear-gradient(90deg, #fb923c 0%, #f43f5e 100%)",
        "cool-gradient":
          "linear-gradient(90deg, #818cf8 0%, #6366f1 100%)",
      },
      borderRadius: {
        "2xl": "1rem",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
