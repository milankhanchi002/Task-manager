const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const socketEventEmitter = require('../socket/utils/eventEmitter');

class NotificationService {
  // Get user notifications with pagination
  static async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    const skip = (page - 1) * limit;
    
    const query = { user: userId };
    if (unreadOnly) {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .populate('relatedId', 'status role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get unread count
  static async getUnreadCount(userId) {
    return await Notification.getUnreadCount(userId);
  }

  // Mark notifications as read (bulk)
  static async markAsRead(userId, notificationIds = null) {
    const result = await Notification.markAsRead(userId, notificationIds);
    
    // Emit socket event for notification read
    const User = require('../models/User');
    const user = await User.findById(userId).select('name email role');
    
    socketEventEmitter.emitNotificationRead({
      notificationIds,
      user,
      modifiedCount: result.modifiedCount
    });
    
    return result;
  }

  // Mark single notification as read
  static async markSingleAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId, 
        user: userId,
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { new: true }
    ).populate('relatedId', 'status role');

    if (!notification) {
      throw new Error('Notification not found or already read');
    }

    return notification;
  }

  // Delete notification
  static async deleteNotification(notificationId, userId) {
    const result = await Notification.deleteOne({
      _id: notificationId,
      user: userId
    });

    if (result.deletedCount === 0) {
      throw new Error('Notification not found');
    }

    return true;
  }

  // Mark all notifications as read
  static async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { 
        user: userId, 
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    return result.modifiedCount;
  }

  // Create notification (used by other services)
  static async createNotification(notificationData) {
    const notification = await Notification.create(notificationData);
    
    // Emit socket event for new notification
    const User = require('../models/User');
    const user = await User.findById(notification.user).select('name email role');
    
    socketEventEmitter.emitNotificationNew({
      notification,
      user
    });
    
    return notification;
  }

  // Get notification statistics
  static async getNotificationStats(userId) {
    const stats = await Notification.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return stats;
  }

  // Clean up old notifications (older than 30 days)
  static async cleanupOldNotifications() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true
    });

    return result.deletedCount;
  }
}

module.exports = NotificationService;
