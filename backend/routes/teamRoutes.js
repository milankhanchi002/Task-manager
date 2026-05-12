const express = require('express');
const {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember
} = require('../controllers/teamController');

const { teamValidation, memberValidation } = require('../validators/teamValidator');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protect middleware to all team routes
router.use(protect);

router
  .route('/')
  .get(getTeams)
  .post(teamValidation, createTeam);

router
  .route('/:id')
  .get(getTeam)
  .put(teamValidation, updateTeam)
  .delete(deleteTeam);

router
  .route('/:id/members')
  .post(memberValidation, addMember);

router
  .route('/:id/members/:userId')
  .delete(removeMember);

module.exports = router;
