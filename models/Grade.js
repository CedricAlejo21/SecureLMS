const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  points: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: 'Points must be a positive number'
    }
  },
  feedback: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gradedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
gradeSchema.index({ student: 1, assignment: 1 }, { unique: true }); // Prevent duplicate grades
gradeSchema.index({ assignment: 1 });
gradeSchema.index({ course: 1 });
gradeSchema.index({ student: 1, course: 1 });
gradeSchema.index({ createdAt: -1 });

// Virtual for percentage score
gradeSchema.virtual('percentage').get(function() {
  if (this.populated('assignment') && this.assignment.maxPoints) {
    return Math.round((this.points / this.assignment.maxPoints) * 100);
  }
  return null;
});

// Virtual for letter grade
gradeSchema.virtual('letterGrade').get(function() {
  const percentage = this.percentage;
  if (percentage === null) return null;
  
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
});

// Pre-save middleware to update timestamps
gradeSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Static method to get grade statistics for an assignment
gradeSchema.statics.getAssignmentStats = async function(assignmentId) {
  const stats = await this.aggregate([
    { $match: { assignment: mongoose.Types.ObjectId(assignmentId) } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        averagePoints: { $avg: '$points' },
        maxPoints: { $max: '$points' },
        minPoints: { $min: '$points' },
        totalPoints: { $sum: '$points' }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : null;
};

// Static method to get grade statistics for a course
gradeSchema.statics.getCourseStats = async function(courseId) {
  const stats = await this.aggregate([
    { $match: { course: mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        averagePoints: { $avg: '$points' },
        maxPoints: { $max: '$points' },
        minPoints: { $min: '$points' },
        totalPoints: { $sum: '$points' }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : null;
};

// Static method to get student's grade summary for a course
gradeSchema.statics.getStudentCourseGrades = async function(studentId, courseId) {
  return await this.find({ student: studentId, course: courseId })
    .populate('assignment', 'title maxPoints dueDate type')
    .sort({ createdAt: -1 });
};

// Instance method to check if grade is passing (60% or higher)
gradeSchema.methods.isPassing = function() {
  return this.percentage >= 60;
};

// Instance method to get grade status
gradeSchema.methods.getStatus = function() {
  const percentage = this.percentage;
  if (percentage === null) return 'Unknown';
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 80) return 'Good';
  if (percentage >= 70) return 'Satisfactory';
  if (percentage >= 60) return 'Passing';
  return 'Failing';
};

module.exports = mongoose.model('Grade', gradeSchema);
