const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const AuditLog = require('../models/AuditLog');
const { auth } = require('../middleware/auth');
const { authorize, isAdmin, isInstructor } = require('../middleware/roleAuth');

const router = express.Router();

// Get all courses (with role-based filtering)
router.get('/', auth, async (req, res) => {
  try {
    let query = { isActive: true };
    
    // Instructors can see their own courses
    if (req.user.role === 'instructor') {
      query['instructor'] = req.user.userId;
    }
    
    // Students and admins can see all active courses
    // Frontend will handle filtering for enrolled vs available courses

    const courses = await Course.find(query)
      .populate('instructor', 'firstName lastName email')
      .populate('students', 'firstName lastName email')
      .populate('assignments', 'title dueDate maxScore')
      .sort({ startDate: -1 });

    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error fetching courses' });
  }
});

// Get student's enrolled courses only
router.get('/student', auth, authorize('student'), async (req, res) => {
  try {
    const courses = await Course.find({ 
      isActive: true,
      students: req.user.userId 
    })
      .populate('instructor', 'firstName lastName email')
      .populate('students', 'firstName lastName email')
      .populate('assignments', 'title dueDate maxScore')
      .sort({ startDate: -1 });

    res.json(courses);
  } catch (error) {
    console.error('Get student courses error:', error);
    res.status(500).json({ message: 'Server error fetching student courses' });
  }
});

// Get single course
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'firstName lastName email')
      .populate('students', 'firstName lastName email')
      .populate({
        path: 'assignments',
        populate: {
          path: 'submissions.student',
          select: 'firstName lastName email'
        }
      });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user has access to this course
    const userIdString = req.user.userId.toString();
    const instructorIdString = course.instructor._id.toString();
    
    // Check if user is admin
    if (req.user.role === 'admin') {
      console.log('✅ Admin access granted for course:', req.params.id);
    }
    
    // Check if user is the instructor
    const isInstructor = instructorIdString === userIdString;
    
    // Check if user is enrolled as a student (handle both populated and non-populated cases)
    const isEnrolledStudent = course.students.some(student => {
      // Handle populated student objects
      if (student._id) {
        return student._id.toString() === userIdString;
      }
      // Handle non-populated ObjectIds
      return student.toString() === userIdString;
    });
    
    const hasAccess = req.user.role === 'admin' || isInstructor || isEnrolledStudent;

    if (!hasAccess) {
      // Log detailed information for debugging
      console.log('❌ Access denied for user:', userIdString, 'Role:', req.user.role);
      console.log('Course instructor:', instructorIdString);
      console.log('Course students (raw):', course.students);
      console.log('Course students (IDs):', course.students.map(s => s._id ? s._id.toString() : s.toString()));
      console.log('User trying to access:', userIdString);
      console.log('Is instructor?', isInstructor);
      console.log('Is enrolled student?', isEnrolledStudent);
      
      await AuditLog.log({
        user: req.user.userId,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        resource: 'Course',
        resourceId: req.params.id,
        details: { 
          reason: 'User not enrolled in course and not instructor',
          userRole: req.user.role,
          courseId: req.params.id,
          instructorId: instructorIdString,
          enrolledStudents: course.students.length,
          isInstructor,
          isEnrolledStudent
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false
      });
      
      return res.status(403).json({ message: 'Access denied. You are not enrolled in this course.' });
    }
    
    console.log('✅ Access granted for user:', userIdString, 'Role:', req.user.role);

    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error fetching course' });
  }
});

