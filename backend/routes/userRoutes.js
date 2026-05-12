const express = require('express');
const { 
  getInviteCandidates,
  getUserProfile
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get users available for invitation (searchable)
router.get('/invite-candidates', getInviteCandidates);

// Get current user profile
router.get('/profile', getUserProfile);

module.exports = router;
