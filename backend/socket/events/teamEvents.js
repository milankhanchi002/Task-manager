const { 
  TEAM_EVENTS,
  createEventPayload,
  getTeamRoomName
} = require('../constants/socketEvents');

class TeamEvents {
  constructor(connectionManager) {
    this.connectionManager = connectionManager;
    this.setupEventListeners();
  }

  /**
   * Setup team event listeners
   */
  setupEventListeners() {
    const socketEventEmitter = require('../utils/eventEmitter');

    socketEventEmitter.on('team:member:joined', this.handleTeamMemberJoined.bind(this));
    socketEventEmitter.on('team:member:left', this.handleTeamMemberLeft.bind(this));
    socketEventEmitter.on('team:updated', this.handleTeamUpdated.bind(this));
  }

  /**
   * Handle team member joined event
   */
  async handleTeamMemberJoined(data) {
    try {
      const { team, member, addedBy } = data;

      console.log(`Team member joined: ${member.name} joined team ${team.name}`);

      // Broadcast to team room
      this.connectionManager.sendToTeam(
        team._id.toString(),
        TEAM_EVENTS.MEMBER_JOINED,
        {
          team: this.sanitizeTeam(team),
          member: this.sanitizeUser(member),
          addedBy: this.sanitizeUser(addedBy),
          timestamp: new Date().toISOString()
        }
      );

      // Auto-join member to team room if online
      const memberSocket = this.findUserSocket(member._id.toString());
      if (memberSocket) {
        await this.connectionManager.joinTeamRoom(memberSocket, team._id.toString());
      }

    } catch (error) {
      console.error('Error handling team member joined:', error);
    }
  }

  /**
   * Handle team member left event
   */
  async handleTeamMemberLeft(data) {
    try {
      const { team, member, removedBy } = data;

      console.log(`Team member left: ${member.name} left team ${team.name}`);

      // Broadcast to team room
      this.connectionManager.sendToTeam(
        team._id.toString(),
        TEAM_EVENTS.MEMBER_LEFT,
        {
          team: this.sanitizeTeam(team),
          member: this.sanitizeUser(member),
          removedBy: removedBy ? this.sanitizeUser(removedBy) : null,
          timestamp: new Date().toISOString()
        }
      );

      // Auto-remove member from team room if online
      const memberSocket = this.findUserSocket(member._id.toString());
      if (memberSocket) {
        await this.connectionManager.leaveRoom(memberSocket, 'team', team._id.toString());
      }

    } catch (error) {
      console.error('Error handling team member left:', error);
    }
  }

  /**
   * Handle team updated event
   */
  async handleTeamUpdated(data) {
    try {
      const { team, updatedBy } = data;

      console.log(`Team updated: ${team.name}`);

      // Broadcast to team room
      this.connectionManager.sendToTeam(
        team._id.toString(),
        TEAM_EVENTS.TEAM_UPDATED,
        {
          team: this.sanitizeTeam(team),
          updatedBy: this.sanitizeUser(updatedBy),
          timestamp: new Date().toISOString()
        }
      );

    } catch (error) {
      console.error('Error handling team updated:', error);
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
   * Sanitize team data for client
   */
  sanitizeTeam(team) {
    if (!team) return null;

    return {
      _id: team._id,
      name: team.name,
      description: team.description,
      owner: team.owner,
      members: team.members,
      isActive: team.isActive,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt
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
    
    socketEventEmitter.off('team:member:joined', this.handleTeamMemberJoined);
    socketEventEmitter.off('team:member:left', this.handleTeamMemberLeft);
    socketEventEmitter.off('team:updated', this.handleTeamUpdated);
  }
}

module.exports = TeamEvents;
