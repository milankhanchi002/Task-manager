const Project = require('../models/Project');
const User = require('../models/User');

/**
 * @desc    Get all projects
 * @route   GET /api/v1/projects
 * @access  Private
 */
exports.getProjects = async (req, res, next) => {
  try {
    let query;

    // If user is admin/manager they can see all projects, else only projects they own or are members of
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      query = Project.find().populate('owner', 'name email').populate('members.user', 'name email');
    } else {
      query = Project.find({
        $or: [
          { owner: req.user.id },
          { 'members.user': req.user.id }
        ]
      }).populate('owner', 'name email').populate('members.user', 'name email');
    }

    const projects = await query;

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Get single project
 * @route   GET /api/v1/projects/:id
 * @access  Private
 */
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Make sure user is project owner, member, or admin/manager
    const isMember = project.members.some(member => member.user._id.toString() === req.user.id);
    
    if (
      project.owner._id.toString() !== req.user.id &&
      !isMember &&
      req.user.role !== 'admin' &&
      req.user.role !== 'manager'
    ) {
      return res.status(401).json({ success: false, message: 'Not authorized to view this project' });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Create new project
 * @route   POST /api/v1/projects
 * @access  Private
 */
exports.createProject = async (req, res, next) => {
  try {
    req.body.owner = req.user.id;
    
    // Add creator as member by default with admin role for project
    req.body.members = [{ user: req.user.id, role: 'admin' }];

    const project = await Project.create(req.body);

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/v1/projects/:id
 * @access  Private
 */
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Make sure user is project owner or admin/manager
    const isMemberAdmin = project.members.some(member => 
      member.user.toString() === req.user.id && member.role === 'admin'
    );

    if (
      project.owner.toString() !== req.user.id &&
      !isMemberAdmin &&
      req.user.role !== 'admin' &&
      req.user.role !== 'manager'
    ) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this project' });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/v1/projects/:id
 * @access  Private
 */
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Make sure user is project owner or admin/manager
    if (
      project.owner.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'manager'
    ) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this project' });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Add member to project
 * @route   POST /api/v1/projects/:id/members
 * @access  Private
 */
exports.addMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Make sure user is project owner, project admin, or app admin/manager
    const isMemberAdmin = project.members.some(member => 
      member.user.toString() === req.user.id && member.role === 'admin'
    );

    if (
      project.owner.toString() !== req.user.id &&
      !isMemberAdmin &&
      req.user.role !== 'admin' &&
      req.user.role !== 'manager'
    ) {
      return res.status(401).json({ success: false, message: 'Not authorized to add members to this project' });
    }

    // Check if user to add exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'User to add not found' });
    }

    // Check if user is already a member
    const alreadyMember = project.members.some(member => member.user.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this project' });
    }

    project.members.push({ user: userId, role: role || 'member' });
    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Remove member from project
 * @route   DELETE /api/v1/projects/:id/members/:userId
 * @access  Private
 */
exports.removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Make sure user is project owner, project admin, app admin/manager, or the user themselves
    const isMemberAdmin = project.members.some(member => 
      member.user.toString() === req.user.id && member.role === 'admin'
    );
    const isSelf = req.params.userId === req.user.id;

    if (
      project.owner.toString() !== req.user.id &&
      !isMemberAdmin &&
      !isSelf &&
      req.user.role !== 'admin' &&
      req.user.role !== 'manager'
    ) {
      return res.status(401).json({ success: false, message: 'Not authorized to remove members from this project' });
    }

    // Check if trying to remove owner
    if (project.owner.toString() === req.params.userId) {
       return res.status(400).json({ success: false, message: 'Cannot remove project owner' });
    }

    project.members = project.members.filter(
      member => member.user.toString() !== req.params.userId
    );

    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
