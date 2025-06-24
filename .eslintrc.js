module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Error prevention
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-duplicate-imports': 'error',
    
    // Code quality
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'warn',
    'prefer-template': 'warn',
    'prefer-arrow-callback': 'warn',
    'arrow-spacing': 'error',
    'no-multiple-empty-lines': ['error', { max: 2 }],
    'no-trailing-spaces': 'error',
    
    // Style consistency
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-blocks': 'error',
    'keyword-spacing': 'error',
    'space-infix-ops': 'error',
    
    // Function rules
    'func-style': ['warn', 'declaration', { allowArrowFunctions: true }],
    'no-param-reassign': 'warn',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    
    // Async/await rules
    'no-async-promise-executor': 'error',
    'require-await': 'warn',
    'no-await-in-loop': 'warn',
    
    // Performance
    'no-loop-func': 'error',
    'no-new-object': 'error',
    'no-new-array': 'error',
    'no-new-wrappers': 'error',
    
    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js', 'tests/**/*.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off', // Allow console in tests
        'prefer-arrow-callback': 'off' // Jest uses function callbacks
      }
    },
    {
      files: ['bin/**/*.js'],
      rules: {
        'no-console': 'off' // Allow console in CLI scripts
      }
    },
    {
      files: ['benchmarks/**/*.js'],
      rules: {
        'no-console': 'off' // Allow console in benchmarks
      }
    }
  ],
  globals: {
    // Test globals from setup.js
    'testUtils': 'readonly',
    'performanceMonitor': 'readonly',
    'memoryMonitor': 'readonly',
    'TEST_CONFIG': 'readonly',
    'restoreConsole': 'readonly'
  }
}; 