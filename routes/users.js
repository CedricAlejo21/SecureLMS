const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({}, '-password -passwordHistory');
    
    await AuditLog.log({
      user: req.user.userId,
      action: 'VIEW_USERS',
      resource: '/api/users',
      details: { count: users.length },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -passwordHistory');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email } = req.body;
    
    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.user.userId } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { firstName, lastName, email, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password -passwordHistory');

    await AuditLog.log({
      user: req.user.userId,
      action: 'UPDATE_PROFILE',
      resource: '/api/users/profile',
      details: { updatedFields: ['firstName', 'lastName', 'email'] },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/change-password', auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 12 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 12 characters and contain uppercase, lowercase, number, and special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.userId).select('+password');
    
    // Verify current password
    const isCurrentPasswordValid = await user.correctPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      await AuditLog.log({
        user: req.user.userId,
        action: 'PASSWORD_CHANGE_FAILED',
        resource: '/api/users/change-password',
        details: { reason: 'Invalid current password' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false
      });
      
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Check if new password was used recently
    const isPasswordReused = user.passwordHistory.some(
      historyEntry => bcrypt.compareSync(newPassword, historyEntry.password)
    );
    
    if (isPasswordReused) {
      await AuditLog.log({
        user: req.user.userId,
        action: 'PASSWORD_CHANGE_FAILED',
        resource: '/api/users/change-password',
        details: { reason: 'Password reuse detected' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false
      });
      
      return res.status(400).json({ message: 'Cannot reuse recent passwords' });
    }

    user.password = newPassword;
    await user.save();

    await AuditLog.log({
      user: req.user.userId,
      action: 'PASSWORD_CHANGED',
      resource: '/api/users/change-password',
      details: { timestamp: new Date() },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user (Admin only)
router.post('/', auth, authorize('admin'), [
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters'),
  body('firstName')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('role')
    .isIn(['admin', 'instructor', 'student'])
    .withMessage('Role must be admin, instructor, or student')
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

    await AuditLog.log({
      user: req.user.userId,
      action: 'CREATE_USER',
      resource: '/api/users',
      details: { 
        createdUserId: user._id,
        username: user.username,
        role: user.role 
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.passwordHistory;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deactivate user (Admin only)
router.put('/:id/deactivate', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    ).select('-password -passwordHistory');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await AuditLog.log({
      user: req.user.userId,
      action: 'DEACTIVATE_USER',
      resource: `/api/users/${req.params.id}/deactivate`,
      details: { deactivatedUserId: user._id, username: user.username },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json(user);
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Activate user (Admin only)
router.put('/:id/activate', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true, updatedAt: Date.now() },
      { new: true }
    ).select('-password -passwordHistory');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await AuditLog.log({
      user: req.user.userId,
      action: 'ACTIVATE_USER',
      resource: `/api/users/${req.params.id}/activate`,
      details: { activatedUserId: user._id, username: user.username },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json(user);
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
