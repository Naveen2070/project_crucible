/** @type {import('tailwindcss').Config} */
module.exports = {
  // nativewind/preset is required by withNativeWind's config validation; Crucible's
  // generated tailwind.preset.js layers the design-token classes (bg-primary, ...) on top.
  presets: [require('nativewind/preset'), require('./tailwind.preset.js')],
  content: ['./index.ts', './App.tsx', './components/**/*.{js,jsx,ts,tsx}'],
};
