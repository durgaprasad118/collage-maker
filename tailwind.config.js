/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'tinos': ['Tinos', 'serif'],
        'montserrat-semibold': ['Montserrat-SemiBold', 'sans-serif'],
        'montserrat': ['Montserrat-Regular', 'sans-serif'],
        'abril': ['AbrilFatface', 'cursive'],
        'allura': ['Allura', 'cursive'],
        'times': ['Times-New-Roman', 'serif'],
      },
    },
  },
  plugins: [],
}