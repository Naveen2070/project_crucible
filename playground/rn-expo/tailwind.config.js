/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.ts', './App.tsx', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('./tailwind.preset.js')],
};
