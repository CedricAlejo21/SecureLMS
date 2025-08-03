const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { auth, reAuth } = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const { 
  securityQuestions, 
  getRandomQuestions, 
  getQuestionById, 
  validateAnswer,
  securityGuidelines 
} = require('../config/securityQuestions');

const router = express.Router();

// Register user with comprehensive security validation
router.post('/register', [
  // Username validation with security requirements
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores')
    .custom(async (value) => {
      // Check for reserved usernames
      const reservedUsernames = ['admin', 'administrator', 'root', 'system', 'api', 'test', 'demo', 'guest'];
      if (reservedUsernames.includes(value.toLowerCase())) {
        throw new Error('Username is reserved and cannot be used');
      }
      return true;
    }),

  // Email validation with security requirements
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
    .custom(async (value) => {
      // Check for disposable email domains (basic list)
      const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com'];
      const domain = value.split('@')[1];
      if (disposableDomains.includes(domain)) {
        throw new Error('Disposable email addresses are not allowed');
      }
      return true;
    }),

  // Enhanced password validation with comprehensive security requirements
  body('password')
    .isLength({ min: 12, max: 128 })
    .withMessage('Password must be between 12-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'g')
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)')
    .custom((value) => {
      // Check for common weak passwords
      const commonPasswords = [
        'password123!', 'Password123!', 'Admin123456!', 'Welcome123!',
        'Qwerty123456!', '123456789!', 'Password1!', 'Admin1234!'
      ];
      if (commonPasswords.includes(value)) {
        throw new Error('Password is too common. Please choose a more secure password');
      }

      // Check for sequential characters
      if (/123456|abcdef|qwerty/i.test(value)) {
        throw new Error('Password cannot contain sequential characters');
      }

      return true;
    }),

  // Confirm password validation
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),

  // Name validation with security sanitization
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('First name must be 1-50 characters and contain only letters, spaces, hyphens, and apostrophes')
    .trim()
    .escape(),

  body('lastName')
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Last name must be 1-50 characters and contain only letters, spaces, hyphens, and apostrophes')
    .trim()
    .escape(),

  // Role validation with security restrictions
  body('role')
    .isIn(['student', 'instructor'])
    .withMessage('Role must be either student or instructor')
    .custom((value) => {
      // Additional role-based restrictions can be added here
      return true;
    }),

  // Terms of service acceptance
  body('acceptTerms')
    .isBoolean()
    .custom((value) => value === true)
    .withMessage('You must accept the terms of service'),

  // Privacy policy acceptance
  body('acceptPrivacy')
    .optional()
    .isBoolean()
    .custom((value) => value === true)
    .withMessage('You must accept the privacy policy')

], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or username' });
    }

    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role
    });

    await user.save();

    // Log registration
    await AuditLog.log({
      user: user._id,
      action: 'USER_CREATED',
      resource: 'User',
      resourceId: user._id,
      details: { username, email, role },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation failed', details: error.message });
    } else if (error.code === 11000) {
      res.status(400).json({ message: 'Username or email already exists' });
    } else {
      res.status(500).json({ message: 'Server error during registration', details: error.message });
    }
  }
});

