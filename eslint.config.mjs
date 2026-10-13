// Regua de qualidade da Lousa. Regras quality/* vem de eslint-rules/ (copia do
// claude-pessoal/templates/eslint, MIT). Nunca suba o teto de 350 linhas nem
// desligue regra para passar: afrouxar e decisao registrada em docs/DECISOES.md.
import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import quality from './eslint-rules/index.cjs'

const NODE_NA_TELA = ['electron', 'node-pty', 'fs', 'path', 'os', 'child_process', 'crypto']

export default defineConfig([
  globalIgnores(['node_modules/**', 'out/**', 'dist/**', 'release/**', 'coverage/**']),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/main/**', 'src/preload/**', 'scripts/**', '*.config.{ts,mjs}', 'eslint-rules/**'],
    languageOptions: { globals: globals.node },
  },
  { files: ['src/renderer/**'], languageOptions: { globals: globals.browser } },
  {
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.mjs'],
    plugins: { quality },
    rules: {
      'quality/max-lines': ['error', { max: 350 }],
      'quality/no-direct-console': ['error', { logger: 'log() de src/main/log.ts' }],
      'no-var': 'error',
      'prefer-const': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      complexity: ['warn', 12],
      'max-depth': ['warn', 4],
      'max-params': ['warn', 4],
      'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-restricted-imports': [
        'error',
        {
          paths: NODE_NA_TELA.map((name) => ({
            name,
            message: 'A tela roda em sandbox: nada de Node/Electron. Use window.lousa.',
          })),
          patterns: [
            { group: ['node:*'], message: 'A tela roda em sandbox: nada de Node. Use window.lousa.' },
            {
              group: ['**/main/**', '**/preload/**'],
              message: 'A tela so fala com o main por window.lousa (contrato em src/shared/ipc.ts).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/main/**/*.ts', 'src/preload/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['**/renderer/**'], message: 'main e preload nao importam a tela.' }] },
      ],
    },
  },
  {
    files: ['src/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: NODE_NA_TELA.map((name) => ({ name, message: 'src/shared e so tipos e constantes.' })),
          patterns: [
            { group: ['node:*', '**/main/**', '**/preload/**', '**/renderer/**'], message: 'src/shared nao depende de ninguem.' },
          ],
        },
      ],
    },
  },
  { files: ['src/main/log.ts', 'scripts/**'], rules: { 'quality/no-direct-console': 'off' } },
  {
    files: ['**/*.test.ts'],
    plugins: { quality },
    rules: { 'quality/max-lines': ['warn', { includeTests: true }], 'max-lines-per-function': 'off' },
  },
  {
    files: ['eslint-rules/**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
])
