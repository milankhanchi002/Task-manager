const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember
} = require('../controllers/projectController');

const { projectValidation, memberValidation } = require('../validators/projectValidator');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protect middleware to all project routes
router.use(protect);

router
  .route('/')
  .get(getProjects)
  .post(projectValidation, createProject);

router
  .route('/:id')
  .get(getProject)
  .put(projectValidation, updateProject)
  .delete(deleteProject);

router
  .route('/:id/members')
  .post(memberValidation, addMember);

router
  .route('/:id/members/:userId')
  .delete(removeMember);

module.exports = router;
