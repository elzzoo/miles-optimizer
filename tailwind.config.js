/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        primary:   "#2563EB",
        secondary: "#06B6D4",
        surface:   "#FFFFFF",
        muted:     "#64748B",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.03)",
        blue: "0 8px 32px rgba(37,99,235,.2)",
      },
    },
  },
  plugins: [],
};
