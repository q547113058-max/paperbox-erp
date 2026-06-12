/** @type {import('jest').Config} */
const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: __dirname,
  roots: [
    path.join(__dirname, 'apps/server/test'),
    path.join(__dirname, 'apps/server/src'),
  ],
  testMatch: [
    '<rootDir>/apps/server/test/**/*-spec.ts',
    '<rootDir>/apps/server/test/**/*.spec.ts',
    '<rootDir>/apps/server/src/**/*.spec.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/server/src/$1',
  },
  collectCoverageFrom: ['apps/server/src/**/*.ts', '!apps/server/src/**/*.d.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: path.join(__dirname, 'apps/server/tsconfig.json') }],
  },
  testTimeout: 30000,
};
