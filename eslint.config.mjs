import antfu from '@antfu/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'

export default antfu(
  {
    formatters: true,
    react: true,
    typescript: true,
    ignores: [
      'node_modules/*',
      'templates/*',
      '.codex/*',
    ],
    rules: {
      '@tanstack/query/exhaustive-deps': 'error',
      '@tanstack/query/stable-query-client': 'error',
      '@tanstack/query/no-rest-destructuring': 'error',
      '@tanstack/query/no-unstable-deps': 'error',
      '@tanstack/query/infinite-query-property-order': 'error',
      '@tanstack/query/no-void-query-fn': 'error',
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