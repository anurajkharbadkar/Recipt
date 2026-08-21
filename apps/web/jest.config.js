const nextJest = require('next/jest');

// next/jest wires up SWC transforms, CSS/asset stubbing, and env loading to
// match this app's own Next.js config — hand-rolling a babel/ts-jest config
// here would risk silently diverging from how Next actually compiles the app.
const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

module.exports = createJestConfig(customJestConfig);
