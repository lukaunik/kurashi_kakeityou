/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#FAF8F4",
          100: "#F3F0E9",
        },
        ink: {
          900: "#2A2722",
          700: "#433E36",
          500: "#6E685D",
        },
        sumi: {
          50: "#EAF0F2",
          100: "#CBDBE0",
          400: "#4C7C8C",
          600: "#2C5566",
          700: "#204252",
          900: "#152C36",
        },
        hanko: {
          50: "#FBEAE4",
          400: "#C97256",
          500: "#B8562F",
          600: "#9A4523",
        },
        moss: {
          400: "#7C9973",
          500: "#5E7F52",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif'],
        display: ['"Shippori Mincho"', 'serif'],
      },
    },
  },
  plugins: [],
}
