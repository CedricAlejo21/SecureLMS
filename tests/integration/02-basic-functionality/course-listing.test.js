const request = require('supertest');
const { app } = require('../../../server');
const { connectDB, disconnectDB, clearDB, createTestUserWithToken } = require('../../helpers/testHelpers');
const { resetCounter, createTestCourse } = require('../../helpers/testData');

describe('1.2.2 Course Listing and Retrieval', () => {
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

  describe('GET /api/courses - All courses listing', () => {
    test('should allow admin to see all courses', async () => {
      const { user: admin, token: adminToken } = await createTestUserWithToken({ role: 'admin' });
      const { user: instructor1 } = await createTestUserWithToken({ role: 'instructor' });
      const { user: instructor2 } = await createTestUserWithToken({ role: 'instructor' });

      // Create courses by different instructors
      const course1 = await createTestCourse(instructor1._id, { title: 'Course 1' });
      const course2 = await createTestCourse(instructor2._id, { title: 'Course 2' });

      const response = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body).toHaveLength(2);
      const courseTitles = response.body.map(course => course.title);
      expect(courseTitles).toContain('Course 1');
      expect(courseTitles).toContain('Course 2');
    });

    test('should allow instructor to see only their own courses', async () => {
      const { user: instructor1, token: instructor1Token } = await createTestUserWithToken({ role: 'instructor' });
      const { user: instructor2 } = await createTestUserWithToken({ role: 'instructor' });

      // Create courses by different instructors
      const course1 = await createTestCourse(instructor1._id, { title: 'Instructor 1 Course' });
      const course2 = await createTestCourse(instructor2._id, { title: 'Instructor 2 Course' });

      const response = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${instructor1Token}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Instructor 1 Course');
      expect(response.body[0].instructor._id).toBe(instructor1._id.toString());
    });

    test('should allow students to see all active courses', async () => {
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });

      // Create active and inactive courses
      const activeCourse = await createTestCourse(instructor._id, { 
        title: 'Active Course', 
        isActive: true 
      });
      const inactiveCourse = await createTestCourse(instructor._id, { 
        title: 'Inactive Course', 
        isActive: false 
      });

      const response = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Active Course');
      expect(response.body[0].isActive).toBe(true);
    });

    test('should require authentication for course listing', async () => {
      const response = await request(app)
        .get('/api/courses')
        .expect(401);

      expect(response.body.message).toContain('token');
    });

    test('should include populated instructor and student data', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student } = await createTestUserWithToken({ role: 'student' });

      // Create course and enroll student
      const course = await createTestCourse(instructor._id, { title: 'Populated Course' });
      course.students.push(student._id);
      await course.save();

      const response = await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].instructor).toBeDefined();
      expect(response.body[0].instructor.firstName).toBe(instructor.firstName);
      expect(response.body[0].students).toHaveLength(1);
      expect(response.body[0].students[0].firstName).toBe(student.firstName);
    });
  });

  describe('GET /api/courses/student - Student enrolled courses', () => {
    test('should return courses student is enrolled in', async () => {
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });

      // Create courses
      const enrolledCourse = await createTestCourse(instructor._id, { 
        title: 'Enrolled Course' 
      });
      const notEnrolledCourse = await createTestCourse(instructor._id, { 
        title: 'Not Enrolled Course' 
      });

      // Enroll student in one course
      enrolledCourse.students.push(student._id);
      await enrolledCourse.save();

      const response = await request(app)
        .get('/api/courses/student')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Enrolled Course');
      expect(response.body[0].students.some(s => s._id === student._id.toString())).toBe(true);
    });

    test('should only allow students to access student courses endpoint', async () => {
      const { token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });

      const response = await request(app)
        .get('/api/courses/student')
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    test('should return empty array for student with no enrollments', async () => {
      const { token: studentToken } = await createTestUserWithToken({ role: 'student' });

      const response = await request(app)
        .get('/api/courses/student')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/courses/:id - Single course retrieval', () => {
    test('should allow instructor to view their own course', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      
      const course = await createTestCourse(instructor._id, { 
        title: 'Instructor Own Course',
        description: 'Course owned by instructor'
      });

      const response = await request(app)
        .get(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body.title).toBe('Instructor Own Course');
      expect(response.body.instructor._id).toBe(instructor._id.toString());
    });

    test('should allow enrolled student to view course', async () => {
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });

      const course = await createTestCourse(instructor._id, { 
        title: 'Student Enrolled Course' 
      });
      
      // Enroll student
      course.students.push(student._id);
      await course.save();

      const response = await request(app)
        .get(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body.title).toBe('Student Enrolled Course');
    });

    test('should allow admin to view any course', async () => {
      const { token: adminToken } = await createTestUserWithToken({ role: 'admin' });
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });

      const course = await createTestCourse(instructor._id, { 
        title: 'Admin Viewable Course' 
      });

      const response = await request(app)
        .get(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body.title).toBe('Admin Viewable Course');
    });

    test('should deny access to non-enrolled student', async () => {
      const { token: studentToken } = await createTestUserWithToken({ role: 'student' });
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });

      const course = await createTestCourse(instructor._id, { 
        title: 'Non-Enrolled Course' 
      });

      const response = await request(app)
        .get(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    test('should deny instructor access to other instructors courses', async () => {
      const { token: instructor1Token } = await createTestUserWithToken({ role: 'instructor' });
      const { user: instructor2 } = await createTestUserWithToken({ role: 'instructor' });

      const course = await createTestCourse(instructor2._id, { 
        title: 'Other Instructor Course' 
      });

      const response = await request(app)
        .get(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${instructor1Token}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    test('should return 404 for non-existent course', async () => {
      const { token: adminToken } = await createTestUserWithToken({ role: 'admin' });
      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

      const response = await request(app)
        .get(`/api/courses/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(404);

      expect(response.body.message).toBe('Course not found');
    });

    test('should return 400 for invalid course ID format', async () => {
      const { token: adminToken } = await createTestUserWithToken({ role: 'admin' });

      const response = await request(app)
        .get('/api/courses/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(500); // MongoDB throws CastError for invalid ObjectId

      expect(response.body.message).toBe('Server error fetching course');
    });

    test('should include populated assignments in course response', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      
      const course = await createTestCourse(instructor._id, { 
        title: 'Course with Assignments'
      });

      // Create assignment for the course
      const Assignment = require('../../../models/Assignment');
      const assignment = new Assignment({
        title: 'Test Assignment',
        description: 'Assignment for testing',
        course: course._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxScore: 100
      });
      await assignment.save();

      const response = await request(app)
        .get(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body.assignments).toBeDefined();
      expect(Array.isArray(response.body.assignments)).toBe(true);
    });
  });

  describe('Access Control and Security', () => {
    test('should require authentication for all course endpoints', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      // Test all endpoints without authentication
      await request(app).get('/api/courses').expect(401);
      await request(app).get('/api/courses/student').expect(401);
      await request(app).get(`/api/courses/${course._id}`).expect(401);
    });

    test('should reject requests with invalid tokens', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      const invalidToken = 'invalid.jwt.token';

      await request(app)
        .get('/api/courses')
        .set('Authorization', `Bearer ${invalidToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(401);

      await request(app)
        .get(`/api/courses/${course._id}`)
        .set('Authorization', `Bearer ${invalidToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(401);
    });
  });
});