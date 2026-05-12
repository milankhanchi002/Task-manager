const { 
  INVITATION_EVENTS,
  createEventPayload,
  getUserRoomName,
  getProjectRoomName,
  getTeamRoomName
} = require('../constants/socketEvents');

class InvitationEvents {
  constructor(connectionManager) {
    this.connectionManager = connectionManager;
    this.setupEventListeners();
  }

  /**
   * Setup invitation event listeners
   */
  setupEventListeners() {
    const socketEventEmitter = require('../utils/eventEmitter');

    // Listen for invitation events from services
    socketEventEmitter.on('invitation:sent', this.handleInvitationSent.bind(this));
    socketEventEmitter.on('invitation:accepted', this.handleInvitationAccepted.bind(this));
    socketEventEmitter.on('invitation:rejected', this.handleInvitationRejected.bind(this));
    socketEventEmitter.on('invitation:cancelled', this.handleInvitationCancelled.bind(this));
  }

  /**
   * Handle invitation sent event
   */
  async handleInvitationSent(data) {
    try {
      const { invitation, sender, receiver } = data;

      console.log(`Invitation sent: ${sender.name} → ${receiver.name}`);

      // Send to receiver's personal room
      this.connectionManager.sendToUser(
        receiver._id.toString(),
        INVITATION_EVENTS.SENT,
        {
          invitation: this.sanitizeInvitation(invitation),
          sender: this.sanitizeUser(sender),
          timestamp: new Date().toISOString()
        }
      );

      // Also send to sender's rooms for real-time updates
      this.connectionManager.sendToUser(
        sender._id.toString(),
        INVITATION_EVENTS.SENT,
        {
          invitation: this.sanitizeInvitation(invitation),
          receiver: this.sanitizeUser(receiver),
          isSender: true,
          timestamp: new Date().toISOString()
        }
      );

      // Join receiver to project/team room if applicable (for preview)
      if (invitation.project) {
        // Note: User can't join project room until they accept
        // But we might want to send limited project info
        this.sendProjectPreview(receiver._id.toString(), invitation.project._id);
      }

    } catch (error) {
      console.error('Error handling invitation sent:', error);
    }
  }

  /**
   * Handle invitation accepted event
   */
  async handleInvitationAccepted(data) {
    try {
      const { invitation, sender, receiver } = data;

      console.log(`Invitation accepted: ${receiver.name} joined ${sender.name}'s ${invitation.project ? 'project' : 'team'}`);

      // Send to sender
      this.connectionManager.sendToUser(
        sender._id.toString(),
        INVITATION_EVENTS.ACCEPTED,
        {
          invitation: this.sanitizeInvitation(invitation),
          receiver: this.sanitizeUser(receiver),
          timestamp: new Date().toISOString()
        }
      );

      // Send to receiver
      this.connectionManager.sendToUser(
        receiver._id.toString(),
        INVITATION_EVENTS.ACCEPTED,
        {
          invitation: this.sanitizeInvitation(invitation),
          isReceiver: true,
          timestamp: new Date().toISOString()
        }
      );

      // Broadcast to project/team room
      if (invitation.project) {
        this.connectionManager.sendToProject(
          invitation.project._id.toString(),
          INVITATION_EVENTS.ACCEPTED,
          {
            member: this.sanitizeUser(receiver),
            role: invitation.role,
            projectId: invitation.project._id.toString(),
            timestamp: new Date().toISOString()
          }
        );

        // Auto-join receiver to project room
        const io = this.connectionManager.io;
        const receiverSocket = this.findUserSocket(receiver._id.toString());
        if (receiverSocket) {
          await this.connectionManager.joinProjectRoom(receiverSocket, invitation.project._id.toString());
        }
      }

      if (invitation.team) {
        this.connectionManager.sendToTeam(
          invitation.team._id.toString(),
          INVITATION_EVENTS.ACCEPTED,
          {
            member: this.sanitizeUser(receiver),
            role: invitation.role,
            teamId: invitation.team._id.toString(),
            timestamp: new Date().toISOString()
          }
        );

        // Auto-join receiver to team room
        const receiverSocket = this.findUserSocket(receiver._id.toString());
        if (receiverSocket) {
          await this.connectionManager.joinTeamRoom(receiverSocket, invitation.team._id.toString());
        }
      }

    } catch (error) {
      console.error('Error handling invitation accepted:', error);
    }
  }

