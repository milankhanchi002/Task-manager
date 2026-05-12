const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Task = require('../models/Task');

// Load env vars
dotenv.config({ path: __dirname + '/../.env' });

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

const users = [
  {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin'
  },
  {
    name: 'Manager User',
    email: 'manager@test.com',
    password: 'password123',
    role: 'manager'
  },
  {
    name: 'Regular User',
    email: 'user@test.com',
    password: 'password123',
    role: 'user'
  }
];

// Import data
const importData = async () => {
  try {
    await User.deleteMany();
    await Task.deleteMany();

    await User.create(users);

    console.log('Data Imported...');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

// Destroy data
const destroyData = async () => {
  try {
    await User.deleteMany();
    await Task.deleteMany();

    console.log('Data Destroyed...');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
