module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    node: true,
    es2022: true,
    browser: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',  // 允许 any（TypeORM/NestJS 需要）
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    'no-empty': 'off',
  },
  ignorePatterns: ['dist', 'node_modules', '*.cjs', '*.config.ts', '*.config.js'],
};
