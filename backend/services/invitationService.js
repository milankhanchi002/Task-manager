const Invitation = require('../models/Invitation');
const Project = require('../models/Project');
const Team = require('../models/Team');
const Notification = require('../models/Notification');
const User = require('../models/User');
const mongoose = require('mongoose');
const socketEventEmitter = require('../socket/utils/eventEmitter');

class InvitationService {
  // Send invitation
  static async sendInvitation(senderId, invitationData) {
    const session = await mongoose.startSession();
    
    try {
      console.log('INVITATION SERVICE DATA:', invitationData);
      
      await session.withTransaction(async () => {
        // Create invitation
        console.log('SERVICE INPUT DATA:', invitationData);
        const invitation = await Invitation.create([{
          sender: senderId,
          receiver: invitationData.receiver,
          project: invitationData.project || null,
          team: invitationData.team || null,
          role: invitationData.role || 'member',
          message: invitationData.message || ''
        }], { session });
        
        console.log('CREATED INVITATION:', invitation);

        // Create notification for receiver
        await Notification.create([{
          user: invitationData.receiver,
          type: 'invitation_sent',
          title: 'New Invitation',
          message: this.getInvitationMessage(invitationData),
          relatedId: invitation[0]._id
        }], { session });

        return invitation[0];
      });

      // Populate invitation for response
      const populatedInvitation = await Invitation.findById(invitation[0]._id)
        .populate('sender', 'name email')
        .populate('receiver', 'name email')
        .populate('project', 'title description')
        .populate('team', 'name description');

      // Emit socket event
      socketEventEmitter.emitInvitationSent({
        invitation: populatedInvitation,
        sender: populatedInvitation.sender,
        receiver: populatedInvitation.receiver
      });

      return populatedInvitation;
    } catch (error) {
      console.error('Error in sendInvitation:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Accept invitation
  static async acceptInvitation(invitationId, userId) {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        const invitation = await Invitation.findById(invitationId)
          .populate('project')
          .populate('team')
          .session(session);

        if (!invitation) {
          throw new Error('Invitation not found');
        }

        // Update invitation status
        invitation.status = 'accepted';
        invitation.respondedAt = new Date();
        await invitation.save({ session });

        // Add user to project or team
        if (invitation.project) {
          await Project.findByIdAndUpdate(
            invitation.project._id,
            {
              $push: {
                members: {
                  user: invitation.receiver,
                  role: invitation.role
                }
              }
            },
            { session }
          );
        }

        if (invitation.team) {
          await Team.findByIdAndUpdate(
            invitation.team._id,
            {
              $push: {
                members: {
                  user: invitation.receiver,
                  role: invitation.role
                }
              }
            },
            { session }
          );
        }

        // Create notification for sender
        await Notification.create([{
          user: invitation.sender,
          type: 'invitation_accepted',
          title: 'Invitation Accepted',
          message: `${invitation.receiver.name || 'User'} accepted your invitation to ${invitation.project?.title || invitation.team?.name}`,
          relatedId: invitation._id
        }], { session });

        // Create notification for receiver about joining
        const notificationType = invitation.project ? 'project_joined' : 'team_joined';
        await Notification.create([{
          user: invitation.receiver,
          type: notificationType,
          title: 'Welcome!',
          message: `You have successfully joined ${invitation.project?.title || invitation.team?.name}`,
          relatedId: invitation._id
        }], { session });

        return invitation;
      });

      // Return populated invitation
      const populatedInvitation = await Invitation.findById(invitationId)
        .populate('sender', 'name email')
        .populate('receiver', 'name email')
        .populate('project', 'title description')
        .populate('team', 'name description');

      // Emit socket event
      socketEventEmitter.emitInvitationAccepted({
        invitation: populatedInvitation,
        sender: populatedInvitation.sender,
        receiver: populatedInvitation.receiver
      });

      return populatedInvitation;
    } catch (error) {
      console.error('Error in acceptInvitation:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Reject invitation
  static async rejectInvitation(invitationId, userId) {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        const invitation = await Invitation.findById(invitationId)
          .populate('project')
          .populate('team')
          .session(session);

        if (!invitation) {
          throw new Error('Invitation not found');
        }

        // Update invitation status
        invitation.status = 'rejected';
        invitation.respondedAt = new Date();
        await invitation.save({ session });

        // Create notification for sender
        await Notification.create([{
          user: invitation.sender,
          type: 'invitation_rejected',
          title: 'Invitation Rejected',
          message: `${invitation.receiver.name || 'User'} rejected your invitation to ${invitation.project?.title || invitation.team?.name}`,
          relatedId: invitation._id
        }], { session });

        return invitation;
      });

      const populatedInvitation = await Invitation.findById(invitationId)
        .populate('sender', 'name email')
        .populate('receiver', 'name email')
        .populate('project', 'title description')
        .populate('team', 'name description');

      // Emit socket event
      socketEventEmitter.emitInvitationRejected({
        invitation: populatedInvitation,
        sender: populatedInvitation.sender,
        receiver: populatedInvitation.receiver
      });

      return populatedInvitation;
    } catch (error) {
      console.error('Error in rejectInvitation:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Cancel invitation
  static async cancelInvitation(invitationId, senderId) {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        const invitation = await Invitation.findById(invitationId)
          .populate('project')
          .populate('team')
          .session(session);

        if (!invitation) {
          throw new Error('Invitation not found');
        }

        // Update invitation status
        invitation.status = 'cancelled';
        await invitation.save({ session });

        // Create notification for receiver
        await Notification.create([{
          user: invitation.receiver,
          type: 'invitation_cancelled',
          title: 'Invitation Cancelled',
          message: `The invitation to ${invitation.project?.title || invitation.team?.name} has been cancelled`,
          relatedId: invitation._id
        }], { session });

        return invitation;
      });

      const populatedInvitation = await Invitation.findById(invitationId)
        .populate('sender', 'name email')
        .populate('receiver', 'name email')
        .populate('project', 'title description')
        .populate('team', 'name description');

      // Emit socket event
      socketEventEmitter.emitInvitationCancelled({
        invitation: populatedInvitation,
        sender: populatedInvitation.sender,
        receiver: populatedInvitation.receiver
      });

      return populatedInvitation;
    } catch (error) {
      console.error('Error in cancelInvitation:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Get received invitations
  static async getReceivedInvitations(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const invitations = await Invitation.find({ 
      receiver: userId,
      status: 'pending'
    })
    .populate('sender', 'name email')
    .populate('project', 'title description')
    .populate('team', 'name description')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Invitation.countDocuments({ 
      receiver: userId,
      status: 'pending'
    });

    return {
      invitations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get sent invitations
  static async getSentInvitations(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const invitations = await Invitation.find({ 
      sender: userId
    })
    .populate('receiver', 'name email')
    .populate('project', 'title description')
    .populate('team', 'name description')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Invitation.countDocuments({ 
      sender: userId
    });

    return {
      invitations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Search users for invitation
  static async searchUsers(query, currentUserId) {
    const searchRegex = new RegExp(query, 'i');
    
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    })
    .select('name email')
    .limit(10);

    return users;
  }

  // Helper method to generate invitation message
  static getInvitationMessage(invitationData) {
    const projectName = invitationData.project?.title || invitationData.projectName;
    const teamName = invitationData.team?.name || invitationData.teamName;
    const targetName = projectName || teamName;
    
    return `You have been invited to join ${targetName} as ${invitationData.role}`;
  }

  // Cleanup expired invitations
  static async cleanupExpiredInvitations() {
    const result = await Invitation.updateMany(
      { 
        expiresAt: { $lt: new Date() },
        status: 'pending'
      },
      { 
        status: 'cancelled'
      }
    );

    return result.modifiedCount;
  }
}

module.exports = InvitationService;
