module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    '@electron-toolkit/eslint-config-ts/recommended',
    '@electron-toolkit/eslint-config-prettier'
  ],
  settings: {
    react: {
      version: 'detect' // React のバージョンを自動検出
    }
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
    ],
    'react/prop-types': 'off',
    'no-control-regex': 0,
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'ImportExpression',
        message:
          'Consider using static imports instead of dynamic imports unless specifically required.'
      }
    ]
  }
}
