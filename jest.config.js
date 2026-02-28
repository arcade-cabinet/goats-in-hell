module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|miniplex|zustand|seedrandom|three|@react-three)/)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/__tests__/App.test.tsx',
    '<rootDir>/.claude/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.claude/',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
