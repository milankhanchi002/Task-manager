const Team = require('../models/Team');
const User = require('../models/User');

exports.getTeams = async (req, res, next) => {
  try {
    let query;

    if (req.user.role === 'admin') {
      query = Team.find().populate('owner', 'name email').populate('members.user', 'name email');
    } else {
      query = Team.find({
        $or: [
          { owner: req.user.id },
          { 'members.user': req.user.id }
        ]
      }).populate('owner', 'name email').populate('members.user', 'name email');
    }

    const teams = await query;

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Get single team
 * @route   GET /api/v1/teams/:id
 * @access  Private
 */
exports.getTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const isMember = team.members.some(member => member.user._id.toString() === req.user.id);
    
    if (
      team.owner._id.toString() !== req.user.id &&
      !isMember &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ success: false, message: 'Not authorized to view this team' });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Create new team
 * @route   POST /api/v1/teams
 * @access  Private
 */
exports.createTeam = async (req, res, next) => {
  try {
    req.body.owner = req.user.id;
    
    // Add creator as member by default with admin role for team
    req.body.members = [{ user: req.user.id, role: 'admin' }];

    const team = await Team.create(req.body);

    // Populate the response
    await team.populate('owner', 'name email');
    await team.populate('members.user', 'name email');

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Update team
 * @route   PUT /api/v1/teams/:id
 * @access  Private
 */
exports.updateTeam = async (req, res, next) => {
  try {
    let team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Make sure user is team owner or admin
    const isMemberAdmin = team.members.some(member => 
      member.user.toString() === req.user.id && member.role === 'admin'
    );

    if (
      team.owner.toString() !== req.user.id &&
      !isMemberAdmin &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this team' });
    }

    team = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('owner', 'name email').populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Delete team
 * @route   DELETE /api/v1/teams/:id
 * @access  Private
 */
exports.deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Make sure user is team owner or admin
    if (
      team.owner.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this team' });
    }

    await team.deleteOne();

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
 * @desc    Add member to team
 * @route   POST /api/v1/teams/:id/members
 * @access  Private
 */
exports.addMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Make sure user is team owner, team admin, or app admin
    const isMemberAdmin = team.members.some(member => 
      member.user.toString() === req.user.id && member.role === 'admin'
    );

    if (
      team.owner.toString() !== req.user.id &&
      !isMemberAdmin &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ success: false, message: 'Not authorized to add members to this team' });
    }

    // Check if user to add exists
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'User to add not found' });
    }

    // Check if user is already a member
    const alreadyMember = team.members.some(member => member.user.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this team' });
    }

    team.members.push({ user: userId, role: role || 'member' });
    await team.save();

    await team.populate('owner', 'name email');
    await team.populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * @desc    Remove member from team
 * @route   DELETE /api/v1/teams/:id/members/:userId
 * @access  Private
 */
exports.removeMember = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Make sure user is team owner, team admin, app admin, or the user themselves
    const isMemberAdmin = team.members.some(member => 
      member.user.toString() === req.user.id && member.role === 'admin'
    );
    const isSelf = req.params.userId === req.user.id;

    if (
      team.owner.toString() !== req.user.id &&
      !isMemberAdmin &&
      !isSelf &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ success: false, message: 'Not authorized to remove members from this team' });
    }

    // Check if trying to remove owner
    if (team.owner.toString() === req.params.userId) {
       return res.status(400).json({ success: false, message: 'Cannot remove team owner' });
    }

    team.members = team.members.filter(
      member => member.user.toString() !== req.params.userId
    );

    await team.save();

    await team.populate('owner', 'name email');
    await team.populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
