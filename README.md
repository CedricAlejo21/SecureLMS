# 🔐 Secure Learning Management System (LMS)

A comprehensive, security-focused Learning Management System built with modern web technologies and implementing industry-standard security practices.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Security Features](#security-features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Demo Accounts](#demo-accounts)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Additional Resources](#additional-resources)

## 🎯 Overview

This Secure LMS is designed for educational institutions requiring robust security controls. It implements comprehensive authentication, authorization, input validation, and audit logging following OWASP security guidelines.

### Key Features
- **Role-based Access Control** (Admin, Instructor, Student)
- **Secure Password Reset** with randomized security questions
- **Comprehensive Security Controls** (Password policies, account lockout, audit logging)
- **Modern UI/UX** with responsive Tailwind CSS design
- **RESTful API** with comprehensive validation
- **Real-time Security Monitoring** and audit trails
- **Complete Grades Management** with role-based permissions
- **Admin Dashboard** for user and course management

## 🔒 Security Features

- **Password Security**: Strong password requirements (12+ chars, complexity rules)
- **Secure Password Reset**: Multi-step reset process with randomized security questions
- **Account Protection**: Failed login attempt tracking and account lockout
- **Session Management**: JWT-based authentication with secure token handling
- **Input Validation**: Comprehensive server-side validation using express-validator
- **SQL Injection Prevention**: MongoDB with Mongoose ODM and input sanitization
- **XSS Protection**: Helmet.js security headers and input sanitization
- **CSRF Protection**: SameSite cookies and CORS configuration
- **Rate Limiting**: API endpoint protection against brute force attacks
- **Audit Logging**: Comprehensive activity tracking and security event logging
- **Role-based Authorization**: Granular permissions based on user roles
- **Data Encryption**: Secure password hashing with bcrypt
- **Security Headers**: Comprehensive HTTP security headers via Helmet

## 🆕 Recent Updates & New Features

### Secure Password Reset System
- **10 Carefully Crafted Security Questions**: Designed to generate sufficiently random, hard-to-guess answers
- **Multi-Step Reset Process**: 
  1. Account identification (username/email)
  2. Security question verification (all questions must be answered correctly)
  3. New password creation with strength validation
  4. Success confirmation
- **Security Question Categories**:
  - Personal History (childhood addresses, phone numbers)
  - Education (graduation years, school details)
  - Work History (first job details, workplace information)
- **Enhanced Security Features**:
  - 10-minute token expiration with countdown timer
  - User enumeration protection
  - Comprehensive audit logging
  - Answer normalization (case-insensitive, trimmed)
  - Password history validation (prevents reuse of last 5 passwords)

### Modern UI/UX Improvements
- **Tailwind CSS Integration**: Complete redesign with modern, spacious styling
- **Consistent Design System**: All components now follow unified design patterns
- **Enhanced User Experience**:
  - Password Reset: Clean 4-step flow with progress indicators
  - Security Questions Setup: Spacious form with real-time validation
  - Responsive design across all screen sizes
  - Improved accessibility with proper focus states

### Authentication System Fixes
- **Fixed Student Grades Access**: Corrected API endpoint mismatch in auth store
- **Improved User Profile Loading**: Fixed `/users/profile` endpoint integration
- **Enhanced Error Handling**: Better error messages and user feedback

### Admin Dashboard Enhancements
- **Complete User Management**: Create, activate/deactivate, and delete users
- **Course Management**: Full CRUD operations for courses
- **Safety Checks**: Prevents admins from deleting themselves or users with active dependencies
- **Real-time Statistics**: User counts, course enrollment data
- **Confirmation Modals**: Safety prompts for destructive actions

### Grades System Improvements
- **Role-based Access Control**: 
  - Students: View their own grades only
  - Instructors: Manage grades for their courses
  - Admins: Full access to all grades
- **Enhanced Grade Display**: Color-coded letter grades (A+, A, B+, etc.)
- **Complete CRUD Operations**: Create, read, update, delete grades
- **Field Consistency**: Fixed `maxPoints` to `maxScore` across backend and frontend
- **Improved User Experience**: Better forms, validation, and feedback

### Code Quality & Maintenance
- **Debug Log Cleanup**: Removed development debug statements from production code
- **Consistent Error Handling**: Standardized error responses across all endpoints
- **Enhanced Validation**: Improved input validation and sanitization
- **Performance Optimizations**: Reduced unnecessary API calls and improved data fetching

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js (v16+ recommended)
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston

### Frontend
- **Framework**: Vue.js 3.3.4
- **Build Tool**: Vite 4.4.9
- **State Management**: Pinia 2.1.6
- **Routing**: Vue Router 4.2.4
- **HTTP Client**: Axios 1.5.0
- **UI Components**: Headless UI, Heroicons
- **Styling**: Tailwind CSS 3.3.3
- **Form Validation**: VeeValidate 4.11.8

### Development Tools
- **Process Manager**: Nodemon
- **Concurrent Tasks**: Concurrently
- **Testing**: Jest, Supertest
- **Linting**: ESLint
- **Code Formatting**: Prettier

## 🏃‍♂️ Running the Application

### Development Mode

### Setup Demo Data
```bash
npm run setup-demo

#### Option 1: Run Backend and Frontend Separately
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

#### Option 2: Run Concurrently
```bash
npm run dev-concurrent
```

### Production Mode

#### 1. Build Frontend
```bash
npm run build
```

#### 2. Start Production Server
```bash
npm start
```


```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api

## 👥 Demo Accounts

The system includes pre-configured demo accounts for testing:

| Role | Username | Email | Password |
|------|----------|-------|----------|
| **Admin** | `admin` | `admin@lms.edu` | `AdminSecure123!` |
| **Instructor** | `instructor1` | `instructor@lms.edu` | `InstructorPass123!` |
| **Student** | `student1` | `student@lms.edu` | `StudentAccess123!` |

### Role Capabilities

**Administrator:**
- Full system access and user management
- View comprehensive audit logs
- Create/delete instructor accounts
- System-wide settings management

**Instructor:**
- Create and manage courses
- Enroll/remove students from courses
- Create assignments and grade submissions
- View student progress in their courses

**Student:**
- Register for new account
- Enroll in available courses
- Submit assignments
- View grades and progress

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register    - Register new user
POST /api/auth/login       - User login
GET  /api/auth/me          - Get current user
POST /api/auth/logout      - User logout
POST /api/auth/change-password - Change password (requires re-auth)
```

### User Management (Admin only)
```
GET    /api/users          - List all users
GET    /api/users/:id      - Get user by ID
POST   /api/users          - Create new user
PUT    /api/users/:id      - Update user
PUT    /api/users/:id/activate - Activate user account
```

### Course Management
```
GET    /api/courses        - List courses (role-filtered)
GET    /api/courses/:id    - Get course details
POST   /api/courses        - Create course (Instructor/Admin)
PUT    /api/courses/:id    - Update course (Instructor/Admin)
POST   /api/courses/:id/enroll - Enroll in course (Student)
DELETE /api/courses/:id/unenroll - Unenroll from course
```

### Assignment Management
```
GET    /api/assignments/course/:courseId - Get course assignments
GET    /api/assignments/:id - Get assignment details
POST   /api/assignments    - Create assignment (Instructor/Admin)
PUT    /api/assignments/:id - Update assignment (Instructor/Admin)
DELETE /api/assignments/:id - Delete assignment (Instructor/Admin)
```

### Grade Management
```
GET    /api/grades/student/:studentId - Get student grades
GET    /api/grades/assignment/:assignmentId - Get assignment grades
POST   /api/grades         - Create/update grade (Instructor/Admin)
```

### Audit Logging (Admin only)
```
GET    /api/audit          - Get audit logs
GET    /api/audit/user/:userId - Get user activity
GET    /api/audit/security - Get security events
```

## 📁 Project Structure

```
CSSECDV-FINAL-PROJ/
├── client/                 # Vue.js frontend
│   ├── src/
│   │   ├── components/     # Reusable Vue components
│   │   ├── views/          # Page components
│   │   ├── stores/         # Pinia state management
│   │   ├── router/         # Vue Router configuration
│   │   └── assets/         # Static assets
│   ├── public/             # Public assets
│   └── package.json        # Frontend dependencies
├── middleware/             # Express middleware
│   ├── auth.js            # Authentication middleware
│   └── roleAuth.js        # Authorization middleware
├── models/                 # MongoDB models
│   ├── User.js            # User model with security features
│   ├── Course.js          # Course model
│   ├── Assignment.js      # Assignment model
│   ├── Grade.js           # Grade model
│   └── AuditLog.js        # Audit logging model
├── routes/                 # API routes
│   ├── auth.js            # Authentication routes
│   ├── users.js           # User management routes
│   ├── courses.js         # Course management routes
│   ├── assignments.js     # Assignment routes
│   ├── grades.js          # Grade management routes
│   └── audit.js           # Audit log routes
├── logs/                   # Application logs
├── server.js              # Express server entry point
├── setup-demo-data.js     # Demo data setup script
├── package.json           # Backend dependencies
├── .env                   # Environment variables
└── README.md              # This file
```

## 🧪 Testing

### Run Backend Tests
```bash
npm test
```

### Run Frontend Tests
```bash
cd client
npm run test
```

### Security Testing Checklist
- [ ] Test password complexity enforcement
- [ ] Verify account lockout functionality
- [ ] Test role-based access restrictions
- [ ] Validate input sanitization
- [ ] Check audit logging completeness
- [ ] Verify JWT token expiration
- [ ] Test rate limiting effectiveness

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong JWT secrets (32+ characters)
3. Configure MongoDB with authentication
4. Set up HTTPS certificates
5. Configure reverse proxy (nginx/Apache)

### Production Checklist
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Database connections secured
- [ ] Log files protected
- [ ] Error messages sanitized
- [ ] Security headers implemented
- [ ] Rate limiting configured
- [ ] Backup strategy in place

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the package.json file for details.

## 🔗 Additional Resources

- [OWASP Security Guidelines](https://owasp.org/)
- [Vue.js Documentation](https://vuejs.org/)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

---

**Built with ❤️ for CSSECDV - Secure Web Development**
