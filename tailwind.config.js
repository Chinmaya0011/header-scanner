/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "#0a0e1a",
        surface: "#111827",
        panel: "#1a2235",
        border: "#1e2d45",
        accent: "#00d4ff",
        "accent-dim": "#0099bb",
        success: "#00e676",
        warning: "#ffb74d",
        danger: "#ff5252",
        muted: "#4a5568",
        text: "#e2e8f0",
        "text-dim": "#94a3b8",
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 212, 255, 0.15)",
        "glow-success": "0 0 12px rgba(0, 230, 118, 0.2)",
        "glow-danger": "0 0 12px rgba(255, 82, 82, 0.2)",
      },
    },
  },
  plugins: [],
};
