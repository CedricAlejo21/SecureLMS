const request = require('supertest');
const { app } = require('../../../server');
const { connectDB, disconnectDB, clearDB, createTestUserWithToken, assertAuditLog } = require('../../helpers/testHelpers');
const { resetCounter, createTestCourse, createTestAssignment } = require('../../helpers/testData');
const Submission = require('../../../models/Submission');

describe('1.2.6 Grade Assignment by Instructor', () => {
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

  describe('Assignment Grading', () => {
    test('should allow instructor to grade student submission', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id, {
        maxScore: 100
      });

      // Create submission first
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Student submission for grading' })
        .expect(201);

      const gradeData = {
        grade: 85,
        feedback: 'Good work! Well-organized and demonstrates understanding of key concepts.'
      };

      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(gradeData)
        .expect(200);

      expect(response.body.grade).toBe(85);
      expect(response.body.feedback).toBe(gradeData.feedback);
      expect(response.body.gradedAt).toBeTruthy();
      expect(response.body.gradedBy).toBe(instructor._id.toString());
    });

    test('should allow admin to grade any submission', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      const { token: adminToken } = await createTestUserWithToken({ role: 'admin' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id, {
        maxScore: 100
      });

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Admin grading test submission' })
        .expect(201);

      const gradeData = {
        grade: 90,
        feedback: 'Admin feedback: Excellent work.'
      };

      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(gradeData)
        .expect(200);

      expect(response.body.grade).toBe(90);
      expect(response.body.feedback).toBe(gradeData.feedback);
    });

    test('should create audit log for grading', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id, {
        maxScore: 100
      });

      // Create submission
      const submissionResponse = await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Audit log grading test' })
        .expect(201);

      const gradeData = {
        grade: 75,
        feedback: 'Audit log test feedback'
      };

      await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(gradeData)
        .expect(200);

      // Verify audit log
      await assertAuditLog('GRADE_SUBMISSION', instructor._id, {
        assignmentId: assignment._id.toString(),
        studentId: student._id.toString(),
        submissionId: submissionResponse.body._id.toString(),
        grade: 75
      });
    });

    test('should populate student information in grading response', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id, {
        maxScore: 100
      });

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Population test submission' })
        .expect(201);

      const gradeData = {
        grade: 80,
        feedback: 'Population test feedback'
      };

      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(gradeData)
        .expect(200);

      expect(response.body.student).toHaveProperty('firstName');
      expect(response.body.student).toHaveProperty('lastName');
      expect(response.body.student).toHaveProperty('email');
      expect(response.body.student.firstName).toBe(student.firstName);
    });

    test('should allow grading without feedback', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id, {
        maxScore: 100
      });

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'No feedback test submission' })
        .expect(201);

      const gradeData = {
        grade: 95
        // No feedback provided
      };

      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(gradeData)
        .expect(200);

      expect(response.body.grade).toBe(95);
      expect(response.body.feedback).toBe('');
    });
  });

  describe('Input Validation', () => {
    test('should reject grading with missing grade', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Missing grade test' })
        .expect(201);

      const invalidData = {
        feedback: 'Feedback without grade'
        // Missing grade
      };

      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'grade')).toBe(true);
    });

    test('should reject grading with non-numeric grade', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Non-numeric grade test' })
        .expect(201);

      const invalidData = {
        grade: 'not-a-number',
        feedback: 'Invalid grade test'
      };

      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'grade')).toBe(true);
    });

    test('should reject grade below zero', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id, {
        maxScore: 100
      });

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Negative grade test' })
        .expect(201);

      const invalidData = {
        grade: -5,
        feedback: 'Negative grade should be rejected'
      };

      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toContain('Grade must be between 0 and');
    });

    test('should reject grade exceeding maximum assignment points', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id, {
        maxScore: 100
      });

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Excessive grade test' })
        .expect(201);

      const invalidData = {
        grade: 150, // Exceeds maxScore of 100
        feedback: 'Grade exceeding maximum should be rejected'
      };

      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toContain('Grade must be between 0 and 100');
    });

    test('should reject feedback exceeding maximum length', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Long feedback test' })
        .expect(201);

      const invalidData = {
        grade: 80,
        feedback: 'A'.repeat(1001) // Exceeds 1000 character limit
      };

      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'feedback')).toBe(true);
    });
  });

  describe('Authorization and Access Control', () => {
    test('should prevent instructor from grading submissions in other instructors courses', async () => {
      const { user: instructor1 } = await createTestUserWithToken({ role: 'instructor' });
      const { user: instructor2, token: instructor2Token } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor1._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Unauthorized grading test' })
        .expect(201);

      const gradeData = {
        grade: 85,
        feedback: 'Unauthorized instructor feedback'
      };

      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructor2Token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(gradeData)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    test('should prevent students from grading submissions', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student1, token: student1Token } = await createTestUserWithToken({ role: 'student' });
      const { user: student2, token: student2Token } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student1._id, student2._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student1._id}`)
        .set('Authorization', `Bearer ${student1Token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Student grading attempt test' })
        .expect(201);

      const gradeData = {
        grade: 100,
        feedback: 'Student trying to grade'
      };

      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student1._id}/grade`)
        .set('Authorization', `Bearer ${student2Token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(gradeData)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    test('should require authentication for grading', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Unauthenticated grading test' })
        .expect(201);

      const gradeData = {
        grade: 85,
        feedback: 'Unauthenticated grading attempt'
      };

      await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .send(gradeData)
        .expect(401);
    });

    test('should reject invalid JWT tokens for grading', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Invalid token grading test' })
        .expect(201);

      const gradeData = {
        grade: 85,
        feedback: 'Invalid token grading attempt'
      };

      await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', 'Bearer invalid-token')
        .set('User-Agent', 'Jest Test Agent')
        .send(gradeData)
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for non-existent assignment when grading', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student } = await createTestUserWithToken({ role: 'student' });
      
      const fakeId = '507f1f77bcf86cd799439011';

      const gradeData = {
        grade: 85,
        feedback: 'Grading non-existent assignment'
      };

      const response = await request(app)
        .put(`/api/submissions/${fakeId}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(gradeData)
        .expect(404);

      expect(response.body.message).toBe('Assignment not found');
    });

    test('should return 404 for non-existent submission when grading', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      // Don't create submission, try to grade non-existent submission
      const gradeData = {
        grade: 85,
        feedback: 'Grading non-existent submission'
      };

      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(gradeData)
        .expect(404);

      expect(response.body.message).toBe('Submission not found');
    });

    test('should handle malformed request body gracefully', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Malformed grading test' })
        .expect(201);

      // Send malformed JSON
      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .set('Content-Type', 'application/json')
        .send('{"invalid json"}')
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should handle invalid ObjectId format in URL', async () => {
      const { token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });

      const gradeData = {
        grade: 85,
        feedback: 'Invalid ID test'
      };

      const response = await request(app)
        .put('/api/submissions/invalid-id/also-invalid-id/grade')
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(gradeData)
        .expect(500);

      expect(response.body.message).toContain('Server error');
    });
  });

  describe('Edge Cases and Update Scenarios', () => {
    test('should allow updating existing grade', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id, {
        maxScore: 100
      });

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Grade update test submission' })
        .expect(201);

      // Initial grading
      const initialGrade = {
        grade: 70,
        feedback: 'Initial feedback'
      };

      await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(initialGrade)
        .expect(200);

      // Update grade
      const updatedGrade = {
        grade: 85,
        feedback: 'Updated feedback after review'
      };

      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(updatedGrade)
        .expect(200);

      expect(response.body.grade).toBe(85);
      expect(response.body.feedback).toBe('Updated feedback after review');
    });

    test('should handle boundary grade values correctly', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id, {
        maxScore: 100
      });

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Boundary grade test' })
        .expect(201);

      // Test minimum valid grade (0)
      const minGrade = {
        grade: 0,
        feedback: 'Minimum grade test'
      };

      let response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(minGrade)
        .expect(200);

      expect(response.body.grade).toBe(0);

      // Test maximum valid grade (maxScore)
      const maxGrade = {
        grade: 100,
        feedback: 'Maximum grade test'
      };

      response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(maxGrade)
        .expect(200);

      expect(response.body.grade).toBe(100);
    });

    test('should handle maximum length feedback correctly', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Max feedback test' })
        .expect(201);

      const gradeData = {
        grade: 88,
        feedback: 'A'.repeat(1000) // Maximum allowed length
      };

      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(gradeData)
        .expect(200);

      expect(response.body.feedback).toBe('A'.repeat(1000));
    });

    test('should verify grade is persisted in database correctly', async () => {
      const { user: instructor, token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      const assignment = await createTestAssignment(course._id);

      // Create submission
      await request(app)
        .post(`/api/submissions/${assignment._id}/${student._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send({ text: 'Database persistence test' })
        .expect(201);

      const gradeData = {
        grade: 92,
        feedback: 'Database persistence test feedback'
      };

      const response = await request(app)
        .put(`/api/submissions/${assignment._id}/${student._id}/grade`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(gradeData)
        .expect(200);

      // Verify grade exists in database
      const submission = await Submission.findById(response.body._id);
      expect(submission).toBeTruthy();
      expect(submission.grade).toBe(92);
      expect(submission.feedback).toBe('Database persistence test feedback');
      expect(submission.gradedBy.toString()).toBe(instructor._id.toString());
      expect(submission.gradedAt).toBeTruthy();
    });
  });
});