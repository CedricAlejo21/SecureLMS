const request = require('supertest');
const { app } = require('../../../server');
const { connectDB, disconnectDB, clearDB, createTestUserWithToken, assertAuditLog } = require('../../helpers/testHelpers');
const { resetCounter, createTestCourse } = require('../../helpers/testData');

describe('1.2.4 Assignment Creation by Instructor', () => {
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

  describe('Assignment Creation', () => {
    test('should allow instructor to create valid assignment for their course', async () => {
      const { user: instructor, token } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id, {
        title: 'Test Course for Assignment'
      });

      const assignmentData = {
        title: 'Midterm Exam',
        description: 'A comprehensive midterm examination covering all course materials',
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 100
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(assignmentData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(assignmentData.title);
      expect(response.body.description).toBe(assignmentData.description);
      expect(response.body.maxScore).toBe(100);
      expect(response.body.course._id).toBe(course._id.toString());
    });

    test('should allow admin to create assignment for any course', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { token: adminToken } = await createTestUserWithToken({ role: 'admin' });
      
      const course = await createTestCourse(instructor._id, {
        title: 'Admin Assignment Course'
      });

      const assignmentData = {
        title: 'Admin Created Assignment',
        description: 'Assignment created by admin for testing purposes',
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 50
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(assignmentData)
        .expect(201);

      expect(response.body.title).toBe(assignmentData.title);
      expect(response.body.maxScore).toBe(50);
    });

    test('should create audit log for assignment creation', async () => {
      const { user: instructor, token } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      const assignmentData = {
        title: 'Audit Log Test Assignment',
        description: 'Assignment for testing audit logging',
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 75
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(assignmentData)
        .expect(201);

      // Verify audit log
      await assertAuditLog('CREATE_ASSIGNMENT', instructor._id, {
        assignmentId: response.body._id.toString(),
        title: assignmentData.title,
        courseId: course._id.toString()
      });
    });

    test('should return populated course data in response', async () => {
      const { user: instructor, token } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id, {
        title: 'Population Test Course'
      });

      const assignmentData = {
        title: 'Population Test Assignment',
        description: 'Testing course population in response',
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 25
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(assignmentData)
        .expect(201);

      expect(response.body.course).toHaveProperty('title');
      expect(response.body.course).toHaveProperty('instructor');
      expect(response.body.course.title).toBe('Population Test Course');
    });
  });

  describe('Input Validation', () => {
    test('should reject assignment with missing title', async () => {
      const { user: instructor, token } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      const invalidData = {
        description: 'Assignment without title',
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 100
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'title')).toBe(true);
    });

    test('should reject assignment with missing description', async () => {
      const { user: instructor, token } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      const invalidData = {
        title: 'Assignment Without Description',
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 100
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'description')).toBe(true);
    });

    test('should reject assignment with invalid course ID', async () => {
      const { token } = await createTestUserWithToken({ role: 'instructor' });

      const invalidData = {
        title: 'Invalid Course Assignment',
        description: 'Assignment with invalid course ID',
        course: 'invalid-course-id',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 100
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'course')).toBe(true);
    });

    test('should reject assignment with invalid due date', async () => {
      const { user: instructor, token } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      const invalidData = {
        title: 'Invalid Date Assignment',
        description: 'Assignment with invalid due date',
        course: course._id.toString(),
        dueDate: 'invalid-date',
        maxPoints: 100
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'dueDate')).toBe(true);
    });

    test('should reject assignment with invalid max points', async () => {
      const { user: instructor, token } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      const invalidData = {
        title: 'Invalid Points Assignment',
        description: 'Assignment with invalid max points',
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 0 // Invalid: must be at least 1
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'maxPoints')).toBe(true);
    });

    test('should reject assignment with max points exceeding limit', async () => {
      const { user: instructor, token } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      const invalidData = {
        title: 'Excessive Points Assignment',
        description: 'Assignment with too many max points',
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 1001 // Exceeds maximum of 1000
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'maxPoints')).toBe(true);
    });

    test('should reject assignment with excessively long title', async () => {
      const { user: instructor, token } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      const invalidData = {
        title: 'A'.repeat(201), // Exceeds 200 character limit
        description: 'Assignment with title too long',
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 100
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'title')).toBe(true);
    });

    test('should reject assignment with excessively long description', async () => {
      const { user: instructor, token } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      const invalidData = {
        title: 'Long Description Assignment',
        description: 'A'.repeat(2001), // Exceeds 2000 character limit
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 100
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'description')).toBe(true);
    });
  });

  describe('Authorization and Access Control', () => {
    test('should prevent students from creating assignments', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id);

      const assignmentData = {
        title: 'Student Attempt Assignment',
        description: 'Student trying to create assignment',
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 100
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(assignmentData)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    test('should prevent instructor from creating assignment for other instructors course', async () => {
      const { user: instructor1 } = await createTestUserWithToken({ role: 'instructor' });
      const { user: instructor2, token: instructor2Token } = await createTestUserWithToken({ role: 'instructor' });
      
      const course = await createTestCourse(instructor1._id, {
        title: 'Instructor 1 Course'
      });

      const assignmentData = {
        title: 'Unauthorized Assignment',
        description: 'Instructor 2 trying to create assignment for Instructor 1 course',
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 100
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${instructor2Token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(assignmentData)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    test('should require authentication for assignment creation', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      const assignmentData = {
        title: 'Unauthenticated Assignment',
        description: 'Assignment created without authentication',
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 100
      };

      await request(app)
        .post('/api/assignments')
        .send(assignmentData)
        .expect(401);
    });

    test('should reject invalid JWT tokens', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      const assignmentData = {
        title: 'Invalid Token Assignment',
        description: 'Assignment with invalid token',
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 100
      };

      await request(app)
        .post('/api/assignments')
        .set('Authorization', 'Bearer invalid-token')
        .set('User-Agent', 'Jest Test Agent')
        .send(assignmentData)
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent course', async () => {
      const { token } = await createTestUserWithToken({ role: 'instructor' });
      const fakeId = '507f1f77bcf86cd799439011';

      const assignmentData = {
        title: 'Non-existent Course Assignment',
        description: 'Assignment for course that does not exist',
        course: fakeId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 100
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(assignmentData)
        .expect(404);

      expect(response.body.message).toBe('Course not found');
    });

    test('should handle malformed request body gracefully', async () => {
      const { token } = await createTestUserWithToken({ role: 'instructor' });

      // Send malformed JSON
      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .set('Content-Type', 'application/json')
        .send('{"invalid json"}')
        .expect(400);

      // Server should handle malformed JSON gracefully
      expect(response.body).toHaveProperty('message');
    });

    test('should validate all required fields simultaneously', async () => {
      const { token } = await createTestUserWithToken({ role: 'instructor' });

      const invalidData = {
        // Missing all required fields
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle assignments with minimal valid data', async () => {
      const { user: instructor, token } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      const minimalData = {
        title: 'A', // Minimum 1 character
        description: 'B', // Minimum 1 character  
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 60 * 1000).toISOString(), // 1 minute from now
        maxPoints: 1 // Minimum points
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(minimalData)
        .expect(201);

      expect(response.body.title).toBe('A');
      expect(response.body.maxScore).toBe(1);
    });

    test('should handle assignments with maximum valid data', async () => {
      const { user: instructor, token } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      const maximalData = {
        title: 'A'.repeat(100), // Maximum length from model (100 chars)
        description: 'B'.repeat(1000), // Maximum length from model (1000 chars)
        course: course._id.toString(),
        dueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        maxPoints: 1000 // Maximum points
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(maximalData)
        .expect(201);

      expect(response.body.title).toBe('A'.repeat(100));
      expect(response.body.maxScore).toBe(1000);
    });

    test('should handle course ID with valid MongoDB ObjectId format', async () => {
      const { user: instructor, token } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      const assignmentData = {
        title: 'ObjectId Test Assignment',
        description: 'Testing ObjectId handling',
        course: course._id.toString(), // Ensure string format
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 100
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(assignmentData)
        .expect(201);

      expect(response.body.course._id).toBe(course._id.toString());
    });
  });
});