// Login user
router.post('/login', [
  body('username')
    .notEmpty()
    .withMessage('Username or email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Find user first (separate from password validation)
    const user = await User.findOne({
      $or: [{ email: username }, { username: username }]
    }).select('+password');
    
    // If user doesn't exist, return generic error
    if (!user) {
      // Log failed login attempt for non-existent user
      await AuditLog.log({
        user: null,
        action: 'LOGIN_FAILED',
        resource: 'Auth',
        details: { username },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'Invalid credentials'
      });
      
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Check if account is locked first
    if (user.isLocked) {
      await AuditLog.log({
        user: user._id,
        action: 'LOGIN_FAILED',
        resource: 'Auth',
        details: { username, reason: 'Account locked' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'Account locked'
      });
      
      return res.status(423).json({ 
        message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later or contact support.' 
      });
    }

    // Validate password for existing user
    const isPasswordCorrect = await user.correctPassword(password);
    if (!isPasswordCorrect) {
      // Increment failed login attempts for existing user with wrong password
      await user.incLoginAttempts();
      
      // Log failed login attempt for existing user
      await AuditLog.log({
        user: user._id,
        action: 'LOGIN_FAILED',
        resource: 'Auth',
        details: { username },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'Invalid credentials'
      });
      
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Reset failed login attempts
    user.failedLoginAttempts = 0;
    user.accountLocked = false;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log successful login
    await AuditLog.log({
      user: user._id,
      action: 'LOGIN',
      resource: 'Auth',
      details: { username: user.username },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.post('/change-password', [
  reAuth,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 12 })
    .withMessage('New password must be at least 12 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId).select('+password');

    // Check password minimum age (24 hours)
    if (!user.canChangePassword()) {
      return res.status(400).json({ 
        message: 'Password cannot be changed within 24 hours of the last change' 
      });
    }

    // Verify current password
    const isMatch = await user.correctPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Check if new password is same as current
    const isSamePassword = await user.correctPassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    // Check password history
    let isInHistory = false;
    for (const oldPassword of user.passwordHistory) {
      const matches = await bcrypt.compare(newPassword, oldPassword.password);
      if (matches) {
        isInHistory = true;
        break;
      }
    }

    if (isInHistory) {
      return res.status(400).json({ message: 'New password cannot be the same as any of your last 5 passwords' });
    }

    user.password = newPassword;
    await user.save();

    // Log password change
    await AuditLog.log({
      user: user._id,
      action: 'PASSWORD_CHANGE',
      resource: 'User',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

// Get available security questions
router.get('/security-questions', (req, res) => {
  try {
    // Return questions without answers for security
    const questions = securityQuestions.map(q => ({
      id: q.id,
      question: q.question,
      category: q.category,
      guidance: q.guidance
    }));
    
    res.json({
      questions,
      guidelines: securityGuidelines
    });
  } catch (error) {
    console.error('Get security questions error:', error);
    res.status(500).json({ message: 'Server error retrieving security questions' });
  }
});

// Set security questions (for new users or updates)
router.post('/security-questions', [
  auth,
  body('questions')
    .isArray({ min: 3, max: 3 })
    .withMessage('Exactly 3 security questions are required'),
  body('questions.*.questionId')
    .notEmpty()
    .withMessage('Question ID is required'),
  body('questions.*.answer')
    .isLength({ min: 1, max: 100 })
    .withMessage('Answer must be between 1-100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { questions } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate each question and answer
    for (const q of questions) {
      const questionConfig = getQuestionById(q.questionId);
      if (!questionConfig) {
        return res.status(400).json({ message: `Invalid question ID: ${q.questionId}` });
      }

      const validation = validateAnswer(q.questionId, q.answer);
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: `Invalid answer for question "${questionConfig.question}": ${validation.error}` 
        });
      }
    }

    // Check for duplicate questions
    const questionIds = questions.map(q => q.questionId);
    if (new Set(questionIds).size !== questionIds.length) {
      return res.status(400).json({ message: 'Duplicate questions are not allowed' });
    }

    // Set security questions
    await user.setSecurityQuestions(questions);
    await user.save();

    // Log security questions setup
    await AuditLog.log({
      user: user._id,
      action: 'SECURITY_QUESTIONS_SET',
      resource: 'User',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Security questions set successfully' });
  } catch (error) {
    console.error('Set security questions error:', error);
    res.status(500).json({ message: 'Server error setting security questions' });
  }
});

// Initiate password reset - verify user and return their security questions
router.post('/password-reset/initiate', [
  body('identifier')
    .notEmpty()
    .withMessage('Email or username is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier } = req.body;
    
    // Find user by email or username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
      isActive: true
    }).select('+securityQuestions +securityQuestions.answer');

    // Always return success to prevent user enumeration
    if (!user || !user.securityQuestions || user.securityQuestions.length === 0) {
      return res.json({ 
        message: 'If the account exists and has security questions set up, they will be displayed.',
        hasQuestions: false
      });
    }

    // Return user's security questions (without answers)
    const userQuestions = user.securityQuestions.map(sq => {
      const questionConfig = getQuestionById(sq.questionId);
      return {
        questionId: sq.questionId,
        question: questionConfig ? questionConfig.question : 'Question not found',
        guidance: questionConfig ? questionConfig.guidance : ''
      };
    });

    // Log password reset initiation
    await AuditLog.log({
      user: user._id,
      action: 'PASSWORD_RESET_INITIATED',
      resource: 'User',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Security questions retrieved successfully',
      hasQuestions: true,
      questions: userQuestions,
      userId: user._id // Needed for the next step
    });
  } catch (error) {
    console.error('Password reset initiate error:', error);
    res.status(500).json({ message: 'Server error during password reset initiation' });
  }
});

// Verify security questions and generate reset token
router.post('/password-reset/verify', [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Security question answers are required'),
  body('answers.*.questionId')
    .notEmpty()
    .withMessage('Question ID is required'),
  body('answers.*.answer')
    .notEmpty()
    .withMessage('Answer is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, answers } = req.body;
    
    const user = await User.findById(userId).select('+securityQuestions +securityQuestions.answer');
    if (!user || !user.isActive) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    // Debug logging
    // Verify all security question answers
    let correctAnswers = 0;
    for (const answer of answers) {
      const isCorrect = await user.verifySecurityAnswer(answer.questionId, answer.answer);
      if (isCorrect) {
        correctAnswers++;
      }
    }

    // Require all answers to be correct
    if (correctAnswers !== user.securityQuestions.length || correctAnswers !== answers.length) {
      // Log failed attempt
      await AuditLog.log({
        user: user._id,
        action: 'PASSWORD_RESET_FAILED',
        resource: 'User',
        resourceId: user._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        details: 'Incorrect security question answers'
      });

      return res.status(400).json({ message: 'Security question answers are incorrect' });
    }

    // Generate password reset token
    const resetToken = user.createPasswordResetToken();
    await user.save();

    // Log successful verification
    await AuditLog.log({
      user: user._id,
      action: 'PASSWORD_RESET_VERIFIED',
      resource: 'User',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Security questions verified successfully',
      resetToken,
      expiresIn: '10 minutes'
    });
  } catch (error) {
    console.error('Password reset verify error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// Complete password reset with new password
router.post('/password-reset/complete', [
  body('resetToken')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 12, max: 128 })
    .withMessage('Password must be between 12-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'g')
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { resetToken, newPassword } = req.body;
    
    // Hash the token to compare with stored version
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
      isActive: true
    }).select('+password +passwordHistory');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Check if new password is same as current
    const isSamePassword = await user.correctPassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    // Check password history
    let isInHistory = false;
    for (const oldPassword of user.passwordHistory) {
      const matches = await bcrypt.compare(newPassword, oldPassword.password);
      if (matches) {
        isInHistory = true;
        break;
      }
    }

    if (isInHistory) {
      return res.status(400).json({ message: 'New password cannot be the same as any of your last 5 passwords' });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.accountLocked = false;
    user.lockUntil = undefined;
    
    await user.save();

    // Log successful password reset
    await AuditLog.log({
      user: user._id,
      action: 'PASSWORD_RESET_COMPLETED',
      resource: 'User',
      resourceId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset complete error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// Logout user
router.post('/logout', auth, async (req, res) => {
  try {
    // Log logout
    await AuditLog.log({
      user: req.user.userId,
      action: 'LOGOUT',
      resource: 'Auth',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

module.exports = router;
