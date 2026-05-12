const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

const { taskValidation } = require('../validators/taskValidator');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protect middleware to all task routes
router.use(protect);

router
  .route('/')
  .get(getTasks)
  .post(taskValidation, createTask);

router
  .route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

module.exports = router;
