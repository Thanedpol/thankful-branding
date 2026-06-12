import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // All theme-aware — driven by CSS variables in globals.css so they
        // flip between dark and light. <alpha-value> keeps /opacity working.
        space: "rgb(var(--bg) / <alpha-value>)",
        "space-light": "rgb(var(--bg-2) / <alpha-value>)",
        ink: "rgb(var(--text) / <alpha-value>)", // primary text
        muted: "rgb(var(--muted) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)", // overlays
        line: "rgb(var(--line) / <alpha-value>)", // borders
        cyan: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          dim: "#0bbfca",
        },
        purple: {
          DEFAULT: "rgb(var(--accent-2) / <alpha-value>)",
          dim: "#5a1fc0",
        },
      },
      fontFamily: {
        // Wired up in layout.tsx via next/font CSS variables
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-share-tech-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0, 245, 255, 0.35), 0 0 40px rgba(0, 245, 255, 0.15)",
        "glow-purple": "0 0 20px rgba(123, 47, 255, 0.35), 0 0 40px rgba(123, 47, 255, 0.15)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(0,245,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.04) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(ellipse at top, rgba(123,47,255,0.12), transparent 60%)",
      },
      backgroundSize: {
        grid: "44px 44px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glitch-skew": {
          "0%, 100%": { transform: "skew(0deg)" },
          "20%": { transform: "skew(-0.4deg)" },
          "40%": { transform: "skew(0.6deg)" },
          "60%": { transform: "skew(-0.2deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "glitch-skew": "glitch-skew 3s infinite linear alternate",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
