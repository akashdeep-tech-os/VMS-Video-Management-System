export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'led': '1920px',
      },
    },
  },
  plugins: [require('tailwind-scrollbar-hide')],
};