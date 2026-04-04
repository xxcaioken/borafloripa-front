import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Ignorar dist e arquivos TS (sem parser TS instalado ainda — migração futura)
  globalIgnores(['dist', '**/*.ts', '**/*.tsx']),
  // Arquivos de config do Vite rodam em Node — precisam de globals.node
  {
    files: ['vite.config.js', 'vite.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      // Contextos exportam tanto Provider quanto hook — padrão React aceito
      'react-refresh/only-export-components': ['warn', { allowExportNames: ['useAuth', 'useToast'] }],
    },
  },
])
