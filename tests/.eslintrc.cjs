module.exports = {
  root: true,
  parserOptions: {
    project: ['tests/.testing.tsconfig.json'],
    sourceType: 'script',
    ecmaVersion: 2020,
    ecmaFeatures: {
      globalReturn: true,
      impliedStrict: true,
      modules: true,
    },
  },
  processor: 'disable/disable',
  globals: {},
  parser: '@typescript-eslint/parser',
  env: {
    commonjs: true,
    browser: true,
    node: true,
    es2020: true,
    mocha: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/errors',
    'plugin:import/typescript',
    'plugin:mocha/recommended',
  ],
  settings: {
    'html/html-extensions': ['.html', '.njk'],
  },
  plugins: ['@typescript-eslint', 'extra-rules', 'no-secrets', 'disable', 'html', 'mocha'],
  rules: {
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/default-param-last': ['error'],
    '@typescript-eslint/explicit-function-return-type': ['error'],
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/no-duplicate-imports': ['error'],
    '@typescript-eslint/no-magic-numbers': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    '@typescript-eslint/no-unused-expressions': [
      'error',
      { allowTernary: true, allowTaggedTemplates: true, allowShortCircuit: true },
    ],
    '@typescript-eslint/no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '_' }],
    '@typescript-eslint/no-use-before-define': ['error'],
    '@typescript-eslint/no-useless-constructor': ['error'],
    '@typescript-eslint/prefer-readonly-parameter-types': 'off',
    '@typescript-eslint/prefer-readonly': ['error'],
    '@typescript-eslint/prefer-reduce-type-parameter': ['error'],
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/semi': [
      'error',
      'never',
      {
        beforeStatementContinuationChars: 'always',
      },
    ],
    '@typescript-eslint/space-infix-ops': ['error', { int32Hint: false }],
    'import/extensions': 'off',
    'import/newline-after-import': 'off',
    'import/prefer-default-export': 'off',
    'import/no-unresolved': 'off',
    'eslint-comments/disable-enable-pair': 'off',
    'ramda/no-redundant-and': 'off',
    'ramda/prefer-ramda-boolean': 'off',
    'mocha/no-hooks-for-single-case': 'off',
    'security/detect-non-literal-fs-filename': 'off',
    'security/detect-object-injection': 'off',
    camelcase: 'off',
    'consistent-return': 'off',
    'comma-dangle': 'off',
    'dot-notation': 'off',
    'no-underscore-dangle': 'off',
    'eol-last': 'off',
    'function-paren-newline': 'off',
    'generator-star-spacing': 'off',
    'global-require': 'off',
    'implicit-arrow-linebreak': 'off',
    indent: 'off',
    'max-len': 'off',
    'new-cap': 'off',
    'newline-per-chained-call': 'off',
    'no-console': 'off',
    'no-confusing-arrow': 'off',
    'no-duplicate-imports': 'off',
    'no-extra-semi': 'off',
    'no-magic-numbers': 'off',
    'no-nested-ternary': 'off',
    'no-negated-condition': 'off',
    'no-shadow': 'off',
    'no-unused-vars': 'off',
    'no-use-before-define': 'off',
    'no-useless-constructor': 'off',
    'no-unused-expressions': 'off',
    'object-curly-spacing': 'off',
    'object-curly-newline': 'off',
    'operator-linebreak': 'off',
    'prefer-arrow-callback': 'off',
    'require-await': 'off',
    semi: 'off',
    'spaced-comment': 'off',
    'space-infix-ops': 'off',
    'array-callback-return': 'error',
    'capitalized-comments': ['off'],
    complexity: ['error', 4],
    eqeqeq: 'error',
    'guard-for-in': 'error',
    'max-depth': ['error', 3],
    'max-lines-per-function': ['error', { max: 24, skipComments: true }],
    'max-params': ['error', 4],
    'max-statements-per-line': ['error', { max: 1 }],
    'no-await-in-loop': 'error',
    'no-debugger': 'warn',
    'no-else-return': 'error',
    'no-eq-null': 'error',
    'no-param-reassign': [
      'error',
      {
        props: true,
        ignorePropertyModificationsFor: ['store', 'res'],
      },
    ],
    'no-plusplus': 'error',
    'no-return-await': 'error',
    'no-return-assign': ['error', 'except-parens'],
    'no-undef-init': 'error',
    'no-unneeded-ternary': ['error', { defaultAssignment: true }],
    'no-useless-return': 'error',
    'operator-assignment': ['error', 'never'],
    quotes: [
      'error',
      'single',
      {
        avoidEscape: true,
        allowTemplateLiterals: true,
      },
    ],
    radix: 'error',
    'require-atomic-updates': 'error',
    'require-unicode-regexp': 'error',
  },
}
