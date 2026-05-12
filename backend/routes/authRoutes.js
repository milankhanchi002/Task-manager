const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  getUsers,
  updateUser,
  deleteUser
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const { registerValidation, loginValidation } = require('../validators/authValidator');

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/logout', protect, logout);
router.get('/me', protect, getMe);

// Admin/Manager only routes
router.get('/users', protect, getUsers);
router.put('/users/:id', protect, updateUser);
router.delete('/users/:id', protect, deleteUser);

module.exports = router;
