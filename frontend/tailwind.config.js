/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#10B981', // Emerald
          deepGreen: '#059669',
          lightGreen: '#ECFDF5',
          blue: '#3B82F6', // Blue
          deepBlue: '#2563EB',
          lightBlue: '#EFF6FF',
          teal: '#14B8A6',
          dark: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Instrument Serif', 'Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
}