// Create new course (instructors and admins)
router.post('/', [
  auth,
  authorize('instructor', 'admin'),
  body('title')
    .isLength({ min: 3, max: 100 })
    .withMessage('Course title must be 3-100 characters'),
  body('description')
    .isLength({ min: 10, max: 500 })
    .withMessage('Course description must be 10-500 characters'),
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('endDate')
    .isISO8601()
    .withMessage('Valid end date is required'),
  body('maxStudents')
    .isInt({ min: 1, max: 100 })
    .withMessage('Maximum students must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, startDate, endDate, maxStudents } = req.body;

    const course = new Course({
      title,
      description,
      instructor: req.user.userId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxStudents
    });

    await course.save();

    // Log course creation
    await AuditLog.log({
      user: req.user.userId,
      action: 'COURSE_CREATED',
      resource: 'Course',
      resourceId: course._id,
      details: { title, maxStudents },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await course.populate('instructor', 'firstName lastName email');
    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error creating course' });
  }
});

// Enroll in course (students)
router.post('/:id/enroll', [
  auth,
  authorize('student')
], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if course is full
    if (course.isFull) {
      return res.status(400).json({ message: 'Course is full' });
    }

    // Check if already enrolled
    if (course.students.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    course.students.push(req.user.userId);
    await course.save();

    // Log enrollment
    await AuditLog.log({
      user: req.user.userId,
      action: 'ENROLLMENT',
      resource: 'Course',
      resourceId: course._id,
      details: { courseTitle: course.title },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Successfully enrolled in course' });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: 'Server error during enrollment' });
  }
});

// Update course (Instructor and Admin only)
router.put('/:id', [
  auth,
  authorize('instructor', 'admin'),
  body('title')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Course title must be 3-100 characters'),
  body('description')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Course description must be 10-500 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  body('maxStudents')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Maximum students must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    if (req.user.role === 'instructor' && course.instructor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own courses.' });
    }

    const updateData = {};
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.startDate) updateData.startDate = new Date(req.body.startDate);
    if (req.body.endDate) updateData.endDate = new Date(req.body.endDate);
    if (req.body.maxStudents) {
      if (req.body.maxStudents < course.students.length) {
        return res.status(400).json({ 
          message: `Cannot reduce max students below current enrollment (${course.students.length})` 
        });
      }
      updateData.maxStudents = req.body.maxStudents;
    }
    updateData.updatedAt = Date.now();

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('instructor', 'firstName lastName email')
     .populate('students', 'firstName lastName email');

    await AuditLog.log({
      user: req.user.userId,
      action: 'COURSE_UPDATED',
      resource: 'Course',
      resourceId: req.params.id,
      details: { courseTitle: updatedCourse.title, updatedFields: Object.keys(updateData) },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(updatedCourse);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error updating course' });
  }
});

// Unenroll from course
router.post('/:id/unenroll', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    let studentToUnenroll = req.user.userId;
    
    if (req.body.studentId) {
      if (req.user.role === 'student') {
        return res.status(403).json({ message: 'Students can only unenroll themselves' });
      }
      
      if (req.user.role === 'instructor' && course.instructor.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied. You can only manage your own courses.' });
      }
      
      studentToUnenroll = req.body.studentId;
    }

    if (!course.students.includes(studentToUnenroll)) {
      return res.status(400).json({ message: 'Student is not enrolled in this course' });
    }

    course.students = course.students.filter(
      studentId => studentId.toString() !== studentToUnenroll
    );
    await course.save();

    await AuditLog.log({
      user: req.user.userId,
      action: 'UNENROLLMENT',
      resource: 'Course',
      resourceId: course._id,
      details: { courseTitle: course.title, unenrolledStudentId: studentToUnenroll },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Successfully unenrolled from course' });
  } catch (error) {
    console.error('Unenroll error:', error);
    res.status(500).json({ message: 'Server error during unenrollment' });
  }
});

// Delete course (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if course has enrolled students
    if (course.students.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete course with enrolled students. Please unenroll all students first.' 
      });
    }

    // Check if course has assignments
    const assignmentCount = await Assignment.countDocuments({ course: req.params.id });
    if (assignmentCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete course with existing assignments. Please delete all assignments first.' 
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    await AuditLog.log({
      user: req.user.userId,
      action: 'COURSE_DELETED',
      resource: 'Course',
      resourceId: req.params.id,
      details: { courseTitle: course.title },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error deleting course' });
  }
});

module.exports = router;
