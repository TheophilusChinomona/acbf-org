/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // Default blue - update with actual brand color
        secondary: '#7c3aed', // Default purple - update with actual brand color
      },
      fontFamily: {
        sans: ['Your Font', 'sans-serif'], // TODO: Extract from WordPress theme
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}

