const Task = require('../models/Task');
const Project = require('../models/Project');

/**
 * @desc    Get all tasks
 * @route   GET /api/v1/tasks
 * @access  Private
 */
exports.getTasks = async (req, res, next) => {
  try {
    let query;
    const reqQuery = { ...req.query };

    // Fields to exclude from normal matching
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Handle user role based access
    // Admin/Manager can see all tasks, users see tasks they are assigned to, or tasks in projects they are members of
    let filter = {};

    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      // Find projects where user is a member
      const userProjects = await Project.find({
        $or: [
          { owner: req.user.id },
          { 'members.user': req.user.id }
        ]
      }).select('_id');

      const projectIds = userProjects.map(p => p._id);
      filter.project = { $in: projectIds };
    }

    // Merge filter with reqQuery (for status, priority, project filtering)
    let queryStr = JSON.stringify({ ...filter, ...reqQuery });

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`);
    
    let parsedQuery = JSON.parse(queryStr);

    // Search functionality
    if (req.query.search) {
      parsedQuery.$text = { $search: req.query.search };
    }

    query = Task.find(parsedQuery)
      .populate({
        path: 'project',
        select: 'title status'
      })
      .populate({
        path: 'assignedTo',
        select: 'name email'
      })
      .populate({
        path: 'createdBy',
        select: 'name email'
      });

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      // Default sort by due date, then created at
      query = query.sort('dueDate -createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Task.countDocuments(parsedQuery);

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const tasks = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: tasks.length,
      pagination,
      data: tasks
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Get single task
 * @route   GET /api/v1/tasks/:id
 * @access  Private
 */
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'title status members')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      const project = task.project;
      const isMember = project.members.some(m => m.user.toString() === req.user.id);
      const isOwner = project.owner.toString() === req.user.id;

      if (!isMember && !isOwner) {
        return res.status(401).json({ success: false, message: 'Not authorized to view this task' });
      }
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Create new task
 * @route   POST /api/v1/tasks
 * @access  Private
 */
exports.createTask = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    
    // Check if project exists and user is authorized
    const project = await Project.findById(req.body.project);
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      const isMember = project.members.some(m => m.user.toString() === req.user.id);
      const isOwner = project.owner.toString() === req.user.id;

      if (!isMember && !isOwner) {
        return res.status(401).json({ success: false, message: 'Not authorized to add task to this project' });
      }
    }

    // Optional: check if assignedTo user is a member of the project
    if (req.body.assignedTo) {
      const isAssignedMember = project.members.some(m => m.user.toString() === req.body.assignedTo) || project.owner.toString() === req.body.assignedTo;
      if (!isAssignedMember && req.user.role !== 'admin') {
         return res.status(400).json({ success: false, message: 'Assigned user is not a member of the project' });
      }
    }

    const task = await Task.create(req.body);

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/v1/tasks/:id
 * @access  Private
 */
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check authorization (Must be admin/manager, project owner, project admin, or task creator, or task assignee)
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
       const project = await Project.findById(task.project);
       const isProjectAdmin = project.members.some(m => m.user.toString() === req.user.id && m.role === 'admin');
       const isOwner = project.owner.toString() === req.user.id;
       const isCreator = task.createdBy.toString() === req.user.id;
       const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user.id;

       if (!isProjectAdmin && !isOwner && !isCreator && !isAssignee) {
           return res.status(401).json({ success: false, message: 'Not authorized to update this task' });
       }
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/v1/tasks/:id
 * @access  Private
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check authorization (Must be admin/manager, project owner, project admin, or task creator)
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
       const project = await Project.findById(task.project);
       const isProjectAdmin = project.members.some(m => m.user.toString() === req.user.id && m.role === 'admin');
       const isOwner = project.owner.toString() === req.user.id;
       const isCreator = task.createdBy.toString() === req.user.id;

       if (!isProjectAdmin && !isOwner && !isCreator) {
           return res.status(401).json({ success: false, message: 'Not authorized to delete this task' });
       }
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
