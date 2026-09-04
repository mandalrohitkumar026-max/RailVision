/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railops: {
          dark: "#0b1329",
          slate: "#1e293b",
          border: "#334155",
          accent: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444"
        }
      }
    },
  },
  plugins: [],
}
