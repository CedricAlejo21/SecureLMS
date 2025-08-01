# Demo Accounts Setup Guide

## Overview
This guide explains how to set up and use the demo accounts for the Secure Learning Management System (LMS).

## Prerequisites
- MongoDB running locally or connection string configured in `.env`
- Node.js dependencies installed (`npm install`)
- Environment variables configured (see `.env.example`)

## Demo Accounts
The system includes three pre-configured demo accounts with different roles:

### 🔑 Demo Credentials

| Role | Username | Email | Password |
|------|----------|-------|----------|
| **Admin** | `admin` | `admin@lms.edu` | `AdminPass123!` |
| **Instructor** | `instructor1` | `instructor@lms.edu` | `InstructorPass123!` |
| **Student** | `student1` | `student@lms.edu` | `StudentPass123!` |

## Setup Instructions

### 1. Environment Configuration
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/lms_secure
JWT_SECRET=your-super-secure-jwt-secret-key-here
NODE_ENV=development
PORT=5000
```

### 2. Run Demo Data Setup
Execute the setup script to create demo accounts and sample data:
```bash
npm run setup-demo
```

Or run directly:
```bash
node setup-demo-data.js
```

### 3. Start the Application
```bash
npm start
```

## What Gets Created

### 👥 User Accounts
- **Admin Account**: Full system access, user management capabilities
- **Instructor Account**: Course management, assignment creation, grading
- **Student Account**: Course enrollment, assignment submission, grade viewing

### 📚 Sample Courses
- **CSSECDV**: Secure Web Development
- **CSSWENG**: Software Engineering

### 🔐 Security Features Demonstrated
- **Password Complexity**: All demo passwords meet 12+ character requirement
- **Role-Based Access**: Different permissions per user type
- **Audit Logging**: All actions are logged with timestamps and IP addresses
- **Account Lockout**: Protection against brute force attacks
- **Input Validation**: Server-side validation on all endpoints

## Testing the System

### 1. Authentication Testing
- Try logging in with valid credentials
- Test invalid credentials (should show generic error message)
- Test account lockout (5 failed attempts)

### 2. Authorization Testing
- Login as different roles and verify access restrictions
- Admin should access user management
- Instructor should access course management
- Student should only access enrolled courses

### 3. Security Testing
- Verify password complexity requirements
- Test input validation on forms
- Check audit logs for all actions
- Verify JWT token expiration

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change password

### Users (Admin only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course (Instructor/Admin)
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

## Security Notes

### 🔒 Password Policy
- Minimum 12 characters
- Must contain uppercase, lowercase, numbers, and special characters
- Password history prevents reuse of last 5 passwords
- Account lockout after 5 failed attempts (15-minute lockout)

### 🛡️ Security Headers
- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Input sanitization (mongo-sanitize, hpp)

### 📝 Audit Logging
All security-relevant actions are logged:
- User registration/login/logout
- Password changes
- Course creation/modification
- Assignment creation/grading
- Failed authentication attempts

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **Demo Accounts Already Exist**
   - The setup script will skip existing accounts
   - To recreate, delete from MongoDB first

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set in `.env`
   - Tokens expire after 24 hours

4. **Permission Denied**
   - Check user role and endpoint permissions
   - Verify JWT token is included in requests

## Clean Up
To remove demo data and start fresh:
```bash
# Connect to MongoDB and drop the database
mongo lms_secure --eval "db.dropDatabase()"
```

Then run the setup script again to recreate demo data.

## Support
For issues or questions about the demo setup, check the audit logs and server console for detailed error messages.
