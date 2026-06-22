import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
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
      },
    },
  },
  plugins: [],
};

export default config;
