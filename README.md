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
- **Comprehensive Security Controls** (Password policies, account lockout, audit logging)
- **Modern UI/UX** with responsive design
- **RESTful API** with comprehensive validation
- **Real-time Security Monitoring** and audit trails

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

### Setup Demo Data
```bash
npm run setup-demo
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api

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
