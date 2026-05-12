const { 
  NOTIFICATION_EVENTS,
  createEventPayload,
  getUserRoomName
} = require('../constants/socketEvents');

class NotificationEvents {
  constructor(connectionManager) {
    this.connectionManager = connectionManager;
    this.setupEventListeners();
  }

  /**
   * Setup notification event listeners
   */
  setupEventListeners() {
    const socketEventEmitter = require('../utils/eventEmitter');

    // Listen for notification events from services
    socketEventEmitter.on('notification:new', this.handleNotificationNew.bind(this));
    socketEventEmitter.on('notification:read', this.handleNotificationRead.bind(this));
    socketEventEmitter.on('notification:count:update', this.handleNotificationCountUpdate.bind(this));
    socketEventEmitter.on('notification:mark_all_read', this.handleMarkAllRead.bind(this));
  }

  /**
   * Handle new notification event
   */
  async handleNotificationNew(data) {
    try {
      const { notification, user } = data;

      console.log(`New notification for ${user.name}: ${notification.title}`);

      // Send to user's personal room
      this.connectionManager.sendToUser(
        user._id.toString(),
        NOTIFICATION_EVENTS.NEW,
        {
          notification: this.sanitizeNotification(notification),
          timestamp: new Date().toISOString()
        }
      );

      // Also send unread count update
      await this.updateUnreadCount(user._id.toString());

    } catch (error) {
      console.error('Error handling new notification:', error);
    }
  }

  /**
   * Handle notification read event
   */
  async handleNotificationRead(data) {
    try {
      const { notification, user, notificationIds } = data;

      console.log(`Notification read by ${user.name}`);

      // Send to user's personal room
      this.connectionManager.sendToUser(
        user._id.toString(),
        NOTIFICATION_EVENTS.READ,
        {
          notificationId: notification?._id,
          notificationIds,
          timestamp: new Date().toISOString()
        }
      );

      // Update unread count
      await this.updateUnreadCount(user._id.toString());

    } catch (error) {
      console.error('Error handling notification read:', error);
    }
  }

  /**
   * Handle notification count update event
   */
  async handleNotificationCountUpdate(data) {
    try {
      const { user, count } = data;

      // Send to user's personal room
      this.connectionManager.sendToUser(
        user._id.toString(),
        NOTIFICATION_EVENTS.COUNT_UPDATE,
        {
          unreadCount: count,
          timestamp: new Date().toISOString()
        }
      );

    } catch (error) {
      console.error('Error handling notification count update:', error);
    }
  }

  /**
   * Handle mark all notifications as read
   */
  async handleMarkAllRead(data) {
    try {
      const { user, modifiedCount } = data;

      console.log(`All notifications marked as read for ${user.name}`);

      // Send to user's personal room
      this.connectionManager.sendToUser(
        user._id.toString(),
        NOTIFICATION_EVENTS.MARK_ALL_READ,
        {
          modifiedCount,
          unreadCount: 0,
          timestamp: new Date().toISOString()
        }
      );

    } catch (error) {
      console.error('Error handling mark all read:', error);
    }
  }

  /**
   * Update unread count for user
   */
  async updateUnreadCount(userId) {
    try {
      const NotificationService = require('../../services/notificationService');
      const unreadCount = await NotificationService.getUnreadCount(userId);

      // Send count update
      this.connectionManager.sendToUser(
        userId,
        NOTIFICATION_EVENTS.COUNT_UPDATE,
        {
          unreadCount,
          timestamp: new Date().toISOString()
        }
      );

      return unreadCount;
    } catch (error) {
      console.error('Error updating unread count:', error);
      return 0;
    }
  }

  /**
   * Sanitize notification data for client
   */
  sanitizeNotification(notification) {
    if (!notification) return null;

    return {
      _id: notification._id,
      user: notification.user,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedId: notification.relatedId,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      timeAgo: this.getTimeAgo(notification.createdAt)
    };
  }

  /**
   * Get time ago string
   */
  getTimeAgo(date) {
    if (!date) return 'Just now';
    
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  /**
   * Cleanup event listeners
   */
  cleanup() {
    const socketEventEmitter = require('../utils/eventEmitter');
    
    socketEventEmitter.off('notification:new', this.handleNotificationNew);
    socketEventEmitter.off('notification:read', this.handleNotificationRead);
    socketEventEmitter.off('notification:count:update', this.handleNotificationCountUpdate);
    socketEventEmitter.off('notification:mark_all_read', this.handleMarkAllRead);
  }
}

module.exports = NotificationEvents;
