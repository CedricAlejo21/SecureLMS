const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Course title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [500, 'Course description cannot exceed 500 characters']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(endDate) {
        return endDate > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  maxStudents: {
    type: Number,
    min: [1, 'Course must have at least 1 student capacity'],
    max: [100, 'Course cannot exceed 100 students']
  },
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
courseSchema.index({ instructor: 1 });
courseSchema.index({ students: 1 });
courseSchema.index({ startDate: 1, endDate: 1 });

// Pre-save middleware to update updatedAt
courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for enrollment count
courseSchema.virtual('enrollmentCount').get(function() {
  return this.students ? this.students.length : 0;
});

// Virtual for isFull
courseSchema.virtual('isFull').get(function() {
  return this.students && this.maxStudents && this.students.length >= this.maxStudents;
});

module.exports = mongoose.model('Course', courseSchema);
