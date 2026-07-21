import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef3f2",
          100: "#fde8e6",
          500: "#e84c3d",
          600: "#d63b2c",
          700: "#b42e22",
        },
        // Auth screens: a Ceylon trade-house palette (ink ledger, parchment
        // ticket stock, brass seals, sapphire for the seller path).
        ink: {
          DEFAULT: "#132A2E",
          50: "#E8EEED",
          200: "#9FB4B2",
          400: "#4C6B69",
          600: "#1D3A3D",
          800: "#0F2224",
          900: "#0A1618",
        },
        parchment: {
          DEFAULT: "#F6ECD9",
          50: "#FFFDF8",
          100: "#F6ECD9",
          200: "#EEDFC0",
          300: "#E2CCA0",
        },
        brass: {
          DEFAULT: "#B8863B",
          100: "#F1E2C4",
          300: "#D4AC6E",
          600: "#8C6220",
        },
        sapphire: {
          DEFAULT: "#2C4A6E",
          100: "#DCE6F0",
          600: "#1F3651",
        },
        tea: {
          DEFAULT: "#4B6B3A",
          100: "#E3ECDC",
        },
      },
      fontFamily: {
        auth: ["var(--font-auth)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
