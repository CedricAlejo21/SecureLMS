const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Course = require('./models/Course');
const Assignment = require('./models/Assignment');
const Grade = require('./models/Grade');
const Submission = require('./models/Submission');
const AuditLog = require('./models/AuditLog');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_secure');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Demo account credentials (meets 12+ character requirement)
const demoAccounts = [
  {
    username: 'admin',
    email: 'admin@lms.edu',
    password: 'AdminPass123!',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'admin'
  },
  {
    username: 'instructor1',
    email: 'instructor@lms.edu',
    password: 'InstructorPass123!',
    firstName: 'John',
    lastName: 'Professor',
    role: 'instructor'
  },
  {
    username: 'student1',
    email: 'student@lms.edu',
    password: 'StudentPass123!',
    firstName: 'Jane',
    lastName: 'Student',
    role: 'student'
  },
  {
    username: 'student2',
    email: 'student2@lms.edu',
    password: 'StudentPass123!',
    firstName: 'Mike',
    lastName: 'Johnson',
    role: 'student'
  }
];

// Sample courses data
const sampleCourses = [
  {
    title: 'Secure Web Development',
    description: 'Learn secure coding practices and web application security. This course covers OWASP Top 10 vulnerabilities, secure authentication, input validation, and security testing methodologies.',
    startDate: new Date('2024-08-15'),
    endDate: new Date('2024-12-15'),
    maxStudents: 30,
    isActive: true,
    instructorEmail: 'instructor1' // Use instructor1 username
  },
  {
    title: 'Software Engineering',
    description: 'Software development methodologies and project management. Covers Agile practices, system design, testing strategies, and software maintenance principles.',
    startDate: new Date('2024-08-15'),
    endDate: new Date('2024-12-15'),
    maxStudents: 25,
    isActive: true,
    instructorEmail: 'instructor1' // Use instructor1 username
  }
];

// Sample assignments data
const sampleAssignments = [
  // Assignments for Secure Web Development course
  {
    title: 'Secure Authentication System',
    description: 'Implement a secure user authentication system with proper password policies, session management, and protection against common attacks like brute force and session hijacking. Include features like password hashing, secure session tokens, and account lockout mechanisms.',
    dueDate: new Date('2024-10-15'),
    maxScore: 100,
    isActive: true,
    courseIndex: 0 // Will be mapped to first course (Secure Web Development)
  },
  {
    title: 'Input Validation and Sanitization',
    description: 'Create a comprehensive input validation system that prevents SQL injection, XSS attacks, and other injection vulnerabilities. Implement both client-side and server-side validation with proper error handling.',
    dueDate: new Date('2024-09-30'),
    maxScore: 75,
    isActive: true,
    courseIndex: 0
  },
  {
    title: 'Security Code Review Assignment',
    description: 'Review and identify security vulnerabilities in provided code samples. Document each vulnerability found, explain the potential impact, and provide secure code alternatives. Focus on OWASP Top 10 vulnerabilities.',
    dueDate: new Date('2024-11-01'),
    maxScore: 85,
    isActive: true,
    courseIndex: 0
  },
  {
    title: 'Web Application Security Testing',
    description: 'Perform comprehensive security testing on a sample web application. Use tools like OWASP ZAP or Burp Suite to identify vulnerabilities. Create a detailed security assessment report with remediation recommendations.',
    dueDate: new Date('2024-11-15'),
    maxScore: 90,
    isActive: true,
    courseIndex: 0
  },
  {
    title: 'Secure API Development',
    description: 'Design and implement a secure REST API with proper authentication, authorization, rate limiting, and input validation. Include comprehensive API documentation and security considerations.',
    dueDate: new Date('2024-12-01'),
    maxScore: 95,
    isActive: true,
    courseIndex: 0
  },
  
  // Assignments for Software Engineering course
  {
    title: 'Software Requirements Analysis',
    description: 'Analyze and document software requirements for a given project scenario. Create user stories, functional and non-functional requirements, and use case diagrams. Follow IEEE standards for requirements documentation.',
    dueDate: new Date('2024-09-25'),
    maxScore: 80,
    isActive: true,
    courseIndex: 1 // Will be mapped to second course (Software Engineering)
  },
  {
    title: 'System Design and Architecture',
    description: 'Design a scalable system architecture for a distributed application. Include component diagrams, database design, API specifications, and deployment architecture. Consider performance, scalability, and maintainability.',
    dueDate: new Date('2024-10-10'),
    maxScore: 100,
    isActive: true,
    courseIndex: 1
  },
  {
    title: 'Agile Project Management Simulation',
    description: 'Participate in a simulated Agile development project. Create sprint plans, user stories, and conduct retrospectives. Document lessons learned and process improvements throughout the simulation.',
    dueDate: new Date('2024-10-25'),
    maxScore: 70,
    isActive: true,
    courseIndex: 1
  },
  {
    title: 'Code Quality and Testing Strategy',
    description: 'Develop a comprehensive testing strategy including unit tests, integration tests, and end-to-end tests. Implement code quality metrics, static analysis, and continuous integration pipelines.',
    dueDate: new Date('2024-11-10'),
    maxScore: 85,
    isActive: true,
    courseIndex: 1
  },
  {
    title: 'Software Maintenance and Refactoring',
    description: 'Analyze legacy code and create a refactoring plan. Implement code improvements while maintaining functionality. Document technical debt and create a maintenance strategy for long-term sustainability.',
    dueDate: new Date('2024-11-25'),
    maxScore: 75,
    isActive: true,
    courseIndex: 1
  }
];

