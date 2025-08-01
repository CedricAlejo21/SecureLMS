const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGIN_SUCCESS',
      'LOGOUT',
      'LOGIN_FAILED',
      'PASSWORD_CHANGE',
      'PASSWORD_CHANGED',
      'PASSWORD_CHANGE_FAILED',
      'ACCOUNT_LOCKED',
      'ACCOUNT_UNLOCKED',
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'DEACTIVATE_USER',
      'VIEW_USERS',
      'VIEW_USER_ACTIVITY',
      'VIEW_AUDIT_LOGS',
      'VIEW_AUDIT_STATS',
      'VIEW_SECURITY_EVENTS',
      'UPDATE_PROFILE',
      'ACTIVATE_USER',
      'CREATE_USER',
      'COURSE_CREATED',
      'COURSE_UPDATED',
      'COURSE_DELETED',
      'VIEW_COURSES',
      'ENROLLMENT',
      'UNENROLLMENT',
      'ASSIGNMENT_CREATED',
      'ASSIGNMENT_UPDATED',
      'ASSIGNMENT_DELETED',
      'ASSIGNMENT_SUBMITTED',
      'SUBMIT_ASSIGNMENT',
      'CREATE_ASSIGNMENT',
      'VIEW_ASSIGNMENTS',
      'VIEW_ASSIGNMENT',
      'VIEW_ASSIGNMENT_GRADES',
      'GRADE_ASSIGNED',
      'GRADE_UPDATED',
      'GRADE_SUBMISSION',
      'CREATE_GRADE',
      'UPDATE_GRADE',
      'DELETE_GRADE',
      'VIEW_GRADES',
      'VIEW_COURSE_GRADES',
      'VIEW_STUDENT_STATS',
      'AUTHENTICATION_FAILED',
      'RE_AUTHENTICATION_FAILED',
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'VALIDATION_FAILURE'
    ]
  },
  resource: {
    type: String,
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: String
});

// Indexes for performance
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// Static method to create audit log
auditLogSchema.statics.log = async function(data) {
  try {
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
