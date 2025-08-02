const request = require('supertest');
const { app } = require('../../../server');
const { connectDB, disconnectDB, clearDB, createTestUserWithToken, assertAuditLog } = require('../../helpers/testHelpers');
const { resetCounter, createTestCourse } = require('../../helpers/testData');

describe('1.2.3 Student Enrollment in Courses', () => {
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

  describe('Course Enrollment', () => {
    test('should allow student to enroll in available course', async () => {
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      
      const course = await createTestCourse(instructor._id, {
        title: 'Open Enrollment Course',
        maxStudents: 30
      });

      const response = await request(app)
        .post(`/api/courses/${course._id}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body.message).toContain('Successfully enrolled');

      // Verify student is now enrolled
      const Course = require('../../../models/Course');
      const updatedCourse = await Course.findById(course._id);
      expect(updatedCourse.students.map(s => s.toString())).toContain(student._id.toString());
    });

    test('should create audit log for successful enrollment', async () => {
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      
      const course = await createTestCourse(instructor._id, {
        title: 'Audit Test Course'
      });

      await request(app)
        .post(`/api/courses/${course._id}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      // Verify audit log
      await assertAuditLog('ENROLLMENT', student._id, {
        courseTitle: course.title
      });
    });

    test('should prevent duplicate enrollment', async () => {
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      
      const course = await createTestCourse(instructor._id, {
        title: 'Duplicate Test Course'
      });

      // First enrollment should succeed
      await request(app)
        .post(`/api/courses/${course._id}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      // Second enrollment should fail
      const response = await request(app)
        .post(`/api/courses/${course._id}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(response.body.message).toContain('Already enrolled');
    });

    test('should prevent enrollment when course is full', async () => {
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      
      // Create course with capacity of 1
      const course = await createTestCourse(instructor._id, {
        title: 'Full Course',
        maxStudents: 1
      });

      // Fill the course with another student
      const { user: student2 } = await createTestUserWithToken({ role: 'student' });
      course.students.push(student2._id);
      await course.save();

      const response = await request(app)
        .post(`/api/courses/${course._id}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(response.body.message).toContain('Course is full');
    });

    test('should return 404 for non-existent course enrollment', async () => {
      const { token: studentToken } = await createTestUserWithToken({ role: 'student' });
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post(`/api/courses/${fakeId}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(404);

      expect(response.body.message).toBe('Course not found');
    });
  });

  describe('Course Unenrollment', () => {
    test('should allow student to unenroll from course', async () => {
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      
      const course = await createTestCourse(instructor._id, {
        title: 'Unenroll Test Course'
      });

      // First enroll the student
      course.students.push(student._id);
      await course.save();

      const response = await request(app)
        .post(`/api/courses/${course._id}/unenroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body.message).toContain('Successfully unenrolled');

      // Verify student is removed
      const Course = require('../../../models/Course');
      const updatedCourse = await Course.findById(course._id);
      expect(updatedCourse.students.map(s => s.toString())).not.toContain(student._id.toString());
    });

    test('should allow instructor to unenroll students from their course', async () => {
      const { user: student } = await createTestUserWithToken({ role: 'student' });
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      
      const course = await createTestCourse(instructor._id, {
        title: 'Instructor Unenroll Course'
      });

      // Enroll the student
      course.students.push(student._id);
      await course.save();

      const response = await request(app)
        .post(`/api/courses/${course._id}/unenroll`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ studentId: student._id.toString() }); // Convert to string
      
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Successfully unenrolled');

      // Verify student is removed
      const Course = require('../../../models/Course');
      const updatedCourse = await Course.findById(course._id);
      expect(updatedCourse.students.map(s => s.toString())).not.toContain(student._id.toString());
    });

    test('should prevent instructor from unenrolling from other instructors courses', async () => {
      const { user: student } = await createTestUserWithToken({ role: 'student' });
      const { user: instructor1 } = await createTestUserWithToken({ role: 'instructor' });
      const { user: instructor2, token: instructor2Token } = await createTestUserWithToken({ role: 'instructor' });
      
      const course = await createTestCourse(instructor1._id, {
        title: 'Other Instructor Course'
      });

      // Enroll the student
      course.students.push(student._id);
      await course.save();

      const response = await request(app)
        .post(`/api/courses/${course._id}/unenroll`)
        .set('Authorization', `Bearer ${instructor2Token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ studentId: student._id })
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    test('should prevent student from unenrolling other students', async () => {
      const { user: student1, token: student1Token } = await createTestUserWithToken({ role: 'student' });
      const { user: student2 } = await createTestUserWithToken({ role: 'student' });
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      
      const course = await createTestCourse(instructor._id, {
        title: 'Student Security Test Course'
      });

      // Enroll both students
      course.students.push(student1._id, student2._id);
      await course.save();

      const response = await request(app)
        .post(`/api/courses/${course._id}/unenroll`)
        .set('Authorization', `Bearer ${student1Token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ studentId: student2._id })
        .expect(403);

      expect(response.body.message).toContain('Students can only unenroll themselves');
    });

    test('should return error when trying to unenroll non-enrolled student', async () => {
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      
      const course = await createTestCourse(instructor._id, {
        title: 'Non-enrolled Test Course'
      });

      const response = await request(app)
        .post(`/api/courses/${course._id}/unenroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(400);

      expect(response.body.message).toContain('not enrolled');
    });

    test('should create audit log for unenrollment', async () => {
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      
      const course = await createTestCourse(instructor._id, {
        title: 'Unenroll Audit Course'
      });

      // Enroll the student first
      course.students.push(student._id);
      await course.save();

      await request(app)
        .post(`/api/courses/${course._id}/unenroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      // Verify audit log
      await assertAuditLog('UNENROLLMENT', student._id, {
        courseTitle: course.title,
        unenrolledStudentId: student._id
      });
    });

    test('should return 404 for non-existent course unenrollment', async () => {
      const { token: studentToken } = await createTestUserWithToken({ role: 'student' });
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post(`/api/courses/${fakeId}/unenroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(404);

      expect(response.body.message).toBe('Course not found');
    });
  });

  describe('Authorization and Access Control', () => {
    test('should deny enrollment for instructors', async () => {
      const { user: instructor1, token: instructor1Token } = await createTestUserWithToken({ role: 'instructor' });
      const { user: instructor2 } = await createTestUserWithToken({ role: 'instructor' });
      
      const course = await createTestCourse(instructor2._id, {
        title: 'Instructor Deny Course'
      });

      const response = await request(app)
        .post(`/api/courses/${course._id}/enroll`)
        .set('Authorization', `Bearer ${instructor1Token}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    test('should deny enrollment for admins', async () => {
      const { token: adminToken } = await createTestUserWithToken({ role: 'admin' });
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      
      const course = await createTestCourse(instructor._id, {
        title: 'Admin Deny Course'
      });

      const response = await request(app)
        .post(`/api/courses/${course._id}/enroll`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    test('should require authentication for enrollment', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      await request(app)
        .post(`/api/courses/${course._id}/enroll`)
        .expect(401);
    });

    test('should require authentication for unenrollment', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      await request(app)
        .post(`/api/courses/${course._id}/unenroll`)
        .expect(401);
    });

    test('should reject invalid tokens for enrollment', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const course = await createTestCourse(instructor._id);

      await request(app)
        .post(`/api/courses/${course._id}/enroll`)
        .set('Authorization', 'Bearer invalid-token')
        .set('User-Agent', 'Jest Test Agent')
        .expect(401);
    });
  });

  describe('Edge Cases and Course Capacity', () => {
    // Note: Concurrent enrollment testing moved to Phase 3 Edge Cases
    // as it's not a core security requirement from CHECKLIST.md

    test('should handle enrollment in course with exact capacity limit', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      // Create course with exact capacity for one student
      const course = await createTestCourse(instructor._id, {
        title: 'Exact Capacity Course',
        maxStudents: 1
      });

      const response = await request(app)
        .post(`/api/courses/${course._id}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body.message).toContain('Successfully enrolled');

      // Verify course is now at capacity
      const Course = require('../../../models/Course');
      const updatedCourse = await Course.findById(course._id);
      expect(updatedCourse.students).toHaveLength(1);
      expect(updatedCourse.isFull).toBe(true);
    });

    test('should handle invalid course ID gracefully', async () => {
      const { token: studentToken } = await createTestUserWithToken({ role: 'student' });

      const response = await request(app)
        .post('/api/courses/invalid-id/enroll')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(500);

      expect(response.body.message).toContain('Server error');
    });
  });
});