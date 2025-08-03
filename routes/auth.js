const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { auth, reAuth } = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

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
