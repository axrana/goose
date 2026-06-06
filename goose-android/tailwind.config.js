/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        goose: {
          bg: "#0f1619",
          card: "#1a2226",
          cardHover: "#212c31",
          border: "#2a373d",
          text: "#e8edef",
          muted: "#8a9ba3",
          sleep: "#4A90D9",
          recovery: "#4CD964",
          strain: "#FF6B35",
          stress: "#9B59B6",
          hr: "#E74C3C",
          hrv: "#1ABC9C",
          energy: "#F39C12",
          cardio: "#3498DB",
          temp: "#E67E22",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
