const request = require('supertest');
const { app } = require('../../../server');
const { connectDB, disconnectDB, clearDB, createTestUserWithToken, assertAuditLog } = require('../../helpers/testHelpers');
const { resetCounter, createTestCourse, createTestAssignment } = require('../../helpers/testData');
const User = require('../../../models/User');
const bcrypt = require('bcryptjs');

describe('1.2.7 User Profile Management', () => {
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

  describe('View User Profile', () => {
    test('should allow user to view their own profile', async () => {
      const { user, token } = await createTestUserWithToken({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: 'student'
      });

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.firstName).toBe('John');
      expect(response.body.lastName).toBe('Doe');
      expect(response.body.email).toBe('john.doe@example.com');
      expect(response.body.role).toBe('student');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHistory');
    });

    test('should require authentication to view profile', async () => {
      await request(app)
        .get('/api/users/profile')
        .expect(401);
    });

    test('should reject invalid JWT tokens', async () => {
      await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .set('User-Agent', 'Jest Test Agent')
        .expect(401);
    });
  });

  describe('Update User Profile', () => {
    test('should allow user to update their profile information', async () => {
      const { user, token } = await createTestUserWithToken({
        firstName: 'Original',
        lastName: 'Name',
        email: 'original@example.com'
      });

      const updateData = {
        firstName: 'Updated',
        lastName: 'NewName',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe('Updated');
      expect(response.body.lastName).toBe('NewName');
      expect(response.body.email).toBe('updated@example.com');
      expect(response.body).not.toHaveProperty('password');
    });

    test('should create audit log for profile update', async () => {
      const { user, token } = await createTestUserWithToken();

      const updateData = {
        firstName: 'Audit',
        lastName: 'Test',
        email: 'audit@example.com'
      };

      await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(updateData)
        .expect(200);

      // Verify audit log
      await assertAuditLog('UPDATE_PROFILE', user._id, {
        updatedFields: ['firstName', 'lastName', 'email']
      });
    });

    test('should normalize email addresses', async () => {
      const { token } = await createTestUserWithToken();

      const updateData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'Test.Email@EXAMPLE.COM' // Test without + sign since model doesn't allow it
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(updateData)
        .expect(200);

      expect(response.body.email).toBe('test.email@example.com');
    });

    test('should validate required fields', async () => {
      const { token } = await createTestUserWithToken();

      const invalidData = {
        firstName: '',
        lastName: 'Valid',
        email: 'valid@example.com'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'firstName')).toBe(true);
    });

    test('should validate email format', async () => {
      const { token } = await createTestUserWithToken();

      const invalidData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'email')).toBe(true);
    });

    test('should prevent using email already taken by another user', async () => {
      const { user: user1 } = await createTestUserWithToken({
        email: 'existing@example.com'
      });
      const { token: user2Token } = await createTestUserWithToken({
        email: 'different@example.com'
      });

      const updateData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'existing@example.com' // Try to use user1's email
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${user2Token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('Email is already in use');
    });

    test('should allow user to keep their current email', async () => {
      const { token } = await createTestUserWithToken({
        email: 'current@example.com'
      });

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        email: 'current@example.com' // Same email
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(updateData)
        .expect(200);

      expect(response.body.email).toBe('current@example.com');
    });

    test('should validate field length limits', async () => {
      const { token } = await createTestUserWithToken();

      const invalidData = {
        firstName: 'A'.repeat(51), // Exceeds 50 character limit
        lastName: 'Valid',
        email: 'valid@example.com'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'firstName')).toBe(true);
    });

    test('should require authentication for profile update', async () => {
      const updateData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
      };

      await request(app)
        .put('/api/users/profile')
        .send(updateData)
        .expect(401);
    });
  });

  describe('Change Password', () => {
    test('should allow user to change password with valid current password', async () => {
      const { user, token } = await createTestUserWithToken({
        password: 'CurrentPass123!'
      });

      const passwordData = {
        currentPassword: 'CurrentPass123!',
        newPassword: 'NewSecurePass456@',
        confirmPassword: 'NewSecurePass456@'
      };

      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(passwordData)
        .expect(200);

      expect(response.body.message).toContain('Password changed successfully');
    });

    test('should create audit log for successful password change', async () => {
      const { user, token } = await createTestUserWithToken({
        password: 'CurrentPass123!'
      });

      const passwordData = {
        currentPassword: 'CurrentPass123!',
        newPassword: 'NewSecurePass456@',
        confirmPassword: 'NewSecurePass456@'
      };

      await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(passwordData)
        .expect(200);

      // Verify audit log
      await assertAuditLog('PASSWORD_CHANGED', user._id);
    });

    test('should reject incorrect current password', async () => {
      const { user, token } = await createTestUserWithToken({
        password: 'CurrentPass123!'
      });

      const passwordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewSecurePass456@',
        confirmPassword: 'NewSecurePass456@'
      };

      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(passwordData)
        .expect(400);

      expect(response.body.message).toContain('Current password is incorrect');
    });

    test('should create audit log for failed password change', async () => {
      const { user, token } = await createTestUserWithToken({
        password: 'CurrentPass123!'
      });

      const passwordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewSecurePass456@',
        confirmPassword: 'NewSecurePass456@'
      };

      await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(passwordData)
        .expect(400);

      // Verify audit log for failure
      await assertAuditLog('PASSWORD_CHANGE_FAILED', user._id, {
        reason: 'Invalid current password'
      });
    });

    test('should prevent password reuse', async () => {
      const currentPassword = 'CurrentPass123!';
      
      // Create user with password history
      const { user, token } = await createTestUserWithToken({
        password: currentPassword
      });

      // Try to change to the same password
      const passwordData = {
        currentPassword: currentPassword,
        newPassword: currentPassword, // Same as current
        confirmPassword: currentPassword
      };

      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(passwordData)
        .expect(400);

      expect(response.body.message).toContain('Cannot reuse recent passwords');
    });

    test('should create audit log for password reuse attempt', async () => {
      const currentPassword = 'CurrentPass123!';
      const { user, token } = await createTestUserWithToken({
        password: currentPassword
      });

      const passwordData = {
        currentPassword: currentPassword,
        newPassword: currentPassword,
        confirmPassword: currentPassword
      };

      await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(passwordData)
        .expect(400);

      // Verify audit log for password reuse
      await assertAuditLog('PASSWORD_CHANGE_FAILED', user._id, {
        reason: 'Password reuse detected'
      });
    });

    test('should validate password complexity requirements', async () => {
      const { token } = await createTestUserWithToken({
        password: 'CurrentPass123!'
      });

      const passwordData = {
        currentPassword: 'CurrentPass123!',
        newPassword: 'weak', // Too weak
        confirmPassword: 'weak'
      };

      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(passwordData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'newPassword')).toBe(true);
    });

    test('should require password confirmation to match', async () => {
      const { token } = await createTestUserWithToken({
        password: 'CurrentPass123!'
      });

      const passwordData = {
        currentPassword: 'CurrentPass123!',
        newPassword: 'NewSecurePass456@',
        confirmPassword: 'DifferentPassword789#'
      };

      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(passwordData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.path === 'confirmPassword')).toBe(true);
    });

    test('should validate required fields for password change', async () => {
      const { token } = await createTestUserWithToken();

      const invalidData = {
        // Missing all required fields
      };

      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('should require authentication for password change', async () => {
      const passwordData = {
        currentPassword: 'CurrentPass123!',
        newPassword: 'NewSecurePass456@',
        confirmPassword: 'NewSecurePass456@'
      };

      await request(app)
        .put('/api/users/change-password')
        .send(passwordData)
        .expect(401);
    });

    test('should verify password is actually changed in database', async () => {
      const currentPassword = 'CurrentPass123!';
      const newPassword = 'NewSecurePass456@';
      
      const { user, token } = await createTestUserWithToken({
        password: currentPassword
      });

      const passwordData = {
        currentPassword: currentPassword,
        newPassword: newPassword,
        confirmPassword: newPassword
      };

      await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(passwordData)
        .expect(200);

      // Verify password was changed in database
      const updatedUser = await User.findById(user._id).select('+password');
      const isNewPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
      const isOldPasswordInvalid = !(await bcrypt.compare(currentPassword, updatedUser.password));
      
      expect(isNewPasswordValid).toBe(true);
      expect(isOldPasswordInvalid).toBe(true);
    });
  });

  describe('Student Statistics', () => {
    test('should allow student to view their statistics', async () => {
      const { user: instructor } = await createTestUserWithToken({ role: 'instructor' });
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });
      
      // Create course with student enrolled
      const course = await createTestCourse(instructor._id, {
        students: [student._id]
      });
      
      // Create assignment
      await createTestAssignment(course._id);

      const response = await request(app)
        .get('/api/users/students/stats')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body).toHaveProperty('enrolledCourses');
      expect(response.body).toHaveProperty('pendingAssignments');
      expect(response.body).toHaveProperty('completedAssignments');
      expect(response.body).toHaveProperty('averageGrade');
      
      expect(response.body.enrolledCourses).toBe(1);
      expect(response.body.pendingAssignments).toBe(1);
      expect(response.body.completedAssignments).toBe(0);
      expect(response.body.averageGrade).toBe(0);
    });

    test('should create audit log for viewing student statistics', async () => {
      const { user: student, token: studentToken } = await createTestUserWithToken({ role: 'student' });

      await request(app)
        .get('/api/users/students/stats')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      // Verify audit log
      await assertAuditLog('VIEW_STUDENT_STATS', student._id);
    });

    test('should deny access to instructors', async () => {
      const { token: instructorToken } = await createTestUserWithToken({ role: 'instructor' });

      const response = await request(app)
        .get('/api/users/students/stats')
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(403);

      expect(response.body.message).toContain('Students only');
    });

    test('should deny access to admins', async () => {
      const { token: adminToken } = await createTestUserWithToken({ role: 'admin' });

      const response = await request(app)
        .get('/api/users/students/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(403);

      expect(response.body.message).toContain('Students only');
    });

    test('should require authentication for student statistics', async () => {
      await request(app)
        .get('/api/users/students/stats')
        .expect(401);
    });

    test('should return correct statistics for student with no enrollments', async () => {
      const { token: studentToken } = await createTestUserWithToken({ role: 'student' });

      const response = await request(app)
        .get('/api/users/students/stats')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('User-Agent', 'Jest Test Agent')
        .expect(200);

      expect(response.body.enrolledCourses).toBe(0);
      expect(response.body.pendingAssignments).toBe(0);
      expect(response.body.completedAssignments).toBe(0);
      expect(response.body.averageGrade).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed request body gracefully for profile update', async () => {
      const { token } = await createTestUserWithToken();

      // Send malformed JSON
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .set('Content-Type', 'application/json')
        .send('{"invalid json"}')
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should handle malformed request body gracefully for password change', async () => {
      const { token } = await createTestUserWithToken();

      // Send malformed JSON
      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .set('Content-Type', 'application/json')
        .send('{"invalid json"}')
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    test('should handle profile update with maximum valid field lengths', async () => {
      const { token } = await createTestUserWithToken();

      const updateData = {
        firstName: 'A'.repeat(50), // Maximum allowed length
        lastName: 'B'.repeat(50),   // Maximum allowed length
        email: 'max@example.com'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe('A'.repeat(50));
      expect(response.body.lastName).toBe('B'.repeat(50));
    });

    test('should handle password change with minimal valid password', async () => {
      const { token } = await createTestUserWithToken({
        password: 'CurrentPass123!'
      });

      const passwordData = {
        currentPassword: 'CurrentPass123!',
        newPassword: 'MinPass123!@', // Minimal valid password (12 chars with complexity)
        confirmPassword: 'MinPass123!@'
      };

      const response = await request(app)
        .put('/api/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(passwordData)
        .expect(200);

      expect(response.body.message).toContain('Password changed successfully');
    });

    test('should persist profile changes in database', async () => {
      const { user, token } = await createTestUserWithToken();

      const updateData = {
        firstName: 'DatabaseTest',
        lastName: 'Verification',
        email: 'dbtest@example.com'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .set('User-Agent', 'Jest Test Agent')
        .send(updateData)
        .expect(200);

      // Verify changes were persisted in database
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.firstName).toBe('DatabaseTest');
      expect(updatedUser.lastName).toBe('Verification');
      expect(updatedUser.email).toBe('dbtest@example.com');
    });
  });
});