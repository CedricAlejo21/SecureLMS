const express = require('express');
const { query, validationResult } = require('express-validator');
const AuditLog = require('../models/AuditLog');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

const router = express.Router();

// Get audit logs (Admin only)
router.get('/', auth, authorize('admin'), [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('action')
    .optional()
    .isString()
    .withMessage('Action must be a string'),
  query('user')
    .optional()
    .isMongoId()
    .withMessage('User must be a valid ID'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    if (req.query.action) {
      filter.action = { $regex: req.query.action, $options: 'i' };
    }
    
    if (req.query.user) {
      filter.user = req.query.user;
    }
    
    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.timestamp.$lte = new Date(req.query.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'username firstName lastName role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter)
    ]);

    await AuditLog.log({
      user: req.user.userId,
      action: 'VIEW_AUDIT_LOGS',
      resource: '/api/audit',
      details: { 
        filters: filter,
        page,
        limit,
        total
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get audit log statistics (Admin only)
router.get('/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const [
      totalLogs,
      recentLogs,
      failedLogins,
      successfulLogins,
      topActions
    ] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      AuditLog.countDocuments({
        action: 'LOGIN_FAILED',
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      AuditLog.countDocuments({
        action: 'LOGIN_SUCCESS',
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      AuditLog.aggregate([
        {
          $match: {
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ])
    ]);

    const stats = {
      totalLogs,
      last24Hours: recentLogs,
      failedLogins,
      successfulLogins,
      topActions
    };

    await AuditLog.log({
      user: req.user.userId,
      action: 'VIEW_AUDIT_STATS',
      resource: '/api/audit/stats',
      details: stats,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json(stats);
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user activity (Admin only)
router.get('/user/:userId', auth, authorize('admin'), [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find({ user: userId })
        .populate('user', 'username firstName lastName role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments({ user: userId })
    ]);

    await AuditLog.log({
      user: req.user.userId,
      action: 'VIEW_USER_ACTIVITY',
      resource: `/api/audit/user/${userId}`,
      details: { 
        targetUserId: userId,
        page,
        limit,
        total
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get security events (Admin only)
router.get('/security', auth, authorize('admin'), [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Security-related actions
    const securityActions = [
      'LOGIN_FAILED',
      'AUTHENTICATION_FAILED',
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'PASSWORD_CHANGE_FAILED',
      'ACCOUNT_LOCKED',
      'VALIDATION_FAILURE'
    ];

    const filter = {
      $or: [
        { action: { $in: securityActions } },
        { success: false }
      ]
    };

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'username firstName lastName role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter)
    ]);

    await AuditLog.log({
      user: req.user.userId,
      action: 'VIEW_SECURITY_EVENTS',
      resource: '/api/audit/security',
      details: { 
        page,
        limit,
        total
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get security events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
