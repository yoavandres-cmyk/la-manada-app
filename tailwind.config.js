/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        manada: {
          red:      '#cc0000',
          darkred:  '#8b0000',
          black:    '#0d0d0d',
          dark:     '#1a1a1a',
          card:     '#222222',
          border:   '#2a2a2a',
          gray:     '#888888',
          light:    '#cccccc',
          cream:    '#e8dcc8',
        }
      },
    },
  },
  plugins: [],
}