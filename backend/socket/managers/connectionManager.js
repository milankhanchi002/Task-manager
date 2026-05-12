const { 
  createEventPayload,
  CONNECTION_EVENTS,
  ERROR_EVENTS 
} = require('../constants/socketEvents');
const roomManager = require('./roomManager');

class ConnectionManager {
  constructor(io) {
    this.io = io;
    this.connectedSockets = new Map(); // socketId -> socket info
    this.setupConnectionHandlers();
  }

  /**
   * Setup main connection handlers
   */
  setupConnectionHandlers() {
    this.io.on(CONNECTION_EVENTS.CONNECT, this.handleConnection.bind(this));
    this.io.on(CONNECTION_EVENTS.CONNECT_ERROR, this.handleConnectionError.bind(this));
  }

  /**
   * Handle new socket connection
   */
  async handleConnection(socket) {
    try {
      console.log(`New socket connection: ${socket.id}`);

      // Store socket info
      this.connectedSockets.set(socket.id, {
        socket,
        userId: socket.userId,
        userRole: socket.userRole,
        connectedAt: new Date(),
        lastActivity: new Date()
      });

      // Join user to their personal room
      await roomManager.joinUserRoom(socket);

      // Emit online status to other users
      socket.broadcast.emit(
        createEventPayload(
          CONNECTION_EVENTS.USER_ONLINE,
          { 
            userId: socket.userId,
            userName: socket.user.name,
            timestamp: new Date().toISOString()
          }
        )
      );

      // Setup socket event handlers
      this.setupSocketEventHandlers(socket);

      // Setup cleanup on disconnect
      socket.on(CONNECTION_EVENTS.DISCONNECT, this.handleDisconnect.bind(this, socket));

      // Send initial connection data
      socket.emit(
        createEventPayload(
          CONNECTION_EVENTS.CONNECT,
          {
            socketId: socket.id,
            userId: socket.userId,
            onlineUsersCount: roomManager.getOnlineUsersCount(),
            userRooms: roomManager.getSocketRooms(socket.id)
          },
          socket.userId
        )
      );

    } catch (error) {
      console.error('Error handling connection:', error);
      socket.emit(
        createEventPayload(
          ERROR_EVENTS.GENERAL_ERROR,
          { message: 'Connection setup failed' }
        )
      );
    }
  }

  /**
   * Handle socket connection errors
   */
  handleConnectionError(error) {
    console.error('Socket connection error:', error);
  }

