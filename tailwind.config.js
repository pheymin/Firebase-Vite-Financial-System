/** @type {import('tailwindcss').Config} */
export default {
  content: ["./*.{html,js}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('flowbite/plugin')({
      charts: true,
    }),
  ],
  darkMode: 'class',
}

