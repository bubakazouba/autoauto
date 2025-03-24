module.exports = {
    collectCoverageFrom: [
        '**/*.{js,jsx}',
        '!**/node_modules/**',
        '!**/vendor/**',
        '!**/coverage/**',
        '!**/dist/**',
        '!**/*bundle.js',
        '!**/jest.config.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['lcov', 'text', 'text-summary'],
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
    testPathIgnorePatterns: ['/node_modules/', '/dist/']
};
