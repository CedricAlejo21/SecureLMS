const request = require('supertest');
const bcrypt = require('bcryptjs');
const { app } = require('../../../server');
const { connectDB, disconnectDB, clearDB, generateTestToken, authenticatedRequest, wait, assertAuditLog } = require('../../helpers/testHelpers');
const { resetCounter, createTestUser, getValidRegistrationData } = require('../../helpers/testData');
const User = require('../../../models/User');
const AuditLog = require('../../../models/AuditLog');

describe('Authentication Security Controls', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
    resetCounter();
  });

  describe('2.1.1 Require authentication for all protected pages/resources', () => {
    const protectedEndpoints = [
      { method: 'get', path: '/api/users/profile', description: 'User profile' },
      { method: 'get', path: '/api/courses', description: 'Courses listing' },
      { method: 'post', path: '/api/courses', description: 'Course creation' },
      { method: 'get', path: '/api/assignments', description: 'Assignments listing' },
      { method: 'post', path: '/api/assignments', description: 'Assignment creation' },
      { method: 'get', path: '/api/audit', description: 'Admin audit logs' },
      { method: 'get', path: '/api/audit/stats', description: 'Admin audit stats' },
      { method: 'post', path: '/api/auth/change-password', description: 'Password change' }
    ];

    protectedEndpoints.forEach(({ method, path, description }) => {
      test(`should require authentication for ${description} (${method.toUpperCase()} ${path})`, async () => {
        const response = await request(app)[method](path);
        
        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/token|unauthorized|authentication/i);
      });

      test(`should reject invalid token for ${description}`, async () => {
        const response = await request(app)[method](path)
          .set('Authorization', 'Bearer invalid-token-format')
          .set('User-Agent', 'Jest Test Agent');
        
        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/token|invalid|malformed/i);
      });

      test(`should reject expired token for ${description}`, async () => {
        const user = await createTestUser({ username: 'expireduser', email: 'expired@test.com' });
        const expiredToken = generateTestToken(user._id, user.role, '1ms');
        
        await wait(10); // Wait for token to expire
        
        const response = await request(app)[method](path)
          .set('Authorization', `Bearer ${expiredToken}`)
          .set('User-Agent', 'Jest Test Agent');
        
        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/token|expired|invalid/i);
      });
    });

    test('should allow access to protected resources with valid token', async () => {
      const user = await createTestUser({ 
        username: 'validuser', 
        email: 'valid@test.com',
        role: 'student' 
      });
      const token = generateTestToken(user._id, user.role);

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body.email).toBe(user.email);
    });
  });

  describe('2.1.2 Authentication controls fail securely', () => {
    test('should implement account lockout after multiple failed attempts', async () => {
      const user = await createTestUser({
        username: 'lockoutuser',
        email: 'lockout@test.com',
        password: 'CorrectPassword123!'
      });

      // Perform 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'lockout@test.com',
            password: 'WrongPassword!'
          })
          .set('User-Agent', 'Jest Test Agent');
        
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid username or password');
      }

      // Verify account is locked by checking database
      const lockedUser = await User.findById(user._id);
      expect(lockedUser.failedLoginAttempts).toBeGreaterThanOrEqual(5);
      expect(lockedUser.accountLocked).toBe(true);
      expect(lockedUser.lockUntil).toBeDefined();

      // 6th attempt should return account locked message
      const lockResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'lockout@test.com',
          password: 'CorrectPassword123!' // Even with correct password
        })
        .set('User-Agent', 'Jest Test Agent')
        .expect(423);

      expect(lockResponse.body.message).toMatch(/locked|temporarily locked/i);

      // Verify audit logs for failed attempts
      const failedLogs = await AuditLog.find({ action: 'LOGIN_FAILED' });
      expect(failedLogs.length).toBeGreaterThanOrEqual(5);
    });

    test('should not reveal user existence in authentication failures', async () => {
      // Test with non-existent user
      const nonExistentResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent@test.com',
          password: 'SomePassword123!'
        })
        .set('User-Agent', 'Jest Test Agent')
        .expect(401);

      // Test with existing user but wrong password
      await createTestUser({
        username: 'existinguser',
        email: 'existing@test.com',
        password: 'CorrectPassword123!'
      });

      const wrongPasswordResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'existing@test.com',
          password: 'WrongPassword123!'
        })
        .set('User-Agent', 'Jest Test Agent')
        .expect(401);

      // Both should return the same generic message
      expect(nonExistentResponse.body.message).toBe('Invalid username or password');
      expect(wrongPasswordResponse.body.message).toBe('Invalid username or password');
    });

    test('should enforce re-authentication for sensitive operations', async () => {
      const user = await createTestUser({
        username: 'reauthuser',
        email: 'reauth@test.com',
        password: 'CurrentPassword123!'
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'reauth@test.com',
          password: 'CurrentPassword123!'
        })
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      const token = loginResponse.body.token;

      // Try to change password without re-authentication should fail
      const changePasswordResponse = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          newPassword: 'NewPassword123!'
        })
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(changePasswordResponse.body.errors).toBeDefined();
    });

    test('should invalidate sessions on security events', async () => {
      const user = await createTestUser({
        username: 'sessionuser',
        email: 'session@test.com'
      });

      const token = generateTestToken(user._id, user.role);

      // Verify token works initially
      await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      // Simulate account lockout by directly setting lockout
      await User.findByIdAndUpdate(user._id, {
        accountLocked: true,
        lockUntil: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      });

      // Token should no longer work after account is locked
      await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(401);
    });
  });

  describe('2.1.3 Only cryptographically strong hashed passwords stored', () => {
    test('should store passwords using bcrypt with sufficient rounds', async () => {
      const userData = getValidRegistrationData();
      const plainTextPassword = userData.password;

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(201);

      // Fetch user from database
      const user = await User.findById(response.body.user.id).select('+password');
      
      // Verify password is hashed
      expect(user.password).not.toBe(plainTextPassword);
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
      
      // Verify bcrypt rounds (should be at least 10)
      const rounds = parseInt(user.password.split('$')[2]);
      expect(rounds).toBeGreaterThanOrEqual(10);
      
      // Verify password can be verified with bcrypt
      const isValid = await bcrypt.compare(plainTextPassword, user.password);
      expect(isValid).toBe(true);
    });

    test('should enforce password complexity requirements', async () => {
      const weakPasswords = [
        'short',                    // Too short
        'onlylowercase123!',        // No uppercase
        'ONLYUPPERCASE123!',        // No lowercase
        'NoNumbers!',               // No numbers
        'NoSpecialChars123',        // No special characters
        'password123!',             // Common password
        'Password123456!',          // Sequential characters
        '123456789!A',              // Sequential numbers
      ];

      for (const password of weakPasswords) {
        const userData = getValidRegistrationData();
        userData.password = password;
        userData.confirmPassword = password;

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .set('User-Agent', 'Jest Test Agent')
          .expect(400);

        expect(response.body.errors).toBeDefined();
      }
    });

    test('should enforce password history', async () => {
      const user = await createTestUser({
        username: 'historyuser',
        email: 'history@test.com',
        password: 'OldPassword123!'
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'history@test.com',
          password: 'OldPassword123!'
        })
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      const token = loginResponse.body.token;

      // Wait for password minimum age to pass (simulated)
      user.passwordChangedAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      await user.save();

      // Try to change to the same password should fail
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'OldPassword123!'
        })
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(response.body.message).toMatch(/different|same/i);
    });

    test('should never store or log passwords in plaintext', async () => {
      const userData = getValidRegistrationData();
      const plainTextPassword = userData.password;

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(201);

      // Check audit logs don't contain plaintext password
      const auditLogs = await AuditLog.find({ action: 'USER_CREATED' });
      expect(auditLogs.length).toBeGreaterThan(0);
      
      const logEntry = auditLogs[0];
      const logString = JSON.stringify(logEntry);
      expect(logString).not.toContain(plainTextPassword);
    });
  });

  describe('2.1.4 Generic authentication failure responses', () => {
    test('should return generic error for various authentication failures', async () => {
      const testCases = [
        {
          username: 'nonexistent@test.com',
          password: 'SomePassword123!',
          description: 'non-existent user'
        },
        {
          username: 'test@test.com',
          password: 'wrongpassword',
          description: 'wrong password (after creating user)'
        }
      ];

      // Create a user for the wrong password test
      await createTestUser({
        username: 'genericuser',
        email: 'test@test.com',
        password: 'CorrectPassword123!'
      });

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: testCase.username,
            password: testCase.password
          })
          .set('User-Agent', 'Jest Test Agent')
          .expect(401);

        // All should return the same generic message
        expect(response.body.message).toBe('Invalid username or password');
        
        // Should not contain specific error details
        expect(response.body.message).not.toMatch(/not found|doesn't exist|incorrect password/i);
      }
    });

    test('should not reveal sensitive information in error messages', async () => {
      // Test registration with existing email
      const user = await createTestUser({
        username: 'existing',
        email: 'existing@test.com'
      });

      const userData = getValidRegistrationData();
      userData.email = 'existing@test.com';

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      // Should not reveal specific field that conflicts
      expect(response.body.message).toMatch(/already exists/i);
      expect(response.body.message).not.toContain('email already exists');
      expect(response.body.message).not.toContain('username already exists');
    });

    test('should provide consistent response times for authentication failures', async () => {
      const user = await createTestUser({
        username: 'timinguser',
        email: 'timing@test.com',
        password: 'CorrectPassword123!'
      });

      const testCases = [
        { username: 'nonexistent@test.com', password: 'password' },
        { username: 'timing@test.com', password: 'wrongpassword' }
      ];

      const responseTimes = [];

      for (const testCase of testCases) {
        const startTime = Date.now();
        
        await request(app)
          .post('/api/auth/login')
          .send(testCase)
          .set('User-Agent', 'Jest Test Agent')
          .expect(401);
        
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      // Response times should be relatively similar (within 300ms difference for test environment)
      const timeDifference = Math.abs(responseTimes[0] - responseTimes[1]);
      expect(timeDifference).toBeLessThan(300);
    });

    test('should not expose system information in error responses', async () => {
      // Test with missing required fields
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: '' }) // Missing password
        .set('User-Agent', 'Jest Test Agent');

      // Should not expose internal error details
      expect(response.body.message || response.body.errors).toBeDefined();
      const errorInfo = JSON.stringify(response.body);
      expect(errorInfo).not.toMatch(/stack trace|file path|line number|internal/i);
    });
  });

  describe('Additional Security Controls', () => {
    test('should log all authentication events for audit trail', async () => {
      const user = await createTestUser({
        username: 'audituser',
        email: 'audit@test.com',
        password: 'TestPassword123!'
      });

      // Test successful login
      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'audit@test.com',
          password: 'TestPassword123!'
        })
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      // Test failed login
      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'audit@test.com',
          password: 'WrongPassword!'
        })
        .set('User-Agent', 'Jest Test Agent')
        .expect(401);

      // Verify audit logs exist
      const loginLog = await AuditLog.findOne({ action: 'LOGIN', user: user._id });
      const failedLog = await AuditLog.findOne({ action: 'LOGIN_FAILED', user: user._id });
      
      expect(loginLog).toBeTruthy();
      expect(failedLog).toBeTruthy();
      
      // Verify logs contain necessary security information
      expect(loginLog.ipAddress).toBeDefined();
      expect(loginLog.userAgent).toBeDefined();
      expect(loginLog.timestamp).toBeDefined();
      expect(failedLog.ipAddress).toBeDefined();
      expect(failedLog.userAgent).toBeDefined();
      expect(failedLog.timestamp).toBeDefined();
    });

    test('should enforce password minimum age', async () => {
      const user = await createTestUser({
        username: 'ageuser',
        email: 'age@test.com',
        password: 'CurrentPassword123!'
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'age@test.com',
          password: 'CurrentPassword123!'
        })
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      const token = loginResponse.body.token;

      // Try to change password immediately (should fail due to minimum age)
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewPassword123!'
        })
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(response.body.message).toMatch(/24 hours|minimum age/i);
    });
  });
});