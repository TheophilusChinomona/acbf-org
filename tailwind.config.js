/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Gold colors
        primary: '#D4AF37', // Metallic Gold - primary brand color
        'primary-light': '#F5E6C8', // Champagne - hover states, light backgrounds
        'primary-dark': '#B8941E', // Dark Gold - accents and depth

        // Brown colors
        secondary: '#6B4423', // Coffee Brown - text, borders
        'secondary-light': '#A67C52', // Tan Brown - secondary backgrounds
        'secondary-dark': '#3E2723', // Dark Brown - footer, dark headers

        // Accent colors
        accent: '#F5E6C8', // Light Gold accent

        // Neutral colors
        cream: '#FAF9F6', // Off-white/cream for subtle backgrounds
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

