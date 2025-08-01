# CSSECDV Secure Web Development Case Project

## Project Overview

This project focuses on implementing comprehensive security controls in a web application, emphasizing authentication, authorization, input validation, and error handling. The application demonstrates secure development practices through a role-based access control system with three distinct user types.

## Real-World Scenario: Online Learning Management System

**Context**: A simplified Learning Management System (LMS) for a training institute where:
- **Administrators** manage the entire system
- **Instructors** (Role A) manage courses and student enrollments
- **Students** (Role B) access courses and submit assignments

**Transactions/Operations**:
- Course enrollments
- Assignment submissions
- Grade management
- User account management
- System audit logging

## User Roles and Permissions

### Administrator
- **Privileges**: Highest level system access
- **Capabilities**:
  - Create/delete/assign Instructor accounts
  - View comprehensive audit logs
  - Manage system-wide settings
  - Change passwords for all users
  - Access all system data

### Instructor (Role A)
- **Privileges**: Elevated permissions within assigned scope
- **Capabilities**:
  - Create and manage courses
  - Enroll/remove students from their courses
  - Grade assignments and manage course content
  - View student progress in their courses
  - Change own password

### Student (Role B)
- **Privileges**: Limited to personal data and assigned content
- **Capabilities**:
  - Register for new account
  - Enroll in available courses
  - Submit assignments
  - View own grades and progress
  - Change own password

## Technical Architecture

### Frontend
- **Technology**: HTML5, CSS3, JavaScript (vanilla or framework of choice)
- **Features**:
  - Responsive design
  - Role-based navigation
  - Secure form handling
  - Custom error pages

### Backend
- **Technology**: Node.js with Express.js (recommended) or similar
- **Database**: MongoDB, PostgreSQL, or MySQL
- **Features**:
  - RESTful API design
  - JWT-based authentication
  - Role-based middleware
  - Comprehensive logging system

## Security Implementation Guide

### 1. Authentication Controls

#### 1.1 Password Security
```javascript
// Example password requirements
const passwordRequirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventReuse: 5, // Last 5 passwords
  minAge: 24 // Hours before password can be changed
};
```

#### 1.2 Account Security
- Implement account lockout after 5 failed attempts
- Lock duration: 15-30 minutes (balance security vs usability)
- Store only salted, hashed passwords (bcrypt recommended)
- Generic error messages: "Invalid username and/or password"

#### 1.3 Session Management
- Secure session handling with proper timeout
- Re-authentication for critical operations
- Last login timestamp display

### 2. Authorization/Access Control

#### 2.1 Implementation Strategy
```javascript
// Middleware example for role-based access
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

// Usage
app.get('/admin/logs', authenticate, authorize(['admin']), getAuditLogs);
app.post('/courses', authenticate, authorize(['admin', 'instructor']), createCourse);
```

#### 2.2 Access Control Rules
- Default deny approach
- Single site-wide authorization component
- Business logic enforcement
- Secure failure handling

### 3. Data Validation

#### 3.1 Input Validation Strategy
```javascript
// Example validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      logValidationFailure(req, error);
      return res.status(400).json({ error: 'Invalid input data' });
    }
    next();
  };
};
```

#### 3.2 Validation Rules
- Reject invalid input (no sanitization)
- Validate data type, range, and length
- Server-side validation for all inputs
- Whitelist approach for allowed characters

### 4. Error Handling and Logging

#### 4.1 Error Handling
```javascript
// Generic error handler
const errorHandler = (err, req, res, next) => {
  // Log the actual error details
  logger.error('Application Error:', {
    error: err.message,
    stack: err.stack,
    user: req.user?.id,
    url: req.url,
    method: req.method
  });

  // Return generic error to user
  res.status(500).json({ 
    error: 'An unexpected error occurred. Please try again later.' 
  });
};
```

#### 4.2 Logging Requirements
```javascript
// Comprehensive logging system
const securityLogger = {
  logAuthAttempt: (username, success, ip) => {
    logger.info('Auth Attempt', { username, success, ip, timestamp: new Date() });
  },
  
  logAccessControl: (user, resource, success) => {
    logger.warn('Access Control', { user, resource, success, timestamp: new Date() });
  },
  
  logValidationFailure: (input, error) => {
    logger.warn('Validation Failure', { input, error, timestamp: new Date() });
  }
};
```

## Pre-Demo Setup Requirements

### Required Test Accounts
Create the following accounts before demonstration:

1. **Administrator Account**
   - Username: `admin@lms.edu`
   - Role: Administrator
   - Access: Full system privileges

2. **Instructor Account**
   - Username: `instructor@lms.edu`
   - Role: Instructor
   - Access: Course management capabilities

3. **Student Account**
   - Username: `student@lms.edu`
   - Role: Student
   - Access: Course enrollment and assignments

## Development Best Practices

### Security-First Development
1. **Threat Modeling**: Identify potential security threats early
2. **Secure Coding**: Follow OWASP guidelines
3. **Regular Testing**: Implement both unit and security tests
4. **Code Reviews**: Focus on security implications

### Database Security
```sql
-- Example: Secure user table structure
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student',
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP NULL,
  last_login TIMESTAMP NULL,
  password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Security
```javascript
// Security headers middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));
```

## Testing Security Controls

### Authentication Testing
- Test password complexity enforcement
- Verify account lockout functionality
- Test session timeout behavior
- Validate password reset security

### Authorization Testing
- Test role-based access restrictions
- Verify privilege escalation prevention
- Test direct object reference protection

### Input Validation Testing
- Test boundary conditions
- Verify injection attack prevention
- Test file upload security (if applicable)

## Deployment Considerations

### Environment Security
```javascript
// Environment configuration
const config = {
  database: {
    url: process.env.DB_URL,
    ssl: process.env.NODE_ENV === 'production'
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '1h'
  },
  session: {
    secret: process.env.SESSION_SECRET,
    secure: process.env.NODE_ENV === 'production'
  }
};
```

### Production Checklist
- [ ] Environment variables properly configured
- [ ] HTTPS enabled
- [ ] Database connections secured
- [ ] Log files properly protected
- [ ] Error messages sanitized
- [ ] Security headers implemented

## Documentation Requirements

### Code Documentation
- Comment security-critical sections
- Document authorization logic
- Explain validation rules
- Detail error handling approach

### User Documentation
- Role-specific user guides
- Security policy documentation
- Password requirements explanation
- Account recovery procedures

## Evaluation Criteria

The project will be evaluated based on the provided checklist covering:
- **Authentication** (2.1.1 - 2.1.13): 26 points
- **Authorization** (2.2.1 - 2.2.3): 6 points
- **Data Validation** (2.3.1 - 2.3.3): 6 points
- **Error Handling and Logging** (2.4.1 - 2.4.7): 14 points

**Total**: 52 points

## Getting Started

1. **Setup Development Environment**
   ```bash
   mkdir lms-secure-app
   cd lms-secure-app
   npm init -y
   npm install express bcrypt jsonwebtoken helmet morgan winston
   ```

2. **Create Project Structure**
   ```
   /src
     /controllers
     /middleware
     /models
     /routes
     /utils
   /public
   /views
   /logs
   package.json
   README.md
   ```

3. **Implement Security Controls Incrementally**
   - Start with basic authentication
   - Add role-based authorization
   - Implement input validation
   - Add comprehensive logging
   - Test each component thoroughly

4. **Prepare Demo Accounts**
   - Create required test accounts
   - Populate with sample data
   - Test all user workflows

Remember: Security is not an afterthought—it should be integrated into every aspect of the development process. Focus on implementing each security control thoroughly rather than rushing through the checklist.