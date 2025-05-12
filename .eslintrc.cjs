module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    '@electron-toolkit/eslint-config-ts/recommended',
    '@electron-toolkit/eslint-config-prettier'
  ],
  plugins: ['i18nhelper'],
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
    'i18nhelper/no-jp-string': 'warn'
  },
  overrides: [
    {
      // テストファイルに対するルールの上書き
      files: ['**/*.test.ts', '**/*.test.tsx', '**/tests/**/*', '**/__tests__/**/*'],
      rules: {
        // テストファイルでは日本語文字列の検出を無効化
        'i18nhelper/no-jp-string': 'off'
      }
    }
  ]
}
