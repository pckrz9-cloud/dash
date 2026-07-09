import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        surface: "var(--surface-1)",
        plane: "var(--plane)",
        ink: "var(--text-primary)",
        "ink-2": "var(--text-secondary)",
        muted: "var(--text-muted)",
        grid: "var(--gridline)",
        baseline: "var(--baseline)",
        series1: "var(--series-1)",
        good: "var(--delta-good)",
        bad: "var(--status-critical)",
      },
      borderColor: {
        hairline: "var(--border-hairline)",
      },
    },
  },
  plugins: [],
};

export default config;
