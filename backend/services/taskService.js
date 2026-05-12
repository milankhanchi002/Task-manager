const Task = require('../models/Task');

const getTasks = async (query, user) => {
  // Add user role based filtering here if needed
  // E.g., admin sees all, user sees only assigned tasks
  let filter = {};
  
  if (user.role === 'user') {
    filter = { assignedTo: user._id };
  }
  
  // Apply additional query filters
  if (query.status) {
    filter.status = query.status;
  }
  
  const tasks = await Task.find(filter).populate('assignedTo', 'name email').populate('createdBy', 'name email');
  return tasks;
};

const createTask = async (taskData, userId) => {
  const task = await Task.create({
    ...taskData,
    createdBy: userId
  });
  return task;
};

const getTaskById = async (taskId) => {
  const task = await Task.findById(taskId).populate('assignedTo', 'name email').populate('createdBy', 'name email');
  if (!task) {
    throw new Error('Task not found');
  }
  return task;
};

const updateTask = async (taskId, taskData) => {
  const task = await Task.findByIdAndUpdate(taskId, taskData, {
    new: true,
    runValidators: true
  });
  
  if (!task) {
    throw new Error('Task not found');
  }
  return task;
};

const deleteTask = async (taskId) => {
  const task = await Task.findByIdAndDelete(taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  return task;
};

module.exports = { getTasks, createTask, getTaskById, updateTask, deleteTask };