  /**
   * Handle socket disconnection
   */
  async handleDisconnect(socket, reason) {
    try {
      const socketInfo = this.connectedSockets.get(socket.id);
      
      if (socketInfo) {
        console.log(`Socket disconnected: ${socket.id} (${socketInfo.userId}) - Reason: ${reason}`);

        // Check if user is still online (other sockets)
        const isStillOnline = roomManager.isUserOnline(socketInfo.userId);

        // Emit offline status only if user has no more active sockets
        if (!isStillOnline) {
          socket.broadcast.emit(
            createEventPayload(
              CONNECTION_EVENTS.USER_OFFLINE,
              { 
                userId: socketInfo.userId,
                userName: socket.user?.name,
                timestamp: new Date().toISOString()
              }
            )
          );
        }

        // Clean up room memberships
        roomManager.cleanup(socket);
      }

      // Remove from connected sockets
      this.connectedSockets.delete(socket.id);

    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  }

  /**
   * Setup individual socket event handlers
   */
  setupSocketEventHandlers(socket) {
    // Room management events
    socket.on(CONNECTION_EVENTS.JOIN_USER_ROOM, this.handleJoinUserRoom.bind(this, socket));
    socket.on(CONNECTION_EVENTS.LEAVE_USER_ROOM, this.handleLeaveUserRoom.bind(this, socket));
    socket.on(CONNECTION_EVENTS.JOIN_PROJECT_ROOM, this.handleJoinProjectRoom.bind(this, socket));
    socket.on(CONNECTION_EVENTS.LEAVE_PROJECT_ROOM, this.handleLeaveProjectRoom.bind(this, socket));
    socket.on(CONNECTION_EVENTS.JOIN_TEAM_ROOM, this.handleJoinTeamRoom.bind(this, socket));
    socket.on(CONNECTION_EVENTS.LEAVE_TEAM_ROOM, this.handleLeaveTeamRoom.bind(this, socket));

    // Activity tracking
    socket.on('activity', this.handleActivity.bind(this, socket));
  }

  /**
   * Handle joining user room
   */
  async handleJoinUserRoom(socket, data) {
    try {
      const { userId } = data;
      
      // Users can only join their own room
      if (userId !== socket.userId) {
        return socket.emit(
          createEventPayload(
            ERROR_EVENTS.AUTHORIZATION_FAILED,
            { message: 'Cannot join another user\'s room' },
            socket.userId
          )
        );
      }

      await roomManager.joinUserRoom(socket);
    } catch (error) {
      console.error('Error joining user room:', error);
      socket.emit(
        createEventPayload(
          ERROR_EVENTS.ROOM_JOIN_FAILED,
          { error: error.message },
          socket.userId
        )
      );
    }
  }

  /**
   * Handle leaving user room
   */
  async handleLeaveUserRoom(socket, data) {
    try {
      const { userId } = data;
      
      if (userId !== socket.userId) {
        return socket.emit(
          createEventPayload(
            ERROR_EVENTS.AUTHORIZATION_FAILED,
            { message: 'Cannot leave another user\'s room' },
            socket.userId
          )
        );
      }

      await roomManager.leaveRoom(socket, 'user', userId);
    } catch (error) {
      console.error('Error leaving user room:', error);
      socket.emit(
        createEventPayload(
          ERROR_EVENTS.GENERAL_ERROR,
          { error: error.message },
          socket.userId
        )
      );
    }
  }

  /**
   * Handle joining project room
   */
  async handleJoinProjectRoom(socket, data) {
    try {
      const { projectId } = data;
      
      if (!projectId) {
        return socket.emit(
          createEventPayload(
            ERROR_EVENTS.VALIDATION_FAILED,
            { message: 'Project ID is required' },
            socket.userId
          )
        );
      }

      await roomManager.joinProjectRoom(socket, projectId);
    } catch (error) {
      console.error('Error joining project room:', error);
      socket.emit(
        createEventPayload(
          ERROR_EVENTS.ROOM_JOIN_FAILED,
          { error: error.message },
          socket.userId
        )
      );
    }
  }

  /**
   * Handle leaving project room
   */
  async handleLeaveProjectRoom(socket, data) {
    try {
      const { projectId } = data;
      
      await roomManager.leaveRoom(socket, 'project', projectId);
    } catch (error) {
      console.error('Error leaving project room:', error);
      socket.emit(
        createEventPayload(
          ERROR_EVENTS.GENERAL_ERROR,
          { error: error.message },
          socket.userId
        )
      );
    }
  }

  /**
   * Handle joining team room
   */
  async handleJoinTeamRoom(socket, data) {
    try {
      const { teamId } = data;
      
      if (!teamId) {
        return socket.emit(
          createEventPayload(
            ERROR_EVENTS.VALIDATION_FAILED,
            { message: 'Team ID is required' },
            socket.userId
          )
        );
      }

      await roomManager.joinTeamRoom(socket, teamId);
    } catch (error) {
      console.error('Error joining team room:', error);
      socket.emit(
        createEventPayload(
          ERROR_EVENTS.ROOM_JOIN_FAILED,
          { error: error.message },
          socket.userId
        )
      );
    }
  }

  /**
   * Handle leaving team room
   */
  async handleLeaveTeamRoom(socket, data) {
    try {
      const { teamId } = data;
      
      await roomManager.leaveRoom(socket, 'team', teamId);
    } catch (error) {
      console.error('Error leaving team room:', error);
      socket.emit(
        createEventPayload(
          ERROR_EVENTS.GENERAL_ERROR,
          { error: error.message },
          socket.userId
        )
      );
    }
  }

  /**
   * Handle user activity tracking
   */
  handleActivity(socket, data) {
    try {
      const socketInfo = this.connectedSockets.get(socket.id);
      if (socketInfo) {
        socketInfo.lastActivity = new Date();
        this.connectedSockets.set(socket.id, socketInfo);
      }
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      connectedSockets: this.connectedSockets.size,
      onlineUsers: roomManager.getOnlineUsersCount(),
      roomStats: roomManager.getStats()
    };
  }

  /**
   * Get socket info
   */
  getSocketInfo(socketId) {
    return this.connectedSockets.get(socketId);
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId) {
    for (const [socketId, socketInfo] of this.connectedSockets) {
      if (socketInfo.userId === userId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all sockets for a user
   */
  getUserSockets(userId) {
    const userSockets = [];
    for (const [socketId, socketInfo] of this.connectedSockets) {
      if (socketInfo.userId === userId) {
        userSockets.push(socketInfo.socket);
      }
    }
    return userSockets;
  }

  /**
   * Broadcast to all connected sockets
   */
  broadcastToAll(event, data) {
    this.io.emit(createEventPayload(event, data));
  }

  /**
   * Send to specific user
   */
  sendToUser(userId, event, data) {
    const userRoom = `user:${userId}`;
    this.io.to(userRoom).emit(createEventPayload(event, data, userId));
  }

  /**
   * Send to project room
   */
  sendToProject(projectId, event, data) {
    const projectRoom = `project:${projectId}`;
    this.io.to(projectRoom).emit(createEventPayload(event, data));
  }

  /**
   * Send to team room
   */
  sendToTeam(teamId, event, data) {
    const teamRoom = `team:${teamId}`;
    this.io.to(teamRoom).emit(createEventPayload(event, data));
  }
}

module.exports = ConnectionManager;
