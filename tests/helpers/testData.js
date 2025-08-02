const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const Course = require('../../models/Course');
const Assignment = require('../../models/Assignment');

let userCounter = 0;

/**
 * Reset counter (useful for test isolation)
 */
const resetCounter = () => {
  userCounter = 0;
};

/**
 * Factory function to create test users
 */
const createTestUser = async (overrides = {}) => {
  userCounter++;
  const defaultUser = {
    username: `user${userCounter}`,
    email: `user${userCounter}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'student',
    isActive: true,
    accountLocked: false,
    failedLoginAttempts: 0
  };

  const userData = { ...defaultUser, ...overrides };
  
  // The User model will hash the password automatically in pre-save middleware
  const user = new User(userData);
  return await user.save();
};

/**
 * Create admin user
 */
const createAdminUser = async (overrides = {}) => {
  return createTestUser({
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    ...overrides
  });
};

/**
 * Create instructor user
 */
const createInstructorUser = async (overrides = {}) => {
  return createTestUser({
    role: 'instructor',
    firstName: 'Instructor',
    lastName: 'User',
    ...overrides
  });
};

/**
 * Create student user
 */
const createStudentUser = async (overrides = {}) => {
  return createTestUser({
    role: 'student',
    firstName: 'Student',
    lastName: 'User',
    ...overrides
  });
};

/**
 * Create test course
 */
const createTestCourse = async (instructorId, overrides = {}) => {
  const defaultCourse = {
    title: `Test Course ${Date.now()}`,
    description: 'A test course for automated testing',
    instructor: instructorId,
    enrolledStudents: [],
    isActive: true
  };

  const courseData = { ...defaultCourse, ...overrides };
  const course = new Course(courseData);
  return await course.save();
};

/**
 * Create test assignment
 */
const createTestAssignment = async (courseId, overrides = {}) => {
  const defaultAssignment = {
    title: `Test Assignment ${Date.now()}`,
    description: 'A test assignment for automated testing',
    course: courseId,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    maxScore: 100,
    isActive: true
  };

  const assignmentData = { ...defaultAssignment, ...overrides };
  const assignment = new Assignment(assignmentData);
  return await assignment.save();
};

/**
 * Create user with password history (for testing password reuse)
 */
const createUserWithPasswordHistory = async (overrides = {}) => {
  const user = await createTestUser(overrides);
  
  // Add some password history
  const oldPasswords = [
    await bcrypt.hash('OldPassword1!', 10),
    await bcrypt.hash('OldPassword2!', 10),
    await bcrypt.hash('OldPassword3!', 10)
  ];
  
  user.passwordHistory = oldPasswords;
  return await user.save();
};

/**
 * Create locked user account (for testing account lockout)
 */
const createLockedUser = async (overrides = {}) => {
  return createTestUser({
    accountLocked: true,
    lockoutTime: new Date(),
    failedLoginAttempts: 5,
    ...overrides
  });
};

/**
 * Valid registration data
 */
const getValidRegistrationData = () => {
  userCounter++;
  const password = 'NewUserPass123!';
  return {
    username: `newuser${userCounter}`,
    email: `newuser${userCounter}@example.com`,
    password: password,
    confirmPassword: password,
    firstName: 'New',
    lastName: 'User',
    role: 'student',
    acceptTerms: true
  };
};

/**
 * Valid login credentials
 */
const getValidLoginData = (email = 'test@example.com') => ({
  email,
  password: 'TestPassword123!'
});

/**
 * Invalid data sets for testing validation
 */
const getInvalidDataSets = () => ({
  invalidEmail: {
    email: 'invalid-email',
    password: 'ValidPass123!',
    firstName: 'Test',
    lastName: 'User'
  },
  weakPassword: {
    email: 'test@example.com',
    password: '123',
    firstName: 'Test',
    lastName: 'User'
  },
  missingFields: {
    email: 'test@example.com'
    // Missing password, firstName, lastName
  },
  longInput: {
    email: 'test@example.com',
    password: 'ValidPass123!',
    firstName: 'A'.repeat(101), // Exceeds typical length limits
    lastName: 'User'
  }
});

module.exports = {
  resetCounter,
  createTestUser,
  createAdminUser,
  createInstructorUser,
  createStudentUser,
  createTestCourse,
  createTestAssignment,
  createUserWithPasswordHistory,
  createLockedUser,
  getValidRegistrationData,
  getValidLoginData,
  getInvalidDataSets
};