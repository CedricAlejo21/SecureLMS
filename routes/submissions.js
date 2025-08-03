const express = require('express');
const { body, validationResult } = require('express-validator');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const AuditLog = require('../models/AuditLog');
const { auth } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

const router = express.Router();

// Get student's submission for an assignment
router.get('/:assignmentId/:studentId', auth, async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;

    // Check if assignment exists and user has access
    const assignment = await Assignment.findById(assignmentId)
      .populate('course', 'students instructor');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check access permissions
    const course = assignment.course;
    if (req.user.role === 'student') {
      // Students can only access their own submissions and must be enrolled
      if (req.user.userId.toString() !== studentId || !course.students.includes(req.user.userId.toString())) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'instructor') {
      // Instructors can only access submissions for their courses
      if (course.instructor.toString() !== req.user.userId.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    // Admins have full access

    const submission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId
    }).populate('student', 'firstName lastName email');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit assignment (Students only)
router.post('/:assignmentId/:studentId', auth, authorize('student'), [
  body('text')
    .isLength({ min: 1, max: 5000 })
    .matches(/^[a-zA-Z0-9\s\-\.,!()&\n\r]+$/)
    .withMessage('Submission text is required, must be less than 5000 characters, and contain only letters, numbers, spaces, and basic punctuation')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignmentId, studentId } = req.params;
    const { text } = req.body;

    // Students can only submit their own assignments
    if (req.user.userId.toString() !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if assignment exists and student has access
    const assignment = await Assignment.findById(assignmentId)
      .populate('course', 'students');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if student is enrolled in the course
    if (!assignment.course.students.includes(req.user.userId.toString())) {
      return res.status(403).json({ message: 'You are not enrolled in this course' });
    }

    // Check if student has already submitted
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this assignment' });
    }

    // Check if assignment is past due and mark as late if needed
    const isLate = new Date() > new Date(assignment.dueDate);

    // Create submission
    const submission = new Submission({
      assignment: assignmentId,
      student: studentId,
      text: text.trim(),
      isLate: isLate
    });

    await submission.save();

    // Log the submission
    await AuditLog.log({
      user: req.user.userId.toString(),
      action: 'SUBMIT_ASSIGNMENT',
      resource: `/api/submissions/${assignmentId}/${studentId}`,
      details: { 
        assignmentId,
        studentId,
        submissionId: submission._id
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    const populatedSubmission = await Submission.findById(submission._id)
      .populate('student', 'firstName lastName email');

    res.status(201).json(populatedSubmission);
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all submissions for an assignment (Instructors and Admins only)
router.get('/:assignmentId', auth, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Check if assignment exists and user has access
    const assignment = await Assignment.findById(assignmentId)
      .populate('course', 'instructor');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check permissions for instructors
    if (req.user.role === 'instructor' && assignment.course.instructor.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate('student', 'firstName lastName email')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Grade submission (Instructors and Admins only)
router.put('/:assignmentId/:studentId/grade', auth, authorize('instructor', 'admin'), [
  body('grade')
    .isNumeric()
    .withMessage('Grade must be a number'),
  body('feedback')
    .optional()
    .isLength({ max: 1000 })
    .matches(/^[a-zA-Z0-9\s\-\.,!()&\n\r]*$/)
    .withMessage('Feedback must be less than 1000 characters and contain only letters, numbers, spaces, and basic punctuation')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignmentId, studentId } = req.params;
    const { grade, feedback } = req.body;

    // Check if assignment exists and user has access
    const assignment = await Assignment.findById(assignmentId)
      .populate('course', 'instructor');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check permissions for instructors
    if (req.user.role === 'instructor' && assignment.course.instructor.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate grade is within assignment max points
    if (grade < 0 || grade > assignment.maxScore) {
      return res.status(400).json({ 
        message: `Grade must be between 0 and ${assignment.maxScore}` 
      });
    }

    const submission = await Submission.findOneAndUpdate(
      { assignment: assignmentId, student: studentId },
      {
        grade,
        feedback: feedback || '',
        gradedAt: new Date(),
        gradedBy: req.user.userId
      },
      { new: true, runValidators: true }
    ).populate('student', 'firstName lastName email');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Log the grading
    await AuditLog.log({
      user: req.user.userId.toString(),
      action: 'GRADE_SUBMISSION',
      resource: `/api/submissions/${assignmentId}/${studentId}/grade`,
      details: { 
        assignmentId,
        studentId,
        submissionId: submission._id,
        grade
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    });

    res.json(submission);
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
