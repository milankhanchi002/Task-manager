const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Invitation must have a sender']
  },
  receiver: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Invitation must have a receiver']
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project'
  },
  team: {
    type: mongoose.Schema.ObjectId,
    ref: 'Team'
  },
  role: {
    type: String,
    enum: ['member', 'admin'],
    required: [true, 'Invitation must specify a role'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot be more than 500 characters'],
    trim: true
  },
  respondedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
invitationSchema.index({ receiver: 1, status: 1 });
invitationSchema.index({ sender: 1, status: 1 });
invitationSchema.index({ expiresAt: 1 });
invitationSchema.index({ project: 1, status: 1 });
invitationSchema.index({ team: 1, status: 1 });

// Prevent duplicate invitations
invitationSchema.index({ 
  sender: 1, 
  receiver: 1, 
  project: 1, 
  team: 1, 
  status: 1 
}, { 
  unique: true,
  partialFilterExpression: { 
    status: 'pending' 
  }
});

// Virtual for checking if invitation is expired
invitationSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Pre-save middleware to validate either project or team must be present
invitationSchema.pre('save', function(next) {
  if (!this.project && !this.team) {
    return next(new Error('Invitation must be associated with either a project or a team'));
  }
  if (this.project && this.team) {
    return next(new Error('Invitation cannot be associated with both project and team'));
  }
  next();
});

// Pre-find middleware to exclude expired invitations
invitationSchema.pre(/^find/, function(next) {
  this.find({ expiresAt: { $gt: new Date() } });
  next();
});

module.exports = mongoose.model('Invitation', invitationSchema);
