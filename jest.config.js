/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json'
      }
    ]
  },
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '\\.integration\\.test\\.ts$' // .integration.test.ts で終わるファイルを除外
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
}
