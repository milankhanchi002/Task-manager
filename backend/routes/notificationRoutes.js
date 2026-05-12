const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markNotificationsRead,
  markSingleAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats
} = require('../controllers/notificationController');

const { protect } = require('../middleware/authMiddleware');
const { 
  markNotificationsReadValidation,
  handleValidationErrors
} = require('../validators/invitationValidator');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get user notifications
router.get('/', getNotifications);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Get notification statistics
router.get('/stats', getNotificationStats);

// Mark notifications as read (bulk)
router.put('/mark-read', 
  markNotificationsReadValidation,
  handleValidationErrors,
  markNotificationsRead
);

// Mark all notifications as read
router.put('/mark-all-read', markAllAsRead);

// Mark single notification as read
router.put('/:id/read', markSingleAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;
