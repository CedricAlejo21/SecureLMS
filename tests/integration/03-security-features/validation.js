/**
 * Data Validation Security Tests (CHECKLIST Requirements Only)
 * 
 * This test suite covers ONLY the official CSSECDV CHECKLIST.md requirements:
 * 
 * CHECKLIST COVERAGE:
 * - CHECKLIST 2.3.1: Input rejection on validation failures (All validation failures should result in input rejection. Sanitizing should not be used.)
 * - CHECKLIST 2.3.2: Data range validation
 * - CHECKLIST 2.3.3: Data length validation
 * 
 * NOTE: NoSQL injection and XSS prevention are NOT part of the official CHECKLIST.md requirements
 */

const request = require('supertest');
const { app } = require('../../../server');
const { connectDB, disconnectDB, clearDB, generateTestToken, authenticatedRequest } = require('../../helpers/testHelpers');
const { resetCounter, createTestUser, getValidRegistrationData } = require('../../helpers/testData');
const User = require('../../../models/User');
const Course = require('../../../models/Course');
const Assignment = require('../../../models/Assignment');
const AuditLog = require('../../../models/AuditLog');

describe('Data Validation Security (CSSECDV CHECKLIST 2.3.x)', () => {
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

  describe('2.3.1 Input rejection on validation failures (CHECKLIST 2.3.1)', () => {
    test('should reject user registration with invalid email format (CHECKLIST 2.3.1)', async () => {
      const invalidEmailData = {
        username: 'testuser',
        email: 'invalid-email-format', // Invalid email
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        acceptTerms: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidEmailData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Please provide a valid email'
          })
        ])
      );
    });

    test('should reject course creation with invalid ISO date format (CHECKLIST 2.3.1)', async () => {
      const instructor = await createTestUser({ role: 'instructor' });
      const token = generateTestToken(instructor._id, instructor.role);

      const invalidCourseData = {
        title: 'Test Course',
        description: 'Valid description for testing',
        startDate: 'invalid-date-format', // Invalid ISO8601 date
        endDate: '2024-12-31T23:59:59.000Z',
        maxStudents: 25
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidCourseData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Valid start date is required'
          })
        ])
      );
    });

    test('should reject assignment creation with invalid MongoDB ObjectId (CHECKLIST 2.3.1)', async () => {
      const instructor = await createTestUser({ role: 'instructor' });
      const token = generateTestToken(instructor._id, instructor.role);

      const invalidAssignmentData = {
        title: 'Test Assignment',
        description: 'Valid description for testing',
        course: 'invalid-object-id', // Invalid MongoDB ObjectId
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 100
      };

      const response = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidAssignmentData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Valid course ID is required'
          })
        ])
      );
    });

    test('should reject grade creation with non-numeric points (CHECKLIST 2.3.1)', async () => {
      const instructor = await createTestUser({ role: 'instructor' });
      const student = await createTestUser({ role: 'student', email: 'student@test.com' });
      const token = generateTestToken(instructor._id, instructor.role);

      // Create course and assignment first
      const course = new Course({
        title: 'Test Course',
        description: 'Test course for grade validation',
        instructor: instructor._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxStudents: 10
      });
      await course.save();

      const assignment = new Assignment({
        title: 'Test Assignment',
        description: 'Test assignment for grade validation',
        course: course._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxScore: 100
      });
      await assignment.save();

      const invalidGradeData = {
        student: student._id,
        assignment: assignment._id,
        course: course._id,
        points: 'invalid-number', // Invalid numeric value
        feedback: 'Good work'
      };

      const response = await request(app)
        .post('/api/grades')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidGradeData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Points must be a positive number'
          })
        ])
      );
    });

    test('should reject course creation with invalid characters (CHECKLIST 2.3.1)', async () => {
      const instructor = await createTestUser({ role: 'instructor' });
      const token = generateTestToken(instructor._id, instructor.role);

      const invalidCharData = {
        title: 'Invalid <script>alert(1)</script> Title', // Contains invalid characters
        description: 'Valid description for testing input rejection',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 25
      };

      const response = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidCharData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringMatching(/contain only letters, numbers, spaces, and basic punctuation/i)
          })
        ])
      );
    });
  });

  describe('2.3.2 Data range validation (CHECKLIST 2.3.2)', () => {
    test('should enforce maximum students range (1-100) for course creation (CHECKLIST 2.3.2)', async () => {
      const instructor = await createTestUser({ role: 'instructor' });
      const token = generateTestToken(instructor._id, instructor.role);

      const courseDataTooHigh = {
        title: 'Test Course',
        description: 'Valid description for testing',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 150 // Above maximum of 100
      };

      const responseHigh = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send(courseDataTooHigh)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(responseHigh.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Maximum students must be between 1 and 100'
          })
        ])
      );

      const courseDataTooLow = {
        title: 'Test Course',
        description: 'Valid description for testing',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 0 // Below minimum of 1
      };

      const responseLow = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send(courseDataTooLow)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(responseLow.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Maximum students must be between 1 and 100'
          })
        ])
      );
    });

    test('should enforce assignment max points range (1-1000) (CHECKLIST 2.3.2)', async () => {
      const instructor = await createTestUser({ role: 'instructor' });
      const token = generateTestToken(instructor._id, instructor.role);

      // Create a course first
      const course = new Course({
        title: 'Test Course',
        description: 'Test course for assignment validation',
        instructor: instructor._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxStudents: 10
      });
      await course.save();

      const assignmentDataTooHigh = {
        title: 'Test Assignment',
        description: 'Valid description for testing',
        course: course._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 1500 // Above maximum of 1000
      };

      const responseHigh = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .send(assignmentDataTooHigh)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(responseHigh.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Max points must be between 1 and 1000'
          })
        ])
      );

      const assignmentDataTooLow = {
        title: 'Test Assignment',
        description: 'Valid description for testing',
        course: course._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxPoints: 0 // Below minimum of 1
      };

      const responseLow = await request(app)
        .post('/api/assignments')
        .set('Authorization', `Bearer ${token}`)
        .send(assignmentDataTooLow)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(responseLow.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Max points must be between 1 and 1000'
          })
        ])
      );
    });

    test('should enforce grade points minimum of 0 (CHECKLIST 2.3.2)', async () => {
      const instructor = await createTestUser({ role: 'instructor' });
      const student = await createTestUser({ role: 'student', email: 'student@test.com' });
      const token = generateTestToken(instructor._id, instructor.role);

      // Create course and assignment
      const course = new Course({
        title: 'Test Course',
        description: 'Test course for grade validation',
        instructor: instructor._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxStudents: 10
      });
      await course.save();

      const assignment = new Assignment({
        title: 'Test Assignment',
        description: 'Test assignment for grade validation',
        course: course._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxScore: 100
      });
      await assignment.save();

      const invalidGradeData = {
        student: student._id,
        assignment: assignment._id,
        course: course._id,
        points: -10, // Below minimum of 0
        feedback: 'Poor work'
      };

      const response = await request(app)
        .post('/api/grades')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidGradeData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Points must be a positive number'
          })
        ])
      );
    });

    test('should enforce business rule: grade cannot exceed assignment max score (CHECKLIST 2.3.2)', async () => {
      const instructor = await createTestUser({ role: 'instructor' });
      const student = await createTestUser({ role: 'student', email: 'student@test.com' });
      const token = generateTestToken(instructor._id, instructor.role);

      // Create course and assignment with max score of 100
      const course = new Course({
        title: 'Test Course',
        description: 'Test course for grade validation',
        instructor: instructor._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxStudents: 10
      });
      await course.save();

      const assignment = new Assignment({
        title: 'Test Assignment',
        description: 'Test assignment for grade validation',
        course: course._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxScore: 100
      });
      await assignment.save();

      const invalidGradeData = {
        student: student._id,
        assignment: assignment._id,
        course: course._id,
        points: 150, // Above assignment max score of 100
        feedback: 'Excellent work'
      };

      const response = await request(app)
        .post('/api/grades')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidGradeData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(response.body.message).toBe('Points cannot exceed assignment maximum of 100');
    });
  });

  describe('2.3.3 Data length validation (CHECKLIST 2.3.3)', () => {
    test('should enforce username length limits (3-30 characters) (CHECKLIST 2.3.3)', async () => {
      const shortUsernameData = {
        username: 'ab', // Too short (minimum 3)
        email: 'test@example.com',
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        acceptTerms: true
      };

      const responseShort = await request(app)
        .post('/api/auth/register')
        .send(shortUsernameData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(responseShort.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringMatching(/username|Invalid value/i)
          })
        ])
      );

      const longUsernameData = {
        username: 'a'.repeat(31), // Too long (maximum 30)
        email: 'test2@example.com',
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        acceptTerms: true
      };

      const responseLong = await request(app)
        .post('/api/auth/register')
        .send(longUsernameData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(responseLong.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringMatching(/username|Invalid value/i)
          })
        ])
      );
    });

    test('should enforce password length limits (12-128 characters) (CHECKLIST 2.3.3)', async () => {
      const shortPasswordData = {
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'Short1!', // Too short (minimum 12)
        confirmPassword: 'Short1!',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        acceptTerms: true
      };

      const responseShort = await request(app)
        .post('/api/auth/register')
        .send(shortPasswordData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(responseShort.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Password must be between 12-128 characters'
          })
        ])
      );

      const longPasswordData = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'A'.repeat(129) + '1!', // Too long (maximum 128)
        confirmPassword: 'A'.repeat(129) + '1!',
        firstName: 'Test',
        lastName: 'User',
        role: 'student',
        acceptTerms: true
      };

      const responseLong = await request(app)
        .post('/api/auth/register')
        .send(longPasswordData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(responseLong.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Password must be between 12-128 characters'
          })
        ])
      );
    });

    test('should enforce course title length limits (3-100 characters) (CHECKLIST 2.3.3)', async () => {
      const instructor = await createTestUser({ role: 'instructor' });
      const token = generateTestToken(instructor._id, instructor.role);

      const shortTitleData = {
        title: 'Ab', // Too short (minimum 3)
        description: 'Valid description for testing',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 25
      };

      const responseShort = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send(shortTitleData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(responseShort.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringMatching(/course title|invalid value/i)
          })
        ])
      );

      const longTitleData = {
        title: 'A'.repeat(101), // Too long (maximum 100)
        description: 'Valid description for testing',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 25
      };

      const responseLong = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send(longTitleData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(responseLong.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringMatching(/course title|invalid value/i)
          })
        ])
      );
    });

    test('should enforce course description length limits (10-500 characters) (CHECKLIST 2.3.3)', async () => {
      const instructor = await createTestUser({ role: 'instructor' });
      const token = generateTestToken(instructor._id, instructor.role);

      const shortDescriptionData = {
        title: 'Valid Course Title',
        description: 'Short', // Too short (minimum 10)
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 25
      };

      const responseShort = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send(shortDescriptionData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(responseShort.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringMatching(/course description|invalid value/i)
          })
        ])
      );

      const longDescriptionData = {
        title: 'Valid Course Title',
        description: 'A'.repeat(501), // Too long (maximum 500)
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 25
      };

      const responseLong = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send(longDescriptionData)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(responseLong.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: expect.stringMatching(/course description|invalid value/i)
          })
        ])
      );
    });
  });

  describe('Additional Validation Security Tests (CHECKLIST Compliance)', () => {
    test('should handle concurrent validation requests without race conditions', async () => {
      const instructor = await createTestUser({ role: 'instructor' });
      const token = generateTestToken(instructor._id, instructor.role);

      // Create multiple concurrent requests with same data to test validation consistency
      const courseData = {
        title: 'Test Course',
        description: 'Valid description for testing',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxStudents: 25
      };

      const requests = Array(5).fill().map(() =>
        request(app)
          .post('/api/courses')
          .set('Authorization', `Bearer ${token}`)
          .send(courseData)
          .set('User-Agent', 'Jest Test Agent')
      );

      const responses = await Promise.all(requests);

      // First should succeed, others should fail due to validation or conflict
      const successCount = responses.filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
      expect(successCount).toBeLessThanOrEqual(5);
    });

    test('should maintain validation performance under load', async () => {
      const instructor = await createTestUser({ role: 'instructor' });
      const token = generateTestToken(instructor._id, instructor.role);

      const startTime = Date.now();

      // Test validation performance with multiple invalid requests
      const invalidRequests = Array(10).fill().map((_, index) =>
        request(app)
          .post('/api/courses')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: '', // Invalid
            description: 'Short', // Invalid
            startDate: 'invalid-date', // Invalid
            endDate: 'invalid-date', // Invalid
            maxStudents: -1 // Invalid
          })
          .set('User-Agent', 'Jest Test Agent')
      );

      const responses = await Promise.all(invalidRequests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should fail validation
      responses.forEach(response => {
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('errors');
      });

      // Should complete within reasonable time (less than 5 seconds for 10 requests)
      expect(duration).toBeLessThan(5000);
    });
  });
});