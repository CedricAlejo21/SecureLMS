const request = require('supertest');
const { app } = require('../../../server');
const { connectDB, disconnectDB, clearDB, generateTestToken, authenticatedRequest } = require('../../helpers/testHelpers');
const { resetCounter, createTestUser, getValidRegistrationData, getValidLoginData } = require('../../helpers/testData');

describe('Authentication Foundation', () => {
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

  describe('1.1.1 User registration with valid data', () => {
    test('should successfully register a new user with valid data', async () => {
      const userData = getValidRegistrationData();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
      expect(response.body.user.role).toBe(userData.role);
      expect(response.body.token).toBeDefined();

      // Should not return password hash
      expect(response.body.user.password).toBeUndefined();
    });

    test('should reject registration with invalid email', async () => {
      const userData = getValidRegistrationData();
      userData.email = 'invalid-email';

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    test('should reject registration with weak password', async () => {
      const userData = getValidRegistrationData();
      userData.password = '123'; // Too weak
      userData.confirmPassword = '123'; // Update confirm password too

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    test('should reject registration with duplicate email', async () => {
      const userData = getValidRegistrationData();

      // First registration should succeed
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email should fail
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('1.1.2 User login with valid credentials', () => {
    test('should successfully login with valid credentials', async () => {
      // Create a test user first
      const user = await createTestUser({
        username: 'loginuser',
        email: 'login@test.com',
        password: 'TestPassword123!'
      });

      const loginData = {
        username: 'login@test.com', // Use email as username
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.user.email).toBe(user.email);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    test('should reject login with invalid email', async () => {
      const loginData = {
        username: 'nonexistent@test.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid username or password');
    });

    test('should reject login with invalid password', async () => {
      // Create a test user first
      await createTestUser({
        username: 'loginuser2',
        email: 'login2@test.com',
        password: 'TestPassword123!'
      });

      const loginData = {
        username: 'login2@test.com',
        password: 'WrongPassword!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe('Invalid username or password');
    });
  });

  describe('1.1.3 JWT token generation and validation', () => {
    test('should generate valid JWT token on login', async () => {
      const user = await createTestUser({
        username: 'jwtuser',
        email: 'jwt@test.com',
        password: 'TestPassword123!'
      });

      const loginData = {
        username: 'jwt@test.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      const token = response.body.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Token should be in JWT format (3 parts separated by dots)
      const tokenParts = token.split('.');
      expect(tokenParts).toHaveLength(3);
    });

    test('should include correct user data in JWT payload', async () => {
      const user = await createTestUser({
        username: 'payloaduser',
        email: 'payload@test.com',
        password: 'TestPassword123!',
        role: 'instructor'
      });

      const loginData = {
        username: 'payload@test.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      const token = response.body.token;
      
      // Decode token (without verification for testing)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      expect(payload.userId).toBe(user._id.toString());
      expect(payload.role).toBe('instructor');
      expect(payload.exp).toBeDefined(); // Expiration time
    });
  });

  describe('1.1.4 Protected route access with valid token', () => {
    test('should allow access to protected route with valid token', async () => {
      const user = await createTestUser({
        username: 'protecteduser',
        email: 'protected@test.com',
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

    test('should allow role-appropriate access', async () => {
      const instructor = await createTestUser({
        username: 'instructoruser',
        email: 'instructor@test.com',
        role: 'instructor'
      });

      const token = generateTestToken(instructor._id, instructor.role);

      // Instructor should be able to access their profile
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body.email).toBe(instructor.email);
      expect(response.body.role).toBe('instructor');
    });
  });

  describe('1.1.5 Protected route rejection without token', () => {
    test('should reject access to protected route without token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    test('should reject access with malformed token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .set('User-Agent', 'Jest Test Agent')
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    test('should reject access with expired token', async () => {
      const user = await createTestUser({
        username: 'expireduser',
        email: 'expired@test.com'
      });

      // Generate token with very short expiration
      const expiredToken = generateTestToken(user._id, user.role, '1ms');
      
      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(401);

      expect(response.body.message).toContain('token');
    });
  });
});