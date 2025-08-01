const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Course = require('./models/Course');
const Assignment = require('./models/Assignment');
const Grade = require('./models/Grade');
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
  }
];

// Sample courses data
const sampleCourses = [
  {
    title: 'Secure Web Development',
    description: 'Learn secure coding practices and web application security',
    startDate: new Date('2024-08-15'),
    endDate: new Date('2024-12-15'),
    maxStudents: 30,
    isActive: true
  },
  {
    title: 'Software Engineering',
    description: 'Software development methodologies and project management',
    startDate: new Date('2024-08-15'),
    endDate: new Date('2024-12-15'),
    maxStudents: 25,
    isActive: true
  }
];

// Sample assignments data
const sampleAssignments = [
  {
    title: 'Secure Authentication System',
    description: 'Implement a secure user authentication system with proper password policies and session management.',
    dueDate: new Date('2024-12-15'),
    maxScore: 100,
    isActive: true
  },
  {
    title: 'Input Validation Quiz',
    description: 'Quiz covering input validation techniques and security best practices.',
    dueDate: new Date('2024-11-30'),
    maxScore: 50,
    isActive: true
  },
  {
    title: 'Security Code Review',
    description: 'Review and identify security vulnerabilities in provided code samples.',
    dueDate: new Date('2024-12-01'),
    maxScore: 75,
    isActive: true
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
        createdUsers[accountData.role] = existingUser;
        continue;
      }

      // Create new user
      const user = new User(accountData);
      await user.save();
      
      createdUsers[accountData.role] = user;
      
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
const createSampleCourses = async (instructor) => {
  console.log('📚 Creating sample courses...');
  
  const createdCourses = [];
  
  for (const courseData of sampleCourses) {
    try {
      // Check if course already exists
      const existingCourse = await Course.findOne({ title: courseData.title });
      
      if (existingCourse) {
        console.log(`⚠️  Course ${courseData.title} already exists, skipping...`);
        createdCourses.push(existingCourse);
        continue;
      }

      // Create new course with instructor assigned
      const course = new Course({
        ...courseData,
        instructor: instructor._id,
        students: []
      });
      
      await course.save();
      createdCourses.push(course);
      
      console.log(`✅ Created course: ${courseData.title}`);
      
      // Log course creation
      await AuditLog.log({
        user: instructor._id,
        action: 'COURSE_CREATED',
        resource: 'Course',
        resourceId: course._id,
        details: { 
          title: course.title,
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
  
  // Create assignments for the first course (CSSECDV)
  if (courses.length > 0) {
    const course = courses[0];
    
    for (const assignmentData of sampleAssignments) {
      try {
        // Check if assignment already exists
        const existingAssignment = await Assignment.findOne({ 
          title: assignmentData.title,
          course: course._id 
        });
        
        if (existingAssignment) {
          console.log(`⚠️  Assignment "${assignmentData.title}" already exists, skipping...`);
          createdAssignments.push(existingAssignment);
          continue;
        }

        // Create new assignment
        const assignment = new Assignment({
          ...assignmentData,
          course: course._id,
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
            courseTitle: course.title,
            createdBy: 'setup-script'
          },
          ipAddress: '127.0.0.1',
          userAgent: 'Setup Script'
        });
        
      } catch (error) {
        console.error(`❌ Error creating assignment ${assignmentData.title}:`, error.message);
      }
    }
  }
  
  return createdAssignments;
};

// Create sample grades
const createSampleGrades = async (student, assignments, instructor) => {
  console.log('📊 Creating sample grades...');
  
  const createdGrades = [];
  const sampleGradeValues = [85, 92, 78]; // Sample scores for the three assignments
  
  for (let i = 0; i < assignments.length && i < sampleGradeValues.length; i++) {
    const assignment = assignments[i];
    const points = Math.min(sampleGradeValues[i], assignment.maxScore);
    
    try {
      // Check if grade already exists
      const existingGrade = await Grade.findOne({ 
        student: student._id,
        assignment: assignment._id 
      });
      
      if (existingGrade) {
        console.log(`⚠️  Grade for "${assignment.title}" already exists, skipping...`);
        createdGrades.push(existingGrade);
        continue;
      }

      // Create new grade
      const grade = new Grade({
        student: student._id,
        assignment: assignment._id,
        course: assignment.course,
        points: points,
        feedback: `Good work on ${assignment.title}. ${points >= 90 ? 'Excellent understanding of the concepts!' : points >= 80 ? 'Well done, minor improvements needed.' : 'Satisfactory work, please review the feedback.'}`,
        gradedBy: instructor._id,
        gradedAt: new Date()
      });
      
      await grade.save();
      createdGrades.push(grade);
      
      console.log(`✅ Created grade: ${points}/${assignment.maxScore} for "${assignment.title}"`);
      
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
    if (users.instructor) {
      courses = await createSampleCourses(users.instructor);
    }
    
    // Enroll student in courses if both exist
    if (users.student && courses.length > 0) {
      await enrollStudentInCourses(users.student, courses);
    }
    
    // Create sample assignments if instructor and courses exist
    let assignments = [];
    if (users.instructor && courses.length > 0) {
      assignments = await createSampleAssignments(courses, users.instructor);
    }
    
    // Create sample grades if student, assignments, and instructor exist
    let grades = [];
    if (users.student && assignments.length > 0 && users.instructor) {
      grades = await createSampleGrades(users.student, assignments, users.instructor);
    }
    
    console.log('\n📋 Demo Account Summary:');
    console.log('========================');
    console.log('Admin: admin@lms.edu / AdminPass123!');
    console.log('Instructor: instructor@lms.edu / InstructorPass123!');
    console.log('Student: student@lms.edu / StudentPass123!');
    console.log('========================\n');
    
    console.log('✅ Demo data setup completed successfully!');
    console.log('🔐 All accounts meet security requirements (12+ character passwords)');
    console.log('📝 All actions have been logged to audit trail');
    console.log(`📚 Created ${courses.length} sample courses`);
    console.log(`📝 Created ${assignments.length} sample assignments`);
    console.log(`📊 Created ${grades.length} sample grades`);
    
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
