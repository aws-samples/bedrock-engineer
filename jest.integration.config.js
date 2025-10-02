require('dotenv').config()

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 90000,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json'
      }
    ]
  },
  testMatch: ['**/*.integration.test.ts'],
  setupFiles: ['<rootDir>/jest.integration.setup.js'],
  // Run tests in parallel across multiple workers for faster execution
  maxWorkers: '50%' // Use 50% of available CPU cores
}
