/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: ["./App.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        main: "#2490EF",
        border: "#EBEEF0",
      },
    },
  },
  plugins: [],
};