// Create demo users
const createDemoUsers = async () => {
  console.log('🔧 Creating demo user accounts...');
  
  const createdUsers = {};
  
  for (const accountData of demoAccounts) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: accountData.email }, { username: accountData.username }]
      });

      if (existingUser) {
        console.log(`⚠️  User ${accountData.username} already exists, skipping...`);
        createdUsers[accountData.username] = existingUser; // Store by username instead of role
        continue;
      }

      // Create new user
      const user = new User(accountData);
      await user.save();
      
      createdUsers[accountData.username] = user; // Store by username instead of role
      
      console.log(`✅ Created ${accountData.role}: ${accountData.username} (${accountData.email})`);
      
      // Log user creation
      await AuditLog.log({
        user: user._id,
        action: 'USER_CREATED',
        resource: 'User',
        resourceId: user._id,
        details: { 
          username: user.username, 
          email: user.email, 
          role: user.role,
          createdBy: 'setup-script'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Setup Script'
      });
      
    } catch (error) {
      console.error(`❌ Error creating user ${accountData.username}:`, error.message);
    }
  }
  
  return createdUsers;
};

// Create sample courses
const createSampleCourses = async (users) => {
  console.log('📚 Creating sample courses...');
  
  const createdCourses = [];
  
  // Debug: log available users
  console.log('Available users:', Object.keys(users));
  
  // Get instructor directly from the users object - it's stored as 'instructor1'
  const instructor = users['instructor1'];
  
  if (!instructor) {
    console.log('❌ instructor1 not found in users:', Object.keys(users));
    return createdCourses;
  }
  
  console.log('✅ Found instructor:', instructor.username, instructor.email);
  
  for (const courseData of sampleCourses) {
    try {
      // Check if course already exists
      const existingCourse = await Course.findOne({ 
        title: courseData.title,
        instructor: instructor._id 
      });
      
      if (existingCourse) {
        console.log(`⚠️  Course ${courseData.title} already exists, skipping...`);
        createdCourses.push(existingCourse);
        continue;
      }

      // Create new course
      const course = new Course({
        title: courseData.title,
        description: courseData.description,
        instructor: instructor._id,
        startDate: courseData.startDate,
        endDate: courseData.endDate,
        maxStudents: courseData.maxStudents,
        isActive: courseData.isActive,
        students: [],
        assignments: []
      });
      
      await course.save();
      createdCourses.push(course);
      
      console.log(`✅ Created course: ${courseData.title} (Instructor: ${instructor.firstName} ${instructor.lastName})`);
      
      // Log course creation
      await AuditLog.log({
        user: instructor._id,
        action: 'COURSE_CREATED',
        resource: 'Course',
        resourceId: course._id,
        details: { 
          title: course.title,
          instructor: `${instructor.firstName} ${instructor.lastName}`,
          createdBy: 'setup-script'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Setup Script'
      });
      
    } catch (error) {
      console.error(`❌ Error creating course ${courseData.title}:`, error.message);
    }
  }
  
  return createdCourses;
};

// Create sample assignments
const createSampleAssignments = async (courses, instructor) => {
  console.log('📝 Creating sample assignments...');
  
  const createdAssignments = [];
  
  for (const assignmentData of sampleAssignments) {
    try {
      // Check if assignment already exists
      const existingAssignment = await Assignment.findOne({ 
        title: assignmentData.title,
        course: courses[assignmentData.courseIndex]._id 
      });
      
      if (existingAssignment) {
        console.log(`⚠️  Assignment "${assignmentData.title}" already exists, skipping...`);
        createdAssignments.push(existingAssignment);
        continue;
      }

      // Create new assignment
      const assignment = new Assignment({
        ...assignmentData,
        course: courses[assignmentData.courseIndex]._id,
        instructor: instructor._id
      });
      
      await assignment.save();
      createdAssignments.push(assignment);
      
      console.log(`✅ Created assignment: ${assignmentData.title}`);
      
      // Log assignment creation
      await AuditLog.log({
        user: instructor._id,
        action: 'ASSIGNMENT_CREATED',
        resource: 'Assignment',
        resourceId: assignment._id,
        details: { 
          title: assignment.title,
          courseTitle: courses[assignmentData.courseIndex].title,
          createdBy: 'setup-script'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Setup Script'
      });
      
    } catch (error) {
      console.error(`❌ Error creating assignment ${assignmentData.title}:`, error.message);
    }
  }
  
  return createdAssignments;
};

// Create sample grades
const createSampleGrades = async (assignments, users) => {
  console.log('📊 Creating sample grades...');
  
  const createdGrades = [];
  const instructor = users['instructor1'];
  
  // Only create grades for student1, leave student2 without grades
  const student = users['student1'];
  
  console.log('Creating grades for student:', student?.username);
  console.log('Instructor:', instructor?.username);
  
  if (!student) {
    console.log('❌ No student1 found for grade creation');
    return createdGrades;
  }
  
  if (!instructor) {
    console.log('❌ No instructor1 found for grade creation');
    return createdGrades;
  }
  
  for (const assignment of assignments) {
    try {
      // Create grade only for student1
      const points = Math.floor(Math.random() * (assignment.maxScore - 10) + 10); // Ensure reasonable grades (10-maxScore)
      
      // Create grade record
      const grade = new Grade({
        student: student._id,
        assignment: assignment._id,
        course: assignment.course,
        points: points,
        maxScore: assignment.maxScore,
        feedback: generateSampleFeedback(assignment.title, points, assignment.maxScore),
        gradedBy: instructor._id,
        gradedAt: new Date(),
        isPublished: true
      });
      
      await grade.save();
      createdGrades.push(grade);
      
      console.log(`✅ Created grade for "${assignment.title}" - ${student.username}: ${points}/${assignment.maxScore}`);
      
      // Log grade creation
      await AuditLog.log({
        user: instructor._id,
        action: 'GRADE_ASSIGNED',
        resource: 'Grade',
        resourceId: grade._id,
        details: { 
          studentId: student._id,
          assignmentTitle: assignment.title,
          points: points,
          maxScore: assignment.maxScore,
          createdBy: 'setup-script'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Setup Script'
      });
      
    } catch (error) {
      console.error(`❌ Error creating grade for ${assignment.title}:`, error.message);
    }
  }
  
  return createdGrades;
};

// Create sample submissions
const createSampleSubmissions = async (assignments, users) => {
  console.log('📤 Creating sample submissions...');
  
  const createdSubmissions = [];
  const student = users['student1'];
  
  console.log('Creating submissions for student:', student?.username);
  
  if (!student) {
    console.log('❌ No student1 found for submission creation');
    return createdSubmissions;
  }
  
  for (const assignment of assignments) {
    try {
      // Generate realistic submission text based on assignment title
      const submissionText = generateSampleSubmissionText(assignment.title);
      
      // Create submission for student1
      const submission = new Submission({
        student: student._id,
        assignment: assignment._id,
        text: submissionText,
        submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last 7 days
        isLate: false
      });
      
      await submission.save();
      createdSubmissions.push(submission);
      
      console.log(`✅ Created submission for "${assignment.title}" - ${student.username}`);
      
      // Log submission creation
      await AuditLog.log({
        user: student._id,
        action: 'ASSIGNMENT_SUBMITTED',
        resource: 'Submission',
        resourceId: submission._id,
        details: { 
          studentId: student._id,
          assignmentTitle: assignment.title,
          submittedAt: submission.submittedAt,
          createdBy: 'setup-script'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Setup Script'
      });
      
    } catch (error) {
      console.error(`❌ Error creating submission for ${assignment.title}:`, error.message);
    }
  }
  
  return createdSubmissions;
};

// Helper function to generate realistic feedback
const generateSampleFeedback = (assignmentTitle, points, maxScore) => {
  const percentage = (points / maxScore) * 100;
  
  if (percentage >= 90) {
    return `Excellent work on ${assignmentTitle}! Your implementation demonstrates a thorough understanding of the concepts. Keep up the great work!`;
  } else if (percentage >= 80) {
    return `Good job on ${assignmentTitle}. Your solution meets most requirements with minor areas for improvement. Consider reviewing the feedback for enhancement opportunities.`;
  } else if (percentage >= 70) {
    return `Satisfactory work on ${assignmentTitle}. Your submission shows understanding of basic concepts but could benefit from more attention to detail and completeness.`;
  } else {
    return `Your submission for ${assignmentTitle} needs improvement. Please review the requirements carefully and consider seeking help during office hours.`;
  }
};

// Helper function to generate realistic submission text
const generateSampleSubmissionText = (assignmentTitle) => {
  const submissionTexts = {
    'Secure Authentication System': `I have implemented a comprehensive secure authentication system with the following features:

1. Password Hashing: Used bcrypt with salt rounds of 12 for secure password storage
2. Session Management: Implemented JWT tokens with proper expiration and refresh mechanisms
3. Account Lockout: Added protection against brute force attacks with progressive delays
4. Two-Factor Authentication: Integrated TOTP-based 2FA using Google Authenticator
5. Password Policy: Enforced strong password requirements with complexity validation

The system includes proper error handling, logging, and follows OWASP authentication guidelines. All sensitive operations are properly validated and sanitized.`,

    'Input Validation and Sanitization': `This assignment demonstrates comprehensive input validation and sanitization techniques:

1. Server-side Validation: Implemented robust validation using express-validator
2. XSS Prevention: Applied HTML encoding and Content Security Policy headers
3. SQL Injection Prevention: Used parameterized queries and input sanitization
4. File Upload Security: Validated file types, sizes, and implemented virus scanning
5. Data Type Validation: Enforced strict data type checking for all inputs

The solution includes both client-side and server-side validation with proper error messaging and security logging.`,

    'Security Code Review Assignment': `Performed a thorough security code review of the provided application:

VULNERABILITIES IDENTIFIED:
1. SQL Injection in user authentication (Line 45-52)
2. Cross-Site Scripting in comment display (Line 128)
3. Insecure Direct Object References in file access (Line 203)
4. Missing CSRF protection on state-changing operations
5. Weak session management with predictable session IDs

RECOMMENDATIONS:
- Implement parameterized queries for database operations
- Add input sanitization and output encoding
- Implement proper access controls with authorization checks
- Add CSRF tokens to all forms
- Use cryptographically secure random session generation

Detailed remediation steps and code examples are provided in the attached report.`,

    'Web Application Security Testing': `Conducted comprehensive security testing using multiple methodologies:

TESTING APPROACH:
1. Automated Scanning: Used OWASP ZAP and Burp Suite for vulnerability discovery
2. Manual Testing: Performed manual penetration testing for business logic flaws
3. Code Analysis: Static analysis using SonarQube and manual code review
4. Authentication Testing: Tested for authentication bypass and session management issues

FINDINGS:
- 3 High-severity vulnerabilities (SQL Injection, XSS, Authentication Bypass)
- 5 Medium-severity issues (CSRF, Information Disclosure, Weak Encryption)
- 8 Low-severity findings (Missing Security Headers, Verbose Error Messages)

All findings include proof-of-concept exploits, risk ratings, and detailed remediation guidance.`,

    'Secure API Development': `Developed a secure REST API following industry best practices:

SECURITY FEATURES IMPLEMENTED:
1. Authentication: JWT-based authentication with refresh tokens
2. Authorization: Role-based access control (RBAC) with fine-grained permissions
3. Rate Limiting: Implemented to prevent abuse and DoS attacks
4. Input Validation: Comprehensive validation using JSON Schema
5. HTTPS Enforcement: SSL/TLS configuration with proper certificate validation
6. API Versioning: Implemented for backward compatibility and security updates

The API includes comprehensive logging, monitoring, and follows OpenAPI 3.0 specification. All endpoints are thoroughly tested with automated security tests.`,

    'Software Requirements Analysis': `Completed comprehensive requirements analysis for the student management system:

FUNCTIONAL REQUIREMENTS:
1. User Management: Student registration, authentication, profile management
2. Course Management: Course creation, enrollment, scheduling
3. Assignment System: Assignment creation, submission, grading
4. Reporting: Grade reports, attendance tracking, analytics

NON-FUNCTIONAL REQUIREMENTS:
1. Security: Data encryption, access controls, audit logging
2. Performance: Response time < 2s, support for 1000+ concurrent users
3. Scalability: Horizontal scaling capability, load balancing
4. Reliability: 99.9% uptime, automated backup and recovery

Requirements are traced to business objectives and include acceptance criteria, priority ratings, and risk assessments.`,

    'System Design and Architecture': `Designed a scalable microservices architecture for the LMS platform:

ARCHITECTURE OVERVIEW:
1. Frontend: React.js SPA with responsive design
2. API Gateway: Kong for routing, authentication, and rate limiting
3. Microservices: User Service, Course Service, Assignment Service, Grade Service
4. Database: PostgreSQL for relational data, Redis for caching
5. Message Queue: RabbitMQ for asynchronous processing
6. Monitoring: ELK stack for logging, Prometheus for metrics

DESIGN PATTERNS:
- CQRS for read/write separation
- Event Sourcing for audit trails
- Circuit Breaker for fault tolerance
- Database per Service for data isolation

The design includes detailed component diagrams, sequence diagrams, and deployment architecture.`,

    'Agile Project Management Simulation': `Participated in a full Agile development cycle simulation:

SPRINT PLANNING:
- Defined user stories with acceptance criteria
- Estimated story points using Planning Poker
- Committed to sprint goals and deliverables

DAILY STANDUPS:
- Reported progress, blockers, and next steps
- Collaborated on problem-solving and knowledge sharing

SPRINT REVIEW & RETROSPECTIVE:
- Demonstrated completed features to stakeholders
- Identified process improvements and action items
- Calculated team velocity and updated project timeline

DELIVERABLES:
- Product backlog with prioritized user stories
- Sprint burndown charts and velocity metrics
- Retrospective notes and improvement action plans`,

    'Code Quality and Testing Strategy': `Implemented comprehensive code quality and testing practices:

CODE QUALITY MEASURES:
1. Static Analysis: ESLint, SonarQube with custom rules
2. Code Coverage: Jest with 90%+ coverage requirement
3. Code Reviews: Pull request process with mandatory reviews
4. Documentation: JSDoc comments and README files

TESTING STRATEGY:
1. Unit Tests: Jest for component and function testing
2. Integration Tests: Supertest for API endpoint testing
3. End-to-End Tests: Cypress for user workflow testing
4. Performance Tests: Artillery for load testing
5. Security Tests: OWASP ZAP integration in CI/CD

CI/CD PIPELINE:
- Automated testing on every commit
- Quality gates preventing deployment of failing code
- Automated security scanning and dependency checks`,

    'Software Maintenance and Refactoring': `Performed systematic refactoring and maintenance of legacy codebase:

REFACTORING ACTIVITIES:
1. Code Smell Elimination: Removed duplicate code, long methods, large classes
2. Design Pattern Implementation: Applied Strategy, Factory, and Observer patterns
3. Performance Optimization: Database query optimization, caching implementation
4. Security Hardening: Updated dependencies, fixed security vulnerabilities

MAINTENANCE TASKS:
1. Dependency Updates: Upgraded to latest stable versions
2. Documentation Updates: Updated API documentation and code comments
3. Bug Fixes: Resolved 15 outstanding issues from backlog
4. Monitoring Implementation: Added application performance monitoring

RESULTS:
- 40% reduction in code complexity
- 60% improvement in response times
- Zero critical security vulnerabilities
- Improved maintainability score from C to A rating`
  };

  return submissionTexts[assignmentTitle] || `This is a comprehensive submission for ${assignmentTitle}. The student has completed all requirements and provided detailed analysis, implementation, and documentation as requested. The work demonstrates understanding of key concepts and practical application of learned principles.`;
};

// Enroll student in courses
const enrollStudentInCourses = async (student, courses) => {
  console.log('👨‍🎓 Enrolling student in courses...');
  
  for (const course of courses) {
    try {
      // Check if student is already enrolled
      if (course.students.includes(student._id)) {
        console.log(`⚠️  Student already enrolled in ${course.title}, skipping...`);
        continue;
      }

      // Add student to course
      course.students.push(student._id);
      await course.save();
      
      console.log(`✅ Enrolled ${student.username} in ${course.title}`);
      
      // Log enrollment
      await AuditLog.log({
        user: student._id,
        action: 'ENROLLMENT',
        resource: 'Course',
        resourceId: course._id,
        details: { 
          courseTitle: course.title,
          studentUsername: student.username,
          enrolledBy: 'setup-script'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Setup Script'
      });
      
    } catch (error) {
      console.error(`❌ Error enrolling student in ${course.title}:`, error.message);
    }
  }
};

// Main setup function
const setupDemoData = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting demo data setup...\n');
    
    // Create demo users
    const users = await createDemoUsers();
    
    // Create sample courses if instructor exists
    let courses = [];
    if (Object.values(users).some(user => user.role === 'instructor')) {
      courses = await createSampleCourses(users);
    }
    
    // Enroll both students in all courses
    if (users['student1'] && users['student2'] && courses.length > 0) {
      await enrollStudentInCourses(users['student1'], courses);
      await enrollStudentInCourses(users['student2'], courses);
    }
    
    // Create sample assignments if instructor and courses exist
    let assignments = [];
    if (users['instructor1'] && courses.length > 0) {
      assignments = await createSampleAssignments(courses, users['instructor1']);
    }
    
    // Create sample submissions if student1, assignments, and instructor exist
    let submissions = [];
    if (users['student1'] && assignments.length > 0 && users['instructor1']) {
      submissions = await createSampleSubmissions(assignments, users);
    }
    
    // Create sample grades if student1, assignments, and instructor exist
    let grades = [];
    if (users['student1'] && assignments.length > 0 && users['instructor1']) {
      grades = await createSampleGrades(assignments, users);
    }
    
    console.log('\n📋 Demo Account Summary:');
    console.log('========================');
    console.log('Admin: admin@lms.edu / AdminPass123!');
    console.log('Instructor: instructor@lms.edu / InstructorPass123!');
    console.log('Student 1 (with grades): student@lms.edu / StudentPass123!');
    console.log('Student 2 (no grades): student2@lms.edu / StudentPass123!');
    console.log('========================\n');
    
    console.log('✅ Demo data setup completed successfully!');
    console.log('🔐 All accounts meet security requirements (12+ character passwords)');
    console.log('📝 All actions have been logged to audit trail');
    console.log(`📚 Created ${courses.length} sample courses`);
    console.log(`📝 Created ${assignments.length} sample assignments`);
    console.log(`📤 Created ${submissions.length} sample submissions (only for student1)`);
    console.log(`📊 Created ${grades.length} sample grades (only for student1)`);
    console.log('👥 Both students enrolled in all courses');
    console.log('🔄 Proper workflow: Submissions created before grades for student1');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run setup if called directly
if (require.main === module) {
  setupDemoData();
}

module.exports = { setupDemoData, demoAccounts };
