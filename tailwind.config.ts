import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FDF4F7",
          100: "#F9E8EF",
          200: "#F3C8D8",
          300: "#E99DB8",
          400: "#D96B8F",
          500: "#C4476F",
          600: "#A33258",
          700: "#822146",
          800: "#631635",
          900: "#4A0E27",
          950: "#2E0618",
        },
        cream: {
          50: "#FDFAF7",
          100: "#FAF4EF",
          200: "#F4EAD9",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      boxShadow: {
        "warm-sm": "0 1px 3px 0 rgba(163, 50, 88, 0.08), 0 1px 2px -1px rgba(163, 50, 88, 0.06)",
        "warm": "0 4px 12px 0 rgba(163, 50, 88, 0.10), 0 2px 4px -1px rgba(163, 50, 88, 0.08)",
        "warm-lg": "0 10px 30px -3px rgba(163, 50, 88, 0.12), 0 4px 8px -4px rgba(163, 50, 88, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
