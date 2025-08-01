const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [100, 'Assignment title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    maxlength: [1000, 'Assignment description cannot exceed 1000 characters']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  maxScore: {
    type: Number,
    required: true,
    min: [1, 'Maximum score must be at least 1'],
    max: [1000, 'Maximum score cannot exceed 1000']
  },
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    fileUrl: String,
    submittedAt: Date,
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    feedback: String,
    isGraded: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
assignmentSchema.index({ course: 1 });
assignmentSchema.index({ dueDate: 1 });

// Pre-save middleware to update updatedAt
assignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for submission count
assignmentSchema.virtual('submissionCount').get(function() {
  return this.submissions ? this.submissions.length : 0;
});

// Method to check if student has submitted
assignmentSchema.methods.hasSubmitted = function(studentId) {
  return this.submissions.some(submission => 
    submission.student.toString() === studentId.toString()
  );
};

module.exports = mongoose.model('Assignment', assignmentSchema);
