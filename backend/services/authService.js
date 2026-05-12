const User = require('../models/User');

const registerUser = async (userData) => {
  const { name, email, password, role } = userData;
  
  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role
  });

  return user;
};

const loginUser = async (email, password) => {
  // Check for user email
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};

module.exports = { registerUser, loginUser };
