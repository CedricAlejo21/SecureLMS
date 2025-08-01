const express = require('express');
const { body, validationResult } = require('express-validator');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

const router = express.Router();

// Get all assignments for a course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Check if user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Students can only see assignments for courses they're enrolled in
    if (req.user.role === 'student' && !course.students.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Instructors can only see assignments for their courses
    if (req.user.role === 'instructor' && course.instructor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignments = await Assignment.find({ course: courseId })
      .populate('course', 'title')
      .sort({ dueDate: 1 });

    await AuditLog.log({
      user: req.user.userId,
      action: 'VIEW_ASSIGNMENTS',
      resource: `/api/assignments/course/${courseId}`,
      details: { courseId, count: assignments.length },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single assignment
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'title instructor students');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check access permissions
    const course = assignment.course;
    if (req.user.role === 'student' && !course.students.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'instructor' && course.instructor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create assignment (Instructor and Admin only)
router.post('/', auth, authorize('instructor', 'admin'), [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('description')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description is required and must be less than 2000 characters'),
  body('course')
    .isMongoId()
    .withMessage('Valid course ID is required'),
  body('dueDate')
    .isISO8601()
    .withMessage('Valid due date is required'),
  body('maxPoints')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max points must be between 1 and 1000')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, course, dueDate, maxPoints } = req.body;

    // Verify course exists and user has permission
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role === 'instructor' && courseDoc.instructor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignment = new Assignment({
      title,
      description,
      course,
      dueDate: new Date(dueDate),
      maxPoints,
      createdBy: req.user.userId
    });

    await assignment.save();

    await AuditLog.log({
      user: req.user.userId,
      action: 'CREATE_ASSIGNMENT',
      resource: '/api/assignments',
      details: { 
        assignmentId: assignment._id,
        title: assignment.title,
        courseId: course 
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('course', 'title');

    res.status(201).json(populatedAssignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update assignment (Instructor and Admin only)
router.put('/:id', auth, authorize('instructor', 'admin'), [
  body('title')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be less than 200 characters'),
  body('description')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Valid due date is required'),
  body('maxPoints')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max points must be between 1 and 1000')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'instructor');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check permissions
    if (req.user.role === 'instructor' && assignment.course.instructor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = {};
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.dueDate) updateData.dueDate = new Date(req.body.dueDate);
    if (req.body.maxPoints) updateData.maxPoints = req.body.maxPoints;
    updateData.updatedAt = Date.now();

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('course', 'title');

    await AuditLog.log({
      user: req.user.userId,
      action: 'UPDATE_ASSIGNMENT',
      resource: `/api/assignments/${req.params.id}`,
      details: { 
        assignmentId: req.params.id,
        updatedFields: Object.keys(updateData)
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json(updatedAssignment);
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete assignment (Instructor and Admin only)
router.delete('/:id', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'instructor');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check permissions
    if (req.user.role === 'instructor' && assignment.course.instructor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    await AuditLog.log({
      user: req.user.userId,
      action: 'DELETE_ASSIGNMENT',
      resource: `/api/assignments/${req.params.id}`,
      details: { 
        assignmentId: req.params.id,
        title: assignment.title
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
