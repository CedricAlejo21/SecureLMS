const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      await AuditLog.log({
        user: null,
        action: 'AUTHENTICATION_FAILED',
        resource: req.path,
        details: { reason: 'No token provided' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false
      });
      
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        await AuditLog.log({
          user: decoded.userId,
          action: 'AUTHENTICATION_FAILED',
          resource: req.path,
          details: { reason: 'User not found' },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false
        });
        
        return res.status(401).json({ message: 'Invalid token.' });
      }

      if (!user.isActive) {
        await AuditLog.log({
          user: user._id,
          action: 'AUTHENTICATION_FAILED',
          resource: req.path,
          details: { reason: 'Account inactive' },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false
        });
        
        return res.status(401).json({ message: 'Account is inactive.' });
      }

      if (user.isLocked) {
        await AuditLog.log({
          user: user._id,
          action: 'AUTHENTICATION_FAILED',
          resource: req.path,
          details: { reason: 'Account locked' },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false
        });
        
        return res.status(401).json({ message: 'Account is locked.' });
      }

      // Check if password was changed after token was issued
      if (user.changedPasswordAfter(decoded.iat)) {
        await AuditLog.log({
          user: user._id,
          action: 'AUTHENTICATION_FAILED',
          resource: req.path,
          details: { reason: 'Password changed after token issued' },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: false
        });
        
        return res.status(401).json({ message: 'Password was changed. Please log in again.' });
      }

      req.user = {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      };
      
      next();
    } catch (jwtError) {
      await AuditLog.log({
        user: null,
        action: 'AUTHENTICATION_FAILED',
        resource: req.path,
        details: { reason: 'Invalid token format', error: jwtError.message },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false
      });
      
      return res.status(401).json({ message: 'Invalid token.' });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

module.exports = auth;
