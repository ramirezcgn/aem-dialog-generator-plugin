module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'aem-dialog-generator-plugin.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/'
  ],
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  verbose: true
};
