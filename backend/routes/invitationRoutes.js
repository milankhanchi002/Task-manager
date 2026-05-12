const express = require('express');
const {
  sendInvitation,
  getReceivedInvitations,
  getSentInvitations,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation,
  searchUsers,
  getInvitationDetails
} = require('../controllers/invitationController');

const { protect } = require('../middleware/authMiddleware');
const { 
  sendInvitationValidation,
  respondInvitationValidation,
  cancelInvitationValidation,
  handleValidationErrors
} = require('../validators/invitationValidator');
const {
  canInviteToProject,
  canInviteToTeam,
  canRespondToInvitation,
  canCancelInvitation,
  validateInvitationData
} = require('../middleware/invitationMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Send invitation - need to check authorization based on project/team
router.post('/send', 
  sendInvitationValidation,
  handleValidationErrors,
  (req, res, next) => {
    // Conditionally apply the correct authorization middleware
    if (req.body.project) {
      return canInviteToProject(req, res, next);
    } else if (req.body.team) {
      return canInviteToTeam(req, res, next);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either project or team must be provided'
      });
    }
  },
  validateInvitationData,
  sendInvitation
);

// Get received invitations
router.get('/my', getReceivedInvitations);

// Get sent invitations
router.get('/sent', getSentInvitations);

// Search users for invitation
router.get('/search-users', searchUsers);

// Get invitation details
router.get('/:id', getInvitationDetails);

// Accept invitation
router.put('/:id/accept', 
  respondInvitationValidation,
  handleValidationErrors,
  canRespondToInvitation,
  acceptInvitation
);

// Reject invitation
router.put('/:id/reject', 
  respondInvitationValidation,
  handleValidationErrors,
  canRespondToInvitation,
  rejectInvitation
);

// Cancel invitation
router.delete('/:id/cancel', 
  cancelInvitationValidation,
  handleValidationErrors,
  canCancelInvitation,
  cancelInvitation
);

module.exports = router;
