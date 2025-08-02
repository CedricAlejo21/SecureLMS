// Global test setup
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test utilities
global.expect = expect;