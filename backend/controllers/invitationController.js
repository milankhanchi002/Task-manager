const InvitationService = require('../services/invitationService');
const NotificationService = require('../services/notificationService');

/**
 * @desc    Send invitation
 * @route   POST /api/v1/invitations/send
 * @access  Private
 */
exports.sendInvitation = async (req, res, next) => {
  try {
    console.log('========== SEND INVITATION ==========');
    console.log('REQ BODY:', req.body);
    console.log('REQ USER:', req.user);
    const { receiver, project, team, role, message } = req.body;

    const invitation = await InvitationService.sendInvitation(req.user.id, {
      receiver,
      project,
      team,
      role,
      message
    });

    console.log('CREATED INVITATION:', invitation);
    res.status(201).json({
      success: true,
      data: invitation
    });
  } catch (error) {
    console.error('Error in sendInvitation:', error);
    console.error('ERROR MESSAGE:', error.message);
    
    // Log validation errors if they exist
    if (error.errors) {
      console.error('VALIDATION ERRORS:', error.errors);
    }
    
    res.status(400).json({
      success: false,
      message: error.message,
      error
    });
  }
};

/**
 * @desc    Get received invitations
 * @route   GET /api/v1/invitations/my
 * @access  Private
 */
exports.getReceivedInvitations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await InvitationService.getReceivedInvitations(
      req.user.id,
      page,
      limit
    );

    res.status(200).json({
      success: true,
      data: result.invitations,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getReceivedInvitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invitations'
    });
  }
};

/**
 * @desc    Get sent invitations
 * @route   GET /api/v1/invitations/sent
 * @access  Private
 */
exports.getSentInvitations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await InvitationService.getSentInvitations(
      req.user.id,
      page,
      limit
    );

    res.status(200).json({
      success: true,
      data: result.invitations,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getSentInvitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sent invitations'
    });
  }
};

/**
 * @desc    Accept invitation
 * @route   PUT /api/v1/invitations/:id/accept
 * @access  Private
 */
exports.acceptInvitation = async (req, res, next) => {
  try {
    const invitation = await InvitationService.acceptInvitation(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: invitation,
      message: 'Invitation accepted successfully'
    });
  } catch (error) {
    console.error('Error in acceptInvitation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept invitation'
    });
  }
};

/**
 * @desc    Reject invitation
 * @route   PUT /api/v1/invitations/:id/reject
 * @access  Private
 */
exports.rejectInvitation = async (req, res, next) => {
  try {
    const invitation = await InvitationService.rejectInvitation(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: invitation,
      message: 'Invitation rejected'
    });
  } catch (error) {
    console.error('Error in rejectInvitation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject invitation'
    });
  }
};

/**
 * @desc    Cancel invitation
 * @route   DELETE /api/v1/invitations/:id/cancel
 * @access  Private
 */
exports.cancelInvitation = async (req, res, next) => {
  try {
    const invitation = await InvitationService.cancelInvitation(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: invitation,
      message: 'Invitation cancelled'
    });
  } catch (error) {
    console.error('Error in cancelInvitation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel invitation'
    });
  }
};

/**
 * @desc    Search users for invitation
 * @route   GET /api/v1/invitations/search-users
 * @access  Private
 */
exports.searchUsers = async (req, res, next) => {
  try {
    const { q: query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const users = await InvitationService.searchUsers(query, req.user.id);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error in searchUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
};

/**
 * @desc    Get invitation details
 * @route   GET /api/v1/invitations/:id
 * @access  Private
 */
exports.getInvitationDetails = async (req, res, next) => {
  try {
    const Invitation = require('../models/Invitation');
    
    const invitation = await Invitation.findById(req.params.id)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .populate('project', 'title description')
      .populate('team', 'name description');

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // Check if user is either sender or receiver
    if (invitation.sender._id.toString() !== req.user.id && 
        invitation.receiver._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this invitation'
      });
    }

    res.status(200).json({
      success: true,
      data: invitation
    });
  } catch (error) {
    console.error('Error in getInvitationDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invitation details'
    });
  }
};
