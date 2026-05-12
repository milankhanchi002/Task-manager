const { 
  getRoomName, 
  ROOM_TYPES,
  createEventPayload,
  CONNECTION_EVENTS,
  ERROR_EVENTS 
} = require('../constants/socketEvents');

class RoomManager {
  constructor() {
    // Track which rooms each socket is in
    this.socketRooms = new Map(); // socketId -> Set of room names
    // Track room membership
    this.roomMembers = new Map(); // roomName -> Set of socketIds
    // Track user to socket mapping
    this.userSockets = new Map(); // userId -> Set of socketIds
  }

  /**
   * Join a room with authorization check
   */
  async joinRoom(socket, roomType, resourceId, options = {}) {
    try {
      const roomName = getRoomName(roomType, resourceId);
      
      // Check if socket is already in this room
      if (this.socketRooms.get(socket.id)?.has(roomName)) {
        console.log(`Socket ${socket.id} already in room ${roomName}`);
        return roomName;
      }

      // Join the room
      await socket.join(roomName);

      // Update tracking
      if (!this.socketRooms.has(socket.id)) {
        this.socketRooms.set(socket.id, new Set());
      }
      this.socketRooms.get(socket.id).add(roomName);

      if (!this.roomMembers.has(roomName)) {
        this.roomMembers.set(roomName, new Set());
      }
      this.roomMembers.get(roomName).add(socket.id);

      // Track user to socket mapping
      if (socket.userId) {
        if (!this.userSockets.has(socket.userId)) {
          this.userSockets.set(socket.userId, new Set());
        }
        this.userSockets.get(socket.userId).add(socket.id);
      }

      console.log(`Socket ${socket.id} (${socket.userId}) joined room ${roomName}`);

      // Emit join confirmation
      socket.emit(createEventPayload(
        CONNECTION_EVENTS.JOIN_USER_ROOM,
        { 
          room: roomName, 
          roomType, 
          resourceId,
          memberCount: this.roomMembers.get(roomName)?.size || 0
        },
        socket.userId
      ));

      return roomName;
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit(createEventPayload(
        ERROR_EVENTS.ROOM_JOIN_FAILED,
        { error: error.message, roomType, resourceId },
        socket.userId
      ));
      throw error;
    }
  }

  /**
   * Leave a room
   */
  async leaveRoom(socket, roomType, resourceId) {
    try {
      const roomName = getRoomName(roomType, resourceId);
      
      // Leave the room
      await socket.leave(roomName);

      // Update tracking
      if (this.socketRooms.has(socket.id)) {
        this.socketRooms.get(socket.id).delete(roomName);
        if (this.socketRooms.get(socket.id).size === 0) {
          this.socketRooms.delete(socket.id);
        }
      }

      if (this.roomMembers.has(roomName)) {
        this.roomMembers.get(roomName).delete(socket.id);
        if (this.roomMembers.get(roomName).size === 0) {
          this.roomMembers.delete(roomName);
        }
      }

      console.log(`Socket ${socket.id} (${socket.userId}) left room ${roomName}`);

      // Emit leave confirmation
      socket.emit(createEventPayload(
        CONNECTION_EVENTS.LEAVE_USER_ROOM,
        { 
          room: roomName, 
          roomType, 
          resourceId,
          memberCount: this.roomMembers.get(roomName)?.size || 0
        },
        socket.userId
      ));

      return roomName;
    } catch (error) {
      console.error('Error leaving room:', error);
      throw error;
    }
  }

  /**
   * Get all rooms a socket is in
   */
  getSocketRooms(socketId) {
    return Array.from(this.socketRooms.get(socketId) || []);
  }

  /**
   * Get all members in a room
   */
  getRoomMembers(roomName) {
    return Array.from(this.roomMembers.get(roomName) || []);
  }

  /**
   * Get room member count
   */
  getRoomMemberCount(roomName) {
    return this.roomMembers.get(roomName)?.size || 0;
  }

  /**
   * Get all sockets for a user
   */
  getUserSockets(userId) {
    return Array.from(this.userSockets.get(userId) || []);
  }

  /**
   * Check if user is online (has active sockets)
   */
  isUserOnline(userId) {
    const sockets = this.userSockets.get(userId);
    return sockets && sockets.size > 0;
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount() {
    return this.userSockets.size;
  }

  /**
   * Clean up when socket disconnects
   */
  cleanup(socket) {
    const socketId = socket.id;
    const userId = socket.userId;

    console.log(`Cleaning up socket ${socketId} for user ${userId}`);

    // Remove from all rooms
    const rooms = this.getSocketRooms(socketId);
    rooms.forEach(roomName => {
      if (this.roomMembers.has(roomName)) {
        this.roomMembers.get(roomName).delete(socketId);
        if (this.roomMembers.get(roomName).size === 0) {
          this.roomMembers.delete(roomName);
        }
      }
    });

    // Clean up socket room tracking
    this.socketRooms.delete(socketId);

    // Clean up user socket mapping
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(socketId);
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  /**
   * Get room statistics
   */
  getStats() {
    return {
      totalRooms: this.roomMembers.size,
      totalSockets: this.socketRooms.size,
      totalOnlineUsers: this.userSockets.size,
      rooms: Array.from(this.roomMembers.entries()).map(([room, members]) => ({
        room,
        memberCount: members.size
      }))
    };
  }

  /**
   * Join user to their personal room (always allowed)
   */
  async joinUserRoom(socket) {
    if (!socket.userId) {
      throw new Error('User not authenticated');
    }
    return await this.joinRoom(socket, ROOM_TYPES.USER, socket.userId);
  }

  /**
   * Join project room with authorization
   */
  async joinProjectRoom(socket, projectId) {
    // Authorization check will be handled by middleware
    return await this.joinRoom(socket, ROOM_TYPES.PROJECT, projectId);
  }

  /**
   * Join team room with authorization
   */
  async joinTeamRoom(socket, teamId) {
    // Authorization check will be handled by middleware
    return await this.joinRoom(socket, ROOM_TYPES.TEAM, teamId);
  }

  /**
   * Leave all rooms for a socket
   */
  async leaveAllRooms(socket) {
    const rooms = this.getSocketRooms(socket.id);
    for (const roomName of rooms) {
      await socket.leave(roomName);
    }
    this.cleanup(socket);
  }
}

// Singleton instance
const roomManager = new RoomManager();

module.exports = roomManager;
