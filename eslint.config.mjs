import antfu from '@antfu/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'

export default antfu(
  {
    formatters: true,
    react: true,
    typescript: true,
    ignores: [
      'node_modules/**',
      '.next/**',
      'coverage/**',
      'dist/**',
      'templates/**',
      '.agents/**',
      '.codex/**',
      '.sonarlint/**',
      '.vscode/**',
    ],
    rules: {
      // Next.js replaces process.env.NEXT_PUBLIC_* at build time via webpack;
      // the node/prefer-global/process rule is not applicable here.
      'node/prefer-global/process': 'off',
      '@tanstack/query/exhaustive-deps': 'error',
      '@tanstack/query/stable-query-client': 'error',
      '@tanstack/query/no-rest-destructuring': 'error',
      '@tanstack/query/no-unstable-deps': 'error',
      '@tanstack/query/infinite-query-property-order': 'error',
      '@tanstack/query/no-void-query-fn': 'error',
      'e18e/ban-dependencies': 'off',
      '@stylistic/indent': ['warn', 2],
      '@stylistic/max-len': [
        'warn',
        {
          code: 200,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],
      '@stylistic/function-paren-newline': ['error', 'multiline-arguments'],
      '@stylistic/function-call-argument-newline': ['error', 'consistent'],
      '@stylistic/jsx-wrap-multilines': [
        'error',
        {
          declaration: 'parens-new-line',
          assignment: 'parens-new-line',
          return: 'parens-new-line',
          arrow: 'parens-new-line',
          condition: 'parens-new-line',
          logical: 'parens-new-line',
          prop: 'parens-new-line',
        },
      ],
      'object-curly-newline': ['error', { multiline: true, consistent: true }],
      'array-bracket-newline': ['error', { multiline: true, minItems: 3 }],
      'array-element-newline': ['error', { multiline: true, minItems: 3 }],
    },
    plugins: {
      '@tanstack/query': pluginQuery,
    },
  },
  {
    files: ['**/*.md'],
    rules: {
      'style/max-len': 'off',
      '@stylistic/max-len': 'off',
      'max-len': 'off',
    },
  },
)
