# SecureLMS Access Control Matrix

This document outlines the access control privileges for different user roles in the SecureLMS application.

## User Roles
- **Admin**: Full system access and management capabilities
- **Instructor**: Course and student management within assigned courses
- **Student**: Limited access to enrolled courses and personal data

## Access Control Matrix

| **Privilege/Action** | **Admin** | **Instructor** | **Student** |
|---------------------|-----------|----------------|-------------|
| **Authentication & User Management** |
| Register new account | Yes | Yes | Yes |
| Login to system | Yes | Yes | Yes |
| Change own password | Yes | Yes | Yes |
| View all users | Yes | No | No |
| Create user accounts | Yes | No | No |
| Activate/Deactivate users | Yes | No | No |
| View user profiles (others) | Yes | No | No |
| **Course Management** |
| View all courses | Yes | Own courses only | Enrolled courses only |
| Create courses | Yes | Yes | No |
| Update course details | Yes | Own courses only | No |
| Delete courses | Yes | No | No |
| Enroll students in courses | Yes | Own courses only | Self-enrollment only |
| Unenroll students | Yes | Own courses only | Self-unenrollment only |
| **Assignment Management** |
| View assignments | Yes | Own course assignments | Enrolled course assignments |
| Create assignments | Yes | Yes | No |
| Update assignments | Yes | Own course assignments | No |
| Delete assignments | Yes | Own course assignments | No |
| **Submission Management** |
| Submit assignments | No | No | Yes |
| View all submissions | Yes | Own course submissions | Own submissions only |
| Grade submissions | Yes | Own course submissions | No |
| **Grade Management** |
| View all grades | Yes | Own course grades | Own grades only |
| Create/Assign grades | Yes | Yes | No |
| Update grades | Yes | Own course grades | No |
| Delete grades | Yes | Own course grades | No |
| View grade statistics | Yes | Own course stats | Own stats only |
| **Audit & Security** |
| View audit logs | Yes | No | No |
| View audit statistics | Yes | No | No |
| View security events | Yes | No | No |
| View user activity logs | Yes | No | No |
| **System Administration** |
| Access admin dashboard | Yes | No | No |
| Manage system settings | Yes | No | No |
| View system statistics | Yes | No | No |

## Role Hierarchy

```
Admin (Highest Privilege)
  ├── Full system access
  ├── User management
  ├── All course access
  └── Audit & security monitoring

Instructor (Medium Privilege)
  ├── Course creation & management
  ├── Assignment management
  ├── Grade management (own courses)
  └── Student management (own courses)

Student (Lowest Privilege)
  ├── Course enrollment
  ├── Assignment submission
  ├── View own grades
  └── Profile management
```

## Special Access Rules

### Instructor Permissions
- Instructors can only manage courses they are assigned to
- Cannot access other instructors' courses or students
- Can view and grade submissions for their own courses only

### Student Permissions
- Students can only access courses they are enrolled in
- Can only view and submit their own assignments
- Cannot access other students' data or submissions

### Admin Override
- Admins have full access to all resources regardless of ownership
- Can perform any action on behalf of any user
- Have access to all audit and security features

## Security Features

### Account Security
- Failed login attempt tracking (max 5 attempts)
- Account lockout for 15 minutes after failed attempts
- Password history tracking (last 5 passwords)
- Minimum password age (24 hours between changes)

### Audit Logging
- All user actions are logged with timestamps
- IP address and user agent tracking
- Failed authentication attempts logged
- Unauthorized access attempts recorded

### Data Protection
- Role-based access control (RBAC) enforcement
- Resource ownership validation
- Input validation and sanitization
- Secure password hashing with bcrypt

## Implementation Notes

- Authorization is enforced at the route level using middleware
- User roles are stored in the database and validated on each request
- JWT tokens contain user role information for stateless authentication
- All sensitive operations require proper role validation

---

*This access control matrix is automatically enforced by the SecureLMS application security middleware.*
