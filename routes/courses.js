const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const auth = require('../middleware/auth');
const { authorize, isInstructor, isAdmin } = require('../middleware/roleAuth');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Get all courses (with role-based filtering)
router.get('/', auth, async (req, res) => {
  try {
    let query = { isActive: true };
    
    // Students can only see courses they can enroll in
    if (req.user.role === 'student') {
      query['students'] = { $nin: [req.user.userId] };
    }
    
    // Instructors can see their own courses
    if (req.user.role === 'instructor') {
      query['instructor'] = req.user.userId;
    }

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
    const hasAccess = req.user.role === 'admin' ||
                     course.instructor._id.toString() === req.user.userId ||
                     course.students.some(student => student._id.toString() === req.user.userId);

    if (!hasAccess) {
      await AuditLog.log({
        user: req.user.userId,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        resource: 'Course',
        resourceId: req.params.id,
        details: { reason: 'User not enrolled in course and not instructor' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false
      });
      
      return res.status(403).json({ message: 'Access denied. You are not enrolled in this course.' });
    }

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

module.exports = router;
