/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        asset: {
          available: '#059669', // Emerald
          assigned: '#2563eb',  // Blue
          repair: '#d97706',    // Amber
          retired: '#64748b',   // Slate
          lost: '#dc2626',      // Red
        },
      },
    },
  },
  plugins: [],
};
