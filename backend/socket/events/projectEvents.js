const { 
  PROJECT_EVENTS,
  createEventPayload,
  getProjectRoomName
} = require('../constants/socketEvents');

class ProjectEvents {
  constructor(connectionManager) {
    this.connectionManager = connectionManager;
    this.setupEventListeners();
  }

  /**
   * Setup project event listeners
   */
  setupEventListeners() {
    const socketEventEmitter = require('../utils/eventEmitter');

    socketEventEmitter.on('project:member:added', this.handleProjectMemberAdded.bind(this));
    socketEventEmitter.on('project:member:removed', this.handleProjectMemberRemoved.bind(this));
    socketEventEmitter.on('project:updated', this.handleProjectUpdated.bind(this));
    socketEventEmitter.on('project:created', this.handleProjectCreated.bind(this));
    socketEventEmitter.on('project:deleted', this.handleProjectDeleted.bind(this));
  }

  /**
   * Handle project member added event
   */
  async handleProjectMemberAdded(data) {
    try {
      const { project, member, addedBy } = data;

      console.log(`Project member added: ${member.name} joined project ${project.title}`);

      // Broadcast to project room
      this.connectionManager.sendToProject(
        project._id.toString(),
        PROJECT_EVENTS.MEMBER_ADDED,
        {
          project: this.sanitizeProject(project),
          member: this.sanitizeUser(member),
          addedBy: this.sanitizeUser(addedBy),
          timestamp: new Date().toISOString()
        }
      );

      // Auto-join member to project room if online
      const memberSocket = this.findUserSocket(member._id.toString());
      if (memberSocket) {
        await this.connectionManager.joinProjectRoom(memberSocket, project._id.toString());
      }

    } catch (error) {
      console.error('Error handling project member added:', error);
    }
  }

  /**
   * Handle project member removed event
   */
  async handleProjectMemberRemoved(data) {
    try {
      const { project, member, removedBy } = data;

      console.log(`Project member removed: ${member.name} left project ${project.title}`);

      // Broadcast to project room
      this.connectionManager.sendToProject(
        project._id.toString(),
        PROJECT_EVENTS.MEMBER_REMOVED,
        {
          project: this.sanitizeProject(project),
          member: this.sanitizeUser(member),
          removedBy: removedBy ? this.sanitizeUser(removedBy) : null,
          timestamp: new Date().toISOString()
        }
      );

      // Auto-remove member from project room if online
      const memberSocket = this.findUserSocket(member._id.toString());
      if (memberSocket) {
        await this.connectionManager.leaveRoom(memberSocket, 'project', project._id.toString());
      }

    } catch (error) {
      console.error('Error handling project member removed:', error);
    }
  }

  /**
   * Handle project updated event
   */
  async handleProjectUpdated(data) {
    try {
      const { project, updatedBy } = data;

      console.log(`Project updated: ${project.title}`);

      // Broadcast to project room
      this.connectionManager.sendToProject(
        project._id.toString(),
        PROJECT_EVENTS.PROJECT_UPDATED,
        {
          project: this.sanitizeProject(project),
          updatedBy: this.sanitizeUser(updatedBy),
          timestamp: new Date().toISOString()
        }
      );

    } catch (error) {
      console.error('Error handling project updated:', error);
    }
  }

  /**
   * Handle project created event
   */
  async handleProjectCreated(data) {
    try {
      const { project, createdBy } = data;

      console.log(`Project created: ${project.title}`);

      // Send to creator
      this.connectionManager.sendToUser(
        createdBy._id.toString(),
        PROJECT_EVENTS.PROJECT_CREATED,
        {
          project: this.sanitizeProject(project),
          isCreator: true,
          timestamp: new Date().toISOString()
        }
      );

      // Auto-join creator to project room
      const creatorSocket = this.findUserSocket(createdBy._id.toString());
      if (creatorSocket) {
        await this.connectionManager.joinProjectRoom(creatorSocket, project._id.toString());
      }

    } catch (error) {
      console.error('Error handling project created:', error);
    }
  }

  /**
   * Handle project deleted event
   */
  async handleProjectDeleted(data) {
    try {
      const { project, deletedBy } = data;

      console.log(`Project deleted: ${project.title}`);

      // Broadcast to project room (will remove all members)
      this.connectionManager.sendToProject(
        project._id.toString(),
        PROJECT_EVENTS.PROJECT_DELETED,
        {
          project: this.sanitizeProject(project),
          deletedBy: this.sanitizeUser(deletedBy),
          timestamp: new Date().toISOString()
        }
      );

      // All members will be automatically removed from the room
      // when they try to interact or on next connection

    } catch (error) {
      console.error('Error handling project deleted:', error);
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
   * Sanitize project data for client
   */
  sanitizeProject(project) {
    if (!project) return null;

    return {
      _id: project._id,
      title: project.title,
      description: project.description,
      status: project.status,
      owner: project.owner,
      members: project.members,
      dueDate: project.dueDate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
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
    
    socketEventEmitter.off('project:member:added', this.handleProjectMemberAdded);
    socketEventEmitter.off('project:member:removed', this.handleProjectMemberRemoved);
    socketEventEmitter.off('project:updated', this.handleProjectUpdated);
    socketEventEmitter.off('project:created', this.handleProjectCreated);
    socketEventEmitter.off('project:deleted', this.handleProjectDeleted);
  }
}

module.exports = ProjectEvents;
