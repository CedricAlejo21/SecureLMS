# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend Development
- `npm run dev` - Start backend in development mode with nodemon
- `npm start` - Start backend in production mode
- `npm test` - Run Jest tests
- `npm run setup-demo` - Initialize database with demo data

### Frontend Development  
- `cd client && npm run dev` - Start Vite development server
- `cd client && npm run build` - Build frontend for production
- `cd client && npm run lint` - Run ESLint on Vue files

### Concurrent Development
- `npm run dev-concurrent` - Run both backend and frontend simultaneously

### Testing Security Features
After any security-related changes, test:
- Password complexity enforcement (12+ chars minimum)
- Account lockout after 5 failed login attempts
- Role-based access restrictions
- JWT token expiration (1 hour)
- Audit logging completeness

## Architecture Overview

### Security-First Design
This is a **security-focused Learning Management System** implementing comprehensive CSSECDV requirements:
- **Authentication**: JWT-based with password policies, account lockout, and audit logging
- **Authorization**: Role-based access control (Admin/Instructor/Student) with ownership validation
- **Input Validation**: Server-side validation using express-validator with MongoDB sanitization
- **Audit Logging**: Comprehensive logging of all security events and user actions

### Technology Stack
- **Backend**: Node.js + Express.js + MongoDB (Mongoose ODM)
- **Frontend**: Vue 3 + Vite + Pinia + Tailwind CSS
- **Security**: Helmet, bcrypt, JWT, rate limiting, input sanitization
- **Logging**: Winston for comprehensive audit trails

### Key Models
- **User**: Implements password history, account lockout, and role management
- **AuditLog**: Tracks all security events and user actions
- **Course**: Manages course data with instructor ownership
- **Assignment/Submission/Grade**: Academic workflow with proper access controls

### Middleware Architecture
- **auth.js**: JWT token validation and user authentication
- **roleAuth.js**: Role-based authorization with audit logging
- **Built-in Express**: Rate limiting, CORS, Helmet security headers, input sanitization

### Role Hierarchy & Access Control
- **Admin**: Full system access including user management and audit logs
- **Instructor**: Course creation/management and grading within owned courses only
- **Student**: Course enrollment, assignment submission, viewing own grades only

### Critical Security Features
1. **Password Policy**: 12+ characters, bcrypt hashing, history tracking (5 passwords), 24-hour minimum age
2. **Account Protection**: 5-attempt lockout with 15-minute duration
3. **Session Security**: 1-hour JWT expiration, re-authentication for sensitive operations
4. **Audit Trail**: All authentication, authorization, and critical operations logged
5. **Input Validation**: Comprehensive server-side validation with whitelist approach
6. **Generic Error Messages**: No information disclosure through error responses

### Database Security
- MongoDB with Mongoose ODM
- Connection string: `mongodb://localhost:27017/lms_secure`
- Built-in sanitization against NoSQL injection
- Proper indexing for performance

### Demo Accounts
- **Admin**: admin@lms.edu / AdminSecure123!
- **Instructor**: instructor@lms.edu / InstructorPass123!
- **Student**: student@lms.edu / StudentAccess123!

## Development Guidelines

### Security Considerations
- Always use the existing middleware for authentication (`auth`) and authorization (`authorize`, `isAdmin`, etc.)
- All new endpoints must implement proper role-based access control
- Log security-relevant events using `AuditLog.log()`
- Use express-validator for all input validation
- Never expose sensitive information in error messages

### Code Patterns
- Controllers use async/await with proper error handling
- All database operations use Mongoose models with validation
- Frontend uses Pinia stores for state management
- Vue Router guards enforce authentication
- API responses follow consistent structure: `{ success, data?, message?, errors? }`

### Testing Approach
- Backend tests use Jest + Supertest
- Focus on security functionality testing
- No frontend testing framework currently configured
- Manual security testing checklist in SECURITY-IMPLEMENTATION.md

### File Organization
- `/routes/` - Express route handlers grouped by feature
- `/middleware/` - Authentication and authorization middleware
- `/models/` - Mongoose schemas with validation
- `/client/src/views/` - Vue page components
- `/client/src/stores/` - Pinia state management
- `/logs/` - Winston log files (error.log, combined.log)

## Port Configuration
- Backend API: Port 3001 (development), configurable via PORT env var
- Frontend: Port 3000 (Vite default)
- MongoDB: Port 27017 (default)

When adding new features, ensure they follow the established security patterns and maintain the comprehensive audit logging that makes this application suitable for academic security coursework.