  /**
   * Handle invitation rejected event
   */
  async handleInvitationRejected(data) {
    try {
      const { invitation, sender, receiver } = data;

      console.log(`Invitation rejected: ${receiver.name} rejected ${sender.name}'s invitation`);

      // Send to sender
      this.connectionManager.sendToUser(
        sender._id.toString(),
        INVITATION_EVENTS.REJECTED,
        {
          invitation: this.sanitizeInvitation(invitation),
          receiver: this.sanitizeUser(receiver),
          timestamp: new Date().toISOString()
        }
      );

      // Send to receiver
      this.connectionManager.sendToUser(
        receiver._id.toString(),
        INVITATION_EVENTS.REJECTED,
        {
          invitation: this.sanitizeInvitation(invitation),
          isReceiver: true,
          timestamp: new Date().toISOString()
        }
      );

    } catch (error) {
      console.error('Error handling invitation rejected:', error);
    }
  }

  /**
   * Handle invitation cancelled event
   */
  async handleInvitationCancelled(data) {
    try {
      const { invitation, sender, receiver } = data;

      console.log(`Invitation cancelled: ${sender.name} cancelled invitation to ${receiver.name}`);

      // Send to receiver
      this.connectionManager.sendToUser(
        receiver._id.toString(),
        INVITATION_EVENTS.CANCELLED,
        {
          invitation: this.sanitizeInvitation(invitation),
          sender: this.sanitizeUser(sender),
          timestamp: new Date().toISOString()
        }
      );

      // Send to sender
      this.connectionManager.sendToUser(
        sender._id.toString(),
        INVITATION_EVENTS.CANCELLED,
        {
          invitation: this.sanitizeInvitation(invitation),
          isSender: true,
          timestamp: new Date().toISOString()
        }
      );

    } catch (error) {
      console.error('Error handling invitation cancelled:', error);
    }
  }

  /**
   * Send limited project preview to potential member
   */
  async sendProjectPreview(userId, projectId) {
    try {
      const Project = require('../../models/Project');
      const project = await Project.findById(projectId)
        .select('title description status')
        .lean();

      if (project) {
        this.connectionManager.sendToUser(
          userId,
          'project:preview',
          {
            project,
            preview: true,
            timestamp: new Date().toISOString()
          }
        );
      }
    } catch (error) {
      console.error('Error sending project preview:', error);
    }
  }

  /**
   * Find socket for user
   */
  findUserSocket(userId) {
    const userSockets = this.connectionManager.getUserSockets(userId);
    return userSockets.length > 0 ? userSockets[0] : null;
  }

  /**
   * Sanitize invitation data for client
   */
  sanitizeInvitation(invitation) {
    if (!invitation) return null;

    return {
      _id: invitation._id,
      sender: invitation.sender,
      receiver: invitation.receiver,
      project: invitation.project,
      team: invitation.team,
      role: invitation.role,
      status: invitation.status,
      message: invitation.message,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      respondedAt: invitation.respondedAt
    };
  }

  /**
   * Sanitize user data for client
   */
  sanitizeUser(user) {
    if (!user) return null;

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }

  /**
   * Cleanup event listeners
   */
  cleanup() {
    const socketEventEmitter = require('../utils/eventEmitter');
    
    socketEventEmitter.off('invitation:sent', this.handleInvitationSent);
    socketEventEmitter.off('invitation:accepted', this.handleInvitationAccepted);
    socketEventEmitter.off('invitation:rejected', this.handleInvitationRejected);
    socketEventEmitter.off('invitation:cancelled', this.handleInvitationCancelled);
  }
}

module.exports = InvitationEvents;
