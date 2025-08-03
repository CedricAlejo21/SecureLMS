const request = require('supertest');
const { app } = require('../../../server');
const { connectDB, disconnectDB, clearDB, createTestUserWithToken, assertAuditLog } = require('../../helpers/testHelpers');
const { resetCounter, createTestCourse, createTestAssignment } = require('../../helpers/testData');
const Submission = require('../../../models/Submission');

describe('1.2.5 Assignment Submission by Student', () => {
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

  describe('Assignment Submission', () => {
    test('should allow enrolled student to submit assignment', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id, {
        title: 'Test Assignment',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Due in 7 days
      });

      const submissionData = {
        text: 'This is my assignment submission with detailed answers and explanations.'
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.text).toBe(submissionData.text);
      expect(response.body.student._id).toBe(student._id.toString());
      expect(response.body.assignment).toBe(assignment._id.toString());
      expect(response.body.isLate).toBe(false);
    });

    test('should detect late submission after due date', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      // Create assignment with past due date
      const assignment = await createTestAssignment(course._id, {
        title: 'Late Test Assignment',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Due yesterday
      });

      const submissionData = {
        text: 'This is a late submission.'
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(201);

      expect(response.body.isLate).toBe(true);
    });

    test('should create audit log for submission', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const submissionData = {
        text: 'Audit log test submission.'
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(201);

      // Verify audit log
      await assertAuditLog('SUBMIT_ASSIGNMENT', student._id, {
        assignmentId: assignment._id.toString(),
        studentId: student._id.toString(),
        submissionId: response.body._id.toString()
      });
    });

    test('should populate student information in response', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const submissionData = {
        text: 'Population test submission.'
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(201);

      expect(response.body.student).toHaveProperty('firstName');
      expect(response.body.student).toHaveProperty('lastName');
      expect(response.body.student).toHaveProperty('email');
      expect(response.body.student.firstName).toBe(student.firstName);
    });
  });

  describe('Input Validation', () => {
    test('should reject submission with missing text', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const invalidData = {
        // Missing text field
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'text')).toBe(true);
    });

    test('should reject submission with empty text', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const invalidData = {
        text: '' // Empty text
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'text')).toBe(true);
    });

    test('should reject submission with text exceeding maximum length', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const invalidData = {
        text: 'A'.repeat(5001) // Exceeds 5000 character limit
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'text')).toBe(true);
    });

    test('should trim whitespace from submission text', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const submissionData = {
        text: '   This text has leading and trailing whitespace   '
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(201);

      expect(response.body.text).toBe('This text has leading and trailing whitespace');
    });
  });

  describe('Authorization and Access Control', () => {
    test('should prevent student from submitting for another student', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student1, token: student1Token } = await createTestUserWithToken({ role: 'student' });
      const { user: student2 } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student1._id, student2._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const submissionData = {
        text: 'Trying to submit for another student.'
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student2._id}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    test('should prevent non-enrolled student from submitting', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [] // Student not enrolled
      });
      
      const assignment = await createTestAssignment(course._id);

      const submissionData = {
        text: 'Non-enrolled student submission.'
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(403);

      expect(response.body.message).toContain('not enrolled');
    });

    test('should prevent instructors from submitting assignments', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const submissionData = {
        text: 'Instructor trying to submit.'
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    test('should prevent admins from submitting assignments', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student } = await createTestUserWithToken({ role: 'student' });
      const { token: adminToken } = await createTestUserWithToken({ role: 'admin' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const submissionData = {
        text: 'Admin trying to submit.'
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    test('should require authentication for submission', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const submissionData = {
        text: 'Unauthenticated submission.'
      };

      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .send(submissionData)
        .expect(401);
    });

    test('should reject invalid JWT tokens', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const submissionData = {
        text: 'Invalid token submission.'
      };

      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', 'Bearer invalid-token')
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(401);
    });
  });

  describe('Duplicate Submission Prevention', () => {
    test('should prevent duplicate submissions for same assignment', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const submissionData = {
        text: 'First submission.'
      };

      // First submission should succeed
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(201);

      // Second submission should fail
      const secondSubmissionData = {
        text: 'Second submission (should fail).'
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(secondSubmissionData)
        .expect(400);

      expect(response.body.message).toContain('already submitted');
    });

    test('should allow different students to submit to same assignment', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student1, token: student1Token } = await createTestUserWithToken({ role: 'student' });
      const { user: student2, token: student2Token } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student1._id, student2._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const submission1Data = {
        text: 'Student 1 submission.'
      };

      const submission2Data = {
        text: 'Student 2 submission.'
      };

      // Both submissions should succeed
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student1._id}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submission1Data)
        .expect(201);

      await request(app)
        .post(`/api/submissions/${assignment._id}/${student2._id}`)
        .set('Authorization', `Bearer ${student2Token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submission2Data)
        .expect(201);
    });

    test('should allow same student to submit to different assignments', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment1 = await createTestAssignment(course._id, {
        title: 'Assignment 1'
      });
      
      const assignment2 = await createTestAssignment(course._id, {
        title: 'Assignment 2'
      });

      const submission1Data = {
        text: 'Submission for assignment 1.'
      };

      const submission2Data = {
        text: 'Submission for assignment 2.'
      };

      // Both submissions should succeed
      await request(app)
        .post(`/api/submissions/${assignment1._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submission1Data)
        .expect(201);

      await request(app)
        .post(`/api/submissions/${assignment2._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submission2Data)
        .expect(201);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent assignment', async () => {
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      const fakeId = '507f1f77bcf86cd799439011';

      const submissionData = {
        text: 'Submission for non-existent assignment.'
      };

      const response = await request(app)
        .post(`/api/submissions/${fakeId}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(404);

      expect(response.body.message).toBe('Assignment not found');
    });

    test('should handle malformed request body gracefully', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      // Send malformed JSON
      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .set('Content-Type', 'application/json')
        .send('{"invalid json"}')
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should handle invalid ObjectId format in URL', async () => {
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });

      const submissionData = {
        text: 'Submission with invalid assignment ID.'
      };

      const response = await request(app)
        .post(`/api/submissions/invalid-id/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(500);

      expect(response.body.message).toContain('Server error');
    });
  });

  describe('Edge Cases', () => {
    test('should handle submission with maximum valid text length', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const submissionData = {
        text: 'A'.repeat(5000) // Maximum allowed length
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(201);

      expect(response.body.text).toBe('A'.repeat(5000));
    });

    test('should handle submission with minimal valid text', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const submissionData = {
        text: 'A' // Minimum valid length
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(201);

      expect(response.body.text).toBe('A');
    });

    test('should handle submission exactly at due date', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      // Set due date very close to current time
      const assignment = await createTestAssignment(course._id, {
        dueDate: new Date(Date.now() + 1000) // Due in 1 second
      });

      const submissionData = {
        text: 'Submission at exact due date.'
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(201);

      // Should not be marked as late since it's submitted before due date
      expect(response.body.isLate).toBe(false);
    });

    test('should verify submission is stored in database correctly', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      const submissionData = {
        text: 'Database verification submission.'
      };

      const response = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(submissionData)
        .expect(201);

      // Verify submission exists in database
      const submission = await Submission.findById(response.body._id);
      expect(submission).toBeTruthy();
      expect(submission.text).toBe(submissionData.text);
      expect(submission.student.toString()).toBe(student._id.toString());
      expect(submission.assignment.toString()).toBe(assignment._id.toString());
    });
  });
});