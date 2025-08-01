const AuditLog = require('../models/AuditLog');

const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        await AuditLog.log({
          user: null,
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          resource: req.path,
          details: { reason: 'No authenticated user' },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false
        });
        
        return res.status(401).json({ message: 'Access denied. Authentication required.' });
      }

      if (!roles.includes(req.user.role)) {
        await AuditLog.log({
          user: req.user.userId,
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          resource: req.path,
          details: { 
            reason: 'Insufficient privileges',
            requiredRoles: roles,
            userRole: req.user.role
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false
        });
        
        return res.status(403).json({ 
          message: 'Access denied. Insufficient privileges.' 
        });
      }

      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({ message: 'Server error during authorization' });
    }
  };
};

// Specific role checks
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    AuditLog.log({
      user: req.user?.userId || null,
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      resource: req.path,
      details: { reason: 'Admin privileges required' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false
    });
    
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

const isInstructor = (req, res, next) => {
  if (req.user && (req.user.role === 'instructor' || req.user.role === 'admin')) {
    next();
  } else {
    AuditLog.log({
      user: req.user?.userId || null,
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      resource: req.path,
      details: { reason: 'Instructor privileges required' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false
    });
    
    res.status(403).json({ message: 'Access denied. Instructor privileges required.' });
  }
};

const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    AuditLog.log({
      user: req.user?.userId || null,
      action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      resource: req.path,
      details: { reason: 'Student privileges required' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false
    });
    
    res.status(403).json({ message: 'Access denied. Student privileges required.' });
  }
};

// Check if user owns the resource or is admin
const isOwnerOrAdmin = (resourceUserId) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') {
        next();
      } else if (req.user.userId === resourceUserId) {
        next();
      } else {
        await AuditLog.log({
          user: req.user.userId,
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          resource: req.path,
          details: { 
            reason: 'Not resource owner and not admin',
            resourceUserId,
            userId: req.user.userId
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false
        });
        
        res.status(403).json({ message: 'Access denied. You can only access your own resources.' });
      }
    } catch (error) {
      console.error('Owner check error:', error);
      res.status(500).json({ message: 'Server error during authorization' });
    }
  };
};

module.exports = {
  authorize,
  isAdmin,
  isInstructor,
  isStudent,
  isOwnerOrAdmin
};
