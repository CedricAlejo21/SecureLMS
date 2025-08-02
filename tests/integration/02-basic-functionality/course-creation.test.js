const request = require('supertest');
const { app } = require('../../../server');
const { connectDB, disconnectDB, clearDB, generateTestToken, createTestUserWithToken } = require('../../helpers/testHelpers');
const { resetCounter, createInstructorUser, createAdminUser, createStudentUser } = require('../../helpers/testData');

describe('1.2.1 Course Creation by Instructor', () => {
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

  describe('Successful course creation', () => {
    test('should allow instructor to create a valid course', async () => {
      const { user: instructor, token } = await createTestUserWithToken({ role: 'instructor' });

      const courseData = {
        title: 'Advanced JavaScript',
        description: 'Learn advanced JavaScript concepts and patterns',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        maxStudents: 30
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(courseData)
        .expect(201);

      expect(response.body.title).toBe(courseData.title);
      expect(response.body.description).toBe(courseData.description);
      expect(response.body.instructor._id).toBe(instructor._id.toString());
      expect(response.body.maxStudents).toBe(courseData.maxStudents);
      expect(response.body.students).toEqual([]);
    });

    test('should allow admin to create a course', async () => {
      const { user: admin, token } = await createTestUserWithToken({ role: 'admin' });

      const courseData = {
        title: 'Database Systems',
        description: 'Introduction to relational and NoSQL databases',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 25
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(courseData)
        .expect(201);

      expect(response.body.title).toBe(courseData.title);
      expect(response.body.maxStudents).toBe(courseData.maxStudents);
    });

    test('should create course with proper audit logging', async () => {
      const { user: instructor, token } = await createTestUserWithToken({ role: 'instructor' });

      const courseData = {
        title: 'Test Course for Audit',
        description: 'Course created to test audit logging',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 20
      };

      await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(courseData)
        .expect(201);

      // Verify audit log was created
      const AuditLog = require('../../../models/AuditLog');
      const auditLog = await AuditLog.findOne({ action: 'COURSE_CREATED' });
      expect(auditLog).toBeTruthy();
      expect(auditLog.user.toString()).toBe(instructor._id.toString());
      expect(auditLog.details.title).toBe(courseData.title);
    });
  });

  describe('Input validation', () => {
    test('should reject course with invalid title (too short)', async () => {
      const { token } = await createTestUserWithToken({ role: 'instructor' });

      const courseData = {
        title: 'JS', // Too short
        description: 'A valid description that meets minimum requirements',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 30
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(courseData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    test('should reject course with invalid title (too long)', async () => {
      const { token } = await createTestUserWithToken({ role: 'instructor' });

      const courseData = {
        title: 'A'.repeat(101), // Too long (>100 chars)
        description: 'A valid description that meets minimum requirements',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 30
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(courseData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should reject course with invalid description (too short)', async () => {
      const { token } = await createTestUserWithToken({ role: 'instructor' });

      const courseData = {
        title: 'Valid Course Title',
        description: 'Short', // Too short (<10 chars)
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 30
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(courseData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should reject course with invalid maxStudents (too low)', async () => {
      const { token } = await createTestUserWithToken({ role: 'instructor' });

      const courseData = {
        title: 'Valid Course Title',
        description: 'A valid description that meets minimum requirements',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 0 // Invalid (minimum 1)
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(courseData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should reject course with invalid dates', async () => {
      const { token } = await createTestUserWithToken({ role: 'instructor' });

      const courseData = {
        title: 'Valid Course Title',
        description: 'A valid description that meets minimum requirements',
        startDate: 'invalid-date',
        endDate: 'invalid-date',
        maxStudents: 30
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(courseData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test('should reject course with missing required fields', async () => {
      const { token } = await createTestUserWithToken({ role: 'instructor' });

      const courseData = {
        title: 'Valid Course Title'
        // Missing description, dates, maxStudents
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(courseData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Authorization', () => {
    test('should deny course creation for students', async () => {
      const { token } = await createTestUserWithToken({ role: 'student' });

      const courseData = {
        title: 'Student Attempt Course',
        description: 'A student should not be able to create this course',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 30
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(courseData)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    test('should deny course creation without authentication', async () => {
      const courseData = {
        title: 'Unauthorized Course',
        description: 'This should not be created without authentication',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 30
      };

      const response = await request(app)
        .post('/api/courses')
        .send(courseData)
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    test('should deny course creation with invalid token', async () => {
      const courseData = {
        title: 'Invalid Token Course',
        description: 'This should not be created with an invalid token',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 30
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', 'Bearer invalid-token')
        .set('User-Agent', 'Jest Test Agent')
        .send(courseData)
        .expect(401);

      expect(response.body.message).toContain('token');
    });
  });

  describe('Edge cases', () => {
    test('should handle course with minimum valid values', async () => {
      const { token } = await createTestUserWithToken({ role: 'instructor' });

      const courseData = {
        title: 'Min', // Minimum length (3 chars)
        description: 'Min course', // Minimum length (10 chars)
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 1 // Minimum value
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(courseData)
        .expect(201);

      expect(response.body.title).toBe(courseData.title);
      expect(response.body.maxStudents).toBe(1);
    });

    test('should handle course with maximum valid values', async () => {
      const { token } = await createTestUserWithToken({ role: 'instructor' });

      const courseData = {
        title: 'A'.repeat(100), // Maximum length (100 chars)
        description: 'B'.repeat(500), // Maximum length (500 chars)
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 100 // Maximum value
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(courseData)
        .expect(201);

      expect(response.body.title).toBe(courseData.title);
      expect(response.body.maxStudents).toBe(100);
    });
  });
});