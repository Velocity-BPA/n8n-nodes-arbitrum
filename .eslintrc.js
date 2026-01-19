module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: ['./tsconfig.json'],
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint', 'n8n-nodes-base'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    env: {
        node: true,
        es2021: true,
    },
    ignorePatterns: [
        'dist/**',
        'node_modules/**',
        'gulpfile.js',
    ],
    rules: {
        // TypeScript rules
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        
        // General rules
        'no-console': 'warn',
        'prefer-const': 'warn',
        'no-unused-vars': 'off', // Use TypeScript version
        
        // n8n-specific rules (if available)
        'n8n-nodes-base/node-param-description-missing-final-period': 'off',
        'n8n-nodes-base/node-param-description-excess-final-period': 'off',
    },
};
