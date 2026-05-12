const User = require('../models/User');
const { sendTokenResponse } = require('../utils/jwt');

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Log user out / clear cookie
 * @route   GET /api/v1/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Get all users
 * @route   GET /api/v1/auth/users
 * @access  Private (Admin/Manager)
 */
exports.getUsers = async (req, res, next) => {
  try {
    // Only admins and managers can see all users
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Not authorized to access this route' });
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Update user role
 * @route   PUT /api/v1/auth/users/:id
 * @access  Private (Admin only)
 */
exports.updateUser = async (req, res, next) => {
  try {
    // Only admins can update roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to access this route' });
    }

    const { role } = req.body;
    
    if (!['user', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent self-role modification
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot modify your own role' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/v1/auth/users/:id
 * @access  Private (Admin only)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    // Only admins can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to access this route' });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
