const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Notification must belong to a user']
  },
  type: {
    type: String,
    enum: [
      'invitation_sent',
      'invitation_accepted', 
      'invitation_rejected',
      'invitation_cancelled',
      'team_joined',
      'project_joined'
    ],
    required: [true, 'Notification must have a type']
  },
  title: {
    type: String,
    required: [true, 'Notification must have a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification must have a message'],
    trim: true,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  relatedId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Invitation'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ relatedId: 1 });

// Pre-save middleware to set readAt when marking as read
notificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(userId, notificationIds = null) {
  const query = { user: userId, isRead: false };
  if (notificationIds) {
    query._id = { $in: notificationIds };
  }
  
  return this.updateMany(
    query,
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ 
    user: userId, 
    isRead: false 
  });
};

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

module.exports = mongoose.model('Notification', notificationSchema);
