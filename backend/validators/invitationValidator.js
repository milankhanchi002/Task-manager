const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Validation for sending invitation
exports.sendInvitationValidation = [
  body('receiver')
    .notEmpty()
    .withMessage('Receiver ID is required')
    .isMongoId()
    .withMessage('Invalid receiver ID'),
  
  body('role')
    .optional()
    .isIn(['member', 'admin'])
    .withMessage('Role must be either member or admin'),
  
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Message cannot be more than 500 characters')
    .trim(),
  
  body('project')
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage('Invalid project ID'),
  
  body('team')
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage('Invalid team ID'),
  
  // Custom validation: either project or team must be provided
  body().custom((value, { req }) => {
    const project = req.body.project;
    const team = req.body.team;
    
    if (!project && !team) {
      throw new Error('Either project ID or team ID must be provided');
    }
    if (project && team) {
      throw new Error('Cannot provide both project and team ID');
    }
    return true;
  })
];

// Validation for responding to invitation
exports.respondInvitationValidation = [
  body('status')
    .isIn(['accepted', 'rejected'])
    .withMessage('Status must be either accepted or rejected')
];

// Validation for cancelling invitation
exports.cancelInvitationValidation = [
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Reason cannot be more than 200 characters')
    .trim()
];

// Validation for marking notifications as read
exports.markNotificationsReadValidation = [
  body('notificationIds')
    .optional()
    .isArray()
    .withMessage('Notification IDs must be an array'),
  
  body('notificationIds.*')
    .optional()
    .isMongoId()
    .withMessage('Each notification ID must be a valid MongoDB ID')
];

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};
