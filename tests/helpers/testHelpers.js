const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Models
const User = require('../../models/User');
const Course = require('../../models/Course');
const Assignment = require('../../models/Assignment');
const AuditLog = require('../../models/AuditLog');

// Import test data factories
const { createTestUser } = require('./testData');

let mongoServer;

/**
 * Connect to in-memory MongoDB instance
 */
const connectDB = async () => {
  try {
    // Disconnect any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.error('Error connecting to test database:', error);
    throw error;
  }
};

/**
 * Disconnect and clean up
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Error disconnecting from test database:', error);
    throw error;
  }
};

/**
 * Clear all collections
 */
const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Generate JWT token for testing
 */
const generateTestToken = (userId, role = 'student', expiresIn = '1h') => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn }
  );
};

/**
 * Create authenticated request with token
 */
const authenticatedRequest = (app, token) => {
  return request(app)
    .set('Authorization', `Bearer ${token}`)
    .set('User-Agent', 'Jest Test Agent');
};

/**
 * Wait for a specified amount of time (for testing time-based features)
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extract error messages from validation errors
 */
const extractErrorMessages = (response) => {
  if (response.body.errors && Array.isArray(response.body.errors)) {
    return response.body.errors.map(err => err.msg);
  }
  return response.body.message || 'Unknown error';
};

/**
 * Assert audit log was created
 */
const assertAuditLog = async (action, userId = null, details = {}) => {
  const log = await AuditLog.findOne({ action }).sort({ timestamp: -1 });
  expect(log).toBeTruthy();
  if (userId) expect(log.user?.toString()).toBe(userId.toString());
  if (Object.keys(details).length > 0) {
    expect(log.details).toMatchObject(details);
  }
  return log;
};

/**
 * Create test user and return with generated token
 */
const createTestUserWithToken = async (userData = {}) => {
  const user = await createTestUser(userData);
  const token = generateTestToken(user._id, user.role);
  return { user, token };
};

module.exports = {
  connectDB,
  disconnectDB,
  clearDB,
  generateTestToken,
  authenticatedRequest,
  wait,
  extractErrorMessages,
  assertAuditLog,
  createTestUserWithToken
};