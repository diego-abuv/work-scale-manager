import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier/flat';

export default tseslint.config(
  { ignores: ['dist/', 'src/generated/'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  prettier,
);