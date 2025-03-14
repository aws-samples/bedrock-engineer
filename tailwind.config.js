/** @type {import('tailwindcss').Config} */
const flowbite = require('flowbite-react/tailwind')

module.exports = {
  content: [
    './src/renderer/src/**/*.{js,jsx,ts,tsx}',
    './src/renderer/index.html',
    flowbite.content()
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slide': 'pulseSlide 1.5s ease-in-out infinite',
        'gradient-x': 'gradient-x 5s ease infinite'
      },
      keyframes: {
        pulseSlide: {
          '0%, 100%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(200%)' }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-position': '0% 50%'
          },
          '50%': {
            'background-position': '100% 50%'
          }
        }
      }
    }
  },
  plugins: [flowbite.plugin()],
  darkMode: 'media'
}
