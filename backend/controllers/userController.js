const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/Project');
const Invitation = require('../models/Invitation');

/**
 * @desc    Get users available for invitation
 * @route   GET /api/v1/users/invite-candidates
 * @access  Private
 */
exports.getInviteCandidates = async (req, res, next) => {
  try {
    const { q: searchQuery, page = 1, limit = 10, teamId, projectId } = req.query;
    
    // Collect user IDs to exclude
    const excludeUserIds = [req.user.id]; // Always exclude current user

    // Exclude team members if teamId is provided
    if (teamId) {
      const team = await Team.findById(teamId).select('members owner');
      if (team) {
        excludeUserIds.push(team.owner);
        team.members.forEach(member => {
          excludeUserIds.push(member.user);
        });
      }
    }

    // Exclude project members if projectId is provided
    if (projectId) {
      const project = await Project.findById(projectId).select('members owner');
      if (project) {
        excludeUserIds.push(project.owner);
        project.members.forEach(member => {
          excludeUserIds.push(member.user);
        });
      }
    }

    // Exclude users who already have pending invitations
    const existingInvitations = await Invitation.find({
      team: teamId,
      project: projectId,
      status: 'pending'
    }).select('receiver');
    
    existingInvitations.forEach(inv => {
      excludeUserIds.push(inv.receiver);
    });

    // Build search query
    let query = {
      _id: { $nin: excludeUserIds }, // Exclude all collected user IDs
    };

    // Add search filter if provided
    if (searchQuery && searchQuery.trim().length >= 2) {
      const searchRegex = new RegExp(searchQuery.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;
    const parsedLimit = Math.min(parseInt(limit), 20); // Max 20 results

    // Find users with limited fields for security
    const users = await User.find(query)
      .select('_id name email role createdAt')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parsedLimit);

    // Get total count for pagination
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    console.error('Error in getInviteCandidates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('_id name email role createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
};
