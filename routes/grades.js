const express = require('express');
const { body, validationResult } = require('express-validator');
const Grade = require('../models/Grade');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { auth } = require('../middleware/auth');
const { authorize, isInstructor, isAdmin } = require('../middleware/roleAuth');

const router = express.Router();

// Get grades for a student (own grades only for students)
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log('=== GRADES FETCH DEBUG ===');
    console.log('Student ID from params:', studentId);
    console.log('User ID from token:', req.user.userId);
    console.log('User role:', req.user.role);
    
    // Students can only view their own grades
    if (req.user.role === 'student' && req.user.userId.toString() !== studentId.toString()) {
      console.log('Access denied: User ID mismatch');
      return res.status(403).json({ message: 'Access denied' });
    }

    const grades = await Grade.find({ student: studentId })
      .populate('assignment', 'title maxScore dueDate')
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    console.log('Found grades:', grades.length);
    console.log('Grade details:', grades.map(g => ({
      id: g._id,
      student: g.student,
      assignment: g.assignment?.title,
      points: g.points,
      maxScore: g.maxScore
    })));

    await AuditLog.log({
      user: req.user.userId,
      action: 'VIEW_GRADES',
      resource: `/api/grades/student/${studentId}`,
      details: { studentId, count: grades.length },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json(grades);
  } catch (error) {
    console.error('Get student grades error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get grades for an assignment (Instructor and Admin only)
router.get('/assignment/:assignmentId', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await Assignment.findById(assignmentId).populate('course', 'instructor');
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Instructors can only view grades for their courses
    if (req.user.role === 'instructor' && assignment.course.instructor.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const grades = await Grade.find({ assignment: assignmentId })
      .populate('student', 'firstName lastName username')
      .populate('assignment', 'title maxScore')
      .sort({ createdAt: -1 });

    await AuditLog.log({
      user: req.user.userId,
      action: 'VIEW_ASSIGNMENT_GRADES',
      resource: `/api/grades/assignment/${assignmentId}`,
      details: { assignmentId, count: grades.length },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json(grades);
  } catch (error) {
    console.error('Get assignment grades error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get grades for a course (Instructor and Admin only)
router.get('/course/:courseId', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { courseId } = req.params;
    
    console.log('=== GET COURSE GRADES DEBUG ===');
    console.log('Course ID:', courseId);
    console.log('User:', req.user.userId, req.user.role);
    
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('Course not found');
      return res.status(404).json({ message: 'Course not found' });
    }

    console.log('Course found:', course.title, 'Instructor:', course.instructor);

    // Instructors can only view grades for their courses
    if (req.user.role === 'instructor' && course.instructor.toString() !== req.user.userId.toString()) {
      console.log('Permission denied - instructor does not own course');
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('Fetching grades for course...');
    const grades = await Grade.find({ course: courseId })
      .populate('student', 'firstName lastName username')
      .populate('assignment', 'title maxScore')
      .sort({ createdAt: -1 });

    console.log('Grades found:', grades.length);

    await AuditLog.log({
      user: req.user.userId,
      action: 'VIEW_COURSE_GRADES',
      resource: `/api/grades/course/${courseId}`,
      details: { courseId, count: grades.length },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json(grades);
  } catch (error) {
    console.error('Get course grades error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Create or update grade (Instructor and Admin only)
router.post('/', auth, authorize('instructor', 'admin'), [
  body('student')
    .isMongoId()
    .withMessage('Valid student ID is required'),
  body('assignment')
    .isMongoId()
    .withMessage('Valid assignment ID is required'),
  body('course')
    .isMongoId()
    .withMessage('Valid course ID is required'),
  body('points')
    .isFloat({ min: 0 })
    .withMessage('Points must be a positive number'),
  body('feedback')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Feedback must be less than 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { student, assignment, course, points, feedback } = req.body;

    // Verify assignment and course exist
    const assignmentDoc = await Assignment.findById(assignment).populate('course', 'instructor');
    if (!assignmentDoc) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    if (req.user.role === 'instructor' && assignmentDoc.course.instructor.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate points don't exceed assignment max score
    if (points > assignmentDoc.maxScore) {
      return res.status(400).json({ 
        message: `Points cannot exceed assignment maximum of ${assignmentDoc.maxScore}` 
      });
    }

    // Check if grade already exists
    let grade = await Grade.findOne({ student, assignment });
    
    if (grade) {
      // Update existing grade
      const oldPoints = grade.points;
      grade.points = points;
      grade.feedback = feedback || '';
      grade.gradedBy = req.user.userId;
      grade.gradedAt = new Date();
      grade.updatedAt = Date.now();
      
      await grade.save();

      await AuditLog.log({
        user: req.user.userId,
        action: 'UPDATE_GRADE',
        resource: '/api/grades',
        details: { 
          gradeId: grade._id,
          studentId: student,
          assignmentId: assignment,
          oldPoints,
          newPoints: points
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true
      });
    } else {
      // Create new grade
      grade = new Grade({
        student,
        assignment,
        course,
        points,
        feedback: feedback || '',
        gradedBy: req.user.userId,
        gradedAt: new Date()
      });

      await grade.save();

      await AuditLog.log({
        user: req.user.userId,
        action: 'CREATE_GRADE',
        resource: '/api/grades',
        details: { 
          gradeId: grade._id,
          studentId: student,
          assignmentId: assignment,
          points
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true
      });
    }

    const populatedGrade = await Grade.findById(grade._id)
      .populate('student', 'firstName lastName username')
      .populate('assignment', 'title maxScore')
      .populate('course', 'title');

    res.status(grade.isNew ? 201 : 200).json(populatedGrade);
  } catch (error) {
    console.error('Create/update grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete grade (Instructor and Admin only)
router.delete('/:id', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('assignment')
      .populate({
        path: 'assignment',
        populate: {
          path: 'course',
          select: 'instructor'
        }
      });

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    // Check permissions
    if (req.user.role === 'instructor' && grade.assignment.course.instructor.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Grade.findByIdAndDelete(req.params.id);

    await AuditLog.log({
      user: req.user.userId,
      action: 'DELETE_GRADE',
      resource: `/api/grades/${req.params.id}`,
      details: { 
        gradeId: req.params.id,
        studentId: grade.student,
        assignmentId: grade.assignment._id,
        points: grade.points
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    console.error('Delete grade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
