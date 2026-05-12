const NotificationService = require('../services/notificationService');

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await NotificationService.getUserNotifications(
      req.user.id,
      page,
      limit,
      unreadOnly
    );

    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications'
    });
  }
};

/**
 * @desc    Get unread notification count
 * @route   GET /api/v1/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.id);

    res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};

/**
 * @desc    Mark notifications as read
 * @route   PUT /api/v1/notifications/mark-read
 * @access  Private
 */
exports.markNotificationsRead = async (req, res, next) => {
  try {
    const { notificationIds } = req.body;

    const modifiedCount = await NotificationService.markAsRead(
      req.user.id,
      notificationIds
    );

    res.status(200).json({
      success: true,
      data: { modifiedCount },
      message: 'Notifications marked as read'
    });
  } catch (error) {
    console.error('Error in markNotificationsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
};

/**
 * @desc    Mark single notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
exports.markSingleAsRead = async (req, res, next) => {
  try {
    const notification = await NotificationService.markSingleAsRead(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error in markSingleAsRead:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read'
    });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/notifications/mark-all-read
 * @access  Private
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const modifiedCount = await NotificationService.markAllAsRead(req.user.id);

    res.status(200).json({
      success: true,
      data: { modifiedCount },
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    await NotificationService.deleteNotification(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notification'
    });
  }
};

/**
 * @desc    Get notification statistics
 * @route   GET /api/v1/notifications/stats
 * @access  Private
 */
exports.getNotificationStats = async (req, res, next) => {
  try {
    const stats = await NotificationService.getNotificationStats(req.user.id);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getNotificationStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics'
    });
  }
};
