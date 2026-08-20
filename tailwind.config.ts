import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff3f1",
          100: "#ffe1dd",
          200: "#ffc4bc",
          300: "#ff9c8f",
          400: "#fd6b59",
          500: "#fd4f3d",
          600: "#fd3a2d",
          700: "#d62a1e",
          800: "#b22318",
          900: "#8c1b12",
        },
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          600: "#16a34a",
          700: "#15803d",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          600: "#d97706",
          700: "#b45309",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          600: "#dc2626",
          700: "#b91c1c",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
