module.exports = {
  preset: 'react-native',
  // Map three/webgpu → three so Jest can resolve the module in Node (no WebGPU)
  moduleNameMapper: {
    '^three/webgpu$': 'three',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm|react-native|@react-native|miniplex|zustand|seedrandom|three|@react-three)/)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/__tests__/App.test.tsx',
    '<rootDir>/.claude/',
  ],
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
