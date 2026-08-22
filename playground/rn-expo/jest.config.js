/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js)'],
  // Ignore everything in node_modules EXCEPT the RN/Expo ecosystem (ships untranspiled ESM).
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-css-interop|nativewind))',
  ],
};
