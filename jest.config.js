module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|reactylon|@babylonjs|miniplex|zustand|seedrandom)/)',
  ],
  moduleNameMapper: {
    '^@babylonjs/core$': '<rootDir>/src/__mocks__/@babylonjs/core.ts',
    '^@babylonjs/gui$': '<rootDir>/src/__mocks__/@babylonjs/gui.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__tests__/App.test.tsx'],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
