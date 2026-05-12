const Invitation = require('../models/Invitation');
const Project = require('../models/Project');
const Team = require('../models/Team');
const User = require('../models/User');

// Check if user can send invitation for project
exports.canInviteToProject = async (req, res, next) => {
  try {
    const { project } = req.body;
    
    if (!project) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Find project and check if user is owner or admin member
    const projectDoc = await Project.findById(project);
    
    if (!projectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is owner or admin member
    const isOwner = projectDoc.owner.toString() === req.user.id;
    const isAdminMember = projectDoc.members.some(
      member => member.user.toString() === req.user.id && member.role === 'admin'
    );

    if (!isOwner && !isAdminMember) {
      return res.status(403).json({
        success: false,
        message: 'Only project owners and admins can send invitations'
      });
    }

    req.project = projectDoc;
    next();
  } catch (error) {
    console.error('Error in canInviteToProject:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check if user can send invitation for team
exports.canInviteToTeam = async (req, res, next) => {
  try {
    const { team } = req.body;
    
    if (!team) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required'
      });
    }

    // Find team and check if user is owner or admin member
    const teamDoc = await Team.findById(team);
    
    if (!teamDoc) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is owner or admin member
    const isOwner = teamDoc.owner.toString() === req.user.id;
    const isAdminMember = teamDoc.members.some(
      member => member.user.toString() === req.user.id && member.role === 'admin'
    );

    if (!isOwner && !isAdminMember) {
      return res.status(403).json({
        success: false,
        message: 'Only team owners and admins can send invitations'
      });
    }

    req.team = teamDoc;
    next();
  } catch (error) {
    console.error('Error in canInviteToTeam:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check if user can respond to invitation (only receiver)
exports.canRespondToInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const invitation = await Invitation.findById(id).populate('receiver');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Check if user is the receiver
    if (invitation.receiver._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only invitation receivers can respond to invitations'
      });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Invitation already ${invitation.status}`
      });
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired'
      });
    }

    req.invitation = invitation;
    next();
  } catch (error) {
    console.error('Error in canRespondToInvitation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check if user can cancel invitation (only sender)
exports.canCancelInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const invitation = await Invitation.findById(id).populate('sender');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Check if user is the sender
    if (invitation.sender._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only invitation senders can cancel invitations'
      });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Invitation already ${invitation.status}`
      });
    }

    req.invitation = invitation;
    next();
  } catch (error) {
    console.error('Error in canCancelInvitation:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Validate invitation data before sending
exports.validateInvitationData = async (req, res, next) => {
  try {
    const { receiver, project, team, role } = req.body;

    // Check if receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Prevent self-invitation
    if (receiver === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot invite yourself'
      });
    }

    // Check if receiver is already a member
    if (project) {
      const isAlreadyMember = req.project.members.some(
        member => member.user.toString() === receiver
      );
      if (isAlreadyMember) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this project'
        });
      }
    }

    if (team) {
      const isAlreadyMember = req.team.members.some(
        member => member.user.toString() === receiver
      );
      if (isAlreadyMember) {
        return res.status(400).json({
          success: false,
          message: 'User is already a member of this team'
        });
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
      sender: req.user.id,
      receiver: receiver,
      project: project || null,
      team: team || null,
      status: 'pending'
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'Invitation already sent and pending'
      });
    }

    // Validate role hierarchy - can't invite with higher role than sender has
    if (role === 'admin') {
      let senderHasAdminRole = false;
      
      if (project) {
        senderHasAdminRole = req.project.owner.toString() === req.user.id ||
          req.project.members.some(m => m.user.toString() === req.user.id && m.role === 'admin');
      } else if (team) {
        senderHasAdminRole = req.team.owner.toString() === req.user.id ||
          req.team.members.some(m => m.user.toString() === req.user.id && m.role === 'admin');
      }

      if (!senderHasAdminRole) {
        return res.status(403).json({
          success: false,
          message: 'Cannot invite with admin role without having admin privileges'
        });
      }
    }

    req.receiverUser = receiverUser;
    next();
  } catch (error) {
    console.error('Error in validateInvitationData:